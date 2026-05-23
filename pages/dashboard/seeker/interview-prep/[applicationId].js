// pages/dashboard/seeker/interview-prep/[applicationId].js
//
// Seeker Interview Prep — powered by ForgeTomorrow alignment intelligence.
// Translates WHY analysis gaps and strengths into seeker-facing preparation guidance.
// The seeker sees: what to prepare, what to lead with, what to practice.
// The seeker never sees: recruiter scores, raw WHY output, or hiring framing.

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

// ── Design tokens ────────────────────────────────────────────────────────────
const ORANGE = '#FF7043';
const DARK   = '#112033';
const GLASS  = {
  background:   'rgba(255,255,255,0.58)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: 14,
  border:       '1px solid rgba(255,255,255,0.30)',
};
const WHITE_CARD = {
  background:   'rgba(255,255,255,0.92)',
  borderRadius: 14,
  border:       '1px solid rgba(0,0,0,0.07)',
};
const SECTION_HEADING = {
  fontSize: 18,
  fontWeight: 900,
  color: ORANGE,
  marginBottom: 16,
  textShadow: '0 1px 2px rgba(255,112,67,0.15)',
};

// ── Priority colors ──────────────────────────────────────────────────────────
const PRIORITY = {
  high:   { bg: '#FEF2F2', border: '#DC2626', label: 'HIGH FOCUS',   labelColor: '#DC2626' },
  medium: { bg: '#FFFBEB', border: '#D97706', label: 'PREP AREA',    labelColor: '#D97706' },
  low:    { bg: '#F0FDF4', border: '#16A34A', label: 'GOOD TO KNOW', labelColor: '#16A34A' },
};

// ── Sub-components ───────────────────────────────────────────────────────────

function PrepAreaCard({ item }) {
  const p = PRIORITY[item.priority] || PRIORITY.medium;
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: p.bg,
      borderRadius: 12,
      border: `1px solid ${p.border}`,
      borderLeft: `4px solid ${p.border}`,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: DARK, flex: 1 }}>{item.area}</div>
        <span style={{
          fontSize: 9,
          fontWeight: 900,
          color: p.labelColor,
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          paddingTop: 2,
        }}>
          {p.label}
        </span>
      </div>

      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.55, marginBottom: item.storyPrompt ? 8 : 0 }}>
        {item.prepNote}
      </div>

      {item.storyPrompt && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              color: ORANGE,
              padding: 0,
              marginBottom: expanded ? 8 : 0,
            }}
          >
            {expanded ? '▲ Hide story prompt' : '▼ Story prompt'}
          </button>

          {expanded && (
            <div style={{
              background: 'rgba(255,112,67,0.06)',
              border: '1px solid rgba(255,112,67,0.20)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#374151',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}>
              💬 {item.storyPrompt}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConfidenceCard({ item }) {
  return (
    <div style={{
      background: '#F0FDF4',
      borderRadius: 10,
      border: '1px solid #16A34A',
      borderLeft: '4px solid #16A34A',
      padding: '12px 14px',
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 4 }}>{item.area}</div>
      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{item.note}</div>
    </div>
  );
}

function QuestionCard({ item }) {
  const [revealed, setRevealed] = useState(false);
  const typeColor = item.type === 'behavioral' ? '#1D4ED8' : '#7C3AED';
  const typeLabel = item.type === 'behavioral' ? 'BEHAVIORAL' : 'ROLE-SPECIFIC';

  return (
    <div style={{
      ...WHITE_CARD,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DARK, flex: 1, lineHeight: 1.45 }}>{item.question}</div>
        <span style={{
          fontSize: 9,
          fontWeight: 900,
          color: typeColor,
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          paddingTop: 2,
        }}>
          {typeLabel}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setRevealed(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            color: ORANGE,
            padding: 0,
          }}
        >
          {revealed ? '▲ Hide tip' : '▼ How to answer'}
        </button>
      </div>

      {revealed && (
        <div style={{
          marginTop: 8,
          background: 'rgba(255,112,67,0.06)',
          border: '1px solid rgba(255,112,67,0.20)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          color: '#374151',
          lineHeight: 1.55,
        }}>
          💡 {item.tip}
        </div>
      )}
    </div>
  );
}

function UniversalPrepCard({ item }) {
  return (
    <div style={{
      ...WHITE_CARD,
      padding: '12px 14px',
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 4 }}>{item.area}</div>
      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.55 }}>{item.note}</div>
    </div>
  );
}

function TransferableCard({ item }) {
  return (
    <div style={{
      background: '#EFF6FF',
      borderRadius: 10,
      border: '1px solid #3B82F6',
      borderLeft: '4px solid #3B82F6',
      padding: '10px 14px',
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 3 }}>{item.skill}</div>
      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{item.note}</div>
    </div>
  );
}

