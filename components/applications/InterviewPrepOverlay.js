// components/applications/InterviewPrepOverlay.js
//
// Seeker Interview Prep Overlay — powered by ForgeTomorrow alignment intelligence.
// Contextual overlay version for the Applications Kanban/details workflow.
// API remains: /api/seeker/applications/[id]/interview-prep

import React, { useEffect, useState } from 'react';

const ORANGE = '#FF7043';
const DARK = '#112033';

const GLASS = {
  background: 'rgba(255,255,255,0.74)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.34)',
};

const WHITE_CARD = {
  background: 'rgba(255,255,255,0.94)',
  borderRadius: 14,
  border: '1px solid rgba(0,0,0,0.07)',
};

const SECTION_HEADING = {
  fontSize: 16,
  fontWeight: 900,
  color: ORANGE,
  marginBottom: 12,
  textShadow: '0 1px 2px rgba(255,112,67,0.15)',
};

const PRIORITY = {
  high: { bg: '#FEF2F2', border: '#DC2626', label: 'HIGH FOCUS', labelColor: '#DC2626' },
  medium: { bg: '#FFFBEB', border: '#D97706', label: 'PREP AREA', labelColor: '#D97706' },
  low: { bg: '#F0FDF4', border: '#16A34A', label: 'GOOD TO KNOW', labelColor: '#16A34A' },
};

function PrepAreaCard({ item }) {
  const p = PRIORITY[item.priority] || PRIORITY.medium;
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: p.bg,
      borderRadius: 12,
      border: `1px solid ${p.border}`,
      borderLeft: `4px solid ${p.border}`,
      padding: '12px 14px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: DARK, flex: 1 }}>{item.area}</div>
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
              fontWeight: 800,
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
      padding: '11px 13px',
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: DARK, marginBottom: 4 }}>{item.area}</div>
      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{item.note}</div>
    </div>
  );
}

