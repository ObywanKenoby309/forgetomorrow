// pages/job/[id]/apply.js
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';

const SELF_ID_LINKS = {
  disability503:
    'https://www.dol.gov/sites/dolgov/files/OFCCP/regs/compliance/sec503/Self_ID_Forms/503Self-IDForm-04262023.pdf',
  vevraa: 'https://www.dol.gov/agencies/ofccp/vevraa/self-id-form',
  eeocRace:
    'https://www.eeoc.gov/sites/default/files/migrated_files/federal/2017-approved-Applicant-Form.pdf',
};

function getChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s.includes('chrome=')) return '';
    const qIndex = s.indexOf('?');
    if (qIndex === -1) return '';
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return String(params.get('chrome') || '').toLowerCase();
  } catch {
    return '';
  }
}

// ✅ safe ID coercion (supports both numeric IDs and string IDs like cuid/uuid)
function coerceId(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  return s; // keep string ids
}

// ✅ accept multiple possible response shapes
function extractList(json, keys = []) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  for (const k of keys) {
    const v = json?.[k];
    if (Array.isArray(v)) return v;
  }
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.results)) return json.results;
  return [];
}

// ✅ Match Jobs page logic: internal if accountKey exists (source of truth), else fallbacks
function isInternalJob(job) {
  if (!job) return false;
  if (job.accountKey) return true;

  const origin = String(job.origin || '').toLowerCase();
  const source = String(job.source || '').toLowerCase();

  return (
    origin === 'internal' ||
    source === 'internal' ||
    source === 'forge' ||
    source === 'forge recruiter' ||
    source === 'forgetomorrow' ||
    source === 'forgetomorrow recruiter'
  );
}

// ✅ normalize question type to match UI checks (TEXT, TEXTAREA, etc.)
function normalizeQuestionType(t) {
  const s = String(t || '').trim().toUpperCase();
  if (!s) return 'TEXT';
  if (s === 'TEXT') return 'TEXT';
  if (s === 'TEXTAREA' || s === 'TEXT_AREA') return 'TEXTAREA';
  if (s === 'NUMBER') return 'NUMBER';
  if (s === 'DATE') return 'DATE';
  if (s === 'BOOLEAN') return 'BOOLEAN';
  if (s === 'SELECT') return 'SELECT';
  if (s === 'MULTISELECT') return 'MULTISELECT';
  return 'TEXT';
}

// ✅ normalize + dedupe questions by key (preserve order)
function mergeQuestions(jobQs, tplQs) {
  const out = [];
  const seen = new Set();

  const push = (q) => {
    if (!q) return;
    const key = String(q.key || '').trim();
    const label = String(q.label || '').trim();
    if (!key || !label) return;

    const k = key.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);

    out.push({
      ...q,
      key,
      label,
      type: normalizeQuestionType(q.type),
      required: Boolean(q.required),
      helpText: String(q.helpText || ''),
    });
  };

  (jobQs || []).forEach(push);
  (tplQs || []).forEach(push);

  return out;
}

