// components/recruiter/jobs/JobProfilePrimitives.js
import React from "react";

export function SectionCard({ title, action, helperText, children, className = '', bodyClassName = '' }) {
  return (
    <section
      className={`rounded-[18px] border border-white/22 bg-[rgba(255,255,255,0.68)] shadow-[0_10px_28px_rgba(15,23,42,0.12)] backdrop-blur-md ${className}`}
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