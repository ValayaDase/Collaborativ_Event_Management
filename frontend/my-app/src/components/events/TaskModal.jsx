// src/components/events/TaskModal.jsx
import React from 'react';
import { MdClose } from 'react-icons/md';

export default function TaskModal({ showModal, setShowModal, taskTitle, setTaskTitle, taskDesc, setTaskDesc, assignedTo, setAssignedTo, members, organizerId, currentUserId, isOrganizer, createTask }) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Create New Task</h2>
          <button
            onClick={() => setShowModal(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdClose size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Enter task description (optional)"
            />
          </div>

          {isOrganizer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select a member</option>
                {members.map(member => (
                  <option key={member._id} value={member._id}>
                    {member.username} {member._id === organizerId && '(Organizer)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isOrganizer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                ℹ️ This task will be assigned to you
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={createTask}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
