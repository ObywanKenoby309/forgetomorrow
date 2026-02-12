// pages/recruiter/job-postings/[id].js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { PlanProvider } from "@/context/PlanContext";
import Link from "next/link";

// ✅ WHY inline info
import WHYScoreInfo from "@/components/ai/WHYScoreInfo";

// ✅ NEW: Reuse the same WHY UI (consistent with drawer experience)
import { WhyCandidateInline } from "@/components/recruiter/WhyCandidateDrawer";

function formatDateTime(v) {
  if (!v) return "—";
  try {
    const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
    if (!d || isNaN(d.getTime())) return String(v);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(v);
  }
}

// Canonical glass numbers (match your Seeker Applications feel)
const GLASS = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const WHITE_CARD = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

function SectionCard({ title, children, right }) {
  return (
    <div style={GLASS} className="p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="font-semibold text-slate-900">{title}</div>
        {right ? <div>{right}</div> : null}
      </div>
      <div style={WHITE_CARD} className="p-4">
        {children}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Pipeline helpers
// ──────────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: "Applied", label: "Applied" },
  { key: "Interviewing", label: "Interviewing" },
  { key: "Offers", label: "Offers" },
  { key: "ClosedOut", label: "Closed Out" },
];

const STAGE_META = {
  Applied: {
    ring: "ring-blue-200",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    colBorder: "border-blue-200",
    colTop: "bg-blue-50/60",
  },
  Interviewing: {
    ring: "ring-green-200",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    colBorder: "border-green-200",
    colTop: "bg-green-50/60",
  },
  Offers: {
    ring: "ring-purple-200",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    colBorder: "border-purple-200",
    colTop: "bg-purple-50/60",
  },
  ClosedOut: {
    ring: "ring-slate-200",
    badgeBg: "bg-slate-50",
    badgeText: "text-slate-700",
    colBorder: "border-slate-200",
    colTop: "bg-slate-50/60",
  },
};

function normalizeStatusForUi(s) {
  const v = String(s || "").trim();
  if (!v) return "Applied";
  if (v === "Closed Out") return "ClosedOut";
  return v;
}

function isStageKeyValid(key) {
  return PIPELINE_STAGES.some((s) => s.key === key);
}

// ──────────────────────────────────────────────────────────────
// Resume helpers + Hybrid viewer (UI only - not PDF)
// ──────────────────────────────────────────────────────────────
function tryParseJson(input) {
  if (!input) return null;
  if (typeof input === "object") return input;
  if (typeof input !== "string") return null;

  const s = input.trim();
  if (!s) return null;

  const looksJson =
    (s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"));
  if (!looksJson) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function normalizeResumeData(raw) {
  const data = tryParseJson(raw);
  if (!data || typeof data !== "object") return null;

  const inner =
    (data.data && typeof data.data === "object" && data.data) ||
    (data.resume && typeof data.resume === "object" && data.resume) ||
    data;

  const personalInfo =
    inner.personalInfo && typeof inner.personalInfo === "object" ? inner.personalInfo : {};

  return {
    personalInfo,
    summary: inner.summary || "",
    workExperiences: Array.isArray(inner.workExperiences) ? inner.workExperiences : [],
    projects: Array.isArray(inner.projects) ? inner.projects : [],
    educationList: Array.isArray(inner.educationList) ? inner.educationList : [],
    skills: Array.isArray(inner.skills) ? inner.skills : [],
    languages: Array.isArray(inner.languages) ? inner.languages : [],
    certifications: Array.isArray(inner.certifications) ? inner.certifications : [],
    customSections: Array.isArray(inner.customSections) ? inner.customSections : [],
  };
}

function HybridResumeViewer({ value }) {
  const data = useMemo(() => normalizeResumeData(value), [value]);
  if (!data) return null;

  const {
    personalInfo = {},
    summary,
    workExperiences = [],
    projects = [],
    educationList = [],
    skills = [],
    languages = [],
    certifications = [],
    customSections = [],
  } = data;

  const contactLine = [personalInfo.email, personalInfo.phone, personalInfo.location]
    .filter(Boolean)
    .join(" • ");

  const extraLines = [personalInfo.portfolio, personalInfo.ftProfile].filter(Boolean);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-center">
        <div className="text-xl font-bold text-slate-900">{personalInfo.name || "Candidate"}</div>
        {contactLine ? <div className="text-xs text-slate-600 mt-1">{contactLine}</div> : null}
        {extraLines.length ? (
          <div className="text-xs text-slate-600 mt-1 space-y-0.5">
            {extraLines.map((l, idx) => (
              <div key={idx}>{l}</div>
            ))}
          </div>
        ) : null}
        {personalInfo.targetedRole ? (
          <div className="text-sm italic text-slate-700 mt-2">{personalInfo.targetedRole}</div>
        ) : null}
      </div>

      {summary ? (
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">
            Professional Summary
          </div>
          <div className="text-sm text-slate-800 mt-2 whitespace-pre-wrap">{summary}</div>
        </div>
      ) : null}

      {languages.length ? (
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">Languages</div>
          <div className="text-sm text-slate-800 mt-2">{languages.join(" • ")}</div>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">Skills</div>
          {skills.length ? (
            <ul className="mt-2 space-y-1">
              {skills.map((s, i) => (
                <li key={i} className="text-sm text-slate-800">
                  • {s}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-sm text-slate-500">No skills listed.</div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">Experience</div>

          {workExperiences.length ? (
            <div className="mt-2 space-y-4">
              {workExperiences.map((exp, i) => {
                const title = exp.title || exp.jobTitle || "";
                const company = exp.company || "";
                const dates = `${exp.startDate || ""}${exp.startDate ? " – " : ""}${
                  exp.endDate || "Present"
                }`;

                return (
                  <div key={i} className="text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 break-words">
                          {title || "Role"}
                          {company ? (
                            <span className="font-normal text-slate-700"> • {company}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {dates.trim() || "—"}
                      </div>
                    </div>

                    {Array.isArray(exp.bullets) && exp.bullets.length ? (
                      <ul className="mt-2 space-y-1">
                        {exp.bullets.map((b, bi) => (
                          <li key={bi} className="text-sm text-slate-800">
                            • {b}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">No experience listed.</div>
          )}
        </div>
      </div>

      {projects.length ? (
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">Projects</div>

          <div className="mt-2 space-y-4">
            {projects.map((proj, i) => {
              const title = proj.title || proj.name || "Project";
              const org = proj.company || proj.org || proj.client || "";
              const dates =
                proj.startDate || proj.endDate
                  ? `${proj.startDate || ""} – ${proj.endDate || "Present"}`
                  : "";

              const bullets = Array.isArray(proj.bullets) ? proj.bullets : [];

              return (
                <div key={i} className="text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 break-words">
                        {title}
                        {org ? <span className="font-normal text-slate-700"> • {org}</span> : null}
                      </div>
                    </div>
                    {dates ? (
                      <div className="text-xs text-slate-500 whitespace-nowrap">{dates}</div>
                    ) : null}
                  </div>

                  {bullets.length ? (
                    <ul className="mt-2 space-y-1">
                      {bullets.map((b, bi) => (
                        <li key={bi} className="text-sm text-slate-800">
                          • {b}
                        </li>
                      ))}
                    </ul>
                  ) : proj.description ? (
                    <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                      {proj.description}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {educationList.length ? (
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">Education</div>

          <div className="mt-2 space-y-3">
            {educationList.map((edu, i) => (
              <div key={i} className="text-sm">
                <div className="font-semibold text-slate-900">
                  {edu.degree || ""} {edu.field ? ` ${edu.field}` : ""}
                </div>
                <div className="text-sm text-slate-700">
                  {edu.institution || edu.school || "—"}
                  {edu.location ? ` • ${edu.location}` : ""}
                </div>
                <div className="text-xs text-slate-500">
                  {edu.startDate || "—"} – {edu.endDate || "Present"}
                </div>
                {edu.description ? (
                  <div className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">
                    {edu.description}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {certifications.length ? (
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">
            Certifications & Training
          </div>

          <div className="mt-2 space-y-2">
            {certifications.map((cert, i) => {
              const name =
                (cert && typeof cert === "object" && (cert.name || cert.title)) ||
                (typeof cert === "string" ? cert : "");
              const org = cert && typeof cert === "object" ? cert.organization || cert.issuer : "";

              return (
                <div key={i} className="text-sm">
                  <div className="font-semibold text-slate-900">{name || "Certification"}</div>
                  {org ? <div className="text-xs text-slate-600">{org}</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {customSections.length
        ? customSections.map((section, i) => {
            if (!section) return null;

            const title = section.title || section.heading || "Additional Information";
            const items = Array.isArray(section.items) ? section.items : null;
            const content = section.content || section.text || section.body;

            return (
              <div key={i} className="mt-5">
                <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">{title}</div>
                {items && items.length ? (
                  <ul className="mt-2 space-y-1">
                    {items.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-800">
                        • {item}
                      </li>
                    ))}
                  </ul>
                ) : content ? (
                  <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{content}</div>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">—</div>
                )}
              </div>
            );
          })
        : null}
    </div>
  );
}

function PacketViewer({ applicationId, job, candidate, onClose }) {
  const [loading, setLoading] = useState(false);
  const [packet, setPacket] = useState(null);
  const [error, setError] = useState(null);

  const [whyLoading, setWhyLoading] = useState(false);
  const [whyError, setWhyError] = useState(null);
  const [whyData, setWhyData] = useState(null);
  const [whyShowDetails, setWhyShowDetails] = useState(false);

  const whyHasRunRef = useRef(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!applicationId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/recruiter/applications/${applicationId}/packet`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!alive) return;
        setPacket(json);
      } catch (e) {
        if (!alive) return;
        setError(e);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [applicationId]);

  const resumeValue = packet?.resume?.content !== undefined ? packet.resume.content : null;
  const jobDescription = job?.description || job?.jobDescription || "";

  useEffect(() => {
    let alive = true;

    async function runWhy() {
      if (!applicationId) return;
      if (whyHasRunRef.current) return;

      const resumeText =
        typeof resumeValue === "string"
          ? resumeValue
          : resumeValue
          ? JSON.stringify(resumeValue)
          : "";

      const jdText = String(jobDescription || "").trim();

      if (!jdText) return;
      if (!String(resumeText || "").trim()) return;

      whyHasRunRef.current = true;

      try {
        setWhyLoading(true);
        setWhyError(null);
        setWhyData(null);

        const res = await fetch("/api/recruiter/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText,
            jobDescription: jdText,
            jobId: job?.id ?? null,
            applicationId,
            candidateUserId: candidate?.id ?? null,
            externalName: null,
            externalEmail: null,
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

        if (!alive) return;
        setWhyData(json);
        setWhyShowDetails(false);
      } catch (e) {
        if (!alive) return;
        setWhyError(e);
        whyHasRunRef.current = false;
      } finally {
        if (!alive) return;
        setWhyLoading(false);
      }
    }

    if (packet) runWhy();

    return () => {
      alive = false;
    };
  }, [packet, applicationId, resumeValue, jobDescription, job?.id, candidate?.id, job]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white border shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">
            Application Packet {applicationId ? `#${applicationId}` : ""}
            {candidate?.name ? (
              <span className="text-slate-500 font-normal"> • {candidate.name}</span>
            ) : null}
          </div>
          <button
            className="text-sm px-3 py-1.5 rounded border hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-auto">
          {loading && <div className="text-sm text-slate-500">Loading packet…</div>}
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Could not load packet. {String(error?.message || "")}
            </div>
          )}

          {packet && (
            <>
              <div className="rounded border p-3">
                <div className="font-medium mb-2">Cover</div>
                {packet.cover?.content ? (
                  <pre className="whitespace-pre-wrap text-sm text-slate-800">
                    {packet.cover.content}
                  </pre>
                ) : (
                  <div className="text-sm text-slate-500">None provided.</div>
                )}
              </div>

              <div className="rounded border p-3">
                <div className="font-medium mb-2">Resume (Hybrid)</div>

                {normalizeResumeData(resumeValue) ? (
                  <HybridResumeViewer value={resumeValue} />
                ) : packet.resume?.content ? (
                  <pre className="whitespace-pre-wrap text-sm text-slate-800">
                    {typeof packet.resume.content === "string"
                      ? packet.resume.content
                      : JSON.stringify(packet.resume.content, null, 2)}
                  </pre>
                ) : (
                  <div className="text-sm text-slate-500">None provided.</div>
                )}
              </div>

              <div className="rounded border p-3">
                <div className="font-medium mb-2">Additional Questions</div>
                {(packet.additionalQuestions || []).length ? (
                  <div className="space-y-2">
                    {packet.additionalQuestions.map((a, idx) => (
                      <div key={`${a.questionKey}-${idx}`} className="text-sm">
                        <div className="font-medium text-slate-800">{a.label || a.questionKey}</div>
                        <div className="text-slate-700 whitespace-pre-wrap">
                          {typeof a.value === "string" ? a.value : JSON.stringify(a.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No additional questions answered.</div>
                )}
              </div>

              <div className="rounded border p-3">
                <div className="font-medium mb-2">Consent and acknowledgement</div>
                {packet.consent ? (
                  <div className="text-sm text-slate-700 space-y-1">
                    <div>Terms accepted: {packet.consent.termsAccepted ? "Yes" : "No"}</div>
                    <div>Status updates: {packet.consent.emailUpdatesAccepted ? "Yes" : "No"}</div>
                    <div>Signature: {packet.consent.signatureName || "Not provided"}</div>
                    <div>Signed at: {packet.consent.signedAt ? String(packet.consent.signedAt) : "Not provided"}</div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No consent record found.</div>
                )}
              </div>

              <div className="rounded border p-3">
                <div className="font-medium mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    ForgeTomorrow assessment
                    <WHYScoreInfo />
                  </div>

                  <div className="flex items-center gap-2">
                    {whyLoading ? (
                      <span className="text-xs text-slate-500">Analyzing…</span>
                    ) : whyData ? (
                      <>
                        <span className="text-sm font-semibold text-[#FF7043]">
                          {typeof whyData?.score === "number" ? `${whyData.score}%` : "—"}
                        </span>
                        <button
                          type="button"
                          className="text-sm px-3 py-1.5 rounded border bg-white hover:bg-slate-50"
                          onClick={() => setWhyShowDetails((v) => !v)}
                        >
                          {whyShowDetails ? "Hide details" : "View details"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="text-sm px-3 py-1.5 rounded border bg-white hover:bg-slate-50"
                        onClick={() => {
                          whyHasRunRef.current = false;
                          setPacket((p) => (p ? { ...p } : p));
                        }}
                        disabled={whyLoading}
                        title={
                          whyError
                            ? `Assessment failed: ${String(whyError?.message || "")}`
                            : "Run assessment"
                        }
                      >
                        {whyError ? "Retry" : "Run"}
                      </button>
                    )}
                  </div>
                </div>

                {whyError ? (
                  <div className="mt-2 text-xs text-rose-700">
                    Assessment could not run. {String(whyError?.message || "")}
                  </div>
                ) : null}

                {whyData?.summary ? (
                  <div className="mt-2 text-sm text-slate-700">{whyData.summary}</div>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">Not generated yet.</div>
                )}

                {whyShowDetails && whyData ? (
                  <div className="mt-3 space-y-3">
                    <WhyCandidateInline explain={whyData} mode="full" title="Why this candidate" />
                    <details className="rounded border p-3">
                      <summary className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Raw JSON (debug)
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-800">
                        {JSON.stringify(whyData, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : null}
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                Self-identification answers are not included in recruiter packets.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineCard({
  app,
  displayName,
  candidateEmail,
  onViewPacket,
  onDownload,
  onChangeStage,
  dragHandlers,
  currentStageKey,
  disabled,
}) {
  const meta = STAGE_META[currentStageKey] || STAGE_META.Applied;

  return (
    <div
      className={`rounded-lg border bg-white p-3 shadow-sm ring-1 ${meta.ring} transition`}
      draggable={!disabled}
      onDragStart={dragHandlers?.onDragStart}
      onDragEnd={dragHandlers?.onDragEnd}
      title="Drag to move stage"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{displayName}</div>
          {candidateEmail ? <div className="text-xs text-slate-600 truncate mt-0.5">{candidateEmail}</div> : null}

          <div className="text-[11px] text-slate-500 mt-2">
            Applied: {formatDateTime(app.appliedAt)}
            {app.submittedAt ? ` • Submitted: ${formatDateTime(app.submittedAt)}` : ""}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs px-2.5 py-1.5 rounded border bg-white hover:bg-slate-50"
              onClick={onViewPacket}
              disabled={disabled}
            >
              View packet
            </button>

            <a
              className="text-xs px-2.5 py-1.5 rounded border bg-white hover:bg-slate-50"
              href={onDownload}
              target="_blank"
              rel="noreferrer"
              title="Download recruiter packet (.zip)"
              onClick={(e) => {
                if (disabled) e.preventDefault();
              }}
            >
              Download
            </a>
          </div>

          <div className="w-full">
            <select
              className="w-full text-xs rounded-md border px-2 py-1.5 bg-white"
              value={currentStageKey}
              onChange={(e) => onChangeStage(e.target.value)}
              disabled={disabled}
              title="Move candidate stage"
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationsList({ apps, viewer, movingAppIds, onMoveStage, onViewPacket }) {
  if (!apps.length) {
    return <div className="text-sm text-slate-500">No applicants yet.</div>;
  }

  return (
    <div className="overflow-auto rounded-lg border bg-white">
      <table className="min-w-[920px] w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left">
            <th className="p-3 font-semibold text-slate-700">Candidate</th>
            <th className="p-3 font-semibold text-slate-700">Email</th>
            <th className="p-3 font-semibold text-slate-700">Stage</th>
            <th className="p-3 font-semibold text-slate-700">Applied</th>
            <th className="p-3 font-semibold text-slate-700">Submitted</th>
            <th className="p-3 font-semibold text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => {
            const candidateName = a?.candidate?.name || null;
            const candidateEmail = a?.candidate?.email || "";
            const candidateId = a?.candidate?.id || null;

            const isViewer = viewer?.id && candidateId && viewer.id === candidateId;

            const displayName = isViewer ? "Internal test application (You)" : candidateName || "Candidate";

            const currentStageKey = normalizeStatusForUi(a.status);
            const disabled = movingAppIds.has(a.id);

            return (
              <tr key={a.id} className="border-t hover:bg-slate-50/60">
                <td className="p-3 font-semibold text-slate-900">{displayName}</td>
                <td className="p-3 text-slate-700">{candidateEmail || "—"}</td>
                <td className="p-3">
                  <select
                    className="text-xs rounded-md border px-2 py-1.5 bg-white"
                    value={currentStageKey}
                    onChange={(e) => onMoveStage(a.id, e.target.value)}
                    disabled={disabled}
                    title="Move candidate stage"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 text-slate-700">{formatDateTime(a.appliedAt)}</td>
                <td className="p-3 text-slate-700">{formatDateTime(a.submittedAt)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-xs px-2.5 py-1.5 rounded border bg-white hover:bg-slate-50"
                      onClick={() => onViewPacket(a)}
                      disabled={disabled}
                    >
                      View packet
                    </button>
                    <a
                      className="text-xs px-2.5 py-1.5 rounded border bg-white hover:bg-slate-50"
                      href={`/api/recruiter/applications/${a.id}/packet.zip`}
                      target="_blank"
                      rel="noreferrer"
                      title="Download recruiter packet (.zip)"
                      onClick={(e) => {
                        if (disabled) e.preventDefault();
                      }}
                    >
                      Download
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function RecruiterJobApplicantsPage() {
  const router = useRouter();

  const jobId = useMemo(() => {
    const n = Number(router.query?.id);
    return Number.isFinite(n) ? n : null;
  }, [router.query]);

  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [viewer, setViewer] = useState(null);

  const [openPacketAppId, setOpenPacketAppId] = useState(null);
  const [openPacketCandidate, setOpenPacketCandidate] = useState(null);

  // ✅ Kanban vs List view toggle (no localStorage persistence)
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "list"

  const draggingRef = useRef({ appId: null, from: null });
  const [movingAppIds, setMovingAppIds] = useState(() => new Set());
  const [moveError, setMoveError] = useState(null);

  useEffect(() => {
    let alive = true;
    async function loadViewer() {
      try {
        const res = await fetch("/api/auth/session");
        const json = await res.json().catch(() => null);
        if (!alive) return;
        setViewer(json?.user || null);
      } catch {
        if (!alive) return;
        setViewer(null);
      }
    }
    loadViewer();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (!jobId) return;

    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await fetch(`/api/recruiter/job-postings/${jobId}/applications`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

        if (!alive) return;
        setJob(json?.job || null);

        const list = Array.isArray(json?.applications) ? json.applications : [];
        setApps(
          list.map((a) => ({
            ...a,
            status: normalizeStatusForUi(a?.status),
          }))
        );
      } catch (e) {
        if (!alive) return;
        setLoadError(e);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [router.isReady, jobId]);

  const grouped = useMemo(() => {
    const g = {};
    PIPELINE_STAGES.forEach((s) => {
      g[s.key] = [];
    });

    (apps || []).forEach((a) => {
      const k = normalizeStatusForUi(a?.status);
      if (!g[k]) g[k] = [];
      g[k].push(a);
    });

    return g;
  }, [apps]);

  async function moveCandidateStage(appId, toStageKey) {
    if (!jobId) return;
    if (!appId) return;
    if (!isStageKeyValid(toStageKey)) return;

    const prevApps = apps;

    const current = prevApps.find((a) => a.id === appId);
    if (!current) return;

    const fromStageKey = normalizeStatusForUi(current.status);
    if (fromStageKey === toStageKey) return;

    setMoveError(null);

    setMovingAppIds((prev) => new Set([...Array.from(prev), appId]));
    setApps((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status: toStageKey,
            }
          : a
      )
    );

    try {
      const res = await fetch(`/api/recruiter/job-postings/${jobId}/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStageKey }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      const updatedStatus = normalizeStatusForUi(json?.application?.status || toStageKey);
      setApps((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                status: updatedStatus,
                updatedAt: json?.application?.updatedAt || a.updatedAt,
              }
            : a
        )
      );
    } catch (e) {
      setApps(prevApps);
      setMoveError(e);
    } finally {
      setMovingAppIds((prev) => {
        const n = new Set(Array.from(prev));
        n.delete(appId);
        return n;
      });
    }
  }

  function stageDropHandlers(toStageKey) {
    return {
      onDragOver: (e) => {
        e.preventDefault();
      },
      onDrop: async (e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("text/plain") || "";
        const parts = raw.split("|");
        const appId = Number(parts[0]);
        const from = parts[1] || null;

        if (!Number.isFinite(appId)) return;
        if (!toStageKey) return;
        if (!isStageKeyValid(toStageKey)) return;

        if (from && normalizeStatusForUi(from) === toStageKey) return;

        await moveCandidateStage(appId, toStageKey);
      },
    };
  }

  const headerRight = (
    <div className="flex items-center gap-2">
      {/* Segmented control */}
      <div className="inline-flex rounded-xl border bg-white/90 overflow-hidden shadow-sm">
        <button
          type="button"
          className="text-sm px-3 py-1.5"
          onClick={() => setViewMode("kanban")}
          style={{
            background: viewMode === "kanban" ? "rgba(255,112,67,0.12)" : "transparent",
            color: viewMode === "kanban" ? "#9A3412" : "#334155",
            fontWeight: viewMode === "kanban" ? 800 : 600,
          }}
          title="Kanban view"
        >
          Kanban
        </button>
        <button
          type="button"
          className="text-sm px-3 py-1.5 border-l"
          onClick={() => setViewMode("list")}
          style={{
            background: viewMode === "list" ? "rgba(255,112,67,0.12)" : "transparent",
            color: viewMode === "list" ? "#9A3412" : "#334155",
            fontWeight: viewMode === "list" ? 800 : 600,
          }}
          title="List view"
        >
          List
        </button>
      </div>

      <Link href="/recruiter/job-postings" className="text-sm px-3 py-1.5 rounded-lg border bg-white/90 hover:bg-white">
        Back to Job Postings
      </Link>
    </div>
  );

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Applicants — ForgeTomorrow"
        activeNav="job-postings"
        header={
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">Applicants</div>
              <div className="text-lg font-semibold text-slate-900">
                {job?.title || "Job"}{" "}
                {job?.company ? <span className="text-slate-500">• {job.company}</span> : null}
              </div>
            </div>
            {headerRight}
          </div>
        }
      >
        <div className="space-y-6">
          {loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Could not load applicants. {String(loadError?.message || "")}
            </div>
          )}

          {moveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Could not move candidate. {String(moveError?.message || "")}
            </div>
          )}

          <SectionCard
            title="Job"
            right={job?.id ? <span className="text-xs text-slate-500">Job ID: {job.id}</span> : null}
          >
            {loading ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : job ? (
              <div className="text-sm text-slate-700 space-y-1">
                <div>
                  <span className="font-medium">Worksite:</span> {job.worksite || "Not provided"}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {job.location || "Not provided"}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Job not found.</div>
            )}
          </SectionCard>

          <SectionCard
            title={`Pipeline (${apps.length})`}
            right={
              <div className="text-xs text-slate-500">
                {viewMode === "kanban"
                  ? "Drag cards between columns or use the stage selector."
                  : "Use the stage selector to move candidates."}
              </div>
            }
          >
            {loading ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : apps.length ? (
              viewMode === "kanban" ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {PIPELINE_STAGES.map((stage) => {
                    const items = grouped[stage.key] || [];
                    const meta = STAGE_META[stage.key] || STAGE_META.Applied;

                    return (
                      <div
                        key={stage.key}
                        className={`rounded-xl border bg-white/80 overflow-hidden`}
                        {...stageDropHandlers(stage.key)}
                        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
                      >
                        <div className={`px-3 py-2 border-b ${meta.colTop}`}>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">{stage.label}</div>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText}`}>
                              {items.length}
                            </span>
                          </div>
                        </div>

                        <div className={`p-3 border-l-4 ${meta.colBorder}`}>
                          <div className="space-y-3 min-h-[40px] max-h-[520px] overflow-auto pr-1">
                            {items.map((a) => {
                              const candidateName = a?.candidate?.name || null;
                              const candidateEmail = a?.candidate?.email || "";
                              const candidateId = a?.candidate?.id || null;

                              const isViewer = viewer?.id && candidateId && viewer.id === candidateId;

                              const displayName = isViewer
                                ? "Internal test application (You)"
                                : candidateName || "Candidate";

                              const currentStageKey = normalizeStatusForUi(a.status);
                              const disabled = movingAppIds.has(a.id);

                              const dragHandlers = {
                                onDragStart: (e) => {
                                  try {
                                    e.dataTransfer.setData("text/plain", `${a.id}|${currentStageKey}`);
                                    draggingRef.current = { appId: a.id, from: currentStageKey };
                                  } catch {
                                    // ignore
                                  }
                                },
                                onDragEnd: () => {
                                  draggingRef.current = { appId: null, from: null };
                                },
                              };

                              return (
                                <PipelineCard
                                  key={a.id}
                                  app={a}
                                  displayName={displayName}
                                  candidateEmail={candidateEmail}
                                  currentStageKey={currentStageKey}
                                  disabled={disabled}
                                  dragHandlers={dragHandlers}
                                  onViewPacket={() => {
                                    setOpenPacketCandidate(a?.candidate || null);
                                    setOpenPacketAppId(a.id);
                                  }}
                                  onDownload={`/api/recruiter/applications/${a.id}/packet.zip`}
                                  onChangeStage={(toKey) => moveCandidateStage(a.id, toKey)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ApplicationsList
                  apps={apps}
                  viewer={viewer}
                  movingAppIds={movingAppIds}
                  onMoveStage={(appId, stageKey) => moveCandidateStage(appId, stageKey)}
                  onViewPacket={(app) => {
                    setOpenPacketCandidate(app?.candidate || null);
                    setOpenPacketAppId(app.id);
                  }}
                />
              )
            ) : (
              <div className="text-sm text-slate-500">No applicants yet.</div>
            )}
          </SectionCard>
        </div>

        {openPacketAppId ? (
          <PacketViewer
            applicationId={openPacketAppId}
            job={job}
            candidate={openPacketCandidate}
            onClose={() => {
              setOpenPacketAppId(null);
              setOpenPacketCandidate(null);
            }}
          />
        ) : null}
      </RecruiterLayout>
    </PlanProvider>
  );
}
