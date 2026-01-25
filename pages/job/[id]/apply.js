// pages/job/[id]/apply.js
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const ORANGE = '#FF7043';

export default function JobApplyPage() {
  const router = useRouter();
  const { id: jobId } = router.query;

  const [job, setJob] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  const [applicationId, setApplicationId] = useState(null);

  const [resumes, setResumes] = useState([]);
  const [covers, setCovers] = useState([]);

  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [selectedCoverId, setSelectedCoverId] = useState(null);

  // answers keyed by questionKey -> value (Json)
  const [answers, setAnswers] = useState({});
  const [consent, setConsent] = useState({
    termsAccepted: false,
    emailUpdatesAccepted: false, // optional
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
        const [jobRes, tplRes, docsRes] = await Promise.all([
          fetch(`/api/jobs/${jobId}`),
          fetch(`/api/apply/template?jobId=${encodeURIComponent(jobId)}`),
          fetch(`/api/apply/documents`),
        ]);

        if (!jobRes.ok) throw new Error('Failed to load job');
        if (!tplRes.ok) throw new Error('Failed to load application template');
        if (!docsRes.ok) throw new Error('Failed to load resumes/covers');

        const jobJson = await jobRes.json();
        const tplJson = await tplRes.json();
        const docsJson = await docsRes.json();

        if (!active) return;

        setJob(jobJson);
        setTemplate(tplJson);

        setResumes(docsJson.resumes || []);
        setCovers(docsJson.covers || []);

        // auto-pick primary if present
        const primaryResume =
          (docsJson.resumes || []).find(r => r.isPrimary) || (docsJson.resumes || [])[0];
        const primaryCover =
          (docsJson.covers || []).find(c => c.isPrimary) || null;

        setSelectedResumeId(primaryResume ? primaryResume.id : null);
        setSelectedCoverId(primaryCover ? primaryCover.id : null);
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

  const steps = useMemo(() => {
    const tplSteps = template?.steps || [];
    return [
      { key: 'documents', title: 'Your documents' },
      ...tplSteps.map(s => ({ key: `tpl:${s.key}`, title: s.title, step: s })),
      { key: 'consent', title: 'Consent & acknowledgement' },
      { key: 'selfid', title: 'Voluntary self-identification (optional)' },
      { key: 'review', title: 'Review & submit' },
    ];
  }, [template]);

  const currentStep = steps[stepIndex] || steps[0];

  const companyName = job?.company || 'Employer';
  const jobTitle = job?.title || 'Role';
  const pageTitle = job ? `Apply — ${jobTitle} at ${companyName}` : 'Apply';

  const isInternal = String(job?.origin || '').toLowerCase() === 'internal';

  // --- Validation rules for "Continue"
  const canContinue = useMemo(() => {
    if (loading || saving) return false;
    if (!job || !isInternal) return false;

    if (currentStep.key === 'documents') {
      return !!selectedResumeId; // cover optional
    }

    if (currentStep.key.startsWith('tpl:')) {
      const step = currentStep.step;
      const questions = step?.questions || [];
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

    if (currentStep.key === 'consent') {
      if (!consent.termsAccepted) return false;
      if (!consent.signatureName || consent.signatureName.trim().length < 2) return false;
      return true;
    }

    if (currentStep.key === 'selfid') {
      return true;
    }

    if (currentStep.key === 'review') {
      if (!selectedResumeId) return false;
      if (!consent.termsAccepted) return false;
      if (!consent.signatureName || consent.signatureName.trim().length < 2) return false;

      const tplSteps = template?.steps || [];
      for (const s of tplSteps) {
        for (const q of s.questions || []) {
          if (!q.required) continue;
          const v = answers[q.key];
          const ok =
            v !== undefined &&
            v !== null &&
            !(typeof v === 'string' && v.trim() === '') &&
            !(Array.isArray(v) && v.length === 0);
          if (!ok) return false;
        }
      }
      return true;
    }

    return false;
  }, [loading, saving, job, isInternal, currentStep, selectedResumeId, answers, consent, template]);

  // Create or update the Application record (draft)
  async function ensureApplicationDraft() {
    if (applicationId) return applicationId;

    const res = await fetch(`/api/apply/application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: Number(jobId),
        resumeId: selectedResumeId ? Number(selectedResumeId) : null,
        coverId: selectedCoverId ? Number(selectedCoverId) : null,
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
        // update resume/cover selection on Application
        const res = await fetch(`/api/apply/application`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: appId,
            resumeId: selectedResumeId ? Number(selectedResumeId) : null,
            coverId: selectedCoverId ? Number(selectedCoverId) : null,
          }),
        });

        if (!res.ok) {
          const j = await safeJson(res);
          throw new Error(j?.error || 'Failed to save document selection.');
        }
        return;
      }

      if (currentStep.key.startsWith('tpl:')) {
        const step = currentStep.step;
        const questions = step?.questions || [];
        const payloadAnswers = questions.map(q => ({
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

      if (currentStep.key === 'consent') {
        const res = await fetch(`/api/apply/consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: appId,
            termsAccepted: !!consent.termsAccepted,
            emailUpdatesAccepted: !!consent.emailUpdatesAccepted, // optional
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

        router.push(`/job/${jobId}?applied=1`);
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
      setStepIndex(i => Math.min(i + 1, steps.length - 1));
    } catch (e) {
      setError(e?.message || 'Failed to continue.');
    }
  }

  async function handleBack() {
    setError('');
    setStepIndex(i => Math.max(i - 1, 0));
  }

  // External/scraped job guard
  if (!loading && job && !isInternal) {
    return (
      <main className="min-h-screen" style={{ padding: 24, background: '#F5F7FA' }}>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border p-6">
          <h1 className="text-xl font-bold mb-2">Apply on the employer site</h1>
          <p className="text-sm text-slate-600">
            This posting is not an internal ForgeTomorrow application. You’ll apply on the employer’s site.
          </p>
          <div className="mt-4">
            <Link href={`/job/${jobId}`} style={{ color: ORANGE }} className="underline">
              Back to posting
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <main
        className="min-h-screen"
        style={{
          padding: '28px 16px 40px',
          background: 'radial-gradient(circle at top, #112033 0, #050910 55%, #020308 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <Link
              href={`/job/${jobId}`}
              className="text-sm inline-flex items-center gap-2"
              style={{ color: ORANGE }}
            >
              <span aria-hidden="true">←</span>
              <span>Back to posting</span>
            </Link>

            <div className="text-xs text-slate-300">
              {companyName} • {jobTitle}
            </div>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left - wizard */}
            <section className="lg:col-span-2">
              <div
                className="rounded-2xl border shadow-lg overflow-hidden"
                style={{
                  borderColor: 'rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {/* Header */}
                <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-300">Application</div>
                      <h1 className="text-xl font-extrabold text-white mt-1">
                        {loading ? 'Loading…' : `Apply to ${jobTitle}`}
                      </h1>
                      <div className="text-sm text-slate-300 mt-1">{companyName}</div>
                    </div>

                    <div className="text-xs text-slate-300">
                      Step {Math.min(stepIndex + 1, steps.length)} of {steps.length}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="mt-4 text-sm text-slate-200">
                    Please complete all mandatory sections of each form to continue. You can go back at any time.
                    Optional fields are appreciated, but never required.
                  </div>

                  {error && (
                    <div
                      className="mt-3 text-sm rounded-xl border px-3 py-2"
                      style={{
                        borderColor: 'rgba(255,112,67,0.6)',
                        color: '#FFCCBC',
                        background: 'rgba(0,0,0,0.18)',
                      }}
                    >
                      {error}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5">
                  {loading ? (
                    <div className="text-slate-200 text-sm">Loading application…</div>
                  ) : (
                    <>
                      <WizardStepList
                        steps={steps}
                        stepIndex={stepIndex}
                        onJump={(idx) => setStepIndex(idx)}
                      />

                      <div className="mt-5">
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

                        {currentStep.key.startsWith('tpl:') && (
                          <TemplateStep
                            step={currentStep.step}
                            answers={answers}
                            setAnswers={setAnswers}
                          />
                        )}

                        {currentStep.key === 'consent' && (
                          <ConsentStep consent={consent} setConsent={setConsent} />
                        )}

                        {currentStep.key === 'selfid' && (
                          <SelfIdStep selfId={selfId} setSelfId={setSelfId} />
                        )}

                        {currentStep.key === 'review' && (
                          <ReviewStep
                            job={job}
                            resumes={resumes}
                            covers={covers}
                            selectedResumeId={selectedResumeId}
                            selectedCoverId={selectedCoverId}
                            consent={consent}
                            answers={answers}
                            template={template}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div
                  className="p-5 border-t flex items-center justify-between gap-3"
                  style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                >
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={stepIndex === 0 || saving}
                    className="px-4 py-2 rounded-full text-sm font-semibold"
                    style={{
                      background: 'rgba(255,255,255,0.10)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      color: '#E2E8F0',
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
                      color: canContinue ? '#FFFFFF' : '#CBD5E1',
                      cursor: canContinue ? 'pointer' : 'default',
                    }}
                  >
                    {saving ? 'Saving…' : currentStep.key === 'review' ? 'Submit application' : 'Continue'}
                  </button>
                </div>
              </div>
            </section>

            {/* Right rail - job description */}
            <aside className="lg:col-span-1">
              <div
                className="rounded-2xl border shadow-lg p-4 sticky top-6"
                style={{
                  borderColor: 'rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="text-xs uppercase tracking-wide text-slate-300">Job posting</div>
                <div className="text-white font-bold mt-1">{jobTitle}</div>
                <div className="text-sm text-slate-300">{companyName}</div>

                <div className="mt-3 text-xs text-slate-300">{job?.location ? `📍 ${job.location}` : ''}</div>

                <div className="mt-4 text-sm text-slate-100 leading-relaxed max-h-[60vh] overflow-auto pr-1">
                  {job?.description ? (
                    <div dangerouslySetInnerHTML={{ __html: job.description }} />
                  ) : (
                    <div className="text-slate-300">Job description not available.</div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

function WizardStepList({ steps, stepIndex, onJump }) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s, idx) => {
        const active = idx === stepIndex;
        const done = idx < stepIndex;
        return (
          <button
            key={`${s.key}:${idx}`}
            type="button"
            onClick={() => onJump(idx)}
            className="text-xs px-3 py-1 rounded-full border"
            style={{
              borderColor: active ? 'rgba(255,112,67,0.75)' : 'rgba(255,255,255,0.14)',
              background: active ? 'rgba(255,112,67,0.12)' : 'rgba(0,0,0,0.10)',
              color: active ? '#FFCCBC' : done ? '#E2E8F0' : '#CBD5E1',
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
      <div className="text-white font-semibold">Choose what you’re applying with</div>
      <div className="text-sm text-slate-200">
        We won’t make you retype your resume. Pick an existing resume and (optionally) a cover letter.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
        >
          <div className="text-sm font-semibold text-white mb-2">Resume (required)</div>
          <select
            value={selectedResumeId || ''}
            onChange={(e) => setSelectedResumeId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.90)' }}
          >
            <option value="">Select a resume…</option>
            {(resumes || []).map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.isPrimary ? ' (Primary)' : ''}
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-300 mt-2">
            Tip: keep a “Primary” resume set on your profile for faster applications.
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
        >
          <div className="text-sm font-semibold text-white mb-2">Cover letter (optional)</div>
          <select
            value={selectedCoverId || ''}
            onChange={(e) => setSelectedCoverId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.90)' }}
          >
            <option value="">No cover letter</option>
            {(covers || []).map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isPrimary ? ' (Primary)' : ''}
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-300 mt-2">
            Cover letters are kept separate from your resume so recruiters can use them as a quick introduction.
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateStep({ step, answers, setAnswers }) {
  const questions = step?.questions || [];

  function setValue(key, value) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="text-white font-semibold">{step?.title || 'Questions'}</div>

      {questions.length === 0 ? (
        <div className="text-sm text-slate-200">No questions in this section.</div>
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
      <div className="text-sm font-semibold text-white">
        {q.label} {required && <span style={{ color: '#FFCCBC' }}>*</span>}
      </div>
      {q.helpText && <div className="text-xs text-slate-300 mt-1">{q.helpText}</div>}
    </div>
  );

  const inputStyle = {
    width: '100%',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    background: 'rgba(255,255,255,0.90)',
  };

  if (q.type === 'TEXT') {
    return (
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
        {commonLabel}
        <input
          value={typeof value === 'string' ? value : (value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      </div>
    );
  }

  if (q.type === 'TEXTAREA') {
    return (
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
        {commonLabel}
        <textarea
          value={typeof value === 'string' ? value : (value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          style={inputStyle}
        />
      </div>
    );
  }

  if (q.type === 'NUMBER') {
    return (
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
        {commonLabel}
        <input
          type="number"
          value={typeof value === 'number' ? value : (value ?? '')}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          style={inputStyle}
        />
      </div>
    );
  }

  if (q.type === 'DATE') {
    return (
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
        {commonLabel}
        <input
          type="date"
          value={typeof value === 'string' ? value : (value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      </div>
    );
  }

  if (q.type === 'BOOLEAN') {
    const boolVal = typeof value === 'boolean' ? value : false;
    return (
      <div
        className="rounded-xl border p-4 flex items-center justify-between gap-3"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
        <div>{commonLabel}</div>
        <label className="inline-flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            checked={!!boolVal}
            onChange={(e) => onChange(e.target.checked)}
          />
          Yes
        </label>
      </div>
    );
  }

  if (q.type === 'SELECT') {
    const opts = Array.isArray(q.options) ? q.options : (q.options?.options || q.options || []);
    return (
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
        {commonLabel}
        <select
          value={typeof value === 'string' ? value : (value ?? '')}
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
    const opts = Array.isArray(q.options) ? q.options : (q.options?.options || q.options || []);
    const arr = Array.isArray(value) ? value : [];
    return (
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
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
                  if (selected) onChange(arr.filter(x => x !== key));
                  else onChange([...arr, key]);
                }}
                className="text-xs px-3 py-1 rounded-full border"
                style={{
                  borderColor: selected ? 'rgba(255,112,67,0.75)' : 'rgba(255,255,255,0.14)',
                  background: selected ? 'rgba(255,112,67,0.12)' : 'rgba(0,0,0,0.10)',
                  color: selected ? '#FFCCBC' : '#E2E8F0',
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

  // fallback
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
    >
      {commonLabel}
      <input
        value={typeof value === 'string' ? value : (value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

function ConsentStep({ consent, setConsent }) {
  return (
    <div className="space-y-4">
      <div className="text-white font-semibold">Consent & acknowledgement</div>
      <div className="text-sm text-slate-200">
        This confirms you’re submitting this application intentionally and agree to be contacted about this role.
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
        <label className="inline-flex items-start gap-3 text-sm text-white">
          <input
            type="checkbox"
            checked={!!consent.termsAccepted}
            onChange={(e) => setConsent(prev => ({ ...prev, termsAccepted: e.target.checked }))}
            style={{ marginTop: 3 }}
          />
          <span>
            I confirm the information I’m submitting is accurate, and I consent to being contacted about this application.
          </span>
        </label>

        <div className="mt-3">
          <label className="inline-flex items-start gap-3 text-sm text-white">
            <input
              type="checkbox"
              checked={!!consent.emailUpdatesAccepted}
              onChange={(e) => setConsent(prev => ({ ...prev, emailUpdatesAccepted: e.target.checked }))}
              style={{ marginTop: 3 }}
            />
            <span>I would like email updates about my application status. (optional)</span>
          </label>
          <div className="text-xs text-slate-300 mt-1 ml-6">
            You can still be contacted about this role even if you opt out of status updates.
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold text-white mb-1">Signature (full name)</div>
          <input
            value={consent.signatureName || ''}
            onChange={(e) => setConsent(prev => ({ ...prev, signatureName: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.90)' }}
            placeholder="Type your full name"
          />
          <div className="text-xs text-slate-300 mt-2">
            This acts as your electronic signature for this submission.
          </div>
        </div>
      </div>
    </div>
  );
}

function SelfIdStep({ selfId, setSelfId }) {
  return (
    <div className="space-y-4">
      <div className="text-white font-semibold">Voluntary self-identification (optional)</div>
      <div className="text-sm text-slate-200">
        This section is optional. You can skip it. If provided, it may help organizations meet reporting requirements.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Gender identity"
          value={selfId.genderIdentity}
          onChange={(v) => setSelfId(p => ({ ...p, genderIdentity: v }))}
        />
        <Field
          label="Race / ethnicity"
          value={selfId.raceEthnicity}
          onChange={(v) => setSelfId(p => ({ ...p, raceEthnicity: v }))}
        />
        <Field
          label="Veteran status"
          value={selfId.veteranStatus}
          onChange={(v) => setSelfId(p => ({ ...p, veteranStatus: v }))}
        />
        <Field
          label="Disability status"
          value={selfId.disabilityStatus}
          onChange={(v) => setSelfId(p => ({ ...p, disabilityStatus: v }))}
        />
      </div>

      <div className="text-xs text-slate-300">
        Note: For MVP, this is plain text. Later we can convert to standardized options per region/org.
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
    >
      <div className="text-sm font-semibold text-white mb-1">{label}</div>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{ background: 'rgba(255,255,255,0.90)' }}
      />
    </div>
  );
}

function ReviewStep({ job, resumes, covers, selectedResumeId, selectedCoverId, consent, answers, template }) {
  const resume = (resumes || []).find(r => r.id === selectedResumeId);
  const cover = (covers || []).find(c => c.id === selectedCoverId);

  return (
    <div className="space-y-4">
      <div className="text-white font-semibold">Review</div>
      <div className="text-sm text-slate-200">
        Confirm everything looks right. When you submit, the recruiter receives your selected resume/cover and your responses.
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
        <div className="text-sm text-white font-semibold">Documents</div>
        <div className="text-sm text-slate-200 mt-1">
          Resume: <span className="text-white">{resume?.name || 'Not selected'}</span>
        </div>
        <div className="text-sm text-slate-200">
          Cover: <span className="text-white">{cover?.name || 'None'}</span>
        </div>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
        <div className="text-sm text-white font-semibold">Consent</div>
        <div className="text-sm text-slate-200 mt-1">
          Accepted: <span className="text-white">{consent.termsAccepted ? 'Yes' : 'No'}</span>
        </div>
        <div className="text-sm text-slate-200">
          Status updates: <span className="text-white">{consent.emailUpdatesAccepted ? 'Yes' : 'No'}</span>
        </div>
        <div className="text-sm text-slate-200">
          Signature: <span className="text-white">{consent.signatureName || '—'}</span>
        </div>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}
      >
        <div className="text-sm text-white font-semibold">Your responses</div>
        <div className="mt-2 space-y-2">
          {(template?.steps || [])
            .flatMap(s => (s.questions || []).map(q => ({ q })))
            .map(({ q }) => {
              const v = answers[q.key];
              const shown = Array.isArray(v) ? v.join(', ') : (v ?? '');
              return (
                <div key={q.key} className="text-sm text-slate-200">
                  <span className="text-white font-semibold">{q.label}:</span> {String(shown)}
                </div>
              );
            })}
        </div>
      </div>

      <div className="text-xs text-slate-300">
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
