// pages/roadmap/onboarding-growth/results.js
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

export default function OnboardingGrowthResultsPage() {
  const router = useRouter();
  const resumeId = String(router.query.resumeId || '');
  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  const Header = (
    <section
      aria-label="Onboarding and growth results header"
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
        Your 30/60/90 Plan
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        A practical roadmap to ramp fast, prove value, and grow or pivot intentionally.
      </p>
    </section>
  );

  const backToSelectionHref = useMemo(() => {
    const params = new URLSearchParams();
    if (chrome) params.set('chrome', chrome);
    return `/roadmap/onboarding-growth/select${params.toString() ? `?${params.toString()}` : ''}`;
  }, [chrome]);

  useEffect(() => {
    let active = true;

    (async () => {
      if (!resumeId) return;

      try {
        setLoading(true);
        setError('');
        setPlan(null);

        const res = await fetch('/api/roadmap/onboarding-growth/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to generate plan');

        if (!active) return;
        setPlan(data?.plan || null);
      } catch (e) {
        if (!active) return;
        setError(e?.message || 'Failed to generate plan. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [resumeId]);

  const goBack = () => router.push(backToSelectionHref);

  return (
    <>
      <Head>
        <title>Onboarding and Growth Results | ForgeTomorrow</title>
      </Head>

      <SeekerLayout
        title="Onboarding and Growth Results | ForgeTomorrow"
        header={Header}
        right={null}
        activeNav={null}
      >
        <div className="w-full max-w-5xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={goBack}
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              ← Back to selection
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            {!resumeId ? (
              <div className="text-center py-10">
                <div className="text-gray-800 font-semibold">Missing resumeId.</div>
                <button
                  onClick={goBack}
                  className="mt-4 bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
                >
                  Go back
                </button>
              </div>
            ) : loading ? (
              <div className="text-center py-10 text-gray-700">
                Generating your personalized roadmap...
              </div>
            ) : error ? (
              <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">
                {error}
              </div>
            ) : !plan ? (
              <div className="text-center py-10 text-gray-700">
                No plan returned. Please try again.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 18 }}>
                <header style={{ borderBottom: '1px solid #eee', paddingBottom: 12 }}>
                  <div style={{ color: '#4A5568' }}>
                    Generated: {plan?.meta?.generatedAt ? new Date(plan.meta.generatedAt).toLocaleString() : 'Now'}
                  </div>
                  {plan?.meta?.candidate ? (
                    <div style={{ fontWeight: 700, marginTop: 4 }}>{plan.meta.candidate}</div>
                  ) : null}
                  {plan?.meta?.headline ? (
                    <div style={{ color: '#4A5568', marginTop: 2 }}>{plan.meta.headline}</div>
                  ) : null}
                </header>

                <Section title="First 30 Days" data={plan.day30} />
                <Section title="Days 31 to 60" data={plan.day60} />
                <Section title="Days 61 to 90" data={plan.day90} />

                <Card title="Growth Recommendations">
                  <List items={plan.growthRecommendations} />
                </Card>

                <Card title="Skills Focus">
                  <List items={plan.skillsFocus} />
                </Card>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => alert('Download coming soon')}
                    className="bg-[#FF7043] text-white px-5 py-3 rounded-lg hover:bg-[#F4511E] transition font-semibold"
                  >
                    Download
                  </button>

                  <button
                    onClick={goBack}
                    className="bg-white border border-gray-300 px-5 py-3 rounded-lg hover:bg-gray-50 transition font-semibold"
                  >
                    Analyze another resume
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}

function Section({ title, data }) {
  if (!data) return null;
  return (
    <Card title={title}>
      <TwoCol>
        <Block subtitle="Objectives">
          <List items={data.objectives} />
        </Block>
        <Block subtitle="Actions">
          <List items={data.actions} />
        </Block>
      </TwoCol>

      <TwoCol>
        <Block subtitle="Metrics">
          <List items={data.metrics} />
        </Block>
        {data.quickWins ? (
          <Block subtitle="Quick Wins">
            <List items={data.quickWins} />
          </Block>
        ) : null}
      </TwoCol>

      {data.risks ? (
        <Block subtitle="Risks">
          <List items={data.risks} />
        </Block>
      ) : null}

      {data.presentation ? (
        <Block subtitle="Presentation">
          <p style={{ color: '#4A5568' }}>{data.presentation}</p>
        </Block>
      ) : null}
    </Card>
  );
}

function Card({ title, children }) {
  return (
    <section
      style={{
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        background: 'white',
      }}
    >
      <h2 style={{ fontWeight: 800, marginBottom: 8 }}>{title}</h2>
      {children}
    </section>
  );
}

function TwoCol({ children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

function Block({ subtitle, children }) {
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{subtitle}</div>
      {children}
    </div>
  );
}

function List({ items }) {
  if (!items || items.length === 0) return <p style={{ color: '#4A5568' }}>-</p>;
  return (
    <ul style={{ display: 'grid', gap: 6, paddingLeft: 18, listStyleType: 'disc' }}>
      {items.map((it, i) => (
        <li key={i} style={{ color: '#4A5568' }}>
          {it}
        </li>
      ))}
    </ul>
  );
}
