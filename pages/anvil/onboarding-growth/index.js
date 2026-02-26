// pages/anvil/onboarding-growth/index.js
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { usePlan } from '@/context/PlanContext';
import SeekerLayout from '@/components/layouts/SeekerLayout';

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

// Tiers that get unlimited access
function isPaidTier(tier) {
  const t = String(tier || '').toUpperCase();
  return t === 'PRO' || t === 'COACH' || t === 'SMALL_BIZ' || t === 'ENTERPRISE';
}

const FREE_LIFETIME_LIMIT = 1;

export default function OnboardingGrowthStartPage() {
  const router = useRouter();
  const { isLoaded: planLoaded, tier } = usePlan();

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // ── FREE tier usage state ─────────────────────────────────────────────
  const [usageLoading, setUsageLoading] = useState(true);
  const [freeUsesCount, setFreeUsesCount] = useState(0);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // Load resumes
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoadingResumes(true);
        setError('');

        const res = await fetch('/api/resume/list', { method: 'GET' });
        const data = await res.json().catch(() => ({}));

        if (!active) return;

        if (!res.ok) throw new Error(data?.error || 'Failed to load resumes.');

        const list = Array.isArray(data?.resumes) ? data.resumes : [];
        setResumes(list);

        const primary = list.find((r) => r?.isPrimary);
        if (primary?.id) setSelectedResumeId(String(primary.id));
        else if (list?.[0]?.id) setSelectedResumeId(String(list[0].id));
      } catch (e) {
        if (!active) return;
        setResumes([]);
        setSelectedResumeId('');
        setError(e?.message || 'Failed to load resumes.');
      } finally {
        if (active) setLoadingResumes(false);
      }
    })();

    return () => { active = false; };
  }, []);

  // ── Load FREE usage count (only needed for free users) ───────────────
  // We fetch from /api/auth/me which already returns the user record
  // including growthPivotFreeUses. We wait for plan to load first.
  useEffect(() => {
    if (!planLoaded) return;

    // Paid users don't need a usage check
    if (isPaidTier(tier)) {
      setUsageLoading(false);
      return;
    }

    let active = true;

    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        const count = Number(data?.user?.growthPivotFreeUses || 0);
        setFreeUsesCount(count);
      } catch {
        // Non-fatal — default to 0, API will enforce the real limit
        if (active) setFreeUsesCount(0);
      } finally {
        if (active) setUsageLoading(false);
      }
    })();

    return () => { active = false; };
  }, [planLoaded, tier]);

  // ── Derived gate state ────────────────────────────────────────────────
  const isFree = planLoaded && !isPaidTier(tier);
  const freeExhausted = isFree && freeUsesCount >= FREE_LIFETIME_LIMIT;
  const hasNoResume = !loadingResumes && resumes.length === 0;

  // FREE users must create a resume before they can use this tool.
  // This ensures we have the data to generate a quality plan.
  const resumeGateBlocks = isFree && hasNoResume;

  const canGenerate = useMemo(
    () => !!selectedResumeId && !generating && !freeExhausted,
    [selectedResumeId, generating, freeExhausted]
  );

  const Header = (
    <section
      aria-label="Onboarding and growth header"
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Plan Growth &amp; Pivots
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 820 }}>
        Turn your resume into a 30/60/90 plan plus a 12-month trajectory. Use it to ramp in a new role,
        grow in your current one, or pivot into what's next.
      </p>
    </section>
  );

  const onGenerate = async () => {
    if (!selectedResumeId) {
      setError('Please select a resume.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/anvil/onboarding-growth/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResumeId }),
      });

      const data = await res.json().catch(() => ({}));

      // ── Handle free limit reached (could happen if two tabs open) ────
      if (res.status === 403 && data?.error === 'free_limit_reached') {
        setFreeUsesCount(FREE_LIFETIME_LIMIT);
        throw new Error(data?.message || 'Free plan limit reached.');
      }

      if (!res.ok) throw new Error(data?.error || 'Failed to generate plan');

      const id = String(data?.planId || data?.roadmapId || '').trim();
      if (!id) throw new Error('Plan generated, but missing planId.');

      // Bump local count so UI reflects use immediately on return
      if (isFree) setFreeUsesCount((c) => c + 1);

      const params = new URLSearchParams();
      params.set('planId', id);
      params.set('roadmapId', id);
      if (chrome) params.set('chrome', chrome);

      router.push(`/anvil/onboarding-growth/results?${params.toString()}`);
    } catch (e) {
      setError(e?.message || 'Failed to generate plan.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Loading state (wait for plan + usage) ────────────────────────────
  const isPageLoading = !planLoaded || loadingResumes || usageLoading;

  return (
    <>
      <Head>
        <title>Plan Growth & Pivots | ForgeTomorrow</title>
      </Head>

      <SeekerLayout
        title="Plan Growth & Pivots | ForgeTomorrow"
        header={Header}
        right={null}
        activeNav={null}
      >
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

            {isPageLoading ? (
              <div style={{ padding: 18, textAlign: 'center', color: '#4A5568' }}>
                Loading…
              </div>

            ) : freeExhausted ? (
              // ── FREE LIMIT REACHED ──────────────────────────────────────
              <div
                style={{
                  background: 'rgba(255, 112, 67, 0.06)',
                  border: '1px solid rgba(255, 112, 67, 0.25)',
                  borderRadius: 12,
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
                <h2 style={{ margin: '0 0 8px', color: '#112033', fontSize: 18, fontWeight: 800 }}>
                  You've used your free Growth & Pivot plan
                </h2>
                <p style={{ margin: '0 0 6px', color: '#607D8B', fontSize: 14 }}>
                  Free accounts get <strong>1 lifetime plan</strong> to get you started.
                </p>
                <p style={{ margin: '0 0 20px', color: '#607D8B', fontSize: 14 }}>
                  Upgrade to <strong>PRO</strong> for unlimited plans, updated any time your situation changes.
                </p>
                <button
                  onClick={() => router.push('/settings?tab=billing')}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 28px',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Upgrade to PRO
                </button>
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => router.push(withChrome('/anvil'))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#607D8B',
                      fontSize: 13,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Back to The Anvil
                  </button>
                </div>
              </div>

            ) : resumeGateBlocks ? (
              // ── FREE USER — NO RESUME YET ───────────────────────────────
              // Free users must build a resume first so we have the data
              // needed to generate a quality plan.
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                <p className="text-orange-800 font-semibold text-base mb-1">
                  You need a resume before you can use this tool.
                </p>
                <p className="text-orange-700 text-sm mb-4">
                  Growth & Pivot uses your resume to build a personalized plan.
                  Create one first so we have everything we need.
                </p>
                <button
                  onClick={() => router.push(withChrome('/resume/create'))}
                  className="bg-[#FF7043] text-white px-6 py-3 rounded-lg hover:bg-[#F4511E] transition font-semibold"
                >
                  Build My Resume
                </button>
              </div>

            ) : (
              // ── MAIN FORM ───────────────────────────────────────────────
              <div className="space-y-5">

                {/* FREE tier usage indicator */}
                {isFree && (
                  <div
                    style={{
                      background: 'rgba(255, 112, 67, 0.06)',
                      border: '1px solid rgba(255, 112, 67, 0.20)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: '#607D8B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#FF7043' }}>
                      Free plan:
                    </span>
                    {freeUsesCount === 0
                      ? '1 free lifetime plan available — make it count!'
                      : `${freeUsesCount} / ${FREE_LIFETIME_LIMIT} free plan used.`}
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-2" htmlFor="resumeSelect">
                    Select Resume
                  </label>
                  <select
                    id="resumeSelect"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Choose a resume…</option>
                    {resumes.map((r) => (
                      <option key={String(r.id)} value={String(r.id)}>
                        {r.name || r.title || `Resume ${r.id}`}
                        {r?.isPrimary ? ' (Primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div
                    style={{
                      color: '#B91C1C',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      padding: 12,
                      borderRadius: 10,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  onClick={onGenerate}
                  disabled={!canGenerate}
                  className="w-full bg-[#FF7043] text-white text-lg font-bold py-4 rounded-lg hover:bg-[#F4511E] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating your plan…' : 'Generate My Plan'}
                </button>

                <div className="text-xs text-gray-500 text-center">
                  Uses your stored resume and saves results to your account history.
                </div>
              </div>
            )}

          </div>
        </div>
      </SeekerLayout>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}