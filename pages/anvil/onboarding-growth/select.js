// pages/anvil/onboarding-growth/select.js
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

export default function OnboardingGrowthResumeSelectorPage() {
  const router = useRouter();

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch('/api/resume/list');
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data?.error || 'Failed to load resumes');

        if (!active) return;

        const list = Array.isArray(data?.resumes) ? data.resumes : [];
        setResumes(list);

        const primary = list.find((r) => r?.isPrimary);
        if (primary?.id) setSelectedResumeId(String(primary.id));
        else if (list?.[0]?.id) setSelectedResumeId(String(list[0].id));
      } catch (e) {
        if (!active) return;
        setError(e?.message || 'Failed to load resumes');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const primaryResume = useMemo(() => {
    if (!Array.isArray(resumes)) return null;
    return resumes.find((r) => r?.isPrimary) || null;
  }, [resumes]);

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
      <h1
        style={{
          margin: 0,
          color: '#FF7043',
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Plan Growth and Pivots
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Turn your resume into a clear 30/60/90 plan to level up in your current track
        or pivot into your next role.
      </p>
    </section>
  );

  const goNext = async () => {
    if (!selectedResumeId) {
      setError('Please select a resume.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      // ✅ CANONICAL GENERATE ENDPOINT
      const res = await fetch('/api/anvil/onboarding-growth/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: String(selectedResumeId) }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to generate plan');

      const id = String(data?.planId || data?.roadmapId || '').trim();
      if (!id) throw new Error('Plan generated, but missing planId.');

      const params = new URLSearchParams();
      params.set('planId', id);
      params.set('roadmapId', id);
      if (chrome) params.set('chrome', chrome);

      router.push(`/anvil/onboarding-growth/results?${params.toString()}`);
    } catch (e) {
      setError(e?.message || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Select Resume | Onboarding and Growth | ForgeTomorrow</title>
      </Head>

      <SeekerLayout
        title="Select Resume | Onboarding and Growth | ForgeTomorrow"
        header={Header}
        right={null}
        activeNav={null}
      >
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            {loading ? (
              <div className="text-center py-6 text-gray-700">Loading resumes...</div>
            ) : (
              <>
                {error ? (
                  <div className="text-red-600 font-medium mb-4">{error}</div>
                ) : null}

                {resumes.length === 0 ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                    <p className="text-orange-800 font-medium">
                      No resumes found. Please create one first.
                    </p>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (chrome) params.set('chrome', chrome);
                        router.push(`/resume/create${params.toString() ? `?${params.toString()}` : ''}`);
                      }}
                      className="mt-4 bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
                    >
                      Open Resume Builder
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {primaryResume ? (
                      <div className="text-sm text-gray-700">
                        Primary resume detected: <span className="font-semibold">{primaryResume.name}</span>
                      </div>
                    ) : null}

                    <div>
                      <label htmlFor="resume" className="block text-sm font-semibold text-gray-800 mb-2">
                        Select Your Resume
                      </label>
                      <select
                        id="resume"
                        value={selectedResumeId}
                        onChange={(e) => {
                          setError('');
                          setSelectedResumeId(e.target.value);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7043] focus:border-transparent"
                      >
                        <option value="">Choose a resume...</option>
                        {resumes.map((r) => {
                          const id = String(r?.id ?? '');
                          const label = r?.name || `Resume ${id}`;
                          const dt = r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : '';
                          const primary = r?.isPrimary ? ' (Primary)' : '';
                          return (
                            <option key={id} value={id}>
                              {label}{primary}{dt ? ` • ${dt}` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <button
                      onClick={goNext}
                      disabled={!selectedResumeId || generating}
                      className="w-full bg-[#FF7043] text-white text-lg font-semibold py-4 rounded-lg hover:bg-[#F4511E] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generating ? 'Generating your plan…' : 'Next'}
                    </button>

                    <p className="text-xs text-gray-600 text-center">
                      Plans are saved to your account so you can revisit them later.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
