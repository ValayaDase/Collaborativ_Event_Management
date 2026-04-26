// src/components/events/TaskModal.jsx
import React from 'react';
import { MdClose, MdSubtitles, MdDescription, MdPerson, MdCalendarToday } from 'react-icons/md';

export default function TaskModal({
  showModal,
  setShowModal,
  taskTitle,
  setTaskTitle,
  taskDesc,
  setTaskDesc,
  taskDueDate,
  setTaskDueDate,
  assignedTo,
  setAssignedTo,
  members,
  organizerId,
  currentUserId,
  isOrganizer,
  createTask
}) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Glassmorphic Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" 
        onClick={() => setShowModal(false)} 
      />
      
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create New Task</h2>
          <button 
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <MdClose className="text-2xl text-slate-600" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MdSubtitles /> Title *
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task name"
              className="w-full bg-slate-100/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MdDescription /> Description
            </label>
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Details..."
              rows="3"
              className="w-full bg-slate-100/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MdCalendarToday /> Task Deadline
            </label>
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700 font-medium"
            />
            <p className="text-xs font-medium text-slate-500 mt-1 pl-2">
              Setting a deadline displays it on the assignee's calendar.
            </p>
          </div>

          {isOrganizer && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MdPerson /> Assign To
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-slate-100/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all"
              >
                <option value="">Select Member</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.username} {m._id === organizerId && '(Organizer)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isOrganizer && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm font-bold text-blue-700">
                ℹ️ This task will be assigned to you
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={createTask}
              className="flex-[2] py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
