// src/components/events/TaskCard.jsx
import React from 'react';
import { MdDelete, MdArrowForward, MdArrowBack } from 'react-icons/md';

export default function TaskCard({ task, currentUserId, isOrganizer, isFinished, status, deleteTask, updateStatus }) {
  const canEdit = task.assignedTo && task.assignedTo._id === currentUserId;
  const canDelete = isOrganizer;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-800 text-sm flex-1">{task.title}</h4>
        {canDelete && !isFinished && (
          <button
            onClick={() => deleteTask(task._id)}
            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors ml-2"
          >
            <MdDelete size={18} />
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-gray-500">
          {task.assignedTo ? (
            <span className="font-medium text-gray-700">{task.assignedTo.username}</span>
          ) : (
            <span className="italic">Unassigned</span>
          )}
        </div>

        {canEdit && !isFinished && (
          <div className="flex gap-1">
            {status === 'in-progress' && (
              <button
                onClick={() => updateStatus(task._id, 'todo')}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                title="Move to To Do"
              >
                <MdArrowBack size={14} />
              </button>
            )}
            {status === 'completed' && (
              <button
                onClick={() => updateStatus(task._id, 'in-progress')}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                title="Move to In Progress"
              >
                <MdArrowBack size={14} />
              </button>
            )}
            {status === 'todo' && (
              <button
                onClick={() => updateStatus(task._id, 'in-progress')}
                className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded text-blue-600 transition-colors"
                title="Move to In Progress"
              >
                <MdArrowForward size={14} />
              </button>
            )}
            {status === 'in-progress' && (
              <button
                onClick={() => updateStatus(task._id, 'completed')}
                className="p-1.5 bg-green-100 hover:bg-green-200 rounded text-green-600 transition-colors"
                title="Move to Completed"
              >
                <MdArrowForward size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
