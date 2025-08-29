// components/resume-form/ProfessionalSummarySection.js
import { useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

export default function ProfessionalSummarySection({
  summary = '',
  setSummary,
  embedded = false,     // when true, render content only (used inside SectionGroup)
  defaultOpen = true,   // used only when not embedded
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const text = summary || '';
  const maxChars = 600;

  const counts = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { words, chars: text.length };
  }, [text]);

  const Body = () => (
    <div className="space-y-3">
      <textarea
        name="summary"
        value={text}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="2–4 concise sentences highlighting your scope, strengths, and impact. Example: “Results-driven operations leader with 10+ years optimizing fulfillment and CX. Known for reducing costs 18% while improving SLA adherence to 98%.”"
        maxLength={maxChars}
        className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
      />

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Aim for a crisp overview; skip buzzwords and keep metrics concrete.</span>
        <span>
          {counts.words} words • {counts.chars}/{maxChars}
        </span>
      </div>
    </div>
  );

  // Embedded mode (inside SectionGroup): no outer card or header.
  if (embedded) return <Body />;

  // Standalone (legacy / direct use) with collapsible header.
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen((o) => !o)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Professional Summary</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </button>

      {isOpen && <Body />}
    </section>
  );
}
