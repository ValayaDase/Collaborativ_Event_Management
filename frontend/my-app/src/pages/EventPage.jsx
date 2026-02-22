// src/pages/EventPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdChat, MdClose } from 'react-icons/md';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config/api';
import useSocket from '../hooks/useSocket';
import ChatBox from '../components/ChatBox';
import EventHeader from '../components/events/EventHeader';
import ProgressBar from '../components/events/ProgressBar';
import TeamMembers from '../components/events/TeamMembers';
import KanbanColumn from '../components/events/KanbanColumn';
import TaskModal from '../components/events/TaskModal';

export default function EventPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [organizerId, setOrganizerId] = useState('');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copied, setCopied] = useState(false);
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
        setOrganizerId(ev.organizer._id);
        setIsOrganizer(ev.organizer._id === currentUserId);
      }
    } catch (error) {
      toast.error('Failed to load event');
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (!socket || !eventId) return;
    socket.emit("join-event", eventId);
    console.log("Joined event room:", eventId);
  }, [socket, eventId]);

  useEffect(() => {
    if (!socket) return;
    const handleTasksUpdated = (updatedTasks) => {
      setTasks(updatedTasks);
    };
    const handleMembersUpdated = () => {
      loadEvent();
    };
    const handleEventFinished = () => {
      toast.info("Event finished by organizer");
      navigate("/dashboard");
    };
    const handleNewMessage = (msg) => {
      if (!isChatOpen && msg.sender._id !== currentUserId) {
        setUnreadCount(prev => prev + 1);
      }
    };
    socket.on("tasks-updated", handleTasksUpdated);
    socket.on("members-updated", handleMembersUpdated);
    socket.on("event-finished", handleEventFinished);
    socket.on("new-message", handleNewMessage);
    return () => {
      socket.off("tasks-updated", handleTasksUpdated);
      socket.off("members-updated", handleMembersUpdated);
      socket.off("event-finished", handleEventFinished);
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, isChatOpen, currentUserId]);

  const copyEventCode = () => {
    if (event?.eventCode) {
      navigator.clipboard.writeText(event.eventCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createTask = async () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required!');
      return;
    }
    const finalAssignedTo = isOrganizer ? assignedTo : currentUserId;
    try {
      const res = await axios.post(
        `${API_URL}/event/${eventId}/tasks`,
        { title: taskTitle, description: taskDesc, assignedTo: finalAssignedTo },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.success) {
        setShowTaskModal(false);
        setTaskTitle('');
        setTaskDesc('');
        setAssignedTo('');
        setTasks(res.data.tasks);
        toast.success('Task created successfully!');
      } else {
        toast.error(res.data.error);
      }
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      const res = await axios.patch(
        `${API_URL}/event/${eventId}/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (!res.data.success) {
        toast.error(res.data.error);
      } else {
        toast.success('Status updated!');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await axios.delete(
        `${API_URL}/event/${eventId}/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.success) {
        setTasks(res.data.tasks);
        toast.success('Task deleted!');
      } else {
        toast.error(res.data.error);
      }
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const finishEvent = async () => {
    if (!window.confirm('Are you sure you want to finish this event? This action cannot be undone.')) return;
    try {
      const res = await axios.post(
        `${API_URL}/event/${eventId}/finish`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.success) {
        toast.success('Event finished!');
        navigate('/dashboard');
      } else {
        toast.error(res.data.error);
      }
    } catch (error) {
      toast.error('Failed to finish event');
    }
  };

  const calculateProgress = () => {
    const total = tasks.length;
    if (total === 0) return {
      todo: 0,
      inProgress: 0,
      completed: 0,
      overall: 0,
      counts: { total: 0, todoCount: 0, inProgressCount: 0, completedCount: 0 }
    };
    const todoCount = tasks.filter(t => t.status === 'todo').length;
    const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    return {
      todo: Math.round((todoCount / total) * 100),
      inProgress: Math.round((inProgressCount / total) * 100),
      completed: Math.round((completedCount / total) * 100),
      overall: Math.round((completedCount / total) * 100),
      counts: { total, todoCount, inProgressCount, completedCount }
    };
  };

  const progress = calculateProgress();

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content - Shifts left when chat opens */}
      <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-96' : 'mr-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <EventHeader
            event={event}
            isOrganizer={isOrganizer}
            copied={copied}
            copyEventCode={copyEventCode}
            setShowTaskModal={setShowTaskModal}
            finishEvent={finishEvent}
          />

          {event.isFinished && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 shadow-sm">
              ⚠️ This event has been finished. No more updates allowed.
            </div>
          )}

          {/* Team Members - Horizontal Layout */}
          <div className="mb-6">
            <TeamMembers
              members={members}
              organizerId={organizerId}
              currentUserId={currentUserId}
            />
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <ProgressBar progress={progress} />
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <KanbanColumn
              status="todo"
              tasks={tasks}
              totalTasks={tasks.length}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              isFinished={event.isFinished}
              deleteTask={deleteTask}
              updateStatus={updateStatus}
            />
            <KanbanColumn
              status="in-progress"
              tasks={tasks}
              totalTasks={tasks.length}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              isFinished={event.isFinished}
              deleteTask={deleteTask}
              updateStatus={updateStatus}
            />
            <KanbanColumn
              status="completed"
              tasks={tasks}
              totalTasks={tasks.length}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              isFinished={event.isFinished}
              deleteTask={deleteTask}
              updateStatus={updateStatus}
            />
          </div>
        </div>
      </div>

      {/* Chat Sidebar - Fixed on right side */}
      {isChatOpen && (
        <div className="fixed top-0 right-0 w-96 h-screen bg-white border-l border-gray-200 shadow-2xl z-40">
          <ChatBox
            eventId={eventId}
            currentUserId={currentUserId}
            socket={socket}
            isOpen={isChatOpen}
          />
        </div>
      )}

      {/* Chat Toggle Button - Changes position when chat is open */}
      <button
        onClick={() => {
          setIsChatOpen(!isChatOpen);
          setUnreadCount(0);
        }}
        className={`fixed bottom-6 ${
          isChatOpen ? 'right-[416px]' : 'right-6'
        } bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50`}
      >
        {isChatOpen ? <MdClose size={24} /> : <MdChat size={24} />}
        {!isChatOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <TaskModal
        showModal={showTaskModal}
        setShowModal={setShowTaskModal}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskDesc={taskDesc}
        setTaskDesc={setTaskDesc}
        assignedTo={assignedTo}
        setAssignedTo={setAssignedTo}
        members={members}
        organizerId={organizerId}
        currentUserId={currentUserId}
        isOrganizer={isOrganizer}
        createTask={createTask}
      />
    </div>
  );
}
