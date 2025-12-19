// components/resume-form/LanguagesSection.js
import { useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTimes } from 'react-icons/fa';

export default function LanguagesSection({
  languages = [],
  setLanguages,
  embedded = false,
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [input, setInput] = useState('');
  const [hoverIdx, setHoverIdx] = useState(-1);

  const hasLang = (arr, s) =>
    (arr || []).some((x) => String(x).toLowerCase() === String(s).toLowerCase());

  const normalizedInput = input.trim();

  // Lightweight “suggestions” from what user typed so far (no external list)
  const suggestions = useMemo(() => {
    if (!normalizedInput) return [];
    const q = normalizedInput.toLowerCase();

    // Common formats: "English", "English — Native", "Spanish - Professional"
    // We'll suggest only the raw language token before separators if user is typing it.
    const existing = (languages || [])
      .map((l) => String(l || ''))
      .map((l) => l.split('—')[0].split('-')[0].split(':')[0].trim())
      .filter(Boolean);

    const uniq = Array.from(new Set(existing));
    return uniq
      .filter((s) => s.toLowerCase().includes(q))
      .filter((s) => !hasLang(languages, s))
      .slice(0, 8);
  }, [normalizedInput, languages]);

  const addLanguage = (raw) => {
    const s = String(raw).trim();
    if (!s) return;
    if (hasLang(languages, s)) return;
    setLanguages((prev) => [...(Array.isArray(prev) ? prev : []), s]);
    setInput('');
    setHoverIdx(-1);
  };

  const removeLanguage = (toRemove) => {
    setLanguages((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (s) => String(s).toLowerCase() !== String(toRemove).toLowerCase()
      )
    );
  };

  const onKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && normalizedInput) {
      e.preventDefault();
      addLanguage(normalizedInput);
      return;
    }
    if (suggestions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHoverIdx((i) => (i + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHoverIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Tab' && hoverIdx >= 0) {
        e.preventDefault();
        addLanguage(suggestions[hoverIdx]);
      }
    }
  };

  const content = (
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
          placeholder="Add a language (e.g., English — Native, Spanish — Professional)…"
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  addLanguage(s);
                }}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === hoverIdx ? 'bg-[#FF7043] text-white' : 'hover:bg-[#FF7043]/10'
                }`}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(languages || []).map((l) => (
          <span
            key={l}
            className="inline-flex items-center gap-1 rounded-full border border-[#FF7043]/30 bg-[#FF7043]/10 px-3 py-1 text-xs font-medium text-[#FF7043]"
          >
            {l}
            <button
              type="button"
              onClick={() => removeLanguage(l)}
              className="ml-1 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-[#FF7043]/20"
              aria-label={`Remove ${l}`}
            >
              <FaTimes />
            </button>
          </span>
        ))}
      </div>

      {Array.isArray(languages) && languages.length > 0 && (
        <button
          type="button"
          onClick={() => setLanguages([])}
          className="text-xs text-slate-500 hover:underline"
        >
          Clear all
        </button>
      )}

      <div className="text-xs text-slate-500">
        Tip: use “Language — Proficiency” (example: “Spanish — Professional”).
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
        <h2 className="text-lg font-semibold text-[#FF7043]">Languages</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </button>
      {isOpen && content}
    </section>
  );
}