export default function JobApplyPage() {
  const router = useRouter();
  const { id: jobId } = router.query;

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const chromeKey = chrome || 'seeker';
  const activeNav = 'jobs';

  const [job, setJob] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  const [applicationId, setApplicationId] = useState(null);

  const [resumes, setResumes] = useState([]);
  const [covers, setCovers] = useState([]);

  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [selectedCoverId, setSelectedCoverId] = useState(null);

  const [answers, setAnswers] = useState({});
  const [consent, setConsent] = useState({
    termsAccepted: false,
    emailUpdatesAccepted: false,
    signatureName: '',
  });
  const [selfId, setSelfId] = useState({
    genderIdentity: '',
    raceEthnicity: '',
    veteranStatus: '',
    disabilityStatus: '',
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load job + template + user resumes/covers
  useEffect(() => {
    let active = true;

    async function run() {
      if (!jobId) return;
      setLoading(true);
      setError('');

      try {
        // Job is required for the page. Template/docs should NOT hard-fail the UI.
        const jobRes = await fetch(`/api/jobs/${jobId}`);
        if (!jobRes.ok) throw new Error('Failed to load job');
        const jobJson = await jobRes.json();
        if (!active) return;

        // Some APIs return { job: {...} } — accept both
        const normalizedJob = jobJson?.job ? jobJson.job : jobJson;
        setJob(normalizedJob);

        // Template: optional
        let tplJson = { steps: [] };
        try {
          const tplRes = await fetch(
            `/api/apply/template?jobId=${encodeURIComponent(jobId)}`
          );
          if (tplRes.ok) tplJson = await tplRes.json();
        } catch {
          // ignore
        }
        if (!active) return;
        setTemplate(tplJson);

        // ✅ Documents: use the endpoint that returns BOTH resumes + covers
        let docsJson = null;
        try {
          const docsRes = await fetch('/api/apply/documents');
          if (docsRes.ok) docsJson = await docsRes.json();
          else setError((prev) => prev || 'Failed to load resumes.');
        } catch {
          setError((prev) => prev || 'Failed to load resumes.');
        }

        if (!active) return;

        const resumeList = extractList(docsJson, ['resumes', 'resume', 'list']);
        const coverList = extractList(docsJson, ['covers', 'cover', 'list']);

        setResumes(resumeList);
        setCovers(coverList);

        const primaryResume =
          resumeList.find((r) => r && r.isPrimary) || resumeList[0];
        const primaryCover =
          coverList.find((c) => c && c.isPrimary) || null;

        setSelectedResumeId(primaryResume ? primaryResume.id : null);
        setSelectedCoverId(primaryCover ? primaryCover.id : null);

        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.log('[Apply] documents loaded:', {
            resumes: resumeList?.length || 0,
            covers: coverList?.length || 0,
            raw: docsJson,
          });
        }
      } catch (e) {
        if (!active) return;
        setError(e?.message || 'Something went wrong loading the application.');
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [jobId]);

  // ✅ merge jobQuestions (root) + template step questions into one list
  const additionalQuestions = useMemo(() => {
    const jobQs = Array.isArray(template?.jobQuestions) ? template.jobQuestions : [];
    const tplSteps = template?.steps || [];
    const tplQs = tplSteps.flatMap((s) => s?.questions || []);
    return mergeQuestions(jobQs, tplQs);
  }, [template]);

  // ✅ step order REQUIRED: Documents → Self-ID → Additional Questions → Consent → Review
  const steps = useMemo(() => {
    const hasAdditional = (additionalQuestions || []).length > 0;

    return [
      { key: 'documents', title: 'Your documents' },
      { key: 'selfid', title: 'Voluntary self-identification (optional)' },
      ...(hasAdditional
        ? [
            {
              key: 'additional',
              title: 'Additional questions',
              questions: additionalQuestions,
            },
          ]
        : []),
      { key: 'consent', title: 'Consent & acknowledgement' },
      { key: 'review', title: 'Review & submit' },
    ];
  }, [additionalQuestions]);

  const currentStep = steps[stepIndex] || steps[0];

  const companyName = job?.company || 'Employer';
  const jobTitle = job?.title || 'Role';
  const pageTitle = job ? `Apply - ${jobTitle} at ${companyName}` : 'Apply';

  // ✅ internal if accountKey exists (or fallbacks)
  const isInternal = isInternalJob(job);

  const canContinue = useMemo(() => {
    if (loading || saving) return false;
    if (!job || !isInternal) return false;

    if (currentStep.key === 'documents') {
      return !!selectedResumeId;
    }

    if (currentStep.key === 'selfid') return true;

    if (currentStep.key === 'consent') {
      if (!consent.termsAccepted) return false;
      if (!consent.signatureName || consent.signatureName.trim().length < 2) return false;
      return true;
    }

    if (currentStep.key === 'additional') {
      const questions = currentStep.questions || [];
      for (const q of questions) {
        if (!q.required) continue;
        const v = answers[q.key];
        const ok =
          v !== undefined &&
          v !== null &&
          !(typeof v === 'string' && v.trim() === '') &&
          !(Array.isArray(v) && v.length === 0);
        if (!ok) return false;
      }
      return true;
    }

    if (currentStep.key === 'review') {
      if (!selectedResumeId) return false;
      if (!consent.termsAccepted) return false;
      if (!consent.signatureName || consent.signatureName.trim().length < 2) return false;

      const allQs = additionalQuestions || [];
      for (const q of allQs) {
        if (!q.required) continue;
        const v = answers[q.key];
        const ok =
          v !== undefined &&
          v !== null &&
          !(typeof v === 'string' && v.trim() === '') &&
          !(Array.isArray(v) && v.length === 0);
        if (!ok) return false;
      }
      return true;
    }

    return false;
  }, [
    loading,
    saving,
    job,
    isInternal,
    currentStep,
    selectedResumeId,
    answers,
    consent,
    additionalQuestions,
  ]);

  async function ensureApplicationDraft() {
    if (applicationId) return applicationId;

    const res = await fetch(`/api/apply/application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: Number(jobId),
        resumeId: selectedResumeId != null ? coerceId(selectedResumeId) : null,
        coverId: selectedCoverId != null ? coerceId(selectedCoverId) : null,
      }),
    });

    if (!res.ok) {
      const j = await safeJson(res);
      throw new Error(j?.error || 'Failed to start application.');
    }

    const json = await res.json();
    setApplicationId(json.id);
    return json.id;
  }

  async function saveCurrentStep() {
    setSaving(true);
    setError('');

    try {
      const appId = await ensureApplicationDraft();

      if (currentStep.key === 'documents') {
        const res = await fetch(`/api/apply/application`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: appId,
            resumeId: selectedResumeId != null ? coerceId(selectedResumeId) : null,
            coverId: selectedCoverId != null ? coerceId(selectedCoverId) : null,
          }),
        });

        if (!res.ok) {
          const j = await safeJson(res);
          throw new Error(j?.error || 'Failed to save document selection.');
        }
        return;
      }

      if (currentStep.key === 'consent') {
        const res = await fetch(`/api/apply/consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: appId,
            termsAccepted: !!consent.termsAccepted,
            emailUpdatesAccepted: !!consent.emailUpdatesAccepted,
            signatureName: consent.signatureName || '',
          }),
        });

        if (!res.ok) {
          const j = await safeJson(res);
          throw new Error(j?.error || 'Failed to save consent.');
        }
        return;
      }

      if (currentStep.key === 'selfid') {
        const res = await fetch(`/api/apply/selfid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: appId,
            ...selfId,
          }),
        });

        if (!res.ok) {
          const j = await safeJson(res);
          throw new Error(j?.error || 'Failed to save self-identification.');
        }
        return;
      }

      if (currentStep.key === 'additional') {
        const questions = currentStep.questions || [];
        const payloadAnswers = questions.map((q) => ({
          questionKey: q.key,
          value: answers[q.key] ?? null,
        }));

        const res = await fetch(`/api/apply/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: appId,
            answers: payloadAnswers,
          }),
        });

        if (!res.ok) {
          const j = await safeJson(res);
          throw new Error(j?.error || 'Failed to save answers.');
        }
        return;
      }

      if (currentStep.key === 'review') {
        const res = await fetch(`/api/apply/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: appId }),
        });

        if (!res.ok) {
          const j = await safeJson(res);
          throw new Error(j?.error || 'Failed to submit application.');
        }

        router.push(withChrome(`/job/${jobId}?applied=1`));
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    if (!canContinue) return;
    try {
      await saveCurrentStep();
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    } catch (e) {
      setError(e?.message || 'Failed to continue.');
    }
  }

  async function handleBack() {
    setError('');
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  if (!loading && job && !isInternal) {
    return (
      <main className="min-h-screen" style={{ padding: 24, background: '#F5F7FA' }}>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border p-6">
          <h1 className="text-xl font-bold mb-2">Apply on the employer site</h1>
          <p className="text-sm text-slate-600">
            This posting is not an internal ForgeTomorrow application. You'll apply on the employer's site.
          </p>
          <div className="mt-4">
            <Link href={withChrome(`/job/${jobId}`)} style={{ color: ORANGE }} className="underline">
              Back to posting
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const HeaderBox = (
    <section
      aria-label="Application header"
      className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm"
    >
      <div className="text-xs uppercase tracking-wide text-gray-500">Application</div>
      <h1 className="text-2xl md:text-3xl font-bold text-orange-600 mt-1">
        {loading ? 'Loading…' : `Apply to ${jobTitle}`}
      </h1>
      <p className="text-sm md:text-base text-gray-600 mt-2 max-w-3xl mx-auto">
        {companyName}
      </p>
      <div className="mt-3">
        <Link
          href={withChrome(`/job/${jobId}`)}
          className="text-sm inline-flex items-center gap-2"
          style={{ color: ORANGE, textDecoration: 'underline' }}
        >
          <span aria-hidden="true">←</span>
          <span>Back to posting</span>
        </Link>
      </div>
      {error && (
        <div
          className="mt-4 text-sm rounded-xl border px-3 py-2"
          style={{
            borderColor: 'rgba(255,112,67,0.6)',
            color: '#B91C1C',
            background: 'rgba(255,112,67,0.10)',
          }}
        >
          {error}
        </div>
      )}
    </section>
  );

  const RightColumn = (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        className="rounded-2xl border shadow-lg p-4"
        style={{
          borderColor: 'rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.86)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="text-xs uppercase tracking-wide text-slate-500">Job posting</div>
        <div className="text-slate-900 font-bold mt-1">{jobTitle}</div>
        <div className="text-sm text-slate-600">{companyName}</div>

        {job?.location && (
          <div className="mt-3 text-xs text-slate-600">📍 {job.location}</div>
        )}

        <div className="mt-4 text-sm text-slate-800 leading-relaxed max-h-[60vh] overflow-auto pr-1">
          {job?.description ? (
            <div dangerouslySetInnerHTML={{ __html: job.description }} />
          ) : (
            <div className="text-slate-500">Job description not available.</div>
          )}
        </div>
      </div>

      <div
        className="rounded-xl border p-3"
        style={{
          borderColor: 'rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="text-xs text-slate-600">
          Step {Math.min(stepIndex + 1, steps.length)} of {steps.length}
        </div>
      </div>
    </div>
  );

  return (
    <SeekerLayout
      title={pageTitle}
      header={HeaderBox}
      right={RightColumn}
      activeNav={activeNav}
    >
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <div
        className="w-full"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          padding: 20,
          display: 'grid',
          gap: 16,
        }}
      >
        {loading ? (
          <div className="text-slate-700 text-sm">Loading application…</div>
        ) : (
          <>
            <WizardStepList steps={steps} stepIndex={stepIndex} />

            <div className="mt-2">
              {currentStep.key === 'documents' && (
                <DocumentsStep
                  resumes={resumes}
                  covers={covers}
                  selectedResumeId={selectedResumeId}
                  setSelectedResumeId={setSelectedResumeId}
                  selectedCoverId={selectedCoverId}
                  setSelectedCoverId={setSelectedCoverId}
                />
              )}

              {currentStep.key === 'selfid' && (
                <SelfIdStep selfId={selfId} setSelfId={setSelfId} />
              )}

              {currentStep.key === 'additional' && (
                <AdditionalQuestionsStep
                  questions={currentStep.questions || []}
                  answers={answers}
                  setAnswers={setAnswers}
                />
              )}

              {currentStep.key === 'consent' && (
                <ConsentStep consent={consent} setConsent={setConsent} />
              )}

              {currentStep.key === 'review' && (
                <ReviewStep
                  job={job}
                  resumes={resumes}
                  covers={covers}
                  selectedResumeId={selectedResumeId}
                  selectedCoverId={selectedCoverId}
                  consent={consent}
                  selfId={selfId}
                  answers={answers}
                  additionalQuestions={additionalQuestions}
                />
              )}
            </div>

            <div
              className="pt-4 mt-2 border-t flex items-center justify-between gap-3"
              style={{ borderColor: 'rgba(0,0,0,0.08)' }}
            >
              <button
                type="button"
                onClick={handleBack}
                disabled={stepIndex === 0 || saving}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(0,0,0,0.10)',
                  color: '#334155',
                  opacity: stepIndex === 0 || saving ? 0.5 : 1,
                  cursor: stepIndex === 0 || saving ? 'default' : 'pointer',
                }}
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canContinue}
                className="px-5 py-2 rounded-full text-sm font-semibold shadow-md"
                style={{
                  backgroundColor: canContinue ? ORANGE : 'rgba(148,163,184,0.35)',
                  color: canContinue ? '#FFFFFF' : '#475569',
                  cursor: canContinue ? 'pointer' : 'default',
                }}
              >
                {saving ? 'Saving…' : currentStep.key === 'review' ? 'Submit application' : 'Continue'}
              </button>
            </div>
          </>
        )}
      </div>
    </SeekerLayout>
  );
}

function WizardStepList({ steps, stepIndex }) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s, idx) => {
        const active = idx === stepIndex;
        const done = idx < stepIndex;
        return (
          <button
            key={`${s.key}:${idx}`}
            type="button"
            disabled
            className="text-xs px-3 py-1 rounded-full border"
            style={{
              borderColor: active ? 'rgba(255,112,67,0.75)' : 'rgba(0,0,0,0.10)',
              background: active ? 'rgba(255,112,67,0.12)' : 'rgba(255,255,255,0.60)',
              color: active ? '#9A3412' : done ? '#334155' : '#475569',
              cursor: 'default',
              opacity: 1,
            }}
            title={s.title}
          >
            {s.title}
          </button>
        );
      })}
    </div>
  );
}

function DocumentsStep({
  resumes,
  covers,
  selectedResumeId,
  setSelectedResumeId,
  selectedCoverId,
  setSelectedCoverId,
}) {
  return (
    <div className="space-y-4">
      <div className="text-slate-900 font-semibold">Choose what you're applying with</div>
      <div className="text-sm text-slate-600">
        We won't make you retype your resume. Pick an existing resume and (optionally) a cover letter.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.75)' }}
        >
          <div className="text-sm font-semibold text-slate-900 mb-2">Resume (required)</div>
          <select
            value={selectedResumeId ?? ''}
            onChange={(e) => setSelectedResumeId(coerceId(e.target.value))}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.12)' }}
          >
            <option value="">Select a resume…</option>
            {(resumes || []).map((r) => (
              <option key={String(r.id)} value={String(r.id)}>
                {r.name}
                {r.isPrimary ? ' (Primary)' : ''}
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-500 mt-2">
            Tip: keep a "Primary" resume set on your profile for faster applications.
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.75)' }}
        >
          <div className="text-sm font-semibold text-slate-900 mb-2">Cover letter (optional)</div>
          <select
            value={selectedCoverId ?? ''}
            onChange={(e) => setSelectedCoverId(coerceId(e.target.value))}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.12)' }}
          >
            <option value="">No cover letter</option>
            {(covers || []).map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.name}
                {c.isPrimary ? ' (Primary)' : ''}
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-500 mt-2">
            Cover letters are kept separate from your resume so recruiters can use them as a quick introduction.
          </div>
        </div>
      </div>
    </div>
  );
}

function AdditionalQuestionsStep({ questions, answers, setAnswers }) {
  function setValue(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="text-slate-900 font-semibold">Additional questions</div>
      <div className="text-sm text-slate-600">
        In addition to the standard application, this position includes a small number of questions from the employer.
        These must be completed before submitting your application.
      </div>

      {questions.length === 0 ? (
        <div className="text-sm text-slate-600">No additional questions for this position.</div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <QuestionField
              key={q.key}
              q={q}
              value={answers[q.key]}
              onChange={(v) => setValue(q.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionField({ q, value, onChange }) {
  const required = !!q.required;

  const commonLabel = (
    <div className="mb-1">
      <div className="text-sm font-semibold text-slate-900">
        {q.label} {required && <span style={{ color: ORANGE }}>*</span>}
      </div>
      {q.helpText && <div className="text-xs text-slate-500 mt-1">{q.helpText}</div>}
    </div>
  );

  const inputStyle = {
    width: '100%',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid rgba(0,0,0,0.12)',
  };

  const cardStyle = {
    borderColor: 'rgba(0,0,0,0.10)',
    background: 'rgba(255,255,255,0.75)',
  };

  if (q.type === 'TEXT') {
    return (
      <div className="rounded-xl border p-4" style={cardStyle}>
        {commonLabel}
        <input
          value={typeof value === 'string' ? value : value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      </div>
    );
  }

  if (q.type === 'TEXTAREA') {
    return (
      <div className="rounded-xl border p-4" style={cardStyle}>
        {commonLabel}
        <textarea
          value={typeof value === 'string' ? value : value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          style={inputStyle}
        />
      </div>
    );
  }

  if (q.type === 'NUMBER') {
    return (
      <div className="rounded-xl border p-4" style={cardStyle}>
        {commonLabel}
        <input
          type="number"
          value={typeof value === 'number' ? value : value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          style={inputStyle}
        />
      </div>
    );
  }

  if (q.type === 'DATE') {
    return (
      <div className="rounded-xl border p-4" style={cardStyle}>
        {commonLabel}
        <input
          type="date"
          value={typeof value === 'string' ? value : value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      </div>
    );
  }

  if (q.type === 'BOOLEAN') {
    const boolVal = typeof value === 'boolean' ? value : false;
    return (
      <div className="rounded-xl border p-4 flex items-center justify-between gap-3" style={cardStyle}>
        <div>{commonLabel}</div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-900">
          <input type="checkbox" checked={!!boolVal} onChange={(e) => onChange(e.target.checked)} />
          Yes
        </label>
      </div>
    );
  }

  if (q.type === 'SELECT') {
    const opts = Array.isArray(q.options) ? q.options : q.options?.options || q.options || [];
    return (
      <div className="rounded-xl border p-4" style={cardStyle}>
        {commonLabel}
        <select
          value={typeof value === 'string' ? value : value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select…</option>
          {(opts || []).map((o) => (
            <option key={String(o)} value={String(o)}>
              {String(o)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (q.type === 'MULTISELECT') {
    const opts = Array.isArray(q.options) ? q.options : q.options?.options || q.options || [];
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="rounded-xl border p-4" style={cardStyle}>
        {commonLabel}
        <div className="flex flex-wrap gap-2">
          {(opts || []).map((o) => {
            const key = String(o);
            const selected = arr.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (selected) onChange(arr.filter((x) => x !== key));
                  else onChange([...arr, key]);
                }}
                className="text-xs px-3 py-1 rounded-full border"
                style={{
                  borderColor: selected ? 'rgba(255,112,67,0.75)' : 'rgba(0,0,0,0.10)',
                  background: selected ? 'rgba(255,112,67,0.10)' : 'rgba(255,255,255,0.70)',
                  color: selected ? '#9A3412' : '#334155',
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4" style={cardStyle}>
      {commonLabel}
      <input
        value={typeof value === 'string' ? value : value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

function ConsentStep({ consent, setConsent }) {
  return (
    <div className="space-y-4">
      <div className="text-slate-900 font-semibold">Consent & acknowledgement</div>
      <div className="text-sm text-slate-600">
        This confirms you're submitting this application intentionally and agree to be contacted about this role.
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.75)' }}
      >
        <label className="inline-flex items-start gap-3 text-sm text-slate-900">
          <input
            type="checkbox"
            checked={!!consent.termsAccepted}
            onChange={(e) => setConsent((prev) => ({ ...prev, termsAccepted: e.target.checked }))}
            style={{ marginTop: 3 }}
          />
          <span>
            I confirm the information I'm submitting is accurate, and I consent to being contacted about this application.
          </span>
        </label>

        <div className="mt-3">
          <label className="inline-flex items-start gap-3 text-sm text-slate-900">
            <input
              type="checkbox"
              checked={!!consent.emailUpdatesAccepted}
              onChange={(e) =>
                setConsent((prev) => ({ ...prev, emailUpdatesAccepted: e.target.checked }))
              }
              style={{ marginTop: 3 }}
            />
            <span>I would like email updates about my application status. (optional)</span>
          </label>
          <div className="text-xs text-slate-500 mt-1 ml-6">
            You can still be contacted about this role even if you opt out of status updates.
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold text-slate-900 mb-1">Signature (full name)</div>
          <input
            value={consent.signatureName || ''}
            onChange={(e) => setConsent((prev) => ({ ...prev, signatureName: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.12)' }}
            placeholder="Type your full name"
          />
          <div className="text-xs text-slate-500 mt-2">
            This acts as your electronic signature for this submission.
          </div>
        </div>
      </div>
    </div>
  );
}

function SelfIdStep({ selfId, setSelfId }) {
  const genderOptions = [
    { value: '', label: 'Decline to answer' },
    { value: 'Female', label: 'Female' },
    { value: 'Male', label: 'Male' },
    { value: 'Non-binary', label: 'Non-binary' },
    { value: 'Another identity', label: 'Another identity' },
  ];

  const raceEthnicityOptions = [
    { value: '', label: 'Decline to answer' },
    { value: 'Hispanic or Latino', label: 'Hispanic or Latino' },
    { value: 'White (Not Hispanic or Latino)', label: 'White (Not Hispanic or Latino)' },
    {
      value: 'Black or African American (Not Hispanic or Latino)',
      label: 'Black or African American (Not Hispanic or Latino)',
    },
    { value: 'Asian (Not Hispanic or Latino)', label: 'Asian (Not Hispanic or Latino)' },
    {
      value: 'Native Hawaiian or Other Pacific Islander (Not Hispanic or Latino)',
      label: 'Native Hawaiian or Other Pacific Islander (Not Hispanic or Latino)',
    },
    {
      value: 'American Indian or Alaska Native (Not Hispanic or Latino)',
      label: 'American Indian or Alaska Native (Not Hispanic or Latino)',
    },
    {
      value: 'Two or More Races (Not Hispanic or Latino)',
      label: 'Two or More Races (Not Hispanic or Latino)',
    },
  ];

  const veteranOptions = [
    { value: '', label: 'Decline to answer' },
    { value: 'I am not a protected veteran', label: 'I am not a protected veteran' },
    { value: 'I am a protected veteran', label: 'I am a protected veteran' },
  ];

  const disabilityOptions = [
    { value: '', label: 'Decline to answer' },
    { value: 'Yes, I have a disability', label: 'Yes, I have a disability' },
    { value: 'No, I do not have a disability', label: 'No, I do not have a disability' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-slate-900 font-semibold">Voluntary self-identification (optional)</div>

      <div className="text-sm text-slate-600">
  Some employers ask these questions to meet U.S. reporting requirements. Your answers are voluntary.
  You can decline to answer any question and still continue your application.
  Your responses are not visible to recruiters or hiring managers and are used only for aggregated compliance reporting.
</div>


      <DisclosureCard
        title="What this is (and what it is not)"
        items={[
          'Optional: you may decline to answer any or all items.',
          'Used for compliance reporting, not to determine hiring decisions.',
          'Employers may store this information in hiring records as required.',
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniLinkCard
          title="Disability (Section 503)"
          desc="Voluntary self-identification of disability."
          href={SELF_ID_LINKS.disability503}
        />
        <MiniLinkCard
          title="Veteran (VEVRAA)"
          desc="Voluntary veteran status disclosure."
          href={SELF_ID_LINKS.vevraa}
        />
        <MiniLinkCard
          title="Race/Ethnicity (EEOC)"
          desc="Applicant race and ethnicity categories."
          href={SELF_ID_LINKS.eeocRace}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Gender identity"
          value={selfId.genderIdentity}
          onChange={(v) => setSelfId((p) => ({ ...p, genderIdentity: v }))}
          options={genderOptions}
          helper="Optional. Choose “Decline to answer” to skip."
        />

        <SelectField
          label="Race / ethnicity"
          value={selfId.raceEthnicity}
          onChange={(v) => setSelfId((p) => ({ ...p, raceEthnicity: v }))}
          options={raceEthnicityOptions}
          helper="Optional. Categories follow common EEOC-style reporting."
        />

        <SelectField
          label="Veteran status"
          value={selfId.veteranStatus}
          onChange={(v) => setSelfId((p) => ({ ...p, veteranStatus: v }))}
          options={veteranOptions}
          helper="Optional. Some employers are required to offer this disclosure."
        />

        <SelectField
          label="Disability status"
          value={selfId.disabilityStatus}
          onChange={(v) => setSelfId((p) => ({ ...p, disabilityStatus: v }))}
          options={disabilityOptions}
          helper="Optional. This is a voluntary self-identification."
        />
      </div>

      <div className="text-xs text-slate-500">
        Note: If you choose “Decline to answer,” ForgeTomorrow records that you skipped the item.
      </div>
    </div>
  );
}

function DisclosureCard({ title, items = [] }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: 'rgba(0,0,0,0.10)',
        background: 'rgba(255,255,255,0.75)',
      }}
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <ul className="mt-2 space-y-1 text-sm text-slate-700 list-disc pl-5">
        {(items || []).map((t, idx) => (
          <li key={idx}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function MiniLinkCard({ title, desc, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl border p-4 block hover:shadow-sm transition"
      style={{
        borderColor: 'rgba(0,0,0,0.10)',
        background: 'rgba(255,255,255,0.75)',
        textDecoration: 'none',
      }}
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="text-xs text-slate-600 mt-1">{desc}</div>
      <div className="text-xs mt-3" style={{ color: ORANGE, textDecoration: 'underline' }}>
        View official form
      </div>
    </a>
  );
}

function SelectField({ label, value, onChange, options = [], helper }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.75)' }}
    >
      <div className="text-sm font-semibold text-slate-900 mb-1">{label}</div>
      {helper && <div className="text-xs text-slate-500 mb-2">{helper}</div>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.12)' }}
      >
        {(options || []).map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {String(o.label)}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReviewStep({
  job,
  resumes,
  covers,
  selectedResumeId,
  selectedCoverId,
  consent,
  selfId,
  answers,
  additionalQuestions,
}) {
  const resume = (resumes || []).find((r) => String(r.id) === String(selectedResumeId));
  const cover = (covers || []).find((c) => String(c.id) === String(selectedCoverId));

  const hasAnySelfId = Boolean(
    String(selfId?.genderIdentity || '').trim() ||
      String(selfId?.raceEthnicity || '').trim() ||
      String(selfId?.veteranStatus || '').trim() ||
      String(selfId?.disabilityStatus || '').trim()
  );

  return (
    <div className="space-y-4">
      <div className="text-slate-900 font-semibold">Review</div>
      <div className="text-sm text-slate-600">
        Confirm everything looks right. When you submit, the recruiter receives your selected resume/cover and your responses.
      </div>

      {/* Documents */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.75)' }}
      >
        <div className="text-sm text-slate-900 font-semibold">Documents</div>
        <div className="text-sm text-slate-700 mt-1">
          Resume: <span className="text-slate-900">{resume?.name || 'Not selected'}</span>
        </div>
        <div className="text-sm text-slate-700">
          Cover: <span className="text-slate-900">{cover?.name || 'None'}</span>
        </div>
      </div>

      {/* Voluntary self-identification (always show - if empty show "Declined to answer") */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.75)' }}
      >
        <div className="text-sm text-slate-900 font-semibold">Voluntary self-identification</div>

        {!hasAnySelfId ? (
          <div className="text-sm text-slate-700 mt-1">
            <span className="text-slate-900">Declined to answer</span>
          </div>
        ) : (
          <>
            {selfId?.genderIdentity && (
              <div className="text-sm text-slate-700 mt-1">
                Gender identity:{' '}
                <span className="text-slate-900">{selfId.genderIdentity}</span>
              </div>
            )}
            {selfId?.raceEthnicity && (
              <div className="text-sm text-slate-700">
                Race / ethnicity:{' '}
                <span className="text-slate-900">{selfId.raceEthnicity}</span>
              </div>
            )}
            {selfId?.veteranStatus && (
              <div className="text-sm text-slate-700">
                Veteran status:{' '}
                <span className="text-slate-900">{selfId.veteranStatus}</span>
              </div>
            )}
            {selfId?.disabilityStatus && (
              <div className="text-sm text-slate-700">
                Disability status:{' '}
                <span className="text-slate-900">{selfId.disabilityStatus}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Additional questions (responses) */}
      {(additionalQuestions || []).length > 0 && (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.75)' }}
        >
          <div className="text-sm text-slate-900 font-semibold">Employer additional questions</div>
          <div className="mt-2 space-y-2">
            {(additionalQuestions || []).map((q) => {
              const v = answers[q.key];
              const shown = Array.isArray(v) ? v.join(', ') : v ?? '';
              return (
                <div key={q.key} className="text-sm text-slate-700">
                  <span className="text-slate-900 font-semibold">{q.label}:</span> {String(shown)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consent MUST be last */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.75)' }}
      >
        <div className="text-sm text-slate-900 font-semibold">Consent</div>
        <div className="text-sm text-slate-700 mt-1">
          Accepted: <span className="text-slate-900">{consent.termsAccepted ? 'Yes' : 'No'}</span>
        </div>
        <div className="text-sm text-slate-700">
          Status updates:{' '}
          <span className="text-slate-900">{consent.emailUpdatesAccepted ? 'Yes' : 'No'}</span>
        </div>
        <div className="text-sm text-slate-700">
          Signature: <span className="text-slate-900">{consent.signatureName || '-'}</span>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Job: {job?.title} at {job?.company}
      </div>
    </div>
  );
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
