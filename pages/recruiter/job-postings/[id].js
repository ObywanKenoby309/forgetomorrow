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

              {/* Resume */}
              <div className="rounded border p-3">
                <div className="font-medium mb-2">Resume</div>
                {packet.resume?.content ? (
                  <pre className="whitespace-pre-wrap text-sm text-slate-800">
                    {packet.resume.content}
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
                Self-identification answers are not included in recruiter
                packets.
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
