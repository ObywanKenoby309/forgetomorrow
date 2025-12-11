// components/recruiter/JobFormModal.js
import { useEffect, useState } from "react";
import JDOptimizer from "@/components/ai/JDOptimizer";
import ATSAdvisor from "@/components/ai/ATSAdvisor";
import { usePlan } from "@/context/PlanContext";

const BLANK = {
  company: "",
  title: "",
  worksite: "Remote", // Remote, Hybrid, Onsite
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
  const isEdit = mode === "edit";

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
    mode === "edit"
      ? "Edit Job"
      : mode === "view"
      ? "View Job"
      : "Post a Job";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl border">
        <div className="p-5 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{titleLabel}</h2>
          {isEnterprise ? (
            <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full font-medium">
              Dual-AI Optimizer Active
            </span>
          ) : (
            <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">
              AI Locked
            </span>
          )}
        </div>

        <div className="p-5 space-y-5 text-sm">
          {/* ROW 1: Company + Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company" required>
              <input
                className="border rounded px-3 py-2 w-full"
                value={data.company}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, company: e.target.value }))
                }
                placeholder="Acme Corp"
                disabled={isView}
              />
            </Field>
            <Field label="Job Title" required>
              <input
                className="border rounded px-3 py-2 w-full"
                value={data.title}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Senior React Developer"
                disabled={isView}
              />
            </Field>
          </div>

          {/* ROW 2: Worksite + Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Worksite" required>
              <select
                className="border rounded px-3 py-2 w-full"
                value={data.worksite}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, worksite: e.target.value }))
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
                  setData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="San Francisco, CA or Global"
                disabled={isView}
              />
            </Field>
          </div>

          {/* ROW 3: Type + Compensation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Employment Type">
              <select
                className="border rounded px-3 py-2 w-full"
                value={data.type}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, type: e.target.value }))
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
                  setData((prev) => ({
                    ...prev,
                    compensation: e.target.value,
                  }))
                }
                placeholder="$120k–$180k / $50–$70/hr"
                disabled={isView}
              />
            </Field>
          </div>

          {/* DESCRIPTION + Dual AI */}
          <Field label="Description" required>
            <p className="text-[11px] text-slate-500 mb-1">
              Tip: Paste your draft, use{" "}
              <span className="font-semibold">Grok JD Builder</span> to rewrite
              it, then run <span className="font-semibold">Sora ATS Insights</span>{" "}
              on the final version for scoring and suggestions.
            </p>
            <textarea
              className="border rounded px-3 py-2 w-full min-h-[180px] font-mono text-sm"
              value={data.description}
              onChange={(e) =>
                setData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe responsibilities, must-haves, culture..."
              disabled={isView}
            />

            {data.description.trim() && isEnterprise && !isView ? (
              <>
                {/* Step 1 — Grok JD Builder (rewrite) */}
                <JDOptimizer
                  draft={data.description}
                  title={data.title}
                  company={data.company}
                  onOptimize={(text) =>
                    setData((prev) => ({ ...prev, description: text }))
                  }
                />

                {/* Step 2 — Sora ATS Insights (score + suggestions) */}
                <div className="mt-4">
                  <ATSAdvisor
                    draft={data.description}
                    title={data.title}
                    company={data.company}
                  />
                </div>
              </>
            ) : data.description.trim() && !isEnterprise && !isView ? (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-300 rounded-lg text-xs">
                <p className="font-bold text-gray-700">Dual-AI JD Builder</p>
                <p className="text-gray-600">
                  Enterprise only — unlock Grok JD Builder + Sora ATS Insights
                  to rewrite and score job descriptions in one flow.
                </p>
              </div>
            ) : null}
          </Field>

          <Field label="Status">
            <select
              className="border rounded px-3 py-2 w-full"
              value={data.status}
              onChange={(e) =>
                setData((prev) => ({ ...prev, status: e.target.value }))
              }
              disabled={isView}
            >
              <option value="Draft">Draft (hidden from seekers)</option>
              <option value="Open">Open</option>
              <option value="Reviewing">Reviewing applicants</option>
              <option value="Closed">Closed</option>
            </select>
          </Field>
        </div>

        <div className="p-5 border-t flex items-center justify-between gap-3 sticky bottom-0 bg-white">
          <div className="text-xs text-slate-500">
            {isView
              ? "Viewing job details."
              : "Fields marked * are required."}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border text-sm hover:bg-slate-50"
            >
              {isView ? "Close" : "Cancel"}
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
