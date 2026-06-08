// pages/feedback/[coachID].js
// Internal CSAT feedback page — authenticated ForgeTomorrow members only.
// SeekerLayout provides the full chrome: wallpaper, sidebar, right rail.
// _app.js already classifies /feedback/* as an internal seeker route — no duplicate header.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const ORANGE = '#FF7043';
const MUTED  = '#64748B';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  boxSizing: 'border-box',
  padding: '20px 24px',
};

// The six CSAT questions
const QUESTIONS = [
  { key: 'satisfaction',    label: 'Overall satisfaction with your coaching' },
  { key: 'communication',   label: 'Coach communication and responsiveness' },
  { key: 'quality',         label: 'Quality of guidance provided' },
  { key: 'helpfulness',     label: 'Helpfulness of resources or action steps' },
  { key: 'progress',        label: 'Progress made toward your career goal' },
  { key: 'recommendation',  label: 'Likelihood you would recommend this coach' },
];

const DEFAULT_SCORES = QUESTIONS.reduce((acc, q) => ({ ...acc, [q.key]: 0 }), {});

function CSATItem({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontWeight: 700, color: '#263238', display: 'block', marginBottom: 8, fontSize: 14 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} out of 5`}
            style={{
              borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
              fontSize: 15, minWidth: 44, fontWeight: 700, fontFamily: 'inherit',
              background: value === n ? ORANGE : 'white',
              color:      value === n ? 'white' : ORANGE,
              border:     `1.5px solid ${ORANGE}`,
              boxShadow:  value === n ? '0 2px 8px rgba(255,112,67,0.3)' : 'none',
              transition: 'all 0.12s',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CoachCSATSurvey() {
  const router   = useRouter();
  const { data: session, status } = useSession();
  const greeting = getTimeGreeting();

  const coachId = String(router.query.coachID || router.query.coachId || '');

  const [coachName,  setCoachName]  = useState('');
  const [scores,     setScores]     = useState(DEFAULT_SCORES);
  const [comment,    setComment]    = useState('');
  const [anonymous,  setAnonymous]  = useState(true);
  const [sent,       setSent]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [status, router]);

  // Load coach name
  useEffect(() => {
    if (!coachId || status !== 'authenticated') return;
    fetch('/api/users/names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [coachId] }),
    })
      .then((r) => r.json())
      .then((d) => {
        const name = Array.isArray(d.names) ? d.names[0] : '';
        if (name && name !== 'User') setCoachName(name);
      })
      .catch(() => {});
  }, [coachId, status]);

  const setScore = (key, val) => setScores((prev) => ({ ...prev, [key]: val }));

  const submit = async () => {
    const missing = QUESTIONS.find((q) => !scores[q.key]);
    if (missing) {
      alert(`Please rate all six questions (1–5). Missing: "${missing.label}"`);
      return;
    }
    if (!coachId) {
      alert('Invalid feedback link. Please contact your coach for a new link.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/coaching/csat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId, ...scores, comment: comment.trim(), anonymous }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || 'Error saving your response. Please try again.');
        return;
      }
      setSent(true);
    } catch {
      alert('Error saving your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-redirect after submit
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => router.push('/seeker-dashboard'), 4000);
    return () => clearTimeout(t);
  }, [sent, router]);

  if (status === 'loading' || status === 'unauthenticated') return null;

  const displayName = coachName || 'your coach';

  const HeaderBox = (
    <SeekerTitleCard
      greeting={greeting}
      title="Coaching Feedback"
      subtitle={`Share your experience with ${displayName}. Your feedback helps improve coaching quality on ForgeTomorrow.`}
    />
  );

  return (
    <SeekerLayout
      title="Coaching Feedback — ForgeTomorrow"
      header={HeaderBox}
      right={<RightRailPlacementManager surfaceId="feedback_internal" />}
      rightVariant="light"
      activeNav="messages"
    >
      {sent ? (
        <div style={{ ...GLASS, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <h2 style={{ color: ORANGE, margin: '0 0 8px', fontWeight: 900 }}>Thanks for your feedback!</h2>
          <p style={{ color: MUTED, margin: '0 0 20px', fontSize: 14, lineHeight: 1.6 }}>
            Your input helps {displayName} improve and deliver the best coaching experience possible.
          </p>
          <button
            type="button"
            onClick={() => router.push('/seeker-dashboard')}
            style={{ background: ORANGE, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            Back to Dashboard
          </button>
          <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 10 }}>Redirecting automatically…</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...GLASS, padding: '20px 24px' }}>
            <h2 style={{ margin: '0 0 4px', color: ORANGE, fontWeight: 900, fontSize: 18 }}>
              Client Satisfaction Survey
            </h2>
            <p style={{ margin: 0, color: MUTED, fontSize: 13, lineHeight: 1.5 }}>
              Rate your experience with <strong>{displayName}</strong> across six dimensions.
            </p>
          </div>

          <div style={WHITE_CARD}>
            {QUESTIONS.map((q) => (
              <CSATItem
                key={q.key}
                label={q.label}
                value={scores[q.key]}
                onChange={(v) => setScore(q.key, v)}
              />
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 700, color: '#263238', display: 'block', marginBottom: 8, fontSize: 14 }}>
                Additional comments (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Any feedback or suggestions…"
                style={{ border: '1.5px solid rgba(15,23,42,0.12)', borderRadius: 10, padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'white', outline: 'none', resize: 'vertical', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.55 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 20 }}>
              <input
                id="anon-internal"
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                style={{ accentColor: ORANGE, cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
              />
              <label htmlFor="anon-internal" style={{ color: '#37474F', fontSize: 13, cursor: 'pointer', lineHeight: 1.5 }}>
                <strong>Submit anonymously to the coach</strong>
                <span style={{ display: 'block', fontSize: 11, color: MUTED, marginTop: 2 }}>
                  ForgeTomorrow may retain visibility for moderation and platform audit purposes.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                style={{ background: submitting ? 'rgba(255,112,67,0.5)' : ORANGE, color: 'white', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14, boxShadow: submitting ? 'none' : '0 2px 8px rgba(255,112,67,0.3)' }}
              >
                {submitting ? 'Submitting…' : 'Submit Feedback'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={submitting}
                style={{ background: 'white', color: ORANGE, border: `1.5px solid ${ORANGE}`, borderRadius: 10, padding: '11px 20px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </SeekerLayout>
  );
}
