// pages/roadmap/onboarding-growth/index.js

import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
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

export default function OnboardingGrowthStartPage() {
  const router = useRouter();

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoadingResumes(true);
        setError('');

        // ✅ FIX: correct endpoint
        const res = await fetch('/api/resume/list', { method: 'GET' });
        const data = await res.json().catch(() => ({}));

        if (!active) return;

        if (!res.ok) throw new Error(data?.error || 'Failed to load resumes.');

        const list = Array.isArray(data?.resumes) ? data.resumes : [];
        setResumes(list);

        const primary = list.find((r) => r?.isPrimary);
        if (primary?.id) setSelectedResumeId(String(primary.id));
      } catch (e) {
        if (!active) return;
        setResumes([]);
        setSelectedResumeId('');
        setError(e?.message || 'Failed to load resumes.');
      } finally {
        if (active) setLoadingResumes(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const canGenerate = useMemo(
    () => !!selectedResumeId && !generating,
    [selectedResumeId, generating]
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
        grow in your current one, or pivot into what’s next.
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
      const res = await fetch('/api/roadmap/onboarding-growth/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResumeId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to generate roadmap');

      const roadmapId = String(data?.roadmapId || '').trim();
      if (!roadmapId) throw new Error('Roadmap generated, but missing roadmapId.');

      const params = new URLSearchParams();
      params.set('roadmapId', roadmapId);
      if (chrome) params.set('chrome', chrome);

      router.push(`/roadmap/onboarding-growth/results?${params.toString()}`);
    } catch (e) {
      setError(e?.message || 'Failed to generate roadmap.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Plan Growth & Pivots | ForgeTomorrow</title>
      </Head>

      <SeekerLayout title="Plan Growth & Pivots | ForgeTomorrow" header={Header} right={null} activeNav={null}>
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            {loadingResumes ? (
              <div style={{ padding: 18, textAlign: 'center', color: '#4A5568' }}>
                Loading resumes…
              </div>
            ) : resumes.length === 0 ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <p className="text-orange-800 font-medium">No resumes found. Please create one first.</p>
                <button
                  onClick={() => router.push(withChrome('/resume/create'))}
                  className="mt-4 bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
                >
                  Open Resume Builder
                </button>
              </div>
            ) : (
              <div className="space-y-5">
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
                  {generating ? 'Generating your plan…' : 'Generate My Roadmap'}
                </button>

                <div className="text-xs text-gray-500 text-center">
                  Uses your stored resume (DB) and saves results to your account history.
                </div>
              </div>
            )}
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
