import React, { useState } from 'react';
import {
  MdArrowBack,
  MdArrowForward,
  MdCalendarToday,
  MdDelete,
  MdWarningAmber,
  MdAdd,
  MdClose
} from 'react-icons/md';
import { formatDateLabel, getTaskEffectiveDate, toDateInputValue } from '../../utils/eventUi';

export default function TaskCard({
  task,
  currentUserId,
  isOrganizer,
  isFinished,
  status,
  deleteTask,
  updateStatus,
  updateSchedule,
  eventDeadline,
  hasConflict,
  updateTaskAssignees,
  members
}) {
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const canEdit = task.assignedTo && task.assignedTo.some(user => user._id === currentUserId);
  const canDelete = isOrganizer;
  const canSchedule = (canEdit || isOrganizer) && !isFinished;
  const effectiveDate = getTaskEffectiveDate(task, eventDeadline);
  const usesEventDeadline = !task.dueDate && !!eventDeadline;

  return (
    <div
      className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 ${
        hasConflict ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-800 text-sm">{task.title}</h4>
            {hasConflict ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-700">
                <MdWarningAmber className="text-sm" />
                Conflict
              </span>
            ) : null}
          </div>
          {task.description ? (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{task.description}</p>
          ) : null}
        </div>

        {canDelete && !isFinished ? (
          <button
            type="button"
            onClick={() => deleteTask(task._id)}
            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-xl transition-colors"
          >
            <MdDelete size={18} />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 flex-wrap">
        {task.assignedTo && task.assignedTo.length > 0 ? (
          task.assignedTo.map(user => (
            <span key={user._id} className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
              {user.username}
            </span>
          ))
        ) : (
          <span className="italic">Unassigned</span>
        )}
        {isOrganizer && !isFinished && (
          <div className="relative">
            <button
              onClick={() => setShowAssignMenu(!showAssignMenu)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center text-gray-600 bg-gray-50 border border-gray-200"
              title="Assign Members"
            >
              <MdAdd size={14} />
            </button>
            {showAssignMenu && (
              <div className="absolute top-full mt-1 left-0 w-48 bg-white shadow-xl rounded-xl border border-gray-100 p-2 z-[60]">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assign Members</span>
                  <button onClick={() => setShowAssignMenu(false)} className="text-gray-400 hover:text-gray-600 p-1"><MdClose size={14}/></button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {members.map(m => {
                    const isAssigned = task.assignedTo && task.assignedTo.some(u => u._id === m._id);
                    return (
                      <label key={m._id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={(e) => {
                            const newAssignees = e.target.checked 
                              ? [...(task.assignedTo || []).map(u => u._id), m._id]
                              : (task.assignedTo || []).filter(u => u._id !== m._id).map(u => u._id);
                            updateTaskAssignees(task._id, newAssignees);
                          }}
                          className="w-3.5 h-3.5 rounded text-slate-800 focus:ring-slate-800"
                        />
                        <span className="text-xs font-medium text-gray-700">{m.username}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`rounded-xl border px-3 py-2 mb-3 ${hasConflict ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-[0.16em]">
          <MdCalendarToday className="text-sm" />
          Task Schedule
        </div>
        <p className="text-sm font-semibold text-slate-800 mt-2">
          {effectiveDate ? formatDateLabel(effectiveDate) : 'No task date yet'}
        </p>
        {usesEventDeadline ? (
          <p className="text-[11px] text-slate-500 mt-1">Using the event deadline as fallback.</p>
        ) : null}
      </div>

      {canSchedule ? (
        <input
          type="date"
          value={toDateInputValue(task.dueDate)}
          onChange={(e) => updateSchedule(task._id, e.target.value)}
          className={`w-full px-3 py-2 rounded-xl border text-sm outline-none mb-3 ${
            hasConflict
              ? 'border-red-200 focus:border-red-400'
              : 'border-slate-200 focus:border-slate-400'
          }`}
        />
      ) : null}

      {canEdit && !isFinished ? (
        <div className="flex gap-1 justify-end">
          {status === 'in-progress' ? (
            <button
              type="button"
              onClick={() => updateStatus(task._id, 'todo')}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
              title="Move to To Do"
            >
              <MdArrowBack size={14} />
            </button>
          ) : null}
          {status === 'completed' ? (
            <button
              type="button"
              onClick={() => updateStatus(task._id, 'in-progress')}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
              title="Move to In Progress"
            >
              <MdArrowBack size={14} />
            </button>
          ) : null}
          {status === 'todo' ? (
            <button
              type="button"
              onClick={() => updateStatus(task._id, 'in-progress')}
              className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded text-blue-600 transition-colors"
              title="Move to In Progress"
            >
              <MdArrowForward size={14} />
            </button>
          ) : null}
          {status === 'in-progress' ? (
            <button
              type="button"
              onClick={() => updateStatus(task._id, 'completed')}
              className="p-1.5 bg-green-100 hover:bg-green-200 rounded text-green-600 transition-colors"
              title="Move to Completed"
            >
              <MdArrowForward size={14} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
