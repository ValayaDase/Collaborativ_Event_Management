// src/components/events/EventHeader.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdContentCopy, MdArrowBack, MdAdd, MdCheckCircle, MdPersonAdd } from 'react-icons/md';

export default function EventHeader({ event, isOrganizer, copied, copyEventCode, setShowTaskModal, finishEvent, handleOpenAddMember }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MdArrowBack size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{event.eventName}</h1>
            <p className="text-sm text-slate-600 mt-1">
              Organizer: <span className="font-semibold text-slate-800">{event.organizer.username}</span>
              {isOrganizer && <span className="ml-2 bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full text-xs font-bold tracking-widest uppercase">You</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyEventCode}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium shadow-sm active:scale-[0.98]"
          >
            <MdContentCopy size={18} />
            {copied ? 'Copied!' : event.eventCode}
          </button>

          {!event.isFinished && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-lg transition-colors text-sm font-medium shadow-sm active:scale-[0.98]"
            >
              <MdAdd size={18} />
              New Task
            </button>
          )}

          {isOrganizer && !event.isFinished && (
            <>
              <button
                onClick={handleOpenAddMember}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg transition-colors text-sm font-medium shadow-sm active:scale-[0.98]"
              >
                <MdPersonAdd size={18} />
                Add Member
              </button>
              <button
                onClick={finishEvent}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors text-sm font-medium shadow-sm active:scale-[0.98]"
              >
                <MdCheckCircle size={18} />
                Finish
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
