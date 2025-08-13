// components/recruiter/JobTable.js
import { useMemo, useState } from "react";

const statusClass = (s) =>
  ({
    Open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Draft: "bg-amber-50 text-amber-700 border-amber-200",
    Closed: "bg-slate-100 text-slate-700 border-slate-300",
  }[s] || "bg-slate-100 text-slate-700 border-slate-300");

export default function JobTable({ jobs = [], onEdit, onView, onClose }) {
  const [sort, setSort] = useState({ key: "title", dir: "asc" });

  const sorted = useMemo(() => {
    const arr = [...jobs];
    arr.sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      if (va === vb) return 0;
      const cmp =
        typeof va === "string" ? va.localeCompare(vb) : (va ?? 0) - (vb ?? 0);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [jobs, sort]);

  const setSortKey = (key) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );

  const HeaderCell = ({ label, keyName }) => (
    <th
      className="px-4 py-3 cursor-pointer select-none"
      onClick={() => setSortKey(keyName)}
      title={`Sort by ${label}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sort.key === keyName && (sort.dir === "asc" ? "▲" : "▼")}
      </span>
    </th>
  );

  return (
    <div className="rounded-lg border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <HeaderCell label="Title" keyName="title" />
              <HeaderCell label="Status" keyName="status" />
              <HeaderCell label="Views" keyName="views" />
              <HeaderCell label="Applications" keyName="applications" />
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((j) => (
              <tr key={j.id} className="border-b last:border-0">
                <td className="px-4 py-3">{j.title}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-[2px] rounded border text-xs ${statusClass(
                      j.status
                    )}`}
                  >
                    {j.status}
                  </span>
                </td>
                <td className="px-4 py-3">{j.views}</td>
                <td className="px-4 py-3">{j.applications}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onEdit?.(j)} className="text-sm underline">Edit</button>
                  <span className="mx-2 text-slate-300">|</span>
                  <button onClick={() => onView?.(j)} className="text-sm underline">View</button>
                  <span className="mx-2 text-slate-300">|</span>
                  <button onClick={() => onClose?.(j)} className="text-sm underline">Close</button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500 text-center" colSpan={5}>
                  No jobs yet. Click “Post a Job” to create your first listing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
