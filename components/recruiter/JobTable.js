// components/recruiter/JobTable.js
import { useMemo, useState } from "react";

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

export default function JobTable({ jobs = [], onEdit, onView, onClose }) {
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
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
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

        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.urgent}
            onChange={(e) => setFilter({ ...filter, urgent: e.target.checked })}
            className="rounded"
          />
          <span className="text-red-700 font-medium">URGENT only</span>
        </label>

        <button
          onClick={() => setFilter({ status: "", urgent: false })}
          className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline"
        >
          Clear filters
        </button>
      </div>

      {/* ───────────────── MOBILE CARDS ───────────────── */}
      <div className="sm:hidden divide-y">
        {filteredAndSorted.map((j) => {
          const status = j.status || "Unknown";
          return (
            <div key={j.id} className="p-4 space-y-2">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="font-semibold break-words">{j.title}</div>
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
                {urgencyBadge(Boolean(j.urgent))}
              </div>

              <div className="text-xs text-slate-600 flex gap-4">
                <span>{j.views ?? 0} views</span>
                <span>{j.applications ?? 0} apps</span>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => onEdit?.(j)}
                  className="text-xs underline text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onView?.(j)}
                  className="text-xs underline text-blue-700"
                >
                  View
                </button>
                {status !== "Closed" && (
                  <button
                    onClick={() => onClose?.(j)}
                    className="text-xs underline text-red-700"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredAndSorted.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500">
            No jobs match your filters.
          </div>
        )}
      </div>

      {/* ───────────────── DESKTOP TABLE ───────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <HeaderCell label="Company" keyName="company" />
              <HeaderCell label="Title" keyName="title" />
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
                  <td className="px-4 py-3">{j.title || "—"}</td>
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
                    {urgencyBadge(Boolean(j.urgent))}
                  </td>
                  <td className="px-4 py-3 text-center">{j.views ?? "—"}</td>
                  <td className="px-4 py-3 text-center">{j.applications ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <button onClick={() => onEdit?.(j)} className="underline">
                      Edit
                    </button>
                    <span className="mx-1 text-slate-300">|</span>
                    <button onClick={() => onView?.(j)} className="underline">
                      View
                    </button>
                    {status !== "Closed" && (
                      <>
                        <span className="mx-1 text-slate-300">|</span>
                        <button
                          onClick={() => onClose?.(j)}
                          className="underline text-red-700"
                        >
                          Close
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