function QuestionCard({ item }) {
  const [revealed, setRevealed] = useState(false);
  const typeColor = item.type === 'behavioral' ? '#1D4ED8' : '#7C3AED';
  const typeLabel = item.type === 'behavioral' ? 'BEHAVIORAL' : 'ROLE-SPECIFIC';

  return (
    <div style={{ ...WHITE_CARD, padding: '13px 15px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: DARK, flex: 1, lineHeight: 1.45 }}>{item.question}</div>
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

      <button
        onClick={() => setRevealed(v => !v)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 800,
          color: ORANGE,
          padding: 0,
        }}
      >
        {revealed ? '▲ Hide tip' : '▼ How to answer'}
      </button>

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
    <div style={{ ...WHITE_CARD, padding: '11px 13px', marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: DARK, marginBottom: 4 }}>{item.area}</div>
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
      <div style={{ fontSize: 13, fontWeight: 800, color: DARK, marginBottom: 3 }}>{item.skill}</div>
      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{item.note}</div>
    </div>
  );
}

function Section({ title, children, count }) {
  return (
    <div style={{ ...GLASS, padding: '16px 16px 12px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <div style={SECTION_HEADING}>{title}</div>
        {count != null && (
          <span style={{ fontSize: 12, color: '#90A4AE', fontWeight: 800 }}>
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ ...GLASS, padding: 24, fontSize: 14, fontWeight: 800, color: '#64748b' }}>
      Building your prep guide…
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div style={{ ...GLASS, padding: 24, color: '#B71C1C', fontSize: 14, fontWeight: 800 }}>
      {error}
    </div>
  );
}

function PrepContent({ data }) {
  return (
    <>
      {data?.intelligenceNote && (
        <div style={{
          background: data?.hasIntelligence ? 'rgba(255,112,67,0.08)' : 'rgba(148,163,184,0.08)',
          border: `1px solid ${data?.hasIntelligence ? 'rgba(255,112,67,0.25)' : 'rgba(148,163,184,0.25)'}`,
          borderRadius: 12,
          padding: '12px 16px',
          fontSize: 12,
          color: data?.hasIntelligence ? '#7C2D12' : '#475569',
          fontWeight: 700,
          lineHeight: 1.55,
          marginBottom: 14,
        }}>
          {data.intelligenceNote}
        </div>
      )}

      {data?.prepAreas?.length > 0 && (
        <Section title="Focus Areas" count={data.prepAreas.length}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
            These are the areas where you want the strongest evidence ready. Prepare a specific STAR story for each one.
          </div>
          {data.prepAreas.map((item, i) => <PrepAreaCard key={`prep-${i}`} item={item} />)}
        </Section>
      )}

      {data?.confidenceAreas?.length > 0 && (
        <Section title="Lead With These" count={data.confidenceAreas.length}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
            Your application shows strong evidence here. Work these into your answers early.
          </div>
          {data.confidenceAreas.map((item, i) => <ConfidenceCard key={`conf-${i}`} item={item} />)}
        </Section>
      )}

      {data?.transferable?.length > 0 && (
        <Section title="Bridge These Explicitly">
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
            You have adjacent experience here. Do not assume the interviewer will connect the dots.
          </div>
          {data.transferable.map((item, i) => <TransferableCard key={`trans-${i}`} item={item} />)}
        </Section>
      )}

      {data?.interviewQuestions?.length > 0 && (
        <Section title="Practice Questions" count={data.interviewQuestions.length}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
            Practice answering these before the interview. Do not memorize — internalize.
          </div>
          {data.interviewQuestions.map((item, i) => <QuestionCard key={`q-${i}`} item={item} />)}
        </Section>
      )}

      {data?.storyBankPrompts?.length > 0 && (
        <Section title="Story Bank Prompts">
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
            Write a short answer for each prompt. These are the stories that win conversations.
          </div>
          {data.storyBankPrompts.map((prompt, i) => (
            <div key={`story-${i}`} style={{ ...WHITE_CARD, padding: '12px 14px', marginBottom: 8, fontSize: 13, color: DARK, lineHeight: 1.55, fontStyle: 'italic' }}>
              💬 {prompt}
            </div>
          ))}
        </Section>
      )}

      <Section title="Always Prepare These">
        {(data?.universalPrep || []).map((item, i) => <UniversalPrepCard key={`universal-${i}`} item={item} />)}
      </Section>

      <div style={{
        background: 'rgba(255,112,67,0.06)',
        border: '1px solid rgba(255,112,67,0.20)',
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 4,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
      }}>
        <div style={{
          width: 38,
          height: 38,
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
          <div style={{ fontSize: 14, fontWeight: 900, color: DARK, marginBottom: 4 }}>
            More tools for your professional journey
          </div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
            The Anvil is your professional workshop for offer negotiation, project promotion, and more.
          </div>
        </div>
      </div>
    </>
  );
}

export default function InterviewPrepOverlay({ open, applicationId, applicationLabel, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        activeJob: data?.job ? { id: data.job.id || null, title: data.job.title || null, company: data.job.company || null } : null,
        activeResume: data?.resume ? { id: data.resume.id || null, title: data.resume.name || null } : null,
        activeTool: {
          name: 'Interview Prep',
          state: loading ? 'loading' : error ? 'error' : data ? 'ready' : 'open',
          goal: 'Prepare the seeker for an interview using ForgeTomorrow alignment intelligence.',
        },
        prepAreas: Array.isArray(data?.prepAreas) ? data.prepAreas.slice(0, 8) : [],
        confidenceAreas: Array.isArray(data?.confidenceAreas) ? data.confidenceAreas.slice(0, 6) : [],
        interviewQuestions: Array.isArray(data?.interviewQuestions) ? data.interviewQuestions.slice(0, 8) : [],
      };
    } catch {}
  }, [open, data, loading, error]);

  if (!open) return null;

  const jobTitle = data?.job?.title || applicationLabel || 'Interview Prep';
  const jobCompany = data?.job?.company || '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10040,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(2,6,23,0.50)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: 'min(1180px, 100%)',
          maxHeight: 'calc(100vh - 48px)',
          borderRadius: 22,
          border: '1px solid rgba(255,255,255,0.30)',
          background: 'linear-gradient(180deg, rgba(248,250,252,0.96), rgba(226,232,240,0.92))',
          boxShadow: '0 32px 90px rgba(2,6,23,0.45)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(15,23,42,0.10)',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.97), rgba(30,41,59,0.94))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.18em', color: ORANGE, textTransform: 'uppercase' }}>
              Interview Prep
            </div>
            <div style={{ fontSize: 21, fontWeight: 950, lineHeight: 1.18, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {jobTitle}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', marginTop: 3 }}>
              {jobCompany ? `Preparing for ${jobCompany}` : 'Prepare your strongest stories before the interview.'}
            </div>
          </div>

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
              fontWeight: 900,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: 18, background: 'radial-gradient(circle at top left, rgba(255,112,67,0.12), transparent 34%)' }}>
          {loading ? <LoadingState /> : error ? <ErrorState error={error} /> : <PrepContent data={data} />}
        </div>
      </div>
    </div>
  );
}
