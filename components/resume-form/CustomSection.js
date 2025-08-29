// components/resume-form/CustomSection.js
import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function CustomSection({
  customSections = [],
  setCustomSections,
  embedded = false,     // render body only when used inside SectionGroup
  defaultOpen = false,  // only used when not embedded
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // ----- helpers (immutable updates) -----
  const updateSection = (idx, patch) => {
    const next = [...customSections];
    const curr = { ...(next[idx] || { title: '', items: [''] }) };
    next[idx] = { ...curr, ...patch };
    setCustomSections(next);
  };

  const updateItem = (sIdx, iIdx, value) => {
    const next = [...customSections];
    const section = { ...(next[sIdx] || { title: '', items: [] }) };
    const items = Array.isArray(section.items) ? [...section.items] : [];
    items[iIdx] = value;
    section.items = items;
    next[sIdx] = section;
    setCustomSections(next);
  };

  const addSection = () => {
    setCustomSections([
      ...customSections,
      { title: 'New Section', items: [''] },
    ]);
  };

  const removeSection = (idx) => {
    const next = [...customSections];
    next.splice(idx, 1);
    setCustomSections(next);
  };

  const addItem = (sIdx) => {
    const next = [...customSections];
    const section = { ...(next[sIdx] || { title: '', items: [] }) };
    const items = Array.isArray(section.items) ? [...section.items] : [];
    items.push('');
    section.items = items;
    next[sIdx] = section;
    setCustomSections(next);
  };

  const removeItem = (sIdx, iIdx) => {
    const next = [...customSections];
    const section = { ...(next[sIdx] || { title: '', items: [] }) };
    const items = Array.isArray(section.items) ? [...section.items] : [];
    items.splice(iIdx, 1);
    section.items = items;
    next[sIdx] = section;
    setCustomSections(next);
  };

  // ----- body -----
  const Body = () => (
    <div className="space-y-4">
      {customSections.length === 0 && (
        <p className="text-sm text-slate-500">No custom sections added yet.</p>
      )}

      {customSections.map((section, sIdx) => (
        <div
          key={sIdx}
          className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={section.title || ''}
              onChange={(e) => updateSection(sIdx, { title: e.target.value })}
              placeholder="Section Title (e.g., Publications, Speaking, Interests)"
              className="w-full rounded-lg border border-slate-200 p-2 text-sm font-semibold outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
            />
            <button
              type="button"
              onClick={() => removeSection(sIdx)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
              aria-label="Remove section"
              title="Remove section"
            >
              <FaTrash className="opacity-80" /> Remove
            </button>
          </div>

          {/* items */}
          <div className="space-y-2">
            {(section.items || []).map((item, iIdx) => (
              <div key={iIdx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(sIdx, iIdx, e.target.value)}
                  placeholder="Add item"
                  className="flex-1 rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
                <button
                  type="button"
                  onClick={() => removeItem(sIdx, iIdx)}
                  className="text-sm font-semibold text-red-600 hover:text-red-700"
                  aria-label="Remove item"
                  title="Remove item"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addItem(sIdx)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#FF7043]/30 px-3 py-2 text-sm font-semibold text-[#FF7043] hover:bg-[#FF7043] hover:text-white transition-colors"
          >
            <FaPlus /> Add Item
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="inline-flex items-center gap-2 rounded-lg border border-[#FF7043]/30 px-3 py-2 text-sm font-semibold text-[#FF7043] hover:bg-[#FF7043] hover:text-white transition-colors"
      >
        <FaPlus /> Add Custom Section
      </button>
    </div>
  );

  // Embedded mode (inside SectionGroup) = no outer card/chrome
  if (embedded) return <Body />;

  // Standalone card mode
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen((o) => !o)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Custom Sections</h2>
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
