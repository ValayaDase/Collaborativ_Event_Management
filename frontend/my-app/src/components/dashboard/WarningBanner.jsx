import React from 'react';
import { MdCampaign, MdWarningAmber } from 'react-icons/md';

const toneStyles = {
  critical: 'border-red-200 bg-red-50 text-red-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info: 'border-slate-200 bg-slate-50 text-slate-700'
};

export default function WarningBanner({
  title,
  message,
  tone = 'warning',
  icon: Icon = MdWarningAmber,
  action
}) {
  return (
    <div className={`rounded-2xl border p-4 ${toneStyles[tone] || toneStyles.info}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon className="text-2xl" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black tracking-tight">{title}</h3>
            {action ? (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-700"
              >
                <MdCampaign className="text-base" />
                {action.label}
              </button>
            ) : null}
          </div>
          <p className="text-sm mt-1 leading-6">{message}</p>
        </div>
      </div>
    </div>
  );
}
