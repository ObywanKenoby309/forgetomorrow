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

function Card({ title, children }) {
  return (
    <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
      <h2 style={{ fontWeight: 800, marginBottom: 10 }}>{title}</h2>
      {children}
    </section>
  );
}

function List({ items }) {
  if (!items || items.length === 0) return <div style={{ color: '#64748B' }}>—</div>;
  return (
    <ul style={{ display: 'grid', gap: 6, paddingLeft: 18, listStyleType: 'disc' }}>
      {items.map((it, i) => (
        <li key={i} style={{ color: '#475569' }}>{it}</li>
      ))}
    </ul>
  );
}

export default function OnboardingGrowthResultsPage() {
  const router = useRouter();

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const roadmapId = String(router.query.roadmapId || '');

  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState('');

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  useEffect(() => {
    let active = true;

    (async () => {
      if (!roadmapId) {
        setLoading(false);
        setError('Missing roadmapId.');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/roadmap/onboarding-growth/get?roadmapId=${encodeURIComponent(roadmapId)}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || 'Failed to load roadmap');

        if (!active) return;
        setRoadmap(data?.roadmap || null);
      } catch (e) {
        if (!active) return;
        setError(e?.message || 'Failed to load roadmap.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [roadmapId]);

  const plan = useMemo(() => roadmap?.data || null, [roadmap]);

  const Header = (
    <section
      aria-label="Onboarding and growth results header"
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
            Your 30/60/90 Roadmap
          </h1>
          <div style={{ color: '#607D8B', marginTop: 4 }}>
            {roadmap?.createdAt ? `Generated: ${new Date(roadmap.createdAt).toLocaleString()}` : ''}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push(withChrome('/roadmap/onboarding-growth'))}
            style={{
              background: 'white',
              border: '1px solid #ddd',
              padding: '10px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Analyze another resume
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <>
      <Head>
        <title>30/60/90 Roadmap | ForgeTomorrow</title>
      </Head>

      <SeekerLayout title="30/60/90 Roadmap | ForgeTomorrow" header={Header} right={null} activeNav={null}>
        <div className="w-full max-w-4xl mx-auto">
          {loading && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center" style={{ color: '#475569' }}>
              Loading your roadmap…
            </div>
          )}

          {!loading && error && (
            <div style={{ color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', padding: 14, borderRadius: 12 }}>
              {error}
            </div>
          )}

          {!loading && !error && plan && (
            <div style={{ display: 'grid', gap: 16 }}>
              <Card title="Summary">
                <div style={{ fontWeight: 800 }}>{plan?.meta?.candidate || 'Candidate'}</div>
                <div style={{ color: '#607D8B', marginTop: 4 }}>{plan?.meta?.headline || ''}</div>
                <div style={{ marginTop: 8, color: '#475569' }}>
                  <span style={{ fontWeight: 800 }}>Scenario:</span> {plan?.meta?.scenario || '—'}
                </div>

                {Array.isArray(plan?.meta?.missingInfo) && plan.meta.missingInfo.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Missing info that would improve accuracy</div>
                    <List items={plan.meta.missingInfo} />
                  </div>
                )}
              </Card>

              <Card title="First 30 Days">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Objectives</div>
                    <List items={plan?.day30?.objectives} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Actions</div>
                    <List items={plan?.day30?.actions} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Metrics</div>
                    <List items={plan?.day30?.metrics} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Quick Wins</div>
                    <List items={plan?.day30?.quickWins} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Risks</div>
                    <List items={plan?.day30?.risks} />
                  </div>
                  {plan?.day30?.presentation ? (
                    <div style={{ color: '#475569' }}>
                      <div style={{ fontWeight: 800, marginBottom: 6 }}>Presentation</div>
                      {plan.day30.presentation}
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card title="Days 31–60">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Objectives</div>
                    <List items={plan?.day60?.objectives} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Actions</div>
                    <List items={plan?.day60?.actions} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Metrics</div>
                    <List items={plan?.day60?.metrics} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Quick Wins</div>
                    <List items={plan?.day60?.quickWins} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Risks</div>
                    <List items={plan?.day60?.risks} />
                  </div>
                  {plan?.day60?.presentation ? (
                    <div style={{ color: '#475569' }}>
                      <div style={{ fontWeight: 800, marginBottom: 6 }}>Presentation</div>
                      {plan.day60.presentation}
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card title="Days 61–90">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Objectives</div>
                    <List items={plan?.day90?.objectives} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Actions</div>
                    <List items={plan?.day90?.actions} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Metrics</div>
                    <List items={plan?.day90?.metrics} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Quick Wins</div>
                    <List items={plan?.day90?.quickWins} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Risks</div>
                    <List items={plan?.day90?.risks} />
                  </div>
                  {plan?.day90?.presentation ? (
                    <div style={{ color: '#475569' }}>
                      <div style={{ fontWeight: 800, marginBottom: 6 }}>Presentation</div>
                      {plan.day90.presentation}
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card title="12-Month Trajectory">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Growth Path</div>
                    <List items={plan?.month12?.growthPath} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Promotion Signals</div>
                    <List items={plan?.month12?.promotionSignals} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Portfolio Proof</div>
                    <List items={plan?.month12?.portfolioProof} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Pivot Options</div>
                    <List items={plan?.month12?.pivotOptions} />
                  </div>
                </div>
              </Card>

              <Card title="Recommendations">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Skills Focus</div>
                    <List items={plan?.recommendations?.skillsFocus} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Credibility Builders</div>
                    <List items={plan?.recommendations?.credibilityBuilders} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Networking Moves</div>
                    <List items={plan?.recommendations?.networkingMoves} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>ForgeTomorrow Tools</div>
                    <List items={plan?.recommendations?.toolsToUseOnForgeTomorrow} />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </SeekerLayout>
    </>
  );
}
