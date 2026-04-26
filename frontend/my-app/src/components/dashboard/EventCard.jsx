import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdCalendarMonth, MdCheckCircle, MdEvent, MdPeople, MdWarningAmber } from 'react-icons/md';
import { daysLeftFromDeadline, formatDateLabel, getDeadlineTone } from '../../utils/eventUi';

const deadlineStyles = {
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200'
};

export default function EventCard({ event, isOrganizer }) {
  const navigate = useNavigate();

  const completed = event.tasks?.filter((task) => task.status === 'completed').length || 0;
  const total = event.tasks?.length || 0;
  const pending = event.tasks?.filter((task) => task.status !== 'completed').length || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const daysLeft = daysLeftFromDeadline(event.deadline);
  const tone = getDeadlineTone(daysLeft);
  const isNearDeadline = daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;

  return (
    <div
      onClick={() => navigate(`/event/${event._id}`)}
      className={`bg-white rounded-[1.75rem] shadow-sm border p-6 hover:shadow-xl hover:-translate-y-1 transition cursor-pointer ${
        isNearDeadline ? 'border-amber-200' : 'border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start gap-4 mb-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-lg font-black text-gray-900">{event.eventName}</h3>
            {isOrganizer ? (
              <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                Organizer
              </span>
            ) : null}
            {isNearDeadline ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-[0.18em] rounded-full border border-amber-200">
                <MdWarningAmber className="text-sm" />
                Deadline Near
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-500">
            {pending} active tasks are still moving inside this event.
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-100">
          <MdEvent className="w-6 h-6 text-slate-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
            <MdPeople className="text-base" />
            Members
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{event.members?.length || 0}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
            <MdCheckCircle className="text-base" />
            Progress
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{progress}%</p>
        </div>
      </div>

      <div className={`rounded-2xl border px-4 py-3 mb-4 ${deadlineStyles[tone]}`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]">
          <MdCalendarMonth className="text-base" />
          Event Deadline
        </div>
        <p className="text-sm font-bold mt-2">
          {event.deadline ? formatDateLabel(event.deadline) : 'Add a deadline'}
        </p>
        <p className="text-xs mt-1">
          {daysLeft === null
            ? 'No deadline set yet.'
            : daysLeft < 0
              ? 'Deadline has passed.'
              : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left.`}
        </p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-slate-900 to-slate-700 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-600 text-right font-semibold">
        {completed}/{total} tasks completed
      </p>
    </div>
  );
}
