import { useMemo, useState } from 'react';
import {
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaPlus,
} from 'react-icons/fa';

export default function VolunteerExperienceSection({
  volunteerExperiences = [],
  setVolunteerExperiences,
  embedded = false,    // render only fields (no outer card/header)
  defaultOpen = true,  // used only in standalone mode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Normalize shape
  const norm = useMemo(
    () =>
      (volunteerExperiences || []).map((e) => ({
        organization: e.organization ?? e.company ?? '',
        role: e.role ?? e.title ?? '',
        location: e.location ?? '',
        startDate: e.startDate ?? '',
        endDate: e.endDate ?? '',
        current: !!e.current,
        description: e.description ?? '',
      })),
    [volunteerExperiences]
  );

  const commit = (next) => setVolunteerExperiences(next);

  const handleField = (idx, name, value) => {
    const next = norm.map((row, i) =>
      i === idx ? { ...row, [name]: value } : row
    );
    commit(next);
  };

  const toggleCurrent = (idx, checked) => {
    const next = norm.map((row, i) =>
      i === idx ? { ...row, current: checked, endDate: checked ? '' : row.endDate } : row
    );
    commit(next);
  };

  const addVol = () => {
    commit([
      ...norm,
      {
        organization: '',
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      },
    ]);
  };

  const removeVol = (idx) => {
    commit(norm.filter((_, i) => i !== idx));
  };

  // Stable content (no nested component = no remount)
  const content = (
    <div className="space-y-4">
      {norm.map((vol, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200 p-3 md:p-4 bg-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Organization
              </label>
              <input
                type="text"
                value={vol.organization}
                onChange={(e) => handleField(idx, 'organization', e.target.value)}
                placeholder="e.g. Local Food Bank"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Role / Title
              </label>
              <input
                type="text"
                value={vol.role}
                onChange={(e) => handleField(idx, 'role', e.target.value)}
                placeholder="e.g. Volunteer Coordinator"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                type="text"
                value={vol.location}
                onChange={(e) => handleField(idx, 'location', e.target.value)}
                placeholder="City, State (or Remote)"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Start Date
                </label>
                <input
                  type="month"
                  value={vol.startDate}
                  onChange={(e) => handleField(idx, 'startDate', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  End Date
                </label>
                <input
                  type="month"
                  value={vol.current ? '' : vol.endDate}
                  onChange={(e) => handleField(idx, 'endDate', e.target.value)}
                  disabled={vol.current}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none disabled:bg-slate-100 focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>

              <label className="flex items-center gap-2 mt-6 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={vol.current}
                  onChange={(e) => toggleCurrent(idx, e.target.checked)}
                  className="rounded border-slate-300"
                />
                I currently volunteer here
              </label>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700">
              Description / Impact
            </label>
            <textarea
              value={vol.description}
              onChange={(e) => handleField(idx, 'description', e.target.value)}
              placeholder="Briefly describe what you did and the impact you made."
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none resize-none min-h-[90px] focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
            />
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => removeVol(idx)}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <FaTrash /> Remove volunteer role
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addVol}
        className="inline-flex items-center gap-1 text-sm text-[#FF7043] hover:underline"
      >
        <FaPlus /> Add another volunteer role
      </button>
    </div>
  );

  // Embedded mode (inside SectionGroup): render content only
  if (embedded) return content;

  // Standalone (legacy/other routes) with collapsible header
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

      {isOpen && content}
    </section>
  );
}
