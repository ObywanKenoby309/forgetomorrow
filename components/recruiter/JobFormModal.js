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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

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
          {/* ROWS unchanged */}
          {/* ... body content unchanged ... */}
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex items-center justify-between gap-3 sticky bottom-[56px] md:bottom-0 bg-white">
          <div className="text-xs text-slate-500 text-center md:text-left w-full md:w-auto">
            {isView ? "Viewing job details." : "Fields marked * are required."}
          </div>

          <div className="flex items-center gap-2 shrink-0">
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

        {/* Spacer */}
        <div className="h-[56px] md:h-0" />
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
