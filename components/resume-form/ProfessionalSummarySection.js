// components/resume-form/ProfessionalSummarySection.js
import React, { memo, useMemo, useState, useEffect, useRef } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

function ProfessionalSummarySection({
  summary = '',
  setSummary,
  embedded = false,     // render body only inside SectionGroup
  defaultOpen = true,   // used only when not embedded
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Keep a local buffer so parent updates don’t steal focus while typing
  const [local, setLocal] = useState(summary || '');
  const lastProp = useRef(summary);

  useEffect(() => {
    // Only sync in if the prop truly changed from outside (e.g., AI insert)
    if (summary !== lastProp.current) {
      lastProp.current = summary;
      setLocal(summary || '');
    }
  }, [summary]);

  const maxChars = 600;
  const counts = useMemo(() => {
    const words = local.trim() ? local.trim().split(/\s+/).length : 0;
    return { words, chars: local.length };
  }, [local]);

  const onChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    // Push up on a microtask to avoid any chance of remount/focus loss
    Promise.resolve().then(() => setSummary(v));
  };

  const Body = () => (
    <div className="space-y-3">
      <textarea
        value={local}
        onChange={onChange}
        placeholder="2–4 concise sentences highlighting your scope, strengths, and impact…"
        maxLength={maxChars}
        className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Aim for a crisp overview; keep metrics concrete.</span>
        <span>{counts.words} words • {counts.chars}/{maxChars}</span>
      </div>
    </div>
  );

  if (embedded) return <Body />;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen(o => !o)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Professional Summary</h2>
        {isOpen ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
      </button>
      {isOpen && <Body />}
    </section>
  );
}

export default memo(ProfessionalSummarySection);
