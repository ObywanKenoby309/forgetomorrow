// pages/recruiter/job-postings/[id].js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { PlanProvider } from "@/context/PlanContext";
import Link from "next/link";

function SectionCard({ title, children, right }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="font-medium">{title}</div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </div>
  );
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

  // quick guard: if it doesn't look like JSON, skip parsing
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

  // Common shapes:
  // 1) { personalInfo, summary, workExperiences, ... }
  // 2) { data: { personalInfo, ... } }
  // 3) { resume: { ... } }
  const inner =
    (data.data && typeof data.data === "object" && data.data) ||
    (data.resume && typeof data.resume === "object" && data.resume) ||
    data;

  // Must have at least personalInfo-ish fields to render hybrid nicely
  const personalInfo =
    inner.personalInfo && typeof inner.personalInfo === "object" ? inner.personalInfo : {};

  // If name is missing, still allow render but it will look weird
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

  const contactLine = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
  ]
    .filter(Boolean)
    .join(" • ");

  const extraLines = [personalInfo.portfolio, personalInfo.ftProfile].filter(Boolean);

  return (
    <div className="rounded border bg-white p-4">
      {/* Header (centered like the Hybrid PDF) */}
      <div className="text-center">
        <div className="text-xl font-bold text-slate-900">
          {personalInfo.name || "Candidate"}
        </div>
        {contactLine ? (
          <div className="text-xs text-slate-600 mt-1">{contactLine}</div>
        ) : null}
        {extraLines.length ? (
          <div className="text-xs text-slate-600 mt-1 space-y-0.5">
            {extraLines.map((l, idx) => (
              <div key={idx}>{l}</div>
            ))}
          </div>
        ) : null}
        {personalInfo.targetedRole ? (
          <div className="text-sm italic text-slate-700 mt-2">
            {personalInfo.targetedRole}
          </div>
        ) : null}
      </div>

      {/* Summary */}
      {summary ? (
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">
            Professional Summary
          </div>
          <div className="text-sm text-slate-800 mt-2 whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      ) : null}

      {/* Languages */}
      {languages.length ? (
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">
            Languages
          </div>
          <div className="text-sm text-slate-800 mt-2">
            {languages.join(" • ")}
          </div>
        </div>
      ) : null}

      {/* Two-column: Skills (left) + Experience (right) */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Skills */}
        <div className="md:col-span-1">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">
            Skills
          </div>
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

        {/* Experience */}
        <div className="md:col-span-2">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">
            Experience
          </div>

          {workExperiences.length ? (
            <div className="mt-2 space-y-4">
              {workExperiences.map((exp, i) => {
                const title = exp.title || exp.jobTitle || "";
                const company = exp.company || "";
                const dates = `${exp.startDate || ""}${exp.startDate ? " – " : ""}${exp.endDate || "Present"}`;

                return (
                  <div key={i} className="text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 break-words">
                          {title || "Role"}
                          {company ? (
                            <span className="font-normal text-slate-700">
                              {" "}
                              • {company}
                            </span>
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

      {/* Projects */}
      {projects.length ? (
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">
            Projects
          </div>

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
                        {org ? (
                          <span className="font-normal text-slate-700">
                            {" "}
                            • {org}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {dates ? (
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {dates}
                      </div>
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

      {/* Education */}
      {educationList.length ? (
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">
            Education
          </div>

          <div className="mt-2 space-y-3">
            {educationList.map((edu, i) => (
              <div key={i} className="text-sm">
                <div className="font-semibold text-slate-900">
                  {edu.degree || ""} {edu.field ? ` ${edu.field}` : ""}
                </div>
                <div className="text-sm text-slate-700">
                  {(edu.institution || edu.school) || "—"}
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

      {/* Certifications */}
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
              const org =
                cert && typeof cert === "object"
                  ? cert.organization || cert.issuer
                  : "";

              return (
                <div key={i} className="text-sm">
                  <div className="font-semibold text-slate-900">
                    {name || "Certification"}
                  </div>
                  {org ? <div className="text-xs text-slate-600">{org}</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Custom sections */}
      {customSections.length
        ? customSections.map((section, i) => {
            if (!section) return null;

            const title =
              section.title || section.heading || "Additional Information";
            const items = Array.isArray(section.items) ? section.items : null;
            const content = section.content || section.text || section.body;

            return (
              <div key={i} className="mt-5">
                <div className="text-xs font-bold uppercase tracking-wide border-b pb-1">
                  {title}
                </div>
                {items && items.length ? (
                  <ul className="mt-2 space-y-1">
                    {items.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-800">
                        • {item}
                      </li>
                    ))}
                  </ul>
                ) : content ? (
                  <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                    {content}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">—</div>
                )}
              </div>
            );
          })
        : null}

      {/* Fallback note */}
      <div className="mt-4 text-[11px] text-slate-500">
        Recruiter view uses the Hybrid layout. Downloadable versions will be handled in the packet export pass.
      </div>
    </div>
  );
}

function PacketViewer({ applicationId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [packet, setPacket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!applicationId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/recruiter/applications/${applicationId}/packet`
        );
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

  const resumeValue =
    packet?.resume?.content !== undefined ? packet.resume.content : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white border shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">
            Application Packet {applicationId ? `#${applicationId}` : ""}
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
          {loading && (
            <div className="text-sm text-slate-500">Loading packet…</div>
          )}
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Could not load packet. {String(error?.message || "")}
            </div>
          )}

          {packet && (
            <>
              {/* Cover */}
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

              {/* Resume (Hybrid formatted) */}
              <div className="rounded border p-3">
                <div className="font-medium mb-2">Resume (Hybrid)</div>

                {/* If we can parse resume JSON, render Hybrid view */}
                {normalizeResumeData(resumeValue) ? (
                  <HybridResumeViewer value={resumeValue} />
                ) : packet.resume?.content ? (
                  // fallback to raw text if it's not JSON
                  <pre className="whitespace-pre-wrap text-sm text-slate-800">
                    {typeof packet.resume.content === "string"
                      ? packet.resume.content
                      : JSON.stringify(packet.resume.content, null, 2)}
                  </pre>
                ) : (
                  <div className="text-sm text-slate-500">None provided.</div>
                )}
              </div>

              {/* Additional Questions */}
              <div className="rounded border p-3">
                <div className="font-medium mb-2">Additional Questions</div>
                {(packet.additionalQuestions || []).length ? (
                  <div className="space-y-2">
                    {packet.additionalQuestions.map((a, idx) => (
                      <div key={`${a.questionKey}-${idx}`} className="text-sm">
                        <div className="font-medium text-slate-800">
                          {a.label || a.questionKey}
                        </div>
                        <div className="text-slate-700 whitespace-pre-wrap">
                          {typeof a.value === "string"
                            ? a.value
                            : JSON.stringify(a.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    No additional questions answered.
                  </div>
                )}
              </div>

              {/* Consent */}
              <div className="rounded border p-3">
                <div className="font-medium mb-2">
                  Consent and acknowledgement
                </div>
                {packet.consent ? (
                  <div className="text-sm text-slate-700 space-y-1">
                    <div>
                      Terms accepted:{" "}
                      {packet.consent.termsAccepted ? "Yes" : "No"}
                    </div>
                    <div>
                      Status updates:{" "}
                      {packet.consent.emailUpdatesAccepted ? "Yes" : "No"}
                    </div>
                    <div>
                      Signature: {packet.consent.signatureName || "Not provided"}
                    </div>
                    <div>
                      Signed at:{" "}
                      {packet.consent.signedAt
                        ? String(packet.consent.signedAt)
                        : "Not provided"}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    No consent record found.
                  </div>
                )}
              </div>

              {/* Forge Assessment */}
              <div className="rounded border p-3">
                <div className="font-medium mb-2">ForgeTomorrow assessment</div>
                {packet.forgeAssessment ? (
                  <div className="text-sm text-slate-700 space-y-2">
                    <div className="text-slate-600">
                      Model: {packet.forgeAssessment.model || "Unknown"}{" "}
                      {packet.forgeAssessment.modelVersion
                        ? `(${packet.forgeAssessment.modelVersion})`
                        : ""}
                      {packet.forgeAssessment.score !== null &&
                      packet.forgeAssessment.score !== undefined
                        ? ` • Score: ${packet.forgeAssessment.score}`
                        : ""}
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-slate-800">
                      {JSON.stringify(packet.forgeAssessment.result, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Not generated yet.</div>
                )}
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

  // Load viewer (so we can label internal test apps cleanly)
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

        const res = await fetch(
          `/api/recruiter/job-postings/${jobId}/applications`
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

        if (!alive) return;
        setJob(json?.job || null);
        setApps(Array.isArray(json?.applications) ? json.applications : []);
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
                {job?.company ? (
                  <span className="text-slate-500">• {job.company}</span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/recruiter/job-postings"
                className="text-sm px-3 py-1.5 rounded border bg-white hover:bg-slate-50"
              >
                Back to Job Postings
              </Link>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Could not load applicants. {String(loadError?.message || "")}
            </div>
          )}

          <SectionCard
            title="Job"
            right={
              job?.id ? (
                <span className="text-xs text-slate-500">Job ID: {job.id}</span>
              ) : null
            }
          >
            {loading ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : job ? (
              <div className="text-sm text-slate-700 space-y-1">
                <div>
                  <span className="font-medium">Worksite:</span>{" "}
                  {job.worksite || "Not provided"}
                </div>
                <div>
                  <span className="font-medium">Location:</span>{" "}
                  {job.location || "Not provided"}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Job not found.</div>
            )}
          </SectionCard>

          <SectionCard title={`Applicants (${apps.length})`}>
            {loading ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : apps.length ? (
              <div className="space-y-3">
                {apps.map((a) => {
                  const candidateName = a?.candidate?.name || null;
                  const candidateEmail = a?.candidate?.email || "";
                  const candidateId = a?.candidate?.id || null;

                  const isViewer =
                    viewer?.id && candidateId && viewer.id === candidateId;

                  const displayName = isViewer
                    ? "Internal test application (You)"
                    : candidateName || "Candidate";

                  return (
                    <div key={a.id} className="rounded border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">
                            {displayName}
                          </div>

                          {candidateEmail ? (
                            <div className="text-sm text-slate-600">
                              {candidateEmail}
                            </div>
                          ) : null}

                          <div className="text-xs text-slate-500 mt-1">
                            Applied:{" "}
                            {a.appliedAt ? String(a.appliedAt) : "Unknown"}{" "}
                            {a.submittedAt
                              ? `• Submitted: ${String(a.submittedAt)}`
                              : ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-sm px-3 py-1.5 rounded border bg-white hover:bg-slate-50"
                            onClick={() => setOpenPacketAppId(a.id)}
                          >
                            View packet
                          </button>

                          <button
                            type="button"
                            className="text-sm px-3 py-1.5 rounded border bg-white hover:bg-slate-50 opacity-60 cursor-not-allowed"
                            title="Download packet will be wired after exports are implemented."
                            disabled
                          >
                            Download
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-600">
                        Packet includes: Cover, Resume, Additional Questions,
                        Consent, Forge Assessment. Self-ID is excluded.
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No applicants yet.</div>
            )}
          </SectionCard>
        </div>

        {openPacketAppId ? (
          <PacketViewer
            applicationId={openPacketAppId}
            onClose={() => setOpenPacketAppId(null)}
          />
        ) : null}
      </RecruiterLayout>
    </PlanProvider>
  );
}
