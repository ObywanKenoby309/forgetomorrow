// components/resume-form/EducationSection.js
import { useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function EducationSection({
  educationList = [],
  setEducationList,
  embedded = false,
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Ensure stable ids (once) so rows don't remount
  const rows = useMemo(() => {
    return (educationList || []).map((e) => {
      if (e?.id) return e;
      return {
        id:
          (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        degree: e?.degree ?? '',
        institution: e?.institution ?? '',
        location: e?.location ?? '',
        startDate: e?.startDate ?? '',
        endDate: e?.endDate ?? '',
        description: e?.description ?? '',
      };
    });
  }, [educationList]);

  const commit = (next) => setEducationList(next);

  const updateFieldOnBlur = (id, field, value) => {
    commit(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addEducation = () => {
    commit([
      ...rows,
      {
        id:
          (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        degree: '',
        institution: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ]);
  };

  const removeEducation = (id) => {
    commit(rows.filter((r) => r.id !== id));
  };

  const Body = () => (
    <div className="space-y-4">
      {rows.map((edu) => (
        <div
          key={edu.id}
          className="rounded-xl border border-slate-200 p-3 md:p-4 bg-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Degree / Qualification
              </label>
              <input
                type="text"
                defaultValue={edu.degree}
                onBlur={(e) => updateFieldOnBlur(edu.id, 'degree', e.target.value)}
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
                defaultValue={edu.institution}
                onBlur={(e) => updateFieldOnBlur(edu.id, 'institution', e.target.value)}
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
                defaultValue={edu.location}
                onBlur={(e) => updateFieldOnBlur(edu.id, 'location', e.target.value)}
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
                  defaultValue={edu.startDate}
                  onBlur={(e) => updateFieldOnBlur(edu.id, 'startDate', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  End Date
                </label>
                <input
                  type="month"
                  defaultValue={edu.endDate}
                  onBlur={(e) => updateFieldOnBlur(edu.id, 'endDate', e.target.value)}
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
              defaultValue={edu.description}
              onBlur={(e) => updateFieldOnBlur(edu.id, 'description', e.target.value)}
              placeholder="Honors, relevant coursework, thesis, societies…"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none resize-y focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              rows={3}
            />
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => removeEducation(edu.id)}
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