function Section({ title, children, count }) {
  return (
    <div style={{ ...GLASS, padding: '20px 20px 16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
        <div style={SECTION_HEADING}>{title}</div>
        {count != null && (
          <span style={{ fontSize: 12, color: '#90A4AE', fontWeight: 700 }}>
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.6)',
      borderRadius: 10,
      padding: '16px 18px',
      fontSize: 13,
      color: '#90A4AE',
      fontWeight: 600,
      lineHeight: 1.5,
    }}>
      {message}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function InterviewPrepPage() {
  const router = useRouter();
  const { applicationId } = router.query;

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!applicationId) return;

    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/seeker/applications/${applicationId}/interview-prep`)
      .then(r => r.json().then(j => ({ ok: r.ok, json: j })))
      .then(({ ok, json }) => {
        if (!alive) return;
        if (!ok) throw new Error(json?.error || 'Failed to load prep.');
        setData(json);
      })
      .catch(e => {
        if (!alive) return;
        setError(e?.message || 'Something went wrong.');
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => { alive = false; };
  }, [applicationId]);

  const jobTitle   = data?.job?.title   || 'this role';
  const jobCompany = data?.job?.company || 'this company';

  const TitleCard = (
    <SeekerTitleCard
      title="Interview Prep"
      subtitle={
        data?.job
          ? `Preparing for ${jobTitle} at ${jobCompany}`
          : 'Get ready for your interview.'
      }
    />
  );

  const RightRail = (
    <RightRailPlacementManager surface="seeker_interview_prep" />
  );

  if (loading) {
    return (
      <SeekerLayout header={TitleCard} right={RightRail} rightVariant="light" rightTopOnly activeNav="jobs">
        <div style={{ padding: 32, fontSize: 14, fontWeight: 700, color: '#90A4AE' }}>
          Building your prep guide…
        </div>
      </SeekerLayout>
    );
  }

  if (error) {
    return (
      <SeekerLayout header={TitleCard} right={RightRail} rightVariant="light" rightTopOnly activeNav="jobs">
        <div style={{
          ...GLASS,
          padding: 24,
          color: '#B71C1C',
          fontSize: 14,
          fontWeight: 700,
        }}>
          {error}
        </div>
      </SeekerLayout>
    );
  }

  return (
    <SeekerLayout
      title={`Interview Prep — ${jobTitle} | ForgeTomorrow`}
      header={TitleCard}
      right={RightRail}
      rightVariant="light"
      rightTopOnly
      activeNav="jobs"
    >
      <div style={{ display: 'grid', gap: 0 }}>

        {/* Intelligence banner */}
        {data?.intelligenceNote && (
          <div style={{
            background: data?.hasIntelligence
              ? 'rgba(255,112,67,0.08)'
              : 'rgba(148,163,184,0.08)',
            border: `1px solid ${data?.hasIntelligence ? 'rgba(255,112,67,0.25)' : 'rgba(148,163,184,0.25)'}`,
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 12,
            color: data?.hasIntelligence ? '#7C2D12' : '#475569',
            fontWeight: 600,
            lineHeight: 1.55,
            marginBottom: 16,
          }}>
            {data.intelligenceNote}
          </div>
        )}

        {/* Focus areas — from WHY gaps */}
        {data?.prepAreas?.length > 0 && (
          <Section title="Focus Areas" count={data.prepAreas.length}>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
              These are the areas where you'll want the strongest evidence ready.
              For each one, prepare a specific story using the STAR format: Situation, Task, Action, Result.
            </div>
            {data.prepAreas.map((item, i) => (
              <PrepAreaCard key={`prep-${i}`} item={item} />
            ))}
          </Section>
        )}

        {/* Lead with these — from WHY strengths */}
        {data?.confidenceAreas?.length > 0 && (
          <Section title="Lead With These" count={data.confidenceAreas.length}>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
              Your application shows strong evidence in these areas. Don't wait to be asked — work them into your answers early.
            </div>
            {data.confidenceAreas.map((item, i) => (
              <ConfidenceCard key={`conf-${i}`} item={item} />
            ))}
          </Section>
        )}

        {/* Transferable skills — bridge these */}
        {data?.transferable?.length > 0 && (
          <Section title="Bridge These Explicitly">
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
              You have adjacent experience in these areas. Don't assume the interviewer will make the connection — bridge it yourself.
            </div>
            {data.transferable.map((item, i) => (
              <TransferableCard key={`trans-${i}`} item={item} />
            ))}
          </Section>
        )}

        {/* Practice questions */}
        {data?.interviewQuestions?.length > 0 && (
          <Section title="Practice Questions" count={data.interviewQuestions.length}>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
              Practice answering these before the interview. Don't memorize — internalize.
            </div>
            {data.interviewQuestions.map((item, i) => (
              <QuestionCard key={`q-${i}`} item={item} />
            ))}
          </Section>
        )}

        {/* Story bank prompts */}
        {data?.storyBankPrompts?.length > 0 && (
          <Section title="Story Bank Prompts">
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
              For each prompt below, write a 2-3 sentence answer before your interview.
              These are the kinds of stories that win conversations.
            </div>
            {data.storyBankPrompts.map((prompt, i) => (
              <div key={`story-${i}`} style={{
                ...WHITE_CARD,
                padding: '12px 14px',
                marginBottom: 8,
                fontSize: 13,
                color: DARK,
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}>
                💬 {prompt}
              </div>
            ))}
          </Section>
        )}

        {/* Universal prep — always show */}
        <Section title="Always Prepare These">
          {(data?.universalPrep || []).map((item, i) => (
            <UniversalPrepCard key={`universal-${i}`} item={item} />
          ))}
        </Section>

        {/* Anvil CTA */}
        <div style={{
          background: 'rgba(255,112,67,0.06)',
          border: '1px solid rgba(255,112,67,0.20)',
          borderRadius: 14,
          padding: '18px 20px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(255,112,67,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
            fontSize: 20,
          }}>
            🔥
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 4 }}>
              More tools for your professional journey
            </div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 10 }}>
              The Anvil is your professional workshop for offer negotiation tools,
              project promotion guides, and more being added all the time.
            </div>
            <button
              onClick={() => router.push('/anvil')}
              style={{
                background: ORANGE,
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                padding: '7px 14px',
                cursor: 'pointer',
              }}
            >
              Visit The Anvil →
            </button>
          </div>
        </div>

        {/* Back link */}
        <div style={{ paddingBottom: 32 }}>
          <button
            onClick={() => router.push('/seeker/applications')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: ORANGE,
              padding: 0,
            }}
          >
            ← Back to Applications
          </button>
        </div>

      </div>
    </SeekerLayout>
  );
}