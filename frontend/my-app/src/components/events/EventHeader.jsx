// src/components/events/EventHeader.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdContentCopy, MdArrowBack, MdAdd, MdCheckCircle } from 'react-icons/md';

export default function EventHeader({ event, isOrganizer, copied, copyEventCode, setShowTaskModal, finishEvent }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdArrowBack size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{event.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Organizer: {event.organizer.username}
              {isOrganizer && <span className="ml-2 text-blue-600 font-medium">(You)</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyEventCode}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow-md"
          >
            <MdContentCopy size={18} />
            {copied ? 'Copied!' : event.eventCode}
          </button>

          {!event.isFinished && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md hover:shadow-lg"
            >
              <MdAdd size={18} />
              New Task
            </button>
          )}

          {isOrganizer && !event.isFinished && (
            <button
              onClick={finishEvent}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md hover:shadow-lg"
            >
              <MdCheckCircle size={18} />
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
