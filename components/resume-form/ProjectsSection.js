// components/resume-form/ProjectsSection.js
import { useEffect, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function ProjectsSection({
  projects = [],
  setProjects,
  embedded = false,     // when true, render content only (used inside SectionGroup)
  defaultOpen = true,   // used only when not embedded
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Backfill stable IDs so inputs don't remount on change
  useEffect(() => {
    if (!Array.isArray(projects)) return;
    let changed = false;
    const withIds = projects.map((p) => {
      if (p && p.id) return p;
      changed = true;
      return {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        title: p?.title ?? '',
        name: p?.name ?? p?.title ?? '',
        role: p?.role ?? '',
        description: p?.description ?? '',
        startDate: p?.startDate ?? '',
        endDate: p?.endDate ?? '',
        link: p?.link ?? '',
      };
    });
    if (changed) setProjects(withIds);
  }, [projects, setProjects]);

  const list = Array.isArray(projects) ? projects : [];
  const commit = (next) => setProjects(next);

  const setField = (id, key, value) => {
    const next = list.map((row) => {
      if (row.id !== id) return row;
      const curr = { ...row, [key]: value };
      // Keep "title" and "name" in sync for analyzers/templates
      if (key === 'title') curr.name = value;
      if (key === 'name' && !curr.title) curr.title = value;
      return curr;
    });
    commit(next);
  };

  const addProject = () => {
    commit([
      ...list,
      {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        title: '',
        name: '',
        role: '',
        description: '',
        startDate: '',
        endDate: '',
        link: '',
      },
    ]);
  };

  const removeProject = (id) => {
    commit(list.filter((row) => row.id !== id));
  };

  const Body = () => (
    <div className="space-y-4">
      {list.length === 0 && (
        <div className="text-sm text-slate-500">
          No projects yet. Add work you shipped, capstones, freelance, or major initiatives.
        </div>
      )}

      {list.map((project, idx) => (
        <div
          key={project.id || idx}
          className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Project Title</label>
              <input
                type="text"
                defaultValue={project.title || ''}
                onBlur={(e) => setField(project.id, 'title', e.target.value)}
                placeholder="e.g., Inventory Optimization Dashboard"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Your Role</label>
              <input
                type="text"
                defaultValue={project.role || ''}
                onBlur={(e) => setField(project.id, 'role', e.target.value)}
                placeholder="e.g., Lead Developer"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="month"
                  defaultValue={project.startDate || ''}
                  onBlur={(e) => setField(project.id, 'startDate', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="month"
                  defaultValue={project.endDate || ''}
                  onBlur={(e) => setField(project.id, 'endDate', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Link (optional)</label>
              <input
                type="url"
                defaultValue={project.link || ''}
                onBlur={(e) => setField(project.id, 'link', e.target.value)}
                placeholder="https://github.com/you/project or case study URL"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Description / Outcomes</label>
            <textarea
              defaultValue={project.description || ''}
              onBlur={(e) => setField(project.id, 'description', e.target.value)}
              placeholder='What was the problem? What did you build? Quantify the impact if possible (e.g., “Cut picking time 22%”).'
              className="mt-1 w-full min-h-[90px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeProject(project.id)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <FaTrash className="opacity-80" /> Remove Project
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addProject}
        className="inline-flex items-center gap-2 rounded-lg border border-[#FF7043]/30 px-3 py-2 text-sm font-semibold text-[#FF7043] hover:bg-[#FF7043] hover:text-white transition-colors"
      >
        <FaPlus /> Add Project
      </button>
    </div>
  );

  // Embedded mode (inside SectionGroup): no outer card/header.
  if (embedded) return <Body />;

  // Standalone: keep collapsible header for legacy routes.
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen((o) => !o)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Projects</h2>
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
