// src/pages/EventPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdChat, MdClose, MdArrowBack, MdAdd, MdHistory, MdGroups, MdTimeline } from 'react-icons/md';
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

export default function EventPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  
  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [activities, setActivities] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUserId = localStorage.getItem('userId');

  const loadEvent = async () => {
    try {
      const res = await axios.get(`${API_URL}/event/${eventId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        const ev = res.data.event;
        setEvent(ev);
        setTasks(ev.tasks);
        setMembers(ev.members);
        setActivities(ev.activities || []);
        setIsOrganizer(ev.organizer._id === currentUserId);
      }
    } catch (error) {
      toast.error('Failed to load event');
      navigate('/dashboard');
    }
  };
  // Inside src/pages/EventPage.jsx

// Function to update task status
const updateTaskStatus = async (taskId, newStatus) => {
  try {
    const res = await axios.patch(
      `${API_URL}/event/${eventId}/tasks/${taskId}/status`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );

    if (res.data.success) {
      setTasks(res.data.tasks);
      toast.success("Status updated");
    }
  } catch (err) {
    toast.error(err.response?.data?.error || "Failed to update status");
  }
};

// Function to delete a task
const handleDeleteTask = async (taskId) => {
  if (!window.confirm("Are you sure you want to delete this task?")) return;
  try {
    const res = await axios.delete(
      `${API_URL}/event/${eventId}/tasks/${taskId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );

    if (res.data.success) {
      setTasks(res.data.tasks);
      toast.success("Task deleted");
    }
  } catch (err) {
    toast.error("Failed to delete task");
  }
};

  useEffect(() => { loadEvent(); }, [eventId]);

  useEffect(() => {
    if (!socket || !eventId) return;
    socket.emit("join-event", eventId);
  }, [socket, eventId]);

  useEffect(() => {
    if (!socket) return;
    const handleTasksUpdated = (updatedTasks) => setTasks(updatedTasks);
    const handleMembersUpdated = () => loadEvent();
    const handleActivitiesUpdated = (updatedActivities) => setActivities(updatedActivities);
    const handleNewMessage = (msg) => {
      if (!isChatOpen && msg.sender._id !== currentUserId) {
        setUnreadCount(prev => prev + 1);
      }
    };
    
    socket.on("tasks-updated", handleTasksUpdated);
    socket.on("activities-updated", handleActivitiesUpdated);
    socket.on("members-updated", handleMembersUpdated);
    socket.on("new-message", handleNewMessage);
    
    return () => {
      socket.off("tasks-updated", handleTasksUpdated);
      socket.off("activities-updated", handleActivitiesUpdated);
      socket.off("members-updated", handleMembersUpdated);
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, isChatOpen, currentUserId]);

  const createTask = async () => {
    if (!taskTitle.trim()) return toast.error('Task title is required!');
    try {
      const res = await axios.post(`${API_URL}/event/${eventId}/tasks`,
        { title: taskTitle, description: taskDesc, assignedTo: isOrganizer ? assignedTo : currentUserId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.success) {
        setShowTaskModal(false);
        setTaskTitle('');
        setTaskDesc('');
        setTasks(res.data.tasks);
        toast.success('Task created!');
      }
    } catch (error) { toast.error('Failed to create task'); }
  };

  const calculateProgress = () => {
    const total = tasks.length;
    if (total === 0) return { overall: 0, total: 0, counts: { total: 0, completedCount: 0 } };
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    return {
      overall: Math.round((completedCount / total) * 100),
      total: total,
      counts: { total, completedCount }
    };
  };

  const progress = calculateProgress();

  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
              <MdArrowBack className="text-2xl text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{event.eventName}</h1>
              <p className="text-sm font-medium text-slate-400">Organizer: <span className="text-slate-600 font-bold">{event.organizer.username}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-lg shadow-slate-200">
              <MdAdd className="text-xl" /> New Task
            </button>
          </div>
        </div>

        {/* INFO CARDS SECTION - Proportion Adjusted (5/7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          {/* Team Info (Left - Slightly Bigger) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 h-full">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <MdGroups className="text-lg" /> Team & Progress
              </h3>
              <TeamMembers members={members} organizerId={event.organizer._id} currentUserId={currentUserId} />
              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex justify-between items-end mb-4">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Completion</p>
                   <p className="text-2xl font-black text-slate-900">{progress.overall}%</p>
                </div>
                <ProgressBar progress={progress} />
              </div>
            </div>
          </div>

          {/* Activity Log (Right - Slightly Smaller) */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 h-full max-h-[400px] flex flex-col">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <MdHistory className="text-lg" /> Activity Stream
              </h3>
              <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                {activities.length > 0 ? (
                  activities.slice().reverse().map((act, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-slate-100 pb-2">
                      <span className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-slate-900 ring-4 ring-white shadow-sm"></span>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{act.message}</p>
                      <span className="text-[10px] text-slate-400 font-bold mt-1 block uppercase">
                        {new Date(act.timestamp).toLocaleTimeString()}
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

        {/* KANBAN SECTION */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['todo', 'in-progress', 'completed'].map(status => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={tasks}
                  totalTasks={tasks.length}
                  currentUserId={currentUserId}
                  isOrganizer={isOrganizer}
                  isFinished={event.isFinished}
                  updateStatus={updateTaskStatus} 
        deleteTask={handleDeleteTask}
                />
              ))}
           </div>
        </div>
      </main>

      <TaskModal 
        showModal={showTaskModal} setShowModal={setShowTaskModal}
        taskTitle={taskTitle} setTaskTitle={setTaskTitle}
        taskDesc={taskDesc} setTaskDesc={setTaskDesc}
        assignedTo={assignedTo} setAssignedTo={setAssignedTo}
        members={members} isOrganizer={isOrganizer} createTask={createTask}
      />

      {/* Floating Chat Toggle */}
      {!isChatOpen && (
        <button 
          onClick={() => { setIsChatOpen(true); setUnreadCount(0); }} 
          className="fixed bottom-8 right-8 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl z-50 hover:scale-105 active:scale-95 transition-all"
        >
          <MdChat size={28} />
          {unreadCount > 0 && <span className="absolute -top-2 -right-2 bg-blue-600 text-[10px] h-6 w-6 rounded-full flex items-center justify-center font-bold ring-4 ring-[#F8FAFC]">{unreadCount}</span>}
        </button>
      )}

      {/* Chat Sidebar with restored Close button */}
      {isChatOpen && (
        <div className="fixed top-0 right-0 w-full sm:w-96 h-screen bg-white shadow-2xl z-[70] animate-in slide-in-from-right duration-300 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <h2 className="font-black text-slate-900 uppercase tracking-tighter">Event Chat</h2>
            <button 
              onClick={() => setIsChatOpen(false)} 
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <MdClose size={24} className="text-slate-600" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatBox eventId={eventId} currentUserId={currentUserId} socket={socket} isOpen={isChatOpen} />
          </div>
        </div>
      )}
    </div>
  );
}