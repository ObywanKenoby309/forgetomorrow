// components/resume-form/WorkExperienceSection.js
import { useMemo, useState } from 'react';
import {
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaPlus,
} from 'react-icons/fa';

export default function WorkExperienceSection({
  experiences = [],
  setExperiences,
  embedded = false,    // render only fields (no outer card/header)
  defaultOpen = true,  // used only in standalone mode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // --- helpers ---
  const norm = useMemo(
    () =>
      (experiences || []).map((e) => ({
        // keep both keys so older code keeps working, but use "title" as canonical
        title: e.title ?? e.jobTitle ?? '',
        jobTitle: e.jobTitle ?? e.title ?? '',
        company: e.company ?? '',
        location: e.location ?? '',
        startDate: e.startDate ?? '',
        endDate: e.endDate ?? '',
        current: !!e.current,
        // bullets preferred; fall back to description (split by newlines)
        bullets: Array.isArray(e.bullets)
          ? e.bullets
          : (e.description || '')
              .split('\n')
              .map((b) => b.trim())
              .filter(Boolean),
        // keep raw description too (for backward compat / export if needed)
        description: e.description ?? '',
      })),
    [experiences]
  );

  const commit = (next) => setExperiences(next);

  const handleField = (idx, name, value) => {
    const next = norm.map((e, i) =>
      i === idx
        ? {
            ...e,
            [name]: value,
            ...(name === 'title' ? { jobTitle: value } : null), // keep both in sync
          }
        : e
    );
    commit(next);
  };

  const handleBullet = (idx, bIdx, value) => {
    const next = norm.map((e, i) =>
      i === idx
        ? {
            ...e,
            bullets: e.bullets.map((b, j) => (j === bIdx ? value : b)),
          }
        : e
    );
    commit(next);
  };

  const addBullet = (idx) => {
    const next = norm.map((e, i) =>
      i === idx ? { ...e, bullets: [...e.bullets, ''] } : e
    );
    commit(next);
  };

  const removeBullet = (idx, bIdx) => {
    const next = norm.map((e, i) =>
      i === idx
        ? { ...e, bullets: e.bullets.filter((_, j) => j !== bIdx) }
        : e
    );
    commit(next);
  };

  const toggleCurrent = (idx, checked) => {
    const next = norm.map((e, i) =>
      i === idx ? { ...e, current: checked, endDate: checked ? '' : e.endDate } : e
    );
    commit(next);
  };

  const addExperience = () => {
    commit([
      ...norm,
      {
        title: '',
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: [''],
        description: '',
      },
    ]);
  };

  const removeExperience = (idx) => {
    const next = norm.filter((_, i) => i !== idx);
    commit(next);
  };

  // ===== Embedded (used inside SectionGroup) =====
  if (embedded) {
    return (
      <div className="space-y-4">
        {norm.map((exp, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 p-3 md:p-4 bg-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Job Title
                </label>
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => handleField(idx, 'title', e.target.value)}
                  placeholder="e.g. Operations Manager"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Company
                </label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleField(idx, 'company', e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  value={exp.location}
                  onChange={(e) => handleField(idx, 'location', e.target.value)}
                  placeholder="City, State"
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
                    value={exp.startDate}
                    onChange={(e) =>
                      handleField(idx, 'startDate', e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    End Date
                  </label>
                  <input
                    type="month"
                    value={exp.current ? '' : exp.endDate}
                    onChange={(e) =>
                      handleField(idx, 'endDate', e.target.value)
                    }
                    disabled={exp.current}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none disabled:bg-slate-100 focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                  />
                </div>
                <label className="flex items-center gap-2 mt-6 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => toggleCurrent(idx, e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  I currently work here
                </label>
              </div>
            </div>

            {/* Bullets editor */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-700">
                Key Achievements / Responsibilities
              </label>
              <div className="mt-2 space-y-2">
                {exp.bullets.map((b, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2">
                    <span className="mt-2 select-none">•</span>
                    <input
                      type="text"
                      value={b}
                      onChange={(e) =>
                        handleBullet(idx, bIdx, e.target.value)
                      }
                      placeholder="Action verb + outcome (quantify results when possible)"
                      className="flex-1 rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                    />
                    <button
                      type="button"
                      onClick={() => removeBullet(idx, bIdx)}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                      aria-label="Remove bullet"
                      title="Remove bullet"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addBullet(idx)}
                  className="inline-flex items-center gap-1 text-xs text-[#FF7043] hover:underline"
                >
                  <FaPlus /> Add bullet
                </button>
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => removeExperience(idx)}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
              >
                <FaTrash /> Remove experience
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addExperience}
          className="inline-flex items-center gap-1 text-sm text-[#FF7043] hover:underline"
        >
          <FaPlus /> Add another experience
        </button>
      </div>
    );
  }

  // ===== Standalone (collapsible card) =====
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Work Experience</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-4">
          {/* reuse embedded rendering for the body */}
          {(
            <WorkExperienceSection
              experiences={norm}
              setExperiences={setExperiences}
              embedded
            />
          )}
        </div>
      )}
    </section>
  );
}
