// components/resume-form/AchievementsSection.js
import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function AchievementsSection({
  achievements = [],
  setAchievements,
  embedded = false,     // render content only (for SectionGroup)
  defaultOpen = true,   // used only when not embedded
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const setField = (index, key, value) => {
    const next = [...achievements];
    const curr = { ...(next[index] || {}) };
    curr[key] = value;
    next[index] = curr;
    setAchievements(next);
  };

  const addAchievement = () => {
    setAchievements([
      ...achievements,
      { title: '', issuer: '', date: '', description: '' },
    ]);
  };

  const removeAchievement = (index) => {
    const next = [...achievements];
    next.splice(index, 1);
    setAchievements(next);
  };

  const Body = () => (
    <div className="space-y-4">
      {achievements.length === 0 && (
        <p className="text-sm text-slate-500">No achievements added yet.</p>
      )}

      {achievements.map((ach, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Title
              </label>
              <input
                type="text"
                value={ach.title || ''}
                onChange={(e) => setField(index, 'title', e.target.value)}
                placeholder="Award or Achievement Title"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Issuer
              </label>
              <input
                type="text"
                value={ach.issuer || ''}
                onChange={(e) => setField(index, 'issuer', e.target.value)}
                placeholder="Organization or Authority"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Date
              </label>
              <input
                type="month"
                value={ach.date || ''}
                onChange={(e) => setField(index, 'date', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              value={ach.description || ''}
              onChange={(e) => setField(index, 'description', e.target.value)}
              placeholder="Optional: details or context about this achievement"
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm resize-none outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeAchievement(index)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <FaTrash className="opacity-80" /> Remove Achievement
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addAchievement}
        className="inline-flex items-center gap-2 rounded-lg border border-[#FF7043]/30 px-3 py-2 text-sm font-semibold text-[#FF7043] hover:bg-[#FF7043] hover:text-white transition-colors"
      >
        <FaPlus /> Add Achievement
      </button>
    </div>
  );

  if (embedded) return <Body />;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen((o) => !o)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Achievements / Awards</h2>
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
