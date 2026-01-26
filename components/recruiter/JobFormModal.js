// components/recruiter/JobFormModal.js
import { useEffect, useMemo, useState } from "react";
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
  additionalQuestions: null, // ✅ supports recruiter-defined questions (Json)
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

  // Templates (org-scoped via API)
  const [tplOpen, setTplOpen] = useState(false);
  const [tplSaveOpen, setTplSaveOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplRows, setTplRows] = useState([]);
  const [tplLoading, setTplLoading] = useState(false);
  const [tplError, setTplError] = useState(null);
  const [tplFlash, setTplFlash] = useState("");

  // ✅ Track the currently loaded template (for Windows-like overwrite behavior)
  const [loadedTemplate, setLoadedTemplate] = useState(null); // { id, templateName }

  const isView = mode === "view";
  const isCreate = mode === "create";
  const isEdit = mode === "edit";

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
      setTplOpen(false);
      setTplSaveOpen(false);
      setTplName("");
      setTplRows([]);
      setTplLoading(false);
      setTplError(null);
      setTplFlash("");
      setLoadedTemplate(null);
      return;
    }

    if (initialJob) {
      // NOTE: intentionally ignore isTemplate/templateName so we don't propagate it into job saves.
      setData({
        company: initialJob.company || "",
        title: initialJob.title || "",
        worksite: initialJob.worksite || "Remote",
        location: initialJob.location || "",
        type: initialJob.type || "Full-time",
        compensation: initialJob.compensation || "",
        description: initialJob.description || "",
        status: initialJob.status || "Draft",
        additionalQuestions:
          initialJob.additionalQuestions !== undefined
            ? initialJob.additionalQuestions
            : null,
      });

      // ✅ If the "initial job" is actually a template passed in, remember it
      if (initialJob.isTemplate && (initialJob.templateName || "").trim()) {
        setLoadedTemplate({
          id: initialJob.id,
          templateName: String(initialJob.templateName || "").trim(),
        });
      } else {
        setLoadedTemplate(null);
      }
    } else {
      setData(BLANK);
      setLoadedTemplate(null);
    }

    setTplFlash("");
    setTplError(null);
  }, [open, initialJob, mode]);

  const valid =
    data.company &&
    data.title &&
    data.worksite &&
    data.location &&
    (data.description || "").trim();

  const titleLabel =
    mode === "edit" ? "Edit Job" : mode === "view" ? "View Job" : "Post a Job";

  const canUseTemplates = !isView; // allow in create + edit

  const loadTemplates = async () => {
    try {
      setTplLoading(true);
      setTplError(null);
      const res = await fetch(
        "/api/recruiter/job-postings?kind=templates&lite=1"
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setTplRows(Array.isArray(json?.jobs) ? json.jobs : []);
    } catch (e) {
      console.error("[JobFormModal] load templates error", e);
      setTplError(e);
      setTplRows([]);
    } finally {
      setTplLoading(false);
    }
  };

  const openLoadPanel = async () => {
    setTplFlash("");
    setTplSaveOpen(false);
    setTplOpen((v) => !v);
    if (!tplOpen) {
      await loadTemplates();
    }
  };

  const openSavePanel = () => {
    setTplFlash("");
    setTplOpen(false);
    setTplSaveOpen((v) => !v);
    if (!tplSaveOpen) {
      // default template name suggestion
      const suggestion = `${(data.title || "").trim()}${
        data.location ? " - " + data.location.trim() : ""
      }`;
      setTplName((p) => (p ? p : suggestion.trim()));
    }
  };

  const applyTemplate = (t) => {
    if (!t) return;

    setData((p) => ({
      ...p,
      company: t.company || p.company || "",
      title: t.title || p.title || "",
      worksite: t.worksite || p.worksite || "Remote",
      location: t.location || p.location || "",
      type: t.type || p.type || "Full-time",
      compensation: t.compensation || p.compensation || "",
      description: t.description || p.description || "",
      status: "Draft",
      additionalQuestions:
        t.additionalQuestions !== undefined ? t.additionalQuestions : p.additionalQuestions,
    }));

    // ✅ Remember which template is loaded
    setLoadedTemplate({
      id: t.id,
      templateName: String(t.templateName || "").trim(),
    });

    setTplOpen(false);
    setTplFlash(`Loaded template "${t.templateName || t.title || "Template"}".`);

    // If user opens "Save template" right after load, prefill name to the loaded one
    const loadedName = String(t.templateName || "").trim();
    if (loadedName) setTplName(loadedName);
  };

  const postTemplate = async ({ overwrite = false, name }) => {
    const res = await fetch("/api/recruiter/job-postings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        isTemplate: true,
        templateName: name,
        overwrite: Boolean(overwrite), // ✅ API uses this to replace existing template by name
        // force templates to be Draft for safety
        status: "Draft",
      }),
    });

    const json = await res.json().catch(() => ({}));
    return { res, json };
  };

  const saveAsTemplate = async () => {
    if (!valid) return;

    const name = (tplName || "").trim();
    if (!name) {
      setTplFlash("Template name is required.");
      return;
    }

    try {
      setTplLoading(true);
      setTplError(null);
      setTplFlash("");

      // Attempt normal save first (no overwrite)
      let { res, json } = await postTemplate({ overwrite: false, name });

      // ✅ If name collision, confirm overwrite (Windows-like)
      if (!res.ok && res.status === 409) {
        const ok = window.confirm(
          `A template named "${name}" already exists.\n\nReplace it?`
        );
        if (!ok) {
          setTplFlash("Save cancelled.");
          return;
        }

        ({ res, json } = await postTemplate({ overwrite: true, name }));
      }

      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      setTplFlash(`Template saved: "${name}".`);
      setTplSaveOpen(false);

      // Keep tplName as-is if they want to save variants quickly, otherwise clear it.
      // Minimal + safer: clear so they intentionally name the next one.
      setTplName("");

      // refresh list so Load dropdown immediately has it
      await loadTemplates();

      // ✅ After saving, treat this as the currently loaded template name
      setLoadedTemplate((prev) => ({
        id: prev?.id || null,
        templateName: name,
      }));
    } catch (e) {
      console.error("[JobFormModal] save template error", e);
      setTplError(e);
      setTplFlash("We couldn't save this template. Please try again.");
    } finally {
      setTplLoading(false);
    }
  };

  const handleSave = () => {
    if (!valid || isView) return;
    // normal job save (never a template)
    onSave?.({
      ...data,
      isTemplate: false,
      templateName: null,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl border">
        {/* Header */}
        <div className="p-5 border-b sticky top-0 bg-white z-10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{titleLabel}</h2>

            {/* Template tools row (MVP working) */}
            {canUseTemplates && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={openLoadPanel}
                  className="px-2.5 py-1 rounded border hover:bg-slate-50"
                  disabled={tplLoading}
                >
                  Load from Template
                </button>

                <button
                  type="button"
                  onClick={openSavePanel}
                  className="px-2.5 py-1 rounded border hover:bg-slate-50"
                  disabled={tplLoading || !valid}
                  title={
                    !valid
                      ? "Fill required fields to save a template."
                      : "Save this role as a reusable template."
                  }
                >
                  Save as Template
                </button>

                {tplLoading && <span className="text-slate-500">Working…</span>}

                {!!loadedTemplate?.templateName && (
                  <span className="text-slate-500">
                    Loaded:{" "}
                    <span className="font-medium">
                      {loadedTemplate.templateName}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Load panel */}
            {canUseTemplates && tplOpen && (
              <div className="mt-3 rounded border bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">Choose a template</div>
                  <button
                    type="button"
                    className="underline text-slate-600"
                    onClick={() => setTplOpen(false)}
                  >
                    Close
                  </button>
                </div>

                {tplError && (
                  <div className="mt-2 text-red-700">
                    We couldn't load templates. Please try again.
                  </div>
                )}

                {!tplError && tplRows.length === 0 && (
                  <div className="mt-2 text-slate-600">
                    No templates saved yet.
                  </div>
                )}

                {tplRows.length > 0 && (
                  <div className="mt-2">
                    <select
                      className="border rounded px-2 py-1 w-full"
                      defaultValue=""
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const t = tplRows.find((x) => Number(x.id) === id);
                        if (t) applyTemplate(t);
                      }}
                    >
                      <option value="" disabled>
                        Select a template…
                      </option>
                      {tplRows.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.templateName || t.title || `Template ${t.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Save panel */}
            {canUseTemplates && tplSaveOpen && (
              <div className="mt-3 rounded border bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">Save template</div>
                  <button
                    type="button"
                    className="underline text-slate-600"
                    onClick={() => setTplSaveOpen(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-2">
                  <div className="text-slate-600 mb-1">Template name</div>
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    placeholder="e.g., Customer Support Manager - Remote"
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveAsTemplate}
                    disabled={tplLoading || !valid || !(tplName || "").trim()}
                    className={`px-3 py-1.5 rounded text-white ${
                      !tplLoading && valid && (tplName || "").trim()
                        ? "bg-[#FF7043] hover:bg-[#F4511E]"
                        : "bg-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Save Template
                  </button>
                  <span className="text-slate-500">
                    Templates are private to your recruiter team.
                  </span>
                </div>
              </div>
            )}

            {tplFlash && (
              <div className="mt-2 text-xs text-slate-600">{tplFlash}</div>
            )}
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

            {/* Always-visible close button */}
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
        <div className="p-5 border-t flex items-center justify-between gap-3 sticky bottom-[64px] md:bottom-0 bg-white">
          <div className="text-xs text-slate-500 text-center md:text-left w-full md:w-auto">
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

        {/* Spacer so the very bottom content is not trapped behind the raised sticky footer on mobile */}
        <div className="h-[64px] md:h-0" />
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
