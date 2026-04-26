import React from 'react';
import { MdTrendingUp } from 'react-icons/md';
import { getPressureStyles } from '../../utils/eventUi';

export default function PressureMeter({ title = 'Pressure Meter', pressure, subtitle }) {
  const styles = getPressureStyles(pressure?.level);
  const rawValue = pressure?.value ?? 0;
  const progress = pressure?.value === null ? 18 : Math.min(rawValue * 22, 100);

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/70 shadow-sm p-6 h-full">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 mt-2">
            {pressure?.label?.toUpperCase() || 'UNKNOWN'}
          </h3>
          <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-2xl border ${styles.badge}`}>
          <MdTrendingUp className="text-2xl" />
        </div>
      </div>

      <div className={`rounded-2xl p-4 ${styles.track}`}>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Pressure Value</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {pressure?.value ?? '--'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Days Left</p>
            <p className="text-lg font-bold text-slate-800 mt-1">
              {pressure?.daysLeft ?? '--'}
            </p>
          </div>
        </div>

        <div className="h-3 rounded-full bg-white/80 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
