import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MdAdd,
  MdArrowBack,
  MdCalendarMonth,
  MdChat,
  MdClose,
  MdGroups,
  MdHistory,
  MdOutlineCrisisAlert,
  MdTimeline,
  MdWarningAmber
} from 'react-icons/md';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config/api';
import useSocket from '../hooks/useSocket';
import Sidebar from '../components/layout/Sidebar';
import TaskModal from '../components/events/TaskModal';
import ChatBox from '../components/ChatBox';
import ProgressBar from '../components/events/ProgressBar';
import TeamMembers from '../components/events/TeamMembers';
import KanbanColumn from '../components/events/KanbanColumn';
import PressureMeter from '../components/dashboard/PressureMeter';
import { formatDateLabel, formatDateTimeLabel, toDateInputValue } from '../utils/eventUi';

const collectEventConflictTaskIds = (conflicts, eventId) => {
  const taskIds = new Set();

  (conflicts?.sameDayConflicts || []).forEach((conflict) => {
    conflict.tasks.forEach((task) => {
      if (task.eventId === eventId) {
        taskIds.add(task.taskId);
      }
    });
  });

  (conflicts?.overloadedUsers || []).forEach((conflict) => {
    conflict.tasks.forEach((task) => {
      if (task.eventId === eventId) {
        taskIds.add(task.taskId);
      }
    });
  });

  return [...taskIds];
};

