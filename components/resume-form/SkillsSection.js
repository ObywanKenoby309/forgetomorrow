// components/resume-form/SkillsSection.js
import { useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTimes } from 'react-icons/fa';
import skillsList from './skillsData';

export default function SkillsSection({
  skills = [],
  setSkills,
  embedded = false,     // render only content (for SectionGroup)
  defaultOpen = true,   // used only when not embedded
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [input, setInput] = useState('');
  const [hoverIdx, setHoverIdx] = useState(-1);

  // case-insensitive “has skill”
  const hasSkill = (s) =>
    (skills || []).some((x) => String(x).toLowerCase() === String(s).toLowerCase());

  const normalizedInput = input.trim();

  const suggestions = useMemo(() => {
    if (!normalizedInput) return [];
    const q = normalizedInput.toLowerCase();
    const filtered = (skillsList || [])
      .filter(
        (s) => s.toLowerCase().includes(q) && !hasSkill(s)
      )
      .slice(0, 8);
    return filtered;
  }, [normalizedInput, skills]);

  const addSkill = (raw) => {
    const s = String(raw).trim();
    if (!s) return;
    if (!hasSkill(s)) setSkills([...(skills || []), s]);
    setInput('');
    setHoverIdx(-1);
  };

  const removeSkill = (toRemove) => {
    const low = String(toRemove).toLowerCase();
    setSkills((skills || []).filter((s) => String(s).toLowerCase() !== low));
  };

  const onKeyDown = (e) => {
    // Enter or comma adds the current input
    if ((e.key === 'Enter' || e.key === ',') && normalizedInput) {
      e.preventDefault();
      addSkill(normalizedInput);
    }
    // Arrow navigation in suggestions
    if (suggestions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHoverIdx((i) => (i + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHoverIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Tab' && hoverIdx >= 0) {
        // Tab to accept highlighted suggestion
        e.preventDefault();
        addSkill(suggestions[hoverIdx]);
      }
    }
  };

  const Body = () => (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHoverIdx(-1);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a skill and press Enter (e.g., React, Excel)…"
          className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
          autoComplete="off"
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow">
            {suggestions.map((s, i) => (
              <li
                key={s}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(-1)}
                onClick={() => addSkill(s)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === hoverIdx
                    ? 'bg-[#FF7043] text-white'
                    : 'hover:bg-[#FF7043]/10'
                }`}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {(skills || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full border border-[#FF7043]/30 bg-[#FF7043]/10 px-3 py-1 text-xs font-medium text-[#FF7043]"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                className="ml-1 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-[#FF7043]/20"
                aria-label={`Remove ${s}`}
              >
                <FaTimes />
              </button>
            </span>
          ))}
        </div>
      )}

      {(skills || []).length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setSkills([])}
            className="text-xs text-slate-500 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );

  // Embedded mode (inside SectionGroup)
  if (embedded) return <Body />;

  // Standalone (legacy / direct use)
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen((o) => !o)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Skills</h2>
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
