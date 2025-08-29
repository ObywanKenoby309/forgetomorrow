// components/resume-form/VolunteerExperienceSection.js
import React, { memo, useEffect, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

function VolunteerExperienceSection({
  volunteerExperiences = [],
  setVolunteerExperiences,
  embedded = false,
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Assign stable IDs once
  useEffect(() => {
    if (!Array.isArray(volunteerExperiences)) return;
    let changed = false;
    const withIds = volunteerExperiences.map(v => {
      if (v && v.id) return v;
      changed = true;
      return {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
        role: v?.role ?? '',
        organization: v?.organization ?? '',
        location: v?.location ?? '',
        startDate: v?.startDate ?? '',
        endDate: v?.endDate ?? '',
        description: v?.description ?? '',
      };
    });
    if (changed) setVolunteerExperiences(withIds);
  }, [volunteerExperiences, setVolunteerExperiences]);

  const list = Array.isArray(volunteerExperiences) ? volunteerExperiences : [];
  const commit = (next) => setVolunteerExperiences(next);

  const setField = (id, key, value) => {
    commit(list.map(row => row.id === id ? { ...row, [key]: value } : row));
  };

  const addRow = () => {
    commit([
      ...list,
      {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
        role: '', organization: '', location: '',
        startDate: '', endDate: '', description: '',
      },
    ]);
  };

  const removeRow = (id) => commit(list.filter(r => r.id !== id));

  const Body = () => (
    <div className="space-y-4">
      {list.map((row) => (
        <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Role/Title</label>
              <input
                type="text"
                value={row.role || ''}
                onChange={(e) => setField(row.id, 'role', e.target.value)}
                placeholder="e.g., Volunteer Coordinator"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Organization</label>
              <input
                type="text"
                value={row.organization || ''}
                onChange={(e) => setField(row.id, 'organization', e.target.value)}
                placeholder="e.g., Helping Hands"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Location</label>
              <input
                type="text"
                value={row.location || ''}
                onChange={(e) => setField(row.id, 'location', e.target.value)}
                placeholder="City, State"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="month"
                  value={row.startDate || ''}
                  onChange={(e) => setField(row.id, 'startDate', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="month"
                  value={row.endDate || ''}
                  onChange={(e) => setField(row.id, 'endDate', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={row.description || ''}
              onChange={(e) => setField(row.id, 'description', e.target.value)}
              placeholder="Describe your role and impact"
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none resize-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <FaTrash className="opacity-80" /> Remove Volunteer Experience
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-2 rounded-lg border border-[#FF7043]/30 px-3 py-2 text-sm font-semibold text-[#FF7043] hover:bg-[#FF7043] hover:text-white transition-colors"
      >
        <FaPlus /> Add Volunteer Experience
      </button>
    </div>
  );

  if (embedded) return <Body />;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button type="button" className="w-full flex items-center justify-between" onClick={() => setIsOpen(o => !o)}>
        <h2 className="text-lg font-semibold text-[#FF7043]">Volunteer Experience</h2>
        {isOpen ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
      </button>
      {isOpen && <Body />}
    </section>
  );
}

export default memo(VolunteerExperienceSection);
