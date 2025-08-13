// components/recruiter/JobFormModal.js
import { useEffect, useState } from "react";

export default function JobFormModal({ open, onClose, onSave }) {
  const [data, setData] = useState({
    title: "",
    location: "",
    type: "Full-time",
    compensation: "",
    description: "",
    status: "Draft",
  });

  useEffect(() => {
    if (!open) {
      setData({
        title: "",
        location: "",
        type: "Full-time",
        compensation: "",
        description: "",
        status: "Draft",
      });
    }
  }, [open]);

  const valid = data.title.trim() && data.description.trim();

  const handleSave = () => {
    if (!valid) return;
    onSave?.(data);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl border">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">Post a Job</h2>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Job Title" required>
              <input
                className="border rounded px-3 py-2 w-full"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
              />
            </Field>
            <Field label="Location">
              <input
                className="border rounded px-3 py-2 w-full"
                value={data.location}
                onChange={(e) => setData({ ...data, location: e.target.value })}
                placeholder="Remote, Nashville, TN, etc."
              />
            </Field>
            <Field label="Employment Type">
              <select
                className="border rounded px-3 py-2 w-full"
                value={data.type}
                onChange={(e) => setData({ ...data, type: e.target.value })}
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
                <option>Temporary</option>
              </select>
            </Field>
            <Field label="Compensation">
              <input
                className="border rounded px-3 py-2 w-full"
                value={data.compensation}
                onChange={(e) => setData({ ...data, compensation: e.target.value })}
                placeholder="$100k–$120k / hrly / range"
              />
            </Field>
            <Field label="Status">
              <select
                className="border rounded px-3 py-2 w-full"
                value={data.status}
                onChange={(e) => setData({ ...data, status: e.target.value })}
              >
                <option>Draft</option>
                <option>Open</option>
                <option>Closed</option>
              </select>
            </Field>
          </div>

          <Field label="Description" required>
            <textarea
              className="border rounded px-3 py-2 w-full min-h-[140px]"
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="Describe responsibilities, requirements, and culture."
            />
          </Field>
        </div>

        <div className="p-5 border-t flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">Fields marked * are required.</div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded border text-sm hover:bg-slate-50">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!valid}
              className={`px-4 py-2 rounded text-sm text-white ${
                valid ? "bg-[#FF7043] hover:bg-[#F4511E]" : "bg-slate-400 cursor-not-allowed"
              }`}
            >
              Save Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required = false }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-600 mb-1">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      {children}
    </label>
  );
}
