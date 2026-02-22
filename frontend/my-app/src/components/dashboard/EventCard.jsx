// src/components/dashboard/EventCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEvent, MdPeople, MdCheckCircle } from 'react-icons/md';

export default function EventCard({ event, isOrganizer }) {
  const navigate = useNavigate();

  const completed = event.tasks?. filter(t => t.status === 'completed').length || 0;
  const total = event.tasks?.length || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      onClick={() => navigate(`/event/${event._id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{event.eventName}</h3>
          {isOrganizer && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              Organizer
            </span>
          )}
        </div>
        <MdEvent className="w-8 h-8 text-gray-400" />
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <MdPeople className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">{event.members?.length || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <MdCheckCircle className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">{completed}/{total}</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="h-full bg-blue-600 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-600 text-right">{progress}%</p>
    </div>
  );
}