// components/applications/InterviewPrepOverlay.js
//
// Seeker Interview Prep Overlay — powered by ForgeTomorrow alignment intelligence.
// Contextual overlay version for the Applications Kanban/details workflow.
// API remains: /api/seeker/applications/[id]/interview-prep
//
// UX goal:
// - Keep the seeker in the Applications workflow.
// - Reduce scroll by grouping prep into a split workspace.
// - Show the highest-priority recruiter validation signals first.
// - Keep practice/story prep visible in a right rail.
// - Preserve Striker context injection for future conversational coaching.

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const ORANGE = '#FF7043';
const DARK = '#112033';
const SLATE = '#334155';
const MUTED = '#64748B';

const OVERLAY_Z = 10040;

const GLASS = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.38)',
  boxShadow: '0 14px 38px rgba(15,23,42,0.10)',
};

const WHITE_CARD = {
  background: 'rgba(255,255,255,0.94)',
  borderRadius: 14,
  border: '1px solid rgba(15,23,42,0.08)',
  boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
};

const PRIORITY = {
  high: {
    bg: '#FEF2F2',
    softBg: 'rgba(220,38,38,0.08)',
    border: '#DC2626',
    label: 'High Focus',
    labelColor: '#DC2626',
  },
  medium: {
    bg: '#FFFBEB',
    softBg: 'rgba(217,119,6,0.08)',
    border: '#D97706',
    label: 'Prep Area',
    labelColor: '#D97706',
  },
  low: {
    bg: '#F0FDF4',
    softBg: 'rgba(22,163,74,0.08)',
    border: '#16A34A',
    label: 'Good to Know',
    labelColor: '#16A34A',
  },
};

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function countPriority(items, priority) {
  return safeArray(items).filter((item) => item?.priority === priority).length;
}

function SectionHeader({ eyebrow, title, count, subtitle }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {eyebrow && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 950,
            letterSpacing: '0.16em',
            color: ORANGE,
            textTransform: 'uppercase',
            marginBottom: 3,
          }}
        >
          {eyebrow}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 950, color: DARK, letterSpacing: '-0.02em' }}>
          {title}
        </h3>

        {count != null && (
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 800 }}>
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ marginTop: 4, fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, tone = 'neutral' }) {
  const toneMap = {
    high: { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.20)', color: '#DC2626' },
    good: { bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.20)', color: '#15803D' },
    blue: { bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.20)', color: '#1D4ED8' },
    amber: { bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.20)', color: '#D97706' },
    neutral: { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.18)', color: SLATE },
  };

  const t = toneMap[tone] || toneMap.neutral;

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        background: t.bg,
        padding: '10px 12px',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 950, color: t.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ marginTop: 3, fontSize: 22, fontWeight: 950, color: t.color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function PrepAreaCard({ item }) {
  const p = PRIORITY[item?.priority] || PRIORITY.medium;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: p.bg,
        borderRadius: 14,
        border: `1px solid ${p.border}`,
        borderLeft: `5px solid ${p.border}`,
        padding: '12px 14px',
        display: 'grid',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 950, color: DARK, lineHeight: 1.25 }}>
            {item?.area || 'Focus area'}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
            {item?.prepNote || 'Prepare one specific example that proves your experience here.'}
          </div>
        </div>

        <span
          style={{
            fontSize: 9,
            fontWeight: 950,
            color: p.labelColor,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            padding: '4px 7px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.68)',
            border: `1px solid ${p.border}33`,
          }}
        >
          {p.label}
        </span>
      </div>

      {item?.storyPrompt && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 900,
              color: ORANGE,
              padding: 0,
            }}
          >
            {expanded ? '▲ Hide story prompt' : '▼ Story prompt'}
          </button>

          {expanded && (
            <div
              style={{
                marginTop: 8,
                background: 'rgba(255,255,255,0.66)',
                border: '1px solid rgba(255,112,67,0.22)',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 12,
                color: '#374151',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}
            >
              💬 {item.storyPrompt}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConfidenceCard({ item }) {
  return (
    <div
      style={{
        background: '#F0FDF4',
        borderRadius: 12,
        border: '1px solid rgba(22,163,74,0.36)',
        borderLeft: '4px solid #16A34A',
        padding: '11px 13px',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 950, color: DARK, marginBottom: 3 }}>
        {item?.area || 'Strong signal'}
      </div>
      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.45 }}>
        {item?.note || 'Your application shows strong evidence here. Lead with it.'}
      </div>
    </div>
  );
}

function TransferableCard({ item }) {
  return (
    <div
      style={{
        background: '#EFF6FF',
        borderRadius: 12,
        border: '1px solid rgba(59,130,246,0.42)',
        borderLeft: '4px solid #3B82F6',
        padding: '11px 13px',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 950, color: DARK, marginBottom: 3 }}>
        {item?.skill || 'Transferable signal'}
      </div>
      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.45 }}>
        {item?.note || "Bridge this explicitly — don't assume the interviewer will connect the dots."}
      </div>
    </div>
  );
}

