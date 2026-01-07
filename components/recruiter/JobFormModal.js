// components/recruiter/JobFormModal.js
import { useEffect, useState } from "react";
import JDOptimizer from "@/components/ai/JDOptimizer";
import ATSAdvisor from "@/components/ai/ATSAdvisor";
import { usePlan } from "@/context/PlanContext";

const BLANK = {
  company: "",
  title: "",
  worksite: "Remote",
  location: "",
  type: "Full-time",
  compensation: "",
  description: "",
  status: "Draft",
};

export default function JobFormModal({
  open,
  mode = "create", // "create" | "edit" | "view"
  initialJob,
  onClose,
  onSave,
}) {
  const { isEnterprise } = usePlan();
  const [data, setData] = useState(BLANK);

  const isView = mode === "view";

  // ─────────────────────────────────────────────
  // Close on ESC (desktop / keyboard users)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setData(BLANK);
      return;
    }

    if (initialJob) {
      setData({
        company: initialJob.company || "",
        title: initialJob.title || "",
        worksite: initialJob.worksite || "Remote",
        location: initialJob.location || "",
        type: initialJob.type || "Full-time",
        compensation: initialJob.compensation || "",
        description: initialJob.description || "",
        status: initialJob.status || "Draft",
      });
    } else {
      setData(BLANK);
    }
  }, [open, initialJob, mode]);

  const valid =
    data.company &&
    data.title &&
    data.worksite &&
    data.location &&
    (data.description || "").trim();

  const handleSave = () => {
    if (!valid || isView) return;
    onSave?.(data);
  };

  if (!open) return null;

  const titleLabel =
    mode === "edit" ? "Edit Job" : mode === "view" ? "View Job" : "Post a Job";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl border">
        {/* Header */}
        <div className="p-5 border-b sticky top-0 bg-white z-10 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{titleLabel}</h2>
          </div>

          <div className="flex items-center gap-3">
            {isEnterprise ? (
              <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full font-medium">
                Dual-AI Optimizer Active
              </span>
            ) : (
              <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">
                AI Locked
              </span>
            )}

            {/* ✅ Always-visible close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border text-slate-600 hover:bg-slate-100"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-sm">
          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company" required>
              <input
                className="border rounded px-3 py-2 w-full"
                value={data.company}
                onChange={(e) =>
                  setData((p) => ({ ...p, company: e.target.value }))
                }
                disabled={isView}
              />
            </Field>
            <Field label="Job Title" required>
              <input
                className="border rounded px-3 py-2 w-full"
                value={data.title}
                onChange={(e) =>
                  setData((p) => ({ ...p, title: e.target.value }))
                }
                disabled={isView}
              />
            </Field>
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Worksite" required>
              <select
                className="border rounded px-3 py-2 w-full"
                value={data.worksite}
                onChange={(e) =>
                  setData((p) => ({ ...p, worksite: e.target.value }))
                }
                disabled={isView}
              >
                <option>Remote</option>
                <option>Hybrid</option>
                <option>Onsite</option>
              </select>
            </Field>
            <Field label="Location" required>
              <input
                className="border rounded px-3 py-2 w-full"
                value={data.location}
                onChange={(e) =>
                  setData((p) => ({ ...p, location: e.target.value }))
                }
                disabled={isView}
              />
            </Field>
          </div>

          {/* ROW 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Employment Type">
              <select
                className="border rounded px-3 py-2 w-full"
                value={data.type}
                onChange={(e) =>
                  setData((p) => ({ ...p, type: e.target.value }))
                }
                disabled={isView}
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </Field>
            <Field label="Compensation">
              <input
                className="border rounded px-3 py-2 w-full"
                value={data.compensation}
                onChange={(e) =>
                  setData((p) => ({ ...p, compensation: e.target.value }))
                }
                disabled={isView}
              />
            </Field>
          </div>

          {/* DESCRIPTION + AI */}
          <Field label="Description" required>
            <textarea
              className="border rounded px-3 py-2 w-full min-h-[180px] font-mono text-sm"
              value={data.description}
              onChange={(e) =>
                setData((p) => ({ ...p, description: e.target.value }))
              }
              disabled={isView}
            />

            {data.description.trim() && isEnterprise && !isView && (
              <>
                <JDOptimizer
                  draft={data.description}
                  title={data.title}
                  company={data.company}
                  onOptimize={(text) =>
                    setData((p) => ({ ...p, description: text }))
                  }
                />
                <div className="mt-4">
                  <ATSAdvisor
                    draft={data.description}
                    title={data.title}
                    company={data.company}
                  />
                </div>
              </>
            )}
          </Field>

          <Field label="Status">
            <select
              className="border rounded px-3 py-2 w-full"
              value={data.status}
              onChange={(e) =>
                setData((p) => ({ ...p, status: e.target.value }))
              }
              disabled={isView}
            >
              <option value="Draft">Draft</option>
              <option value="Open">Open</option>
              <option value="Reviewing">Reviewing applicants</option>
              <option value="Closed">Closed</option>
            </select>
          </Field>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex items-center justify-between gap-3 sticky bottom-0 bg-white">
          <div className="text-xs text-slate-500">
            {isView ? "Viewing job details." : "Fields marked * are required."}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border text-sm hover:bg-slate-50"
            >
              Close
            </button>
            {!isView && (
              <button
                onClick={handleSave}
                disabled={!valid}
                className={`px-4 py-2 rounded text-sm text-white ${
                  valid
                    ? "bg-[#FF7043] hover:bg-[#F4511E]"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
              >
                Save Job
              </button>
            )}
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