export default function EventPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const currentUserId = localStorage.getItem('userId');

  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [health, setHealth] = useState(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [deadlineInput, setDeadlineInput] = useState('');
  const [conflictTaskIds, setConflictTaskIds] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadEvent = async () => {
    try {
      const res = await axios.get(`${API_URL}/event/${eventId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        const loadedEvent = res.data.event;
        setEvent(loadedEvent);
        setTasks(loadedEvent.tasks || []);
        setMembers(loadedEvent.members || []);
        setActivities(loadedEvent.activities || []);
        setHealth(res.data.health || null);
        setIsOrganizer(loadedEvent.organizer._id === currentUserId);
        setDeadlineInput(toDateInputValue(loadedEvent.deadline));
      }
    } catch (error) {
      toast.error('Failed to load event');
      navigate('/dashboard');
    }
  };

  const loadConflicts = async () => {
    try {
      const res = await axios.get(`${API_URL}/event/conflicts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        setConflictTaskIds(collectEventConflictTaskIds(res.data.conflicts, eventId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadEvent();
    loadConflicts();
  }, [eventId]);

  useEffect(() => {
    if (!socket || !eventId) return;
    socket.emit('join-event', eventId);
  }, [socket, eventId]);

  useEffect(() => {
    if (!socket) return;

    const handleTasksUpdated = (updatedTasks) => {
      setTasks(updatedTasks);
      loadConflicts();
    };

    const handleMembersUpdated = () => loadEvent();
    const handleActivitiesUpdated = (updatedActivities) => {
      setActivities(updatedActivities);
      loadEvent();
    };
    const handleEventUpdated = () => loadEvent();
    const handleNewMessage = (message) => {
      if (!isChatOpen && message.sender._id !== currentUserId) {
        setUnreadCount((previous) => previous + 1);
      }
    };

    socket.on('tasks-updated', handleTasksUpdated);
    socket.on('activities-updated', handleActivitiesUpdated);
    socket.on('members-updated', handleMembersUpdated);
    socket.on('event-updated', handleEventUpdated);
    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('tasks-updated', handleTasksUpdated);
      socket.off('activities-updated', handleActivitiesUpdated);
      socket.off('members-updated', handleMembersUpdated);
      socket.off('event-updated', handleEventUpdated);
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, isChatOpen, currentUserId, eventId]);

  const createTask = async () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/event/${eventId}/tasks`,
        {
          title: taskTitle,
          description: taskDesc,
          dueDate: taskDueDate || undefined,
          assignedTo: assignedTo
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.success) {
        setShowTaskModal(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskDueDate('');
        setAssignedTo([]);
        setTasks(res.data.tasks);
        loadEvent();
        loadConflicts();
        toast.success('Task created');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await axios.patch(
        `${API_URL}/event/${eventId}/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.success) {
        setTasks(res.data.tasks);
        loadEvent();
        loadConflicts();
        toast.success('Status updated');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const updateTaskSchedule = async (taskId, dueDate) => {
    try {
      const res = await axios.patch(
        `${API_URL}/event/${eventId}/tasks/${taskId}/schedule`,
        { dueDate: dueDate || null },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.success) {
        setTasks(res.data.tasks);
        loadEvent();
        loadConflicts();
        toast.success('Task schedule updated');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update task schedule');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await axios.delete(`${API_URL}/event/${eventId}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        setTasks(res.data.tasks);
        loadEvent();
        loadConflicts();
        toast.success('Task deleted');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete task');
    }
  };

  const updateTaskAssignees = async (taskId, newAssignees) => {
    try {
      const res = await axios.patch(
        `${API_URL}/event/${eventId}/tasks/${taskId}/assign`,
        { assignedTo: newAssignees },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.success) {
        setTasks(res.data.tasks);
        loadEvent();
        loadConflicts();
        toast.success('Task assignees updated');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update assignees');
    }
  };

  const updateDeadline = async () => {
    if (!isOrganizer) return;

    try {
      const res = await axios.patch(
        `${API_URL}/event/${eventId}/deadline`,
        { deadline: deadlineInput || null },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.success) {
        setEvent(res.data.event);
        setTasks(res.data.event.tasks || []);
        setMembers(res.data.event.members || []);
        setActivities(res.data.event.activities || []);
        setHealth(res.data.health || null);
        setDeadlineInput(toDateInputValue(res.data.event.deadline));
        loadConflicts();
        toast.success(res.data.event.deadline ? 'Deadline updated' : 'Deadline cleared');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update deadline');
    }
  };

  const addMember = async () => {
    if (!newMemberEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/event/${eventId}/members/add`,
        { email: newMemberEmail },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.success) {
        setShowAddMemberModal(false);
        setNewMemberEmail('');
        toast.success(res.data.message || 'Member added successfully');
      } else {
        toast.error(res.data.error || 'Failed to add member');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add member');
    }
  };

  const calculateProgress = () => {
    const total = tasks.length;
    const todoCount = tasks.filter((task) => task.status === 'todo').length;
    const inProgressCount = tasks.filter((task) => task.status === 'in-progress').length;
    const completedCount = tasks.filter((task) => task.status === 'completed').length;

    if (total === 0) {
      return {
        overall: 0,
        total: 0,
        counts: { total: 0, todoCount: 0, inProgressCount: 0, completedCount: 0 }
      };
    }

    return {
      overall: Math.round((completedCount / total) * 100),
      total,
      counts: { total, todoCount, inProgressCount, completedCount }
    };
  };

  if (!event) return null;

  const progress = calculateProgress();
  const deadlineActionLabel = event.deadline ? 'Edit Deadline' : 'Add Deadline';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        <div className="flex flex-col gap-5 mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <MdArrowBack className="text-2xl text-slate-600" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{event.eventName}</h1>
                <p className="text-sm font-medium text-slate-400 mt-1">
                  Organizer:{' '}
                  <span className="text-slate-600 font-bold">{event.organizer.username}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 xl:items-center">
              <div className="rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50 min-w-[240px]">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  <MdCalendarMonth className="text-base" />
                  Event Deadline
                </div>
                <p className="text-base font-bold text-slate-900 mt-2">
                  {event.deadline ? formatDateLabel(event.deadline) : 'Add a deadline'}
                </p>
                {isOrganizer ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="date"
                      value={deadlineInput}
                      onChange={(e) => setDeadlineInput(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={updateDeadline}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
                    >
                      {deadlineActionLabel}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {isOrganizer && (
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-lg shadow-slate-200"
                  >
                    <MdAdd className="text-xl" />
                    New Task
                  </button>
                )}
                {isOrganizer && (
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold transition-all"
                  >
                    <MdAdd className="text-xl" />
                    Add Member
                  </button>
                )}
              </div>
            </div>
          </div>

          {health?.nearDeadline ? (
            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <MdWarningAmber className="text-2xl text-amber-600 mt-0.5" />
                <div>
                  <h2 className="text-lg font-black text-amber-800">Deadline is near</h2>
                  <p className="text-sm text-amber-700 mt-1">
                    This event is within 5 days of its deadline. Keep active tasks moving and clear blockers fast.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {health?.silentFailure ? (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <MdOutlineCrisisAlert className="text-2xl text-red-600 mt-0.5" />
                <div>
                  <h2 className="text-lg font-black text-red-800">No progress detected</h2>
                  <p className="text-sm text-red-700 mt-1">
                    There has been no recent activity on this event. It may need a follow-up from the organizer.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {conflictTaskIds.length > 0 ? (
            <div className="rounded-[2rem] border border-red-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <MdWarningAmber className="text-2xl text-red-500 mt-0.5" />
                <div>
                  <h2 className="text-lg font-black text-slate-900">Task conflicts found</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Some scheduled tasks in this board overlap with other active work. They are highlighted in red below.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          <div className="lg:col-span-4">
            <PressureMeter
              pressure={health?.pressure}
              subtitle="Pending tasks divided by days left until the event deadline."
            />
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 h-full">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <MdGroups className="text-lg" />
                Team & Progress
              </h3>
              <TeamMembers
                members={members}
                organizerId={event.organizer._id}
                currentUserId={currentUserId}
              />
              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex justify-between items-end mb-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Completion</p>
                  <p className="text-2xl font-black text-slate-900">{progress.overall}%</p>
                </div>
                <ProgressBar progress={progress} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 h-full max-h-[400px] flex flex-col">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <MdHistory className="text-lg" />
                Activity Stream
              </h3>
              <div className="flex-1 overflow-y-auto space-y-6">
                {activities.length > 0 ? (
                  activities.slice().reverse().map((activity, index) => (
                    <div key={`${activity.timestamp}-${index}`} className="relative pl-6 border-l-2 border-slate-100 pb-2">
                      <span className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-slate-900 ring-4 ring-white shadow-sm" />
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{activity.message}</p>
                      <span className="text-[10px] text-slate-400 font-bold mt-1 block uppercase">
                        {formatDateTimeLabel(activity.timestamp)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 opacity-20">
                    <MdTimeline className="text-5xl mb-2" />
                    <p className="text-sm italic font-medium">No activity yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Task Board</p>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Active Workstream</h2>
            </div>
            <p className="text-sm text-slate-500">
              Red borders highlight task conflicts or overloaded assignments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['todo', 'in-progress', 'completed'].map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasks}
                totalTasks={tasks.length}
                currentUserId={currentUserId}
                isOrganizer={isOrganizer}
                isFinished={event.isFinished}
                updateStatus={updateTaskStatus}
                updateSchedule={updateTaskSchedule}
                deleteTask={handleDeleteTask}
                eventDeadline={event.deadline}
                conflictTaskIds={conflictTaskIds}
                updateTaskAssignees={updateTaskAssignees}
                members={members}
              />
            ))}
          </div>
        </div>
      </main>

      <TaskModal
        showModal={showTaskModal}
        setShowModal={setShowTaskModal}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskDesc={taskDesc}
        setTaskDesc={setTaskDesc}
        taskDueDate={taskDueDate}
        setTaskDueDate={setTaskDueDate}
        assignedTo={assignedTo}
        setAssignedTo={setAssignedTo}
        members={members}
        organizerId={event.organizer._id}
        currentUserId={currentUserId}
        isOrganizer={isOrganizer}
        createTask={createTask}
      />

      {showAddMemberModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" 
            onClick={() => setShowAddMemberModal(false)} 
          />
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Member</h2>
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="p-2 hover:bg-slate-200/50 rounded-full transition-colors"
              >
                <MdClose className="text-2xl text-slate-600" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MdGroups /> Member Email *
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMember()}
                  placeholder="user@example.com"
                  className="w-full bg-slate-100/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addMember}
                  className="flex-[2] py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!isChatOpen ? (
        <button
          type="button"
          onClick={() => {
            setIsChatOpen(true);
            setUnreadCount(0);
          }}
          className="fixed bottom-8 right-8 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl z-50 hover:scale-105 active:scale-95 transition-all"
        >
          <MdChat size={28} />
          {unreadCount > 0 ? (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-[10px] h-6 w-6 rounded-full flex items-center justify-center font-bold ring-4 ring-[#F8FAFC]">
              {unreadCount}
            </span>
          ) : null}
        </button>
      ) : null}

      {isChatOpen ? (
        <div className="fixed top-0 right-0 w-full sm:w-96 h-screen bg-white shadow-2xl z-[70] animate-in slide-in-from-right duration-300 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <h2 className="font-black text-slate-900 uppercase tracking-tighter">Event Chat</h2>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <MdClose size={24} className="text-slate-600" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatBox
              eventId={eventId}
              currentUserId={currentUserId}
              socket={socket}
              isOpen={isChatOpen}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