function QuestionCard({ item, compact = false }) {
  const [revealed, setRevealed] = useState(false);
  const typeColor = item?.type === 'behavioral' ? '#1D4ED8' : '#7C3AED';
  const typeLabel = item?.type === 'behavioral' ? 'Behavioral' : 'Role-specific';

  return (
    <div style={{ ...WHITE_CARD, padding: compact ? '11px 12px' : '13px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: DARK, flex: 1, lineHeight: 1.38 }}>
          {item?.question || 'Practice question'}
        </div>

        <span
          style={{
            fontSize: 9,
            fontWeight: 950,
            color: typeColor,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            paddingTop: 2,
            textTransform: 'uppercase',
          }}
        >
          {typeLabel}
        </span>
      </div>

      {item?.tip && (
        <>
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            style={{
              marginTop: 7,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 900,
              color: ORANGE,
              padding: 0,
            }}
          >
            {revealed ? '▲ Hide tip' : '▼ How to answer'}
          </button>

          {revealed && (
            <div
              style={{
                marginTop: 8,
                background: 'rgba(255,112,67,0.06)',
                border: '1px solid rgba(255,112,67,0.20)',
                borderRadius: 9,
                padding: '8px 10px',
                fontSize: 12,
                color: '#374151',
                lineHeight: 1.45,
              }}
            >
              💡 {item.tip}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UniversalPrepCard({ item }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(15,23,42,0.08)',
        background: 'rgba(255,255,255,0.82)',
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 950, color: DARK, marginBottom: 2 }}>
        {item?.area || 'Prepare'}
      </div>
      <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.42 }}>
        {item?.note || ''}
      </div>
    </div>
  );
}

function StoryPromptCard({ prompt }) {
  return (
    <div
      style={{
        ...WHITE_CARD,
        padding: '11px 12px',
        fontSize: 12,
        color: DARK,
        lineHeight: 1.45,
        fontStyle: 'italic',
      }}
    >
      💬 {prompt}
    </div>
  );
}

function Panel({ eyebrow, title, count, subtitle, children, style = {} }) {
  return (
    <section style={{ ...GLASS, padding: 16, ...style }}>
      <SectionHeader eyebrow={eyebrow} title={title} count={count} subtitle={subtitle} />
      {children}
    </section>
  );
}

function EmptyMini({ message }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px dashed rgba(100,116,139,0.26)',
        background: 'rgba(248,250,252,0.70)',
        padding: '12px',
        fontSize: 12,
        color: MUTED,
        fontWeight: 700,
        lineHeight: 1.45,
      }}
    >
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        ...GLASS,
        padding: 10,
        fontSize: 14,
        fontWeight: 900,
        color: '#64748B',
      }}
    >
      Building your prep guide…
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div
      style={{
        ...GLASS,
        padding: 10,
        color: '#B91C1C',
        fontSize: 14,
        fontWeight: 900,
      }}
    >
      {error}
    </div>
  );
}

