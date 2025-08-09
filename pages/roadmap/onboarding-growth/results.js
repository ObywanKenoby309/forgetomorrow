// pages/roadmap/onboarding-growth/results.js
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useContext, useEffect, useMemo, useState } from 'react';
import SeekerSidebar from '../../../components/SeekerSidebar';
import { ResumeContext } from '../../../context/ResumeContext';
import { generateOnboardingPlan } from '../../../utils/onboardingGrowthMock';

// TEMP: plan stub + usage decrement pulled from the selector for now
import { recordAnalysis } from '../../../components/resume/ResumeSelector';

export default function OnboardingGrowthResultsPage() {
  const router = useRouter();
  const { resumeId } = router.query;
  const userPlan = 'free'; // TODO: wire to real plan/entitlement

  const { resumes = [] } = useContext(ResumeContext);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  // Find resume by id or by "resume-<index>" fallback
  const selectedResume = useMemo(() => {
    if (!resumes || resumes.length === 0 || !resumeId) return null;

    // Try direct id match first
    const direct = resumes.find((r) => String(r?.id) === String(resumeId));
    if (direct) return direct;

    // Fallback: if resumeId looks like "resume-<n>", treat <n> as index
    if (String(resumeId).startsWith('resume-')) {
      const idx = Number(String(resumeId).split('resume-')[1]);
      if (!Number.isNaN(idx) && resumes[idx]) return resumes[idx];
    }

    // Last resort: try title match (not ideal, prevents crash)
    return resumes.find((r) => (r?.title || r?.name) === resumeId) || null;
  }, [resumes, resumeId]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!selectedResume) {
        setLoading(false);
        if (resumes.length > 0) setError('Selected resume not found.');
        return;
      }
      try {
        setLoading(true);
        const result = await generateOnboardingPlan(selectedResume);
        if (!active) return;
        setPlan(result);

        // Decrement usage after a successful generation
        recordAnalysis(userPlan);
      } catch (e) {
        if (!active) return;
        setError('Failed to generate plan. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedResume, userPlan, resumes.length]);

  const goBack = () => router.push('/roadmap/onboarding-growth/select');

  return (
    <>
      <Head>
        <title>Onboarding & Growth Results | ForgeTomorrow</title>
      </Head>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px minmax(0, 1fr) 300px',
          gap: '20px',
          padding: '120px 20px 20px',
          minHeight: '100vh',
          backgroundColor: '#ECEFF1',
        }}
      >
        <SeekerSidebar />

        <main
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '32px',
            maxWidth: '1000px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <button
              onClick={goBack}
              style={{
                background: 'transparent',
                border: '1px solid #ddd',
                padding: '8px 14px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              ← Back to selection
            </button>
          </div>

          <h1
            style={{
              color: '#FF7043',
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '8px',
            }}
          >
            Your 30/60/90 Onboarding & Growth Plan
          </h1>

          {loading && (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              Generating your personalized roadmap…
            </div>
          )}

          {error && !loading && (
            <div style={{ color: 'red', padding: '16px', border: '1px solid #f5c2c7', borderRadius: 8 }}>
              {error}
            </div>
          )}

          {!loading && !error && plan && (
            <div style={{ display: 'grid', gap: 24 }}>
              <header style={{ borderBottom: '1px solid #eee', paddingBottom: 12 }}>
                <div style={{ color: '#4A5568' }}>
                  Generated: {new Date(plan.meta.generatedAt).toLocaleString()}
                </div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{plan.meta.candidate}</div>
                <div style={{ color: '#4A5568', marginTop: 2 }}>{plan.meta.headline}</div>
              </header>

              <Section title="First 30 Days" data={plan.day30} />
              <Section title="Days 31–60" data={plan.day60} />
              <Section title="Days 61–90" data={plan.day90} />

              <Card title="Growth Recommendations">
                <List items={plan.growthRecommendations} />
              </Card>

              <Card title="Skills Focus">
                <List items={plan.skillsFocus} />
              </Card>

              {/* Placeholder: later we’ll add PDF/Text export */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  onClick={() => alert('Download coming soon')}
                  style={{
                    backgroundColor: '#FF7043',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Download
                </button>
                <button
                  onClick={goBack}
                  style={{
                    backgroundColor: 'white',
                    color: '#333',
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                  }}
                >
                  Analyze another resume
                </button>
              </div>
            </div>
          )}
        </main>

        <aside
          style={{
            backgroundColor: '#ECEFF1',
            borderRadius: '8px',
            width: '300px',
          }}
        />
      </div>
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
        {data.quickWins && (
          <Block subtitle="Quick Wins">
            <List items={data.quickWins} />
          </Block>
        )}
      </TwoCol>
      {data.risks && (
        <Block subtitle="Risks">
          <List items={data.risks} />
        </Block>
      )}
      {data.presentation && (
        <Block subtitle="Presentation">
          <p style={{ color: '#4A5568' }}>{data.presentation}</p>
        </Block>
      )}
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
      <h2 style={{ fontWeight: 700, marginBottom: 8 }}>{title}</h2>
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
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{subtitle}</div>
      {children}
    </div>
  );
}

function List({ items }) {
  if (!items || items.length === 0) {
    return <p style={{ color: '#4A5568' }}>—</p>;
  }
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
