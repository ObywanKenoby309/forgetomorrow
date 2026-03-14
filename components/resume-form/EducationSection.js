// components/resume-form/EducationSection.js
import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function EducationSection({
  educationList = [],
  setEducationList,
  embedded = false,
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const rows = Array.isArray(educationList) ? educationList : [];

  const updateField = (index, field, value) => {
    setEducationList((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const current = next[index] || {};

      next[index] = {
        ...current,
        [field]: value,
      };

      return next;
    });
  };

  const addEducation = () => {
    setEducationList((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      next.push({
        degree: '',
        institution: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
      });
      return next;
    });
  };

  const removeEducation = (index) => {
    setEducationList((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      next.splice(index, 1);
      return next;
    });
  };

  const Body = () => (
    <div className="space-y-4">
      {rows.map((edu, index) => (
        <div
          key={edu?.id || `education-${index}`}
          className="rounded-xl border border-slate-200 p-3 md:p-4 bg-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Degree / Qualification
              </label>
              <input
                type="text"
                value={edu?.degree || ''}
                onChange={(e) => updateField(index, 'degree', e.target.value)}
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
                value={edu?.institution || edu?.school || ''}
                onChange={(e) => updateField(index, 'institution', e.target.value)}
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
                value={edu?.location || ''}
                onChange={(e) => updateField(index, 'location', e.target.value)}
                placeholder="City, State"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Start Date
                </label>
                <input
                  type="month"
                  value={edu?.startDate || ''}
                  onChange={(e) => updateField(index, 'startDate', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  End Date
                </label>
                <input
                  type="month"
                  value={edu?.endDate || ''}
                  onChange={(e) => updateField(index, 'endDate', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700">
              Description / Notes
            </label>
            <textarea
              value={edu?.description || edu?.details || ''}
              onChange={(e) => updateField(index, 'description', e.target.value)}
              placeholder="Honors, relevant coursework, thesis, societies…"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none resize-y focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              rows={3}
            />
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => removeEducation(index)}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <FaTrash /> Remove Education
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEducation}
        className="inline-flex items-center gap-1 text-sm text-[#FF7043] hover:underline"
      >
        <FaPlus /> Add Another Education
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