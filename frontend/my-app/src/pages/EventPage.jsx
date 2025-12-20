import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoChatbubbleEllipsesSharp, IoCopyOutline, IoTrashOutline } from "react-icons/io5";
import { IoCheckmarkCircle, IoTimeOutline, IoListOutline } from "react-icons/io5";
import ChatBox from "../components/ChatBox";
import useSocket from "../hooks/useSocket";
import axios from "axios";
import { toast } from "react-toastify";

export default function EventPage() {
  const { id:  eventId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [organizerId, setOrganizerId] = useState("");
  const [isOrganizer, setIsOrganizer] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUserId = localStorage.getItem("userId");
  const [copied, setCopied] = useState(false);

  // Load event details
  const loadEvent = async () => {
    const res = await axios.get(`http://localhost:5000/event/${eventId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (res.data.success) {
      const ev = res.data.event;
      setEvent(ev);
      setTasks(ev.tasks);
      setMembers(ev.members);
      setOrganizerId(ev.organizer._id);
      setIsOrganizer(ev.organizer._id === currentUserId);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  // Socket setup
  useEffect(() => {
    if (! socket || !eventId) return;

    socket. emit("join-event", eventId);

    socket.on("tasks-updated", (updatedTasks) => {
      setTasks(updatedTasks);
    });

    socket.on("members-updated", (memberIds) => {
      loadEvent();
    });

    socket.on("event-finished", () => {
      toast.info("Event finished by organizer");
      navigate("/dashboard");
    });

    socket.on("new-message", (msg) => {
      if (!isChatOpen && msg.sender._id !== currentUserId) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off("tasks-updated");
      socket.off("members-updated");
      socket.off("event-finished");
      socket.off("new-message");
    };
  }, [socket, eventId, isChatOpen, currentUserId]);

  const copyEventCode = () => {
    if (event?.eventCode) {
      navigator.clipboard.writeText(event.eventCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createTask = async () => {
    if (!taskTitle.trim()) {
      toast.error("Task title is required!");
      return;
    }

    const res = await axios.post(
      `http://localhost:5000/event/${eventId}/tasks`,
      {
        title: taskTitle,
        description: taskDesc,
        assignedTo,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (res.data.success) {
      setShowTaskModal(false);
      setTaskTitle("");
      setTaskDesc("");
      setAssignedTo("");
      setTasks(res.data.tasks);
      toast.success("Task created successfully!");
    } else {
      toast.error(res.data.error);
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    const res = await axios.patch(
      `http://localhost:5000/event/${eventId}/tasks/${taskId}/status`,
      { status: newStatus },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (! res.data.success) {
      toast.error(res.data.error);
    } else {
      toast.success("Task status updated!");
    }
  };

  const deleteTask = async (taskId) => {
    if (! window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    const res = await axios.delete(
      `http://localhost:5000/event/${eventId}/tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (res.data.success) {
      setTasks(res.data.tasks);
      toast.success("Task deleted successfully!");
    } else {
      toast. error(res.data.error);
    }
  };

  const finishEvent = async () => {
    if (!window.confirm("Are you sure you want to finish this event?  This action cannot be undone.")) {
      return;
    }

    const res = await axios. post(
      `http://localhost:5000/event/${eventId}/finish`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (res.data.success) {
      toast.success("Event finished successfully!");
      navigate("/dashboard");
    } else {
      toast.error(res.data.error);
    }
  };

  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);

  // Calculate progress statistics
  const calculateProgress = () => {
    const total = tasks.length;
    if (total === 0) return { todo: 0, inProgress: 0, completed: 0, overall: 0 };

    const todoCount = tasksByStatus("todo").length;
    const inProgressCount = tasksByStatus("in-progress").length;
    const completedCount = tasksByStatus("completed").length;

    return {
      todo: Math.round((todoCount / total) * 100),
      inProgress: Math.round((inProgressCount / total) * 100),
      completed: Math.round((completedCount / total) * 100),
      overall: Math.round((completedCount / total) * 100),
      counts: { total, todoCount, inProgressCount, completedCount }
    };
  };

  const progress = calculateProgress();

  if (!event) return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-lg text-gray-600">Loading... </div>
    </div>
  );

  const statusConfig = {
    "todo": {
      label: "To Do",
      icon: IoListOutline,
      color:  "bg-slate-100 border-slate-300",
      headerColor: "bg-linear-to-r from-slate-500 to-slate-600"
    },
    "in-progress": {
      label: "In Progress",
      icon: IoTimeOutline,
      color: "bg-amber-50 border-amber-200",
      headerColor: "bg-linear-to-r from-amber-500 to-orange-500"
    },
    "completed": {
      label: "Completed",
      icon: IoCheckmarkCircle,
      color:  "bg-emerald-50 border-emerald-200",
      headerColor: "bg-linear-to-r from-emerald-500 to-green-600"
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex">
      {/* MAIN CONTENT */}
      <div
        className={`flex-1 p-6 transition-all duration-300 ${
          isChatOpen ? "mr-96" : "mr-0"
        }`}
      >
        {/* Event Finished Alert */}
        {event.isFinished && (
          <div className="mb-6 px-6 py-4 bg-linear-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <p className="text-red-700 font-semibold">
               This event has been finished.  No more updates allowed.
            </p>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {event.eventName}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Organizer:  {event.organizer.username}
                </span>
              </p>

              {/* Event Code */}
              {isOrganizer && (
                <div className="mt-4 inline-flex items-center gap-3 bg-linear-to-r from-blue-50 to-purple-50 px-4 py-3 rounded-xl border border-blue-200">
                  <span className="text-sm font-medium text-gray-700">Event Code:</span>
                  <span className="text-xl font-bold text-blue-600 tracking-widest">
                    {event. eventCode}
                  </span>
                  <button
                    onClick={copyEventCode}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Copy Event Code"
                  >
                    <IoCopyOutline className="w-5 h-5 text-blue-600" />
                  </button>
                  {copied && (
                    <span className="text-sm text-green-600 font-medium animate-pulse">
                      ✓ Copied!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isOrganizer && (
                <>
                  <button
                    disabled={event.isFinished}
                    className={`px-5 py-2. 5 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                      event.isFinished
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md"
                    }`}
                    onClick={() => !event.isFinished && setShowTaskModal(true)}
                  >
                    + Assign Task
                  </button>
                  <button
                    disabled={event.isFinished}
                    className={`px-5 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                      event. isFinished
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-linear-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-md"
                    }`}
                    onClick={finishEvent}
                  >
                    Finish Event
                  </button>
                </>
              )}
              <button
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                onClick={() => navigate("/dashboard")}
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Overall Progress Bar */}
          {tasks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-700">Overall Progress</h3>
                <span className="text-2xl font-bold text-emerald-600">{progress.overall}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-linear-to-r from-emerald-500 to-green-600 transition-all duration-500 ease-out flex items-center justify-end px-2"
                  style={{ width:  `${progress.overall}%` }}
                >
                  {progress.overall > 10 && (
                    <span className="text-white text-xs font-bold">
                      {progress.counts.completedCount}/{progress.counts.total} tasks
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex justify-between text-sm text-gray-900">
                <span> To Do: {progress.counts.todoCount}</span>
                <span> In Progress: {progress.counts.inProgressCount}</span>
                <span> Completed: {progress.counts.completedCount}</span>
              </div>
            </div>
          )}

          {/* Members Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Team Members</h2>
            <div className="flex flex-wrap gap-3">
              {members.map((m) => (
                <div
                  key={m._id}
                  className="px-4 py-2 bg-linear-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="font-medium text-gray-800">{m.username}</span>
                  {m._id === organizerId && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      Organizer
                    </span>
                  )}
                  {m._id === currentUserId && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                      You
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {["todo", "in-progress", "completed"].map((status) => {
            const config = statusConfig[status];
            const StatusIcon = config.icon;
            const statusTasks = tasksByStatus(status);
            const statusProgress = tasks.length > 0 ? Math.round((statusTasks.length / tasks.length) * 100) : 0;

            return (
              <div key={status} className="flex flex-col">
                {/* Column Header */}
                <div className={`${config.headerColor} text-white px-4 py-3 rounded-t-xl shadow-md`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-5 h-5" />
                      <h3 className="text-lg font-bold">{config.label}</h3>
                    </div>
                    <span className="bg-white text-black bg-opacity-25 px-2.5 py-0.5 rounded-full text-sm font-semibold">
                      {statusTasks.length}
                    </span>
                  </div>
                  
                  {/* Progress bar for this column */}
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width:  `${statusProgress}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1 text-white text-opacity-90">
                    {statusProgress}% of total tasks
                  </div>
                </div>

                {/* Tasks Container */}
                <div className={`${config.color} border-2 rounded-b-xl p-4 min-h-[400px] space-y-3`}>
                  {statusTasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 relative"
                    >
                      {/* Delete Button (Only for Organizer) */}
                      {isOrganizer && ! event.isFinished && (
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
                          title="Delete Task"
                        >
                          <IoTrashOutline className="w-4 h-4 text-red-500 group-hover:text-red-700" />
                        </button>
                      )}

                      <h4 className="font-bold text-gray-800 mb-2 pr-8">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                          👤 {task.assignedTo ?  task.assignedTo.username :  "Unassigned"}
                        </span>
                      </div>

                      {/* Status Buttons */}
                      {task.assignedTo && task.assignedTo._id === currentUserId && (
                        <div className="flex flex-wrap gap-2">
                          {status !== "todo" && (
                            <button
                              disabled={event.isFinished}
                              className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => updateStatus(task._id, "todo")}
                            >
                              → To Do
                            </button>
                          )}
                          {status !== "in-progress" && (
                            <button
                              disabled={event.isFinished}
                              className="px-3 py-1.5 text-xs bg-amber-400 text-white rounded-lg hover:bg-amber-500 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => updateStatus(task._id, "in-progress")}
                            >
                              → In Progress
                            </button>
                          )}
                          {status !== "completed" && (
                            <button
                              disabled={event.isFinished}
                              className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => updateStatus(task._id, "completed")}
                            >
                              → Complete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Empty State */}
                  {statusTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                      <StatusIcon className="w-12 h-12 mb-2 opacity-30" />
                      <p className="text-sm">No tasks yet</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHAT SIDEBAR */}
      <div
        className={`fixed top-0 right-0 h-screen w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isChatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <ChatBox eventId={eventId} isOpen={isChatOpen} isFinished={event.isFinished} />
      </div>

      {/* CHAT TOGGLE BUTTON */}
      <button
        onClick={() => {
          setIsChatOpen(! isChatOpen);
          if (! isChatOpen) setUnreadCount(0);
        }}
        className={`fixed bottom-6 right-6 bg-linear-to-r from-blue-600 to-purple-600 text-white 
          w-16 h-16 rounded-full shadow-xl hover:from-blue-700 hover:to-purple-700 
          transition-all duration-300 flex items-center justify-center 
          z-50 transform hover:scale-110 ${isChatOpen ? "mr-96" : "mr-0"}`}
        title={isChatOpen ? "Close Chat" : "Open Chat"}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <IoChatbubbleEllipsesSharp className="w-7 h-7" />
          {unreadCount > 0 && ! isChatOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* ASSIGN TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 m-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Assign New Task</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter task title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target. value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Add details about the task"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  rows="3"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">Select a team member</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.username}
                      {m._id === organizerId ?  " (Organizer)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md"
                  onClick={createTask}
                >
                  Create Task
                </button>
                <button
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}