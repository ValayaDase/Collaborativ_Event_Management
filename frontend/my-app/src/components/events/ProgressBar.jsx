// src/components/events/ProgressBar.jsx
import React from 'react';

export default function ProgressBar({ progress }) {
  // Remove the early return condition
  const hasNoTasks = progress.counts.total === 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Overall Progress</h3>
        <span className="text-sm font-bold text-gray-800">
          {hasNoTasks ? '0' : progress.overall}%
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className="bg-green-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${hasNoTasks ? 0 : progress.overall}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">To Do</p>
          <p className="text-lg font-bold text-gray-700">
            {hasNoTasks ? '0' : progress.counts.todoCount}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">In Progress</p>
          <p className="text-lg font-bold text-blue-600">
            {hasNoTasks ? '0' : progress.counts.inProgressCount}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Completed</p>
          <p className="text-lg font-bold text-green-600">
            {hasNoTasks ? '0' : progress.counts.completedCount}
          </p>
        </div>
      </div>

      {hasNoTasks && (
        <p className="text-center text-sm text-gray-500 mt-3">
          No tasks yet. Create your first task to track progress!
        </p>
      )}
    </div>
  );
}
