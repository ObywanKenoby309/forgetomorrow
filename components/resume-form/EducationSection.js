// components/resume-form/EducationSection.js
import { useMemo, useState } from 'react';
import {
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaPlus,
} from 'react-icons/fa';

export default function EducationSection({
  educationList = [],
  setEducationList,
  embedded = false,     // render only fields (no outer card/header)
  defaultOpen = true,   // used only in standalone mode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // --- normalize so we can add "current" & keep keys consistent
  const norm = useMemo(
    () =>
      (educationList || []).map((e) => ({
        degree: e.degree ?? '',
        institution: e.institution ?? '',
        location: e.location ?? '',
        startDate: e.startDate ?? '',
        endDate: e.endDate ?? '',
        current: !!e.current,
        description: e.description ?? '',
      })),
    [educationList]
  );

  const commit = (next) => setEducationList(next);

  const handleField = (idx, name, value) => {
    const next = norm.map((row, i) => (i === idx ? { ...row, [name]: value } : row));
    commit(next);
  };

  const toggleCurrent = (idx, checked) => {
    const next = norm.map((row, i) =>
      i === idx ? { ...row, current: checked, endDate: checked ? '' : row.endDate } : row
    );
    commit(next);
  };

  const addEducation = () => {
    commit([
      ...norm,
      {
        degree: '',
        institution: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      },
    ]);
  };

  const removeEducation = (idx) => {
    commit(norm.filter((_, i) => i !== idx));
  };

  // ===== Embedded body (used inside SectionGroup) =====
  const Body = () => (
    <div className="space-y-4">
      {norm.map((edu, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200 p-3 md:p-4 bg-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Degree / Qualification
              </label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => handleField(idx, 'degree', e.target.value)}
                placeholder="e.g. B.S. in Computer Science"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Institution
              </label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => handleField(idx, 'institution', e.target.value)}
                placeholder="e.g. University of Example"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                type="text"
                value={edu.location}
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
                  value={edu.startDate}
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
                  value={edu.current ? '' : edu.endDate}
                  onChange={(e) => handleField(idx, 'endDate', e.target.value)}
                  disabled={edu.current}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none disabled:bg-slate-100 focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
              <label className="flex items-center gap-2 mt-6 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={edu.current}
                  onChange={(e) => toggleCurrent(idx, e.target.checked)}
                  className="rounded border-slate-300"
                />
                I am currently studying here
              </label>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700">
              Description / Notes
            </label>
            <textarea
              value={edu.description}
              onChange={(e) => handleField(idx, 'description', e.target.value)}
              placeholder="Honors, relevant coursework, thesis, societies…"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none resize-y focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              rows={3}
            />
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => removeEducation(idx)}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <FaTrash /> Remove education
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEducation}
        className="inline-flex items-center gap-1 text-sm text-[#FF7043] hover:underline"
      >
        <FaPlus /> Add another education
      </button>
    </div>
  );

  // ===== Render modes =====
  if (embedded) return <Body />;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Education</h2>
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
