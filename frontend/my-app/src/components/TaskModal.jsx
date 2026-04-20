import React from 'react';
import { MdClose, MdSubtitles, MdDescription, MdPerson } from 'react-icons/md';

export default function TaskModal({
  showModal, setShowModal, taskTitle, setTaskTitle,
  taskDesc, setTaskDesc, assignedTo, setAssignedTo,
  members, isOrganizer, createTask
}) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Glassmorphic Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity" 
        onClick={() => setShowModal(false)} 
      />
      
      <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 p-8 animate-in zoom-in-95 duration-200">
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
              <MdSubtitles /> Title
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
              className="w-full bg-slate-100/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {isOrganizer && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MdPerson /> Assign To
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-slate-100/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option value="">Select Member</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.username}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={createTask}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all active:scale-[0.98]"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}