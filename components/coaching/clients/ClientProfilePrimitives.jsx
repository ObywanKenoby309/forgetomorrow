// components/coaching/clients/ClientProfilePrimitives.jsx
// Shared UI primitives used across the coaching client profile page.
// MetaRow, SectionCard, TabButton — no data fetching, no side effects.

import React from 'react';

export function MetaRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] text-slate-500 shrink-0">{label}</span>
      <span className="text-[11px] text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}

export function SectionCard({ title, action, helperText, children, className = '', bodyClassName = '' }) {
  return (
    <section
      className={`rounded-[18px] border border-white/26 bg-[rgba(255,255,255,0.70)] shadow-[0_10px_22px_rgba(15,23,42,0.11)] backdrop-blur-xl ${className}`}
    >
      <div className={`p-2.5 sm:p-3 ${bodyClassName}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-black tracking-tight text-[#FF7043] drop-shadow-[0_2px_4px_rgba(15,23,42,0.45)]">
              {title}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {helperText ? (
          <div className="text-xs text-slate-500 mb-3 leading-5">
            {helperText}
          </div>
        ) : null}

        {children}
      </div>
    </section>
  );
}

export function TabButton({ id, label, activeTab, setActiveTab, badge }) {
  const active = activeTab === id;
  return (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[13px] font-semibold transition ${
        active
          ? 'border border-[#FF7043] bg-[rgba(255,112,67,0.12)] text-[#FF7043] shadow-sm'
          : 'border border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
      }`}
    >
      <span>{label}</span>
      {badge ? (
        <span className="inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-white/90 px-1.5 text-[11px] font-bold text-slate-700 border border-slate-200">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
