// src/components/events/TeamMembers.jsx
import React from 'react';
import { MdPeople, MdStar } from 'react-icons/md';

export default function TeamMembers({ members, organizerId, currentUserId }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <MdPeople size={20} className="text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">
          Team Members ({members.length})
        </h3>
      </div>

      {/* Horizontal scrollable layout */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {members.map(member => (
          <div
            key={member._id}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-blue-600">
                {member.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-gray-800 whitespace-nowrap">
                {member.username}
                {member._id === currentUserId && (
                  <span className="ml-1 text-xs text-blue-600">(You)</span>
                )}
              </p>
              {member._id === organizerId && (
                <MdStar size={16} className="text-yellow-500 flex-shrink-0" title="Organizer" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
