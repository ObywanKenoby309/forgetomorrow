// components/recruiter/JobFormModal.js
import { useEffect, useMemo, useState } from "react";
import JDOptimizer from "@/components/ai/JDOptimizer";
import ATSAdvisor from "@/components/ai/ATSAdvisor";
import { usePlan } from "@/context/PlanContext";

const ORANGE = "#FF7043";
const ORANGE_DARK = "#F4511E";

const BLANK = {
  company: "",
  title: "",
  worksite: "Remote",
  location: "",
  type: "Full-time",
  compensation: "",
  description: "",
  status: "Draft",
  additionalQuestions: null, // recruiter-defined application questions (max 6)
};

function makeQuestionKey() {
  // stable-enough client key for Json array items
  return `q_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function countWords(text) {
  const s = String(text || "").trim();
  if (!s) return 0;
  return s.split(/\s+/).filter(Boolean).length;
}

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

  // Track the currently loaded template (for Windows-like overwrite behavior)
  const [loadedTemplate, setLoadedTemplate] = useState(null); // { id, templateName }

  // Additional questions toggle + panel state (mobile + desktop)
  const [aqEnabled, setAqEnabled] = useState(false);
  const [aqPanelOpen, setAqPanelOpen] = useState(true);

  const isView = mode === "view";
  const isCreate = mode === "create";
  const isEdit = mode === "edit";

  // Close on ESC (desktop / keyboard users)
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

      setAqEnabled(false);
      setAqPanelOpen(true);
      return;
    }

    if (initialJob) {
      // NOTE: intentionally ignore isTemplate/templateName so we don't propagate it into job saves.
      const incomingAq = Array.isArray(initialJob.additionalQuestions)
        ? initialJob.additionalQuestions
        : null;

      setData({
        company: initialJob.company || "",
        title: initialJob.title || "",
        worksite: initialJob.worksite || "Remote",
        location: initialJob.location || "",
        type: initialJob.type || "Full-time",
        compensation: initialJob.compensation || "",
        description: initialJob.description || "",
        status: initialJob.status || "Draft",
        additionalQuestions: incomingAq,
      });

      // enable toggle if questions exist on the loaded job/template
      setAqEnabled(Array.isArray(incomingAq) && incomingAq.length > 0);

      // If the "initial job" is actually a template passed in, remember it
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
      setAqEnabled(false);
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

  const aqList = useMemo(() => {
    return Array.isArray(data.additionalQuestions) ? data.additionalQuestions : [];
  }, [data.additionalQuestions]);

  const aqCount = aqList.length;
  const aqLimitReached = aqCount >= 6;

  const descWords = useMemo(() => countWords(data.description), [data.description]);

  const missing = useMemo(() => {
    if (isView) return [];
    const m = [];
    if (!data.company) m.push("Company");
    if (!data.title) m.push("Job Title");
    if (!data.worksite) m.push("Worksite");
    if (!data.location) m.push("Location");
    if (!(data.description || "").trim()) m.push("Description");
    return m;
  }, [data.company, data.title, data.worksite, data.location, data.description, isView]);

  const loadTemplates = async () => {
    try {
      setTplLoading(true);
      setTplError(null);
      const res = await fetch("/api/recruiter/job-postings?kind=templates&lite=1");
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

    const incomingAq = Array.isArray(t.additionalQuestions) ? t.additionalQuestions : null;

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
      additionalQuestions: incomingAq,
    }));

    setAqEnabled(Array.isArray(incomingAq) && incomingAq.length > 0);

    setLoadedTemplate({
      id: t.id,
      templateName: String(t.templateName || "").trim(),
    });

    setTplOpen(false);
    setTplFlash(`Template loaded: "${t.templateName || t.title || "Template"}".`);

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
        overwrite: Boolean(overwrite),
        status: "Draft",

        additionalQuestions:
          aqEnabled && Array.isArray(data.additionalQuestions) && data.additionalQuestions.length
            ? data.additionalQuestions
            : null,
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

      let { res, json } = await postTemplate({ overwrite: false, name });

      if (!res.ok && res.status === 409) {
        const ok = window.confirm(`A template named "${name}" already exists.\n\nReplace it?`);
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
      setTplName("");
      await loadTemplates();

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

    const cleanedAq =
      aqEnabled && Array.isArray(data.additionalQuestions) && data.additionalQuestions.length
        ? data.additionalQuestions
            .filter((q) => (q?.label || "").trim())
            .slice(0, 6)
        : null;

    onSave?.({
      ...data,
      isTemplate: false,
      templateName: null,
      additionalQuestions: cleanedAq,
    });
  };

  const setQuestionAt = (idx, patch) => {
    setData((p) => {
      const current = Array.isArray(p.additionalQuestions) ? p.additionalQuestions : [];
      const next = [...current];
      const prev = next[idx] || {};
      next[idx] = { ...prev, ...patch };
      return { ...p, additionalQuestions: next };
    });
  };

  const addQuestion = () => {
    setData((p) => {
      const current = Array.isArray(p.additionalQuestions) ? p.additionalQuestions : [];
      if (current.length >= 6) return p;

      const next = [
        ...current,
        {
          key: makeQuestionKey(),
          label: "",
          type: "text",
          required: false,
          helpText: "",
        },
      ];

      return { ...p, additionalQuestions: next };
    });
  };

  const removeQuestion = (idx) => {
    setData((p) => {
      const current = Array.isArray(p.additionalQuestions) ? p.additionalQuestions : [];
      const next = current.filter((_, i) => i !== idx);
      return { ...p, additionalQuestions: next.length ? next : null };
    });
  };

  const toggleAdditionalQuestions = () => {
    if (isView) return;

    if (aqEnabled) {
      if (aqCount > 0) {
        const ok = window.confirm(
          "Turn off additional questions?\n\nThis will remove the custom questions from this job/template."
        );
        if (!ok) return;
      }
      setAqEnabled(false);
      setData((p) => ({ ...p, additionalQuestions: null }));
      setTplFlash("Additional questions disabled.");
      return;
    }

    setAqEnabled(true);
    setTplFlash("");
    setAqPanelOpen(true);

    setData((p) => {
      const current = Array.isArray(p.additionalQuestions) ? p.additionalQuestions : [];
      if (current.length) return p;
      return {
        ...p,
        additionalQuestions: [
          {
            key: makeQuestionKey(),
            label: "",
            type: "text",
            required: false,
            helpText: "",
          },
        ],
      };
    });
  };

  if (!open) return null;

  const aiBadge = isEnterprise
    ? { label: "AI Optimizer Active", hint: "Rewrite + ATS guidance for faster, cleaner postings." }
    : { label: "AI Add-on Locked", hint: "Upgrade to unlock JD optimization + ATS guidance." };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white/85 backdrop-blur-xl shadow-2xl border border-white/40">
        {/* Premium top accent */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${ORANGE} 0%, ${ORANGE_DARK} 50%, #111827 100%)`,
          }}
        />

        {/* Header */}
        <div className="p-5 border-b border-black/5 sticky top-0 bg-white/70 backdrop-blur-xl z-10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{titleLabel}</h2>

              {/* AI badge (brand-forward, less transparent) */}
              <span
                className={`text-[11px] px-2 py-1 rounded-full font-medium border ${
                  isEnterprise
                    ? "text-white"
                    : "text-white bg-slate-500 border-slate-500"
                }`}
                style={
                  isEnterprise
                    ? {
                        background: `linear-gradient(90deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
                        borderColor: ORANGE_DARK,
                      }
                    : undefined
                }
                title={aiBadge.hint}
              >
                {aiBadge.label}
              </span>

              {/* subtle “you’re in control” helper */}
              {!isView && (
                <span className="text-xs text-slate-600">
                  Build fast. Save as a template. Add screening questions only when you need them.
                </span>
              )}
            </div>

            {/* Template tools row */}
            {canUseTemplates && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={openLoadPanel}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]"
                  disabled={tplLoading}
                >
                  Load Template
                </button>

                <button
                  type="button"
                  onClick={openSavePanel}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]"
                  disabled={tplLoading || !valid}
                  title={
                    !valid
                      ? "Fill required fields to save a template."
                      : "Save this role as a reusable template."
                  }
                >
                  Save as Template
                </button>

                {/* Additional Questions toggle (beside save) */}
                <button
                  type="button"
                  onClick={toggleAdditionalQuestions}
                  disabled={tplLoading || isView}
                  className={`px-3 py-1.5 rounded-lg border active:scale-[0.99] ${
                    aqEnabled
                      ? "text-white"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                  }`}
                  style={
                    aqEnabled
                      ? {
                          background: `linear-gradient(90deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
                          borderColor: ORANGE_DARK,
                        }
                      : undefined
                  }
                  title="Add up to 6 custom application questions (text responses)."
                >
                  {aqEnabled ? "Screening Questions: ON" : "Screening Questions: OFF"}
                </button>

                {tplLoading && (
                  <span className="text-slate-500 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                    Working…
                  </span>
                )}

                {!!loadedTemplate?.templateName && (
                  <span className="text-slate-500">
                    Loaded:{" "}
                    <span className="font-medium text-slate-800">
                      {loadedTemplate.templateName}
                    </span>
                  </span>
                )}

                {aqEnabled && (
                  <span className="text-slate-500">
                    Questions: <span className="font-medium">{aqCount}/6</span>
                  </span>
                )}
              </div>
            )}

            {/* Load panel */}
            {canUseTemplates && tplOpen && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 backdrop-blur p-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-800">Choose a template</div>
                  <button
                    type="button"
                    className="underline text-slate-600 hover:text-slate-900"
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
                    No templates saved yet. Create one once and reuse it forever.
                  </div>
                )}

                {tplRows.length > 0 && (
                  <div className="mt-2">
                    <select
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full bg-white"
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

                    <div className="mt-2 text-[11px] text-slate-500">
                      Tip: templates are private to your recruiter team and keep your posting flow consistent.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save panel */}
            {canUseTemplates && tplSaveOpen && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 backdrop-blur p-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-800">Save template</div>
                  <button
                    type="button"
                    className="underline text-slate-600 hover:text-slate-900"
                    onClick={() => setTplSaveOpen(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-2">
                  <div className="text-slate-600 mb-1">Template name</div>
                  <input
                    className="border border-slate-200 rounded-lg px-3 py-2 w-full bg-white"
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
                    className={`px-3 py-2 rounded-lg text-white active:scale-[0.99] ${
                      !tplLoading && valid && (tplName || "").trim()
                        ? ""
                        : "bg-slate-400 cursor-not-allowed"
                    }`}
                    style={
                      !tplLoading && valid && (tplName || "").trim()
                        ? {
                            background: `linear-gradient(90deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
                          }
                        : undefined
                    }
                  >
                    Save Template
                  </button>
                  <span className="text-slate-500">
                    Your team can reuse this posting in one click.
                  </span>
                </div>
              </div>
            )}

            {tplFlash && (
              <div className="mt-3 text-xs text-slate-700 bg-white/70 border border-slate-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: ORANGE }}
                />
                <span>{tplFlash}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Always-visible close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 bg-white/80 hover:bg-slate-100 active:scale-[0.99]"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 text-sm">
          <div className="flex flex-col md:flex-row gap-5">
            {/* LEFT: Job form */}
            <div className="flex-1 space-y-5 min-w-0">
              {/* Row: quick “completion” pulse */}
              {!isView && (
                <div className="rounded-xl border border-slate-200 bg-white/70 backdrop-blur p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-700">
                      <span className="font-medium">Posting readiness:</span>{" "}
                      {valid ? (
                        <span className="text-slate-800">
                          Ready to save - required fields complete.
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          Missing:{" "}
                          <span className="font-medium text-slate-800">
                            {missing.join(", ")}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Description: <span className="font-medium">{descWords}</span> words
                    </div>
                  </div>
                </div>
              )}

              {/* ROW 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Company" required>
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.company}
                    onChange={(e) => setData((p) => ({ ...p, company: e.target.value }))}
                    disabled={isView}
                    placeholder="e.g., ForgeTomorrow"
                  />
                </Field>
                <Field label="Job Title" required>
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.title}
                    onChange={(e) => setData((p) => ({ ...p, title: e.target.value }))}
                    disabled={isView}
                    placeholder="e.g., Senior Recruiter"
                  />
                </Field>
              </div>

              {/* ROW 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Worksite" required>
                  <select
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.worksite}
                    onChange={(e) => setData((p) => ({ ...p, worksite: e.target.value }))}
                    disabled={isView}
                  >
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>Onsite</option>
                  </select>
                </Field>
                <Field label="Location" required>
                  <input
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.location}
                    onChange={(e) => setData((p) => ({ ...p, location: e.target.value }))}
                    disabled={isView}
                    placeholder="e.g., Nashville, TN"
                  />
                </Field>
              </div>

              {/* ROW 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Employment Type">
                  <select
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.type}
                    onChange={(e) => setData((p) => ({ ...p, type: e.target.value }))}
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
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.compensation}
                    onChange={(e) => setData((p) => ({ ...p, compensation: e.target.value }))}
                    disabled={isView}
                    placeholder="e.g., $70-90k base + bonus"
                  />
                </Field>
              </div>

              {/* DESCRIPTION + AI */}
              <Field label="Description" required>
                <div className="rounded-xl border border-slate-200 bg-white/70 backdrop-blur p-3">
                  <textarea
                    className="border border-slate-200 rounded-xl px-3 py-2 w-full min-h-[200px] font-mono text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                    value={data.description}
                    onChange={(e) => setData((p) => ({ ...p, description: e.target.value }))}
                    disabled={isView}
                    placeholder="Write the role clearly. Keep it human. You can optimize it with AI after you draft."
                  />

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500">
                      Pro tip: strong postings reduce back-and-forth and attract better-fit applicants.
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {descWords} words
                    </div>
                  </div>

                  {data.description.trim() && isEnterprise && !isView && (
                    <>
                      <div className="mt-4">
                        <JDOptimizer
                          draft={data.description}
                          title={data.title}
                          company={data.company}
                          onOptimize={(text) => setData((p) => ({ ...p, description: text }))}
                        />
                      </div>
                      <div className="mt-4">
                        <ATSAdvisor draft={data.description} title={data.title} company={data.company} />
                      </div>
                    </>
                  )}

                  {data.description.trim() && !isEnterprise && !isView && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">AI Optimizer</span> is locked on your plan.
                      When enabled, it rewrites for clarity + ATS alignment and gives quick guidance.
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Status">
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 w-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                  value={data.status}
                  onChange={(e) => setData((p) => ({ ...p, status: e.target.value }))}
                  disabled={isView}
                >
                  <option value="Draft">Draft</option>
                  <option value="Open">Open</option>
                  <option value="Reviewing">Reviewing applicants</option>
                  <option value="Closed">Closed</option>
                </select>

                {!isView && (
                  <div className="mt-2 text-[11px] text-slate-500">
                    “Open” makes it visible to seekers. “Reviewing” keeps it visible but pauses new applications.
                  </div>
                )}
              </Field>
            </div>

            {/* RIGHT: Additional Questions panel (desktop right, mobile stacks) */}
            {canUseTemplates && aqEnabled && (
              <div className="w-full md:w-[380px] shrink-0">
                <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-3 sticky md:top-[92px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: ORANGE }}
                        />
                        <div className="font-semibold text-xs text-slate-900">
                          Screening Questions
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {aqCount}/6
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Candidates answer with short text fields. Use this when you need clarity up front - not extra steps.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-xs underline text-slate-600 hover:text-slate-900"
                      onClick={() => setAqPanelOpen((v) => !v)}
                    >
                      {aqPanelOpen ? "Hide" : "Show"}
                    </button>
                  </div>

                  {aqPanelOpen && (
                    <>
                      <div className="mt-3 space-y-3">
                        {aqList.map((q, idx) => (
                          <div
                            key={q?.key || idx}
                            className="rounded-xl border border-slate-200 bg-white/85 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[11px] font-semibold text-slate-800">
                                Question {idx + 1}
                              </div>
                              {!isView && (
                                <button
                                  type="button"
                                  className="text-[11px] text-rose-700 underline hover:text-rose-800"
                                  onClick={() => removeQuestion(idx)}
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="mt-2">
                              <input
                                className="border border-slate-200 rounded-xl px-3 py-2 w-full text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                                value={String(q?.label || "")}
                                onChange={(e) => setQuestionAt(idx, { label: e.target.value })}
                                placeholder='e.g., "Describe your experience with high-volume recruiting."'
                                disabled={isView}
                              />
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <label className="flex items-center gap-2 text-xs text-slate-600 select-none">
                                <input
                                  type="checkbox"
                                  checked={!!q?.required}
                                  onChange={(e) => setQuestionAt(idx, { required: e.target.checked })}
                                  disabled={isView}
                                />
                                Required
                              </label>

                              <span className="text-[10px] text-slate-500">
                                Text response
                              </span>
                            </div>

                            <div className="mt-2">
                              <input
                                className="border border-slate-200 rounded-xl px-3 py-2 w-full text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7043]/35"
                                value={String(q?.helpText || "")}
                                onChange={(e) => setQuestionAt(idx, { helpText: e.target.value })}
                                placeholder="Optional helper text (shown to candidate)…"
                                disabled={isView}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={addQuestion}
                          disabled={isView || aqLimitReached}
                          className={`px-3 py-2 rounded-xl border text-xs active:scale-[0.99] ${
                            !isView && !aqLimitReached
                              ? "border-slate-200 bg-white hover:bg-slate-50"
                              : "bg-slate-200 text-slate-500 cursor-not-allowed border-slate-200"
                          }`}
                        >
                          + Add Question
                        </button>

                        <div className="text-[11px] text-slate-600">
                          {aqCount}/6
                        </div>
                      </div>

                      {aqCount > 0 && (
                        <div className="mt-2 text-[11px] text-slate-500">
                          Tip: keep questions short. Mark only the must-haves as required.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/5 flex items-center justify-between gap-3 sticky bottom-[64px] md:bottom-0 bg-white/70 backdrop-blur-xl">
          <div className="text-xs text-slate-600 text-center md:text-left w-full md:w-auto">
            {isView
              ? "Viewing job details."
              : valid
              ? "Ready to save. Your posting is complete."
              : "Fields marked * are required."}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:bg-slate-50 active:scale-[0.99]"
            >
              Close
            </button>

            {!isView && (
              <button
                onClick={handleSave}
                disabled={!valid}
                className={`px-4 py-2 rounded-xl text-sm text-white active:scale-[0.99] ${
                  valid ? "" : "bg-slate-400 cursor-not-allowed"
                }`}
                style={
                  valid
                    ? { background: `linear-gradient(90deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)` }
                    : undefined
                }
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
      <span className="block text-xs text-slate-700 mb-1">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      {children}
    </label>
  );
}
