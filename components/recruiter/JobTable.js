// components/recruiter/JobTable.js
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const statusClass = (s) =>
  ({
    Open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Draft: "bg-amber-50 text-amber-700 border-amber-200",
    Reviewing: "bg-blue-50 text-blue-700 border-blue-200",
    Closed: "bg-slate-100 text-slate-700 border-slate-300",
    Unknown: "bg-slate-100 text-slate-700 border-slate-300",
  }[s] || "bg-slate-100 text-slate-700 border-slate-300");

const urgencyBadge = (urgent) =>
  urgent ? (
    <span className="inline-flex items-center gap-1 px-2 py-[2px] bg-red-100 text-red-700 border border-red-300 rounded text-xs font-bold">
      URGENT
    </span>
  ) : null;

export default function JobTable({
  jobs = [],
  mode = "jobs", // "jobs" | "templates"
  onEdit,
  onView,
  onClose,
  onUseTemplate,

  // ✅ NEW: jobs-only action to open applicants view
  onViewApplicants,

  // used only for templates (delete action)
  onDelete,
}) {
  const [sort, setSort] = useState({ key: "title", dir: "asc" });
  const [filter, setFilter] = useState({ status: "", urgent: false });

  const filteredAndSorted = useMemo(() => {
    let arr = [...jobs];

    if (filter.status) arr = arr.filter((j) => j.status === filter.status);
    if (filter.urgent) arr = arr.filter((j) => j.urgent);

    arr.sort((a, b) => {
      const va = a[sort.key] ?? "";
      const vb = b[sort.key] ?? "";
      const cmp =
        typeof va === "string" ? va.localeCompare(vb) : (va ?? 0) - (vb ?? 0);
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return arr;
  }, [jobs, sort, filter]);

  const setSortKey = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  const HeaderCell = ({ label, keyName }) => (
    <th
      className="px-4 py-3 cursor-pointer select-none hover:bg-slate-100"
      onClick={() => setSortKey(keyName)}
    >
      <span className="inline-flex items-center gap-1 font-medium">
        {label}
        {sort.key === keyName && (sort.dir === "asc" ? "↑" : "↓")}
      </span>
    </th>
  );

  const isTemplates = mode === "templates";

  function ActionMenu({ job }) {
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 176 });
    const [mounted, setMounted] = useState(false);

    const status = job.status || "Unknown";
    const canClose = !isTemplates && status !== "Closed";
    const canDeleteTemplate = isTemplates;

    // ✅ NEW: jobs-only (not templates), requires handler, and must be a real job (not a template row)
    const canViewApplicants =
      !isTemplates && typeof onViewApplicants === "function" && !job?.isTemplate;

    useEffect(() => setMounted(true), []);

    const computePosition = () => {
      const el = buttonRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const menuWidth = 176; // matches w-44
      const gap = 8;

      // Default: open downward, right-aligned to button
      let top = rect.bottom + gap;
      let left = rect.right - menuWidth;

      // Keep on-screen (horizontal)
      const pad = 8;
      if (left < pad) left = pad;
      if (left + menuWidth > window.innerWidth - pad) {
        left = window.innerWidth - pad - menuWidth;
      }

      // Vertical: if it would overflow bottom, open upward
      const estimatedMenuHeight = canDeleteTemplate ? 5 * 36 : 4 * 36; // rough
      if (top + estimatedMenuHeight > window.innerHeight - pad) {
        top = rect.top - gap - estimatedMenuHeight;
      }
      if (top < pad) top = pad;

      setPos({ top, left, width: menuWidth });
    };

    useEffect(() => {
      if (!open) return;

      computePosition();

      const onResize = () => computePosition();
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onResize, true);

      const onKey = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", onKey);

      const onDown = (e) => {
        const btn = buttonRef.current;
        const menu = menuRef.current;
        if (!btn || !menu) return;

        if (btn.contains(e.target)) return;
        if (menu.contains(e.target)) return;

        setOpen(false);
      };
      document.addEventListener("mousedown", onDown);

      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onResize, true);
        window.removeEventListener("keydown", onKey);
        document.removeEventListener("mousedown", onDown);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const run = (fn) => {
      try {
        fn?.();
      } finally {
        setOpen(false);
      }
    };

    const menu = (
      <div
        ref={menuRef}
        className="fixed z-[9999]"
        style={{ top: pos.top, left: pos.left, width: pos.width }}
      >
        <div className="rounded-md border bg-white shadow-lg overflow-hidden">
          {isTemplates && (
            <button
              type="button"
              onClick={() => run(() => onUseTemplate?.(job))}
              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-[#FF7043]"
            >
              Use template
            </button>
          )}

          <button
            type="button"
            onClick={() => run(() => onEdit?.(job))}
            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => run(() => onView?.(job))}
            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50"
          >
            View
          </button>

          {/* ✅ NEW: View Applicants (jobs-only) */}
          {canViewApplicants && (
            <button
              type="button"
              onClick={() => run(() => onViewApplicants?.(job))}
              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-[#FF7043]"
            >
              View applicants
            </button>
          )}

          {canClose && (
            <button
              type="button"
              onClick={() => run(() => onClose?.(job))}
              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-red-700"
            >
              Close posting
            </button>
          )}

          {canDeleteTemplate && (
            <>
              <div className="h-px bg-slate-100" />
              <button
                type="button"
                onClick={() => run(() => onDelete?.(job))}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-red-700"
              >
                Delete template
              </button>
            </>
          )}
        </div>
      </div>
    );

    return (
      <>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            // if opening, compute immediately for a snappy feel
            if (!open) setTimeout(() => computePosition(), 0);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border hover:bg-slate-50 text-xs"
        >
          Actions <span className="text-slate-500">▾</span>
        </button>

        {mounted && open ? createPortal(menu, document.body) : null}
      </>
    );
  }

  return (
    <div className="rounded-lg border bg-white">
      {/* FILTER BAR */}
      <div className="p-3 border-b bg-slate-50 flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Filter:</span>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option>Draft</option>
            <option>Open</option>
            <option value="Reviewing">Reviewing</option>
            <option>Closed</option>
          </select>
        </div>

        {!isTemplates && (
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={filter.urgent}
              onChange={(e) =>
                setFilter({ ...filter, urgent: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-red-700 font-medium">URGENT only</span>
          </label>
        )}

        <button
          onClick={() => setFilter({ status: "", urgent: false })}
          className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline"
        >
          Clear filters
        </button>
      </div>

      {/* MOBILE CARDS */}
      <div className="sm:hidden divide-y">
        {filteredAndSorted.map((j) => {
          const status = j.status || "Unknown";
          return (
            <div key={j.id} className="p-4 space-y-2">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="font-semibold break-words">
                  {isTemplates ? j.templateName || j.title : j.title}
                </div>
                <div className="text-xs text-slate-600 break-words">
                  {j.company || "—"} • {j.location || "—"}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2 py-[2px] rounded border text-xs ${statusClass(
                    status
                  )}`}
                >
                  {status}
                </span>
                {!isTemplates && urgencyBadge(Boolean(j.urgent))}
              </div>

              {!isTemplates && (
                <div className="text-xs text-slate-600 flex gap-4">
                  <span>{j.views ?? 0} views</span>
                  <span>{j.applications ?? 0} apps</span>
                </div>
              )}

              <div className="pt-1">
                <ActionMenu job={j} />
              </div>
            </div>
          );
        })}

        {filteredAndSorted.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500">
            No items match your filters.
          </div>
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <HeaderCell label="Company" keyName="company" />
              <HeaderCell
                label={isTemplates ? "Template" : "Title"}
                keyName={isTemplates ? "templateName" : "title"}
              />
              <th className="px-4 py-3">Worksite</th>
              <th className="px-4 py-3">Location</th>
              <HeaderCell label="Status" keyName="status" />
              <th className="px-4 py-3 text-center">Urgent</th>
              <HeaderCell label="Views" keyName="views" />
              <HeaderCell label="Apps" keyName="applications" />
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((j) => {
              const status = j.status || "Unknown";
              return (
                <tr key={j.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{j.company || "—"}</td>
                  <td className="px-4 py-3">
                    {isTemplates
                      ? j.templateName || j.title || "—"
                      : j.title || "—"}
                  </td>
                  <td className="px-4 py-3">{j.worksite || "—"}</td>
                  <td className="px-4 py-3">{j.location || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-[2px] rounded border text-xs ${statusClass(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!isTemplates ? urgencyBadge(Boolean(j.urgent)) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!isTemplates ? j.views ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!isTemplates ? j.applications ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <ActionMenu job={j} />
                  </td>
                </tr>
              );
            })}

            {filteredAndSorted.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No items match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
