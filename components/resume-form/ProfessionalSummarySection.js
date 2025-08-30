// components/resume-form/ProfessionalSummarySection.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

export default function ProfessionalSummarySection({
  summary = '',
  setSummary,
  embedded = false,     // content-only when used inside SectionGroup
  defaultOpen = true,   // only used when not embedded
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Controlled textarea state
  const [text, setText] = useState(summary || '');
  const lastProp = useRef(summary || '');
  const debounceRef = useRef(null);

  // Sync local state when summary prop changes from elsewhere (AI, restore, etc.)
  useEffect(() => {
    if (summary !== lastProp.current) {
      lastProp.current = summary || '';
      setText(summary || '');
    }
  }, [summary]);

  // Debounce pushing edits up to context to keep typing smooth
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text !== lastProp.current) {
        lastProp.current = text;
        setSummary(text);
      }
    }, 150);
    return () => clearTimeout(debounceRef.current);
  }, [text, setSummary]);

  const maxChars = 600;
  const counts = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { words, chars: text.length };
  }, [text]);

  // Stable content (no nested component = no remount)
  const content = (
    <div className="space-y-3">
      <textarea
        data-ftid="summary-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="2–4 concise sentences highlighting scope, strengths, and impact."
        maxLength={maxChars}
        className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Aim for a crisp overview; skip buzzwords, keep metrics concrete.</span>
        <span>{counts.words} words • {counts.chars}/{maxChars}</span>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen((o) => !o)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Professional Summary</h2>
        {isOpen ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
      </button>

      {isOpen && content}
    </section>
  );
}