function PrepWorkspace({ data, onNavigate }) {
  const prepAreas = safeArray(data?.prepAreas);
  const confidenceAreas = safeArray(data?.confidenceAreas);
  const transferable = safeArray(data?.transferable);
  const interviewQuestions = safeArray(data?.interviewQuestions);
  const storyBankPrompts = safeArray(data?.storyBankPrompts);
  const universalPrep = safeArray(data?.universalPrep);

  const topFocus = prepAreas.slice(0, 3);
  const secondaryFocus = prepAreas.slice(3);
  const topQuestions = interviewQuestions.slice(0, 6);
  const behavioralQuestions = topQuestions.filter((item) => item?.type === 'behavioral');
  const roleSpecificQuestions = topQuestions.filter((item) => item?.type === 'role-specific');
  const otherQuestions = topQuestions.filter((item) => item?.type !== 'behavioral' && item?.type !== 'role-specific');
  const topStories = storyBankPrompts.slice(0, 4);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(420px, 528px) minmax(260px, 1fr)',
          gap: 14,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(112px, 1fr))',
            gap: 10,
          }}
        >
          <StatTile label="High Focus" value={countPriority(prepAreas, 'high')} tone="high" />
          <StatTile label="Strong Signals" value={confidenceAreas.length} tone="good" />
          <StatTile label="Bridge" value={transferable.length} tone="blue" />
          <StatTile label="Questions" value={interviewQuestions.length} tone="amber" />
        </div>

        {data?.intelligenceNote && (
          <div
            style={{
              justifySelf: 'end',
              maxWidth: 430,
              background: data?.hasIntelligence ? 'rgba(255,112,67,0.08)' : 'rgba(148,163,184,0.08)',
              border: `1px solid ${data?.hasIntelligence ? 'rgba(255,112,67,0.25)' : 'rgba(148,163,184,0.25)'}`,
              borderRadius: 999,
              padding: '10px 14px',
              fontSize: 12,
              color: data?.hasIntelligence ? '#7C2D12' : '#475569',
              fontWeight: 900,
              lineHeight: 1.25,
              textAlign: 'center',
            }}
          >
            {data.intelligenceNote}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr 0.95fr',
          gap: 14,
          alignItems: 'start',
        }}
      >
        <Panel
          eyebrow="Recruiter validation"
          title="Focus First"
          count={prepAreas.length}
          subtitle="Prepare one clear STAR story for each high-focus item before the interview."
          style={{ minHeight: 250 }}
        >
          {topFocus.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {topFocus.map((item, i) => (
                <PrepAreaCard key={`prep-${i}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyMini message="No major validation gaps were detected from the current application evidence." />
          )}

          {secondaryFocus.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <details>
                <summary style={{ cursor: 'pointer', color: ORANGE, fontSize: 12, fontWeight: 950 }}>
                  Show {secondaryFocus.length} additional prep {secondaryFocus.length === 1 ? 'area' : 'areas'}
                </summary>
                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                  {secondaryFocus.map((item, i) => (
                    <PrepAreaCard key={`prep-extra-${i}`} item={item} />
                  ))}
                </div>
              </details>
            </div>
          )}
        </Panel>

        <Panel
          eyebrow="Confidence"
          title="Lead With These"
          count={confidenceAreas.length}
          subtitle="Strong signals already visible in your application."
          style={{ minHeight: 250 }}
        >
          {confidenceAreas.length ? (
            <div style={{ display: 'grid', gap: 9 }}>
              {confidenceAreas.slice(0, 5).map((item, i) => (
                <ConfidenceCard key={`conf-${i}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyMini message="No specific strength signals were returned yet. Use your strongest resume examples." />
          )}
        </Panel>

        <Panel
          eyebrow="Bridge"
          title="Connect the Dots"
          count={transferable.length || null}
          subtitle="Adjacent evidence that needs to be explained clearly."
          style={{ minHeight: 250 }}
        >
          {transferable.length ? (
            <div style={{ display: 'grid', gap: 9 }}>
              {transferable.slice(0, 5).map((item, i) => (
                <TransferableCard key={`trans-${i}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyMini message="No transferable-skill bridges were detected. Focus on direct strengths and high-priority prep." />
          )}
        </Panel>
      </div>

      <div
        style={{
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(17,32,51,0.98), rgba(30,41,59,0.95))',
          color: 'white',
          padding: '14px 16px',
          border: '1px solid rgba(255,255,255,0.10)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 410px)',
          gap: 14,
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: '0.16em', color: ORANGE, textTransform: 'uppercase' }}>
            Prep cockpit
          </div>
          <div style={{ marginTop: 4, fontSize: 17, fontWeight: 950, lineHeight: 1.22 }}>
            Practice the story, not just the answer.
          </div>
          <div style={{ marginTop: 5, fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.42 }}>
            Use the prompts below to rehearse clean, specific examples before the conversation.
          </div>
        </div>

        <div
          style={{
            borderRadius: 15,
            border: '1px solid rgba(255,112,67,0.22)',
            background: 'rgba(255,255,255,0.08)',
            padding: '12px 14px',
            display: 'flex',
            gap: 11,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(255,112,67,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
              fontSize: 18,
            }}
          >
            🔥
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 950, color: 'white', marginBottom: 3 }}>
              Need deeper prep?
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.35 }}>
              Use The Anvil and Hearth for negotiation, project promotion, and coaching support.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onNavigate?.('/anvil')}
                style={{
                  border: '1px solid rgba(255,112,67,0.35)',
                  background: 'rgba(255,112,67,0.18)',
                  color: '#FFD7C8',
                  borderRadius: 999,
                  padding: '5px 9px',
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                The Anvil
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('/the-hearth')}
                style={{
                  border: '1px solid rgba(255,255,255,0.20)',
                  background: 'rgba(255,255,255,0.10)',
                  color: 'white',
                  borderRadius: 999,
                  padding: '5px 9px',
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                The Hearth
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.85fr) minmax(320px, 0.9fr)',
          gap: 14,
          alignItems: 'start',
        }}
      >
        <Panel
          eyebrow="Practice"
          title="Likely Questions"
          count={interviewQuestions.length}
          subtitle="Open the tips only where you need help."
        >
          {topQuestions.length ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
                alignItems: 'start',
              }}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 950,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#1D4ED8',
                  }}
                >
                  Behavioral
                </div>

                {(behavioralQuestions.length ? behavioralQuestions : otherQuestions).map((item, i) => (
                  <QuestionCard key={`behavioral-q-${i}`} item={item} />
                ))}
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 950,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#7C3AED',
                  }}
                >
                  Role-specific
                </div>

                {roleSpecificQuestions.length ? (
                  roleSpecificQuestions.map((item, i) => (
                    <QuestionCard key={`role-q-${i}`} item={item} />
                  ))
                ) : (
                  <EmptyMini message="Role-specific questions were not returned for this role yet. Use the story prompts to prepare examples." />
                )}
              </div>
            </div>
          ) : (
            <EmptyMini message="No role-specific questions were returned. Use the story prompts." />
          )}
        </Panel>

        <div style={{ display: 'grid', gap: 14 }}>
          <Panel
            eyebrow="Story bank"
            title="Proof Stories"
            count={storyBankPrompts.length || null}
            subtitle="Prepare short, real examples."
          >
            {topStories.length ? (
              <div style={{ display: 'grid', gap: 9 }}>
                {topStories.map((prompt, i) => (
                  <StoryPromptCard key={`story-${i}`} prompt={prompt} />
                ))}
              </div>
            ) : (
              <EmptyMini message="No story prompts were generated yet." />
            )}
          </Panel>

          <Panel
            eyebrow="Baseline"
            title="Always Prepare"
          >
            {universalPrep.length ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {universalPrep.map((item, i) => (
                  <UniversalPrepCard key={`universal-${i}`} item={item} />
                ))}
              </div>
            ) : (
              <EmptyMini message="Review the company, role, walk-away conditions, and questions for them." />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPrepOverlay({ open, applicationId, applicationLabel, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const jobTitle = data?.job?.title || applicationLabel || 'Interview Prep';
  const jobCompany = data?.job?.company || '';

  const headerSubtitle = useMemo(() => {
    if (jobCompany && jobTitle) return `Preparing for ${jobCompany}`;
    return 'Prepare your strongest stories before the interview.';
  }, [jobCompany, jobTitle]);

  const handleNavigate = (href) => {
    if (typeof window !== 'undefined' && href) {
      window.location.href = href;
    }
  };

  useEffect(() => {
    if (!open || !applicationId) return;

    let alive = true;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/seeker/applications/${applicationId}/interview-prep`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, json: j })))
      .then(({ ok, json }) => {
        if (!alive) return;
        if (!ok) throw new Error(json?.error || 'Failed to load prep.');
        setData(json);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || 'Something went wrong.');
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, applicationId]);

  useEffect(() => {
    if (!open) return;

    const onEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!open) return;

    try {
      window.__FT_CONTEXT__ = {
        surface: 'seeker_interview_prep',
        activeJob: data?.job
          ? {
              id: data.job.id || null,
              title: data.job.title || null,
              company: data.job.company || null,
            }
          : null,
        activeResume: data?.resume
          ? {
              id: data.resume.id || null,
              title: data.resume.name || null,
            }
          : null,
        activeTool: {
          name: 'Interview Prep',
          state: loading ? 'loading' : error ? 'error' : data ? 'ready' : 'open',
          goal: 'Prepare the seeker for an interview using ForgeTomorrow alignment intelligence.',
        },
        prepAreas: safeArray(data?.prepAreas).slice(0, 8),
        confidenceAreas: safeArray(data?.confidenceAreas).slice(0, 6),
        interviewQuestions: safeArray(data?.interviewQuestions).slice(0, 8),
      };
    } catch {
      // Striker context is best-effort only.
    }
  }, [open, data, loading, error]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: OVERLAY_Z,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: 10,
        background: 'rgba(2,6,23,0.54)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: 'min(1380px, 100%)',
          maxHeight: 'calc(100vh - 20px)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.30)',
          background: 'linear-gradient(180deg, rgba(248,250,252,0.96), rgba(226,232,240,0.92))',
          boxShadow: '0 34px 96px rgba(2,6,23,0.48)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(15,23,42,0.10)',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 950,
                letterSpacing: '0.18em',
                color: ORANGE,
                textTransform: 'uppercase',
              }}
            >
              Interview Prep Workspace
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 950,
                lineHeight: 1.15,
                marginTop: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {jobTitle}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', marginTop: 3 }}>
              {headerSubtitle}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {data?.fromCache && (
              <span
                style={{
                  border: '1px solid rgba(22,163,74,0.28)',
                  background: 'rgba(22,163,74,0.12)',
                  color: '#BBF7D0',
                  borderRadius: 999,
                  padding: '7px 10px',
                  fontSize: 11,
                  fontWeight: 950,
                }}
              >
                Prep Ready
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                border: '1px solid rgba(255,255,255,0.20)',
                background: 'rgba(255,255,255,0.10)',
                color: 'white',
                borderRadius: 12,
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: 950,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>

        <div
          style={{
            overflowY: 'auto',
            padding: 14,
            background: 'radial-gradient(circle at top left, rgba(255,112,67,0.13), transparent 34%)',
          }}
        >
          {loading ? <LoadingState /> : error ? <ErrorState error={error} /> : <PrepWorkspace data={data} onNavigate={handleNavigate} />}
        </div>
      </div>
    </div>,
    document.body
  );
}
