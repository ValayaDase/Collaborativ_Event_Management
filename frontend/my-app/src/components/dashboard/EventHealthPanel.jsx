import React from 'react';
import { MdBolt, MdSchedule, MdWarningAmber } from 'react-icons/md';
import { formatDateTimeLabel, getHealthAccent } from '../../utils/eventUi';

export default function EventHealthPanel({ eventHealth = [], alerts = [], onOpenEvent }) {
  const visibleHealth = eventHealth.slice(0, 5);
  const visibleAlerts = alerts.slice(0, 3);

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/70 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Auto Event Brain</p>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Event Health Signals</h2>
          <p className="text-sm text-slate-500 mt-2">
            Low activity, silent stretches, deadline risk, and workload pressure in one place.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950 text-white px-4 py-3 min-w-[220px]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-bold">Live Warnings</p>
          <p className="text-3xl font-black mt-2">{alerts.length}</p>
        </div>
      </div>

      {visibleAlerts.length > 0 ? (
        <div className="grid gap-3 mb-6">
          {visibleAlerts.map((alert, index) => (
            <div
              key={`${alert.type}-${alert.eventId || index}`}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <MdWarningAmber className="text-xl text-amber-500 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-slate-800">{alert.eventName}</p>
                <p className="text-sm text-slate-600">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-4">
        {visibleHealth.length > 0 ? (
          visibleHealth.map((health) => (
            <button
              key={health.eventId}
              type="button"
              onClick={() => onOpenEvent?.(health.eventId)}
              className="w-full text-left rounded-[1.5rem] border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900">{health.eventName}</h3>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${getHealthAccent(health.status)}`}>
                      {health.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <MdBolt className="text-base" />
                      {health.pendingTasks} active tasks
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MdSchedule className="text-base" />
                      Last update {formatDateTimeLabel(health.lastActivityAt)}
                    </span>
                  </div>
                </div>

                <div className="lg:max-w-sm">
                  <p className="text-sm font-semibold text-slate-700">
                    {health.suggestions[0] || 'This event is moving well right now.'}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-6 text-center text-slate-500">
            No event health warnings right now.
          </div>
        )}
      </div>
    </div>
  );
}
