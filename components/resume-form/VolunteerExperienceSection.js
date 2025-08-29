// components/resume-form/VolunteerExperienceSection.js
import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function VolunteerExperienceSection({
  volunteerExperiences = [],
  setVolunteerExperiences,
  embedded = false,     // when true, render content only (used inside SectionGroup)
  defaultOpen = true,   // used only when not embedded
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const setField = (index, key, value) => {
    const next = [...volunteerExperiences];
    const curr = { ...(next[index] || {}) };
    curr[key] = value;
    next[index] = curr;
    setVolunteerExperiences(next);
  };

  const addVolunteerExperience = () => {
    setVolunteerExperiences([
      ...volunteerExperiences,
      {
        role: '',
        organization: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
        link: '', // optional: org/site/reference
      },
    ]);
  };

  const removeVolunteerExperience = (index) => {
    const next = [...volunteerExperiences];
    next.splice(index, 1);
    setVolunteerExperiences(next);
  };

  const Body = () => (
    <div className="space-y-4">
      {volunteerExperiences.length === 0 && (
        <div className="text-sm text-slate-500">
          No volunteer experience yet. Add community work, leadership, or service roles.
        </div>
      )}

      {volunteerExperiences.map((vol, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Role / Title</label>
              <input
                type="text"
                value={vol.role || ''}
                onChange={(e) => setField(index, 'role', e.target.value)}
                placeholder="e.g., Volunteer Coordinator"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Organization</label>
              <input
                type="text"
                value={vol.organization || ''}
                onChange={(e) => setField(index, 'organization', e.target.value)}
                placeholder="e.g., Helping Hands"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Location</label>
              <input
                type="text"
                value={vol.location || ''}
                onChange={(e) => setField(index, 'location', e.target.value)}
                placeholder="City, State"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="month"
                  value={vol.startDate || ''}
                  onChange={(e) => setField(index, 'startDate', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="month"
                  value={vol.endDate || ''}
                  onChange={(e) => setField(index, 'endDate', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Link (optional)</label>
              <input
                type="url"
                value={vol.link || ''}
                onChange={(e) => setField(index, 'link', e.target.value)}
                placeholder="Organization website / reference link"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Description / Impact</label>
            <textarea
              value={vol.description || ''}
              onChange={(e) => setField(index, 'description', e.target.value)}
              placeholder="What did you do? Quantify impact if possible (e.g., “Organized 12 events; raised $18k”)."
              className="mt-1 w-full min-h-[90px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeVolunteerExperience(index)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <FaTrash className="opacity-80" /> Remove Volunteer Experience
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addVolunteerExperience}
        className="inline-flex items-center gap-2 rounded-lg border border-[#FF7043]/30 px-3 py-2 text-sm font-semibold text-[#FF7043] hover:bg-[#FF7043] hover:text-white transition-colors"
      >
        <FaPlus /> Add Volunteer Experience
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
        <h2 className="text-lg font-semibold text-[#FF7043]">Volunteer Experience</h2>
        {isOpen ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
      </button>

      {isOpen && <Body />}
    </section>
  );
}
