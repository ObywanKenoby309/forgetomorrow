// pages/feedback/public/[token].js
// External CSAT feedback page — no authentication required.
// getServerSideProps resolves the token and fetches coach data + wallpaper
// before the page renders — no client-side blip.
// AppShell provides LandingHeader and LandingFooter for this public route.

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const ORANGE = '#FF7043';
const SLATE  = '#334155';
const MUTED  = '#64748B';
const DEFAULT_WALLPAPER = '/images/profile-fallbacks/profile-default-wallpaper.png';
const THANK_YOU_SEAL = '/images/csat/thank-you-seal.png';
const TOKEN_SECRET = process.env.CSAT_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;

const QUESTIONS = [
  { key: 'satisfaction',   label: 'Overall satisfaction with your coaching',       hint: 'How satisfied were you overall?' },
  { key: 'communication',  label: 'Coach communication and responsiveness',         hint: 'Were they easy to reach and responsive?' },
  { key: 'quality',        label: 'Quality of guidance provided',                  hint: 'Was the coaching advice clear and actionable?' },
  { key: 'helpfulness',    label: 'Helpfulness of resources or action steps',      hint: 'Did the resources or exercises help you move forward?' },
  { key: 'progress',       label: 'Progress made toward your career goal',         hint: 'How much progress did you feel you made?' },
  { key: 'recommendation', label: 'Likelihood you would recommend this coach',     hint: 'Would you refer this coach to someone you care about?' },
];

const DEFAULT_SCORES = QUESTIONS.reduce((acc, q) => ({ ...acc, [q.key]: 0 }), {});

export async function getServerSideProps(context) {
  const { token } = context.params;

  if (!token) {
    return { props: { tokenError: 'Missing feedback token.' } };
  }

  try {
    let payload;
    try {
      payload = jwt.verify(String(token), TOKEN_SECRET);
    } catch {
      return { props: { tokenError: 'This feedback link is invalid or has expired.' } };
    }

    const coachId = String(payload?.coachId || '').trim();
    if (!coachId) {
      return { props: { tokenError: 'Malformed feedback token.' } };
    }

    const coach = await prisma.user.findUnique({
      where: { id: coachId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        headline: true,
        avatarUrl: true,
        wallpaperUrl: true,
        deletedAt: true,
      },
    });

    if (!coach || coach.deletedAt) {
      return { props: { tokenError: 'The coach associated with this link no longer exists.' } };
    }

    const coachName =
      [coach.firstName, coach.lastName].filter(Boolean).join(' ') ||
      coach.name ||
      'Your coach';

    return {
      props: {
        coachId,
        coachName,
        coachHeadline: coach.headline || null,
        coachAvatar: coach.avatarUrl || null,
        wallpaperUrl: coach.wallpaperUrl || null,
        tokenError: null,
      },
    };
  } catch (err) {
    console.error('[feedback/public] getServerSideProps error:', err);
    return { props: { tokenError: 'Could not load this feedback link. Please try again.' } };
  }
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function JoinCard() {
  return (
    <aside style={{
      background: 'rgba(255,255,255,0.90)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.30)',
      borderRadius: 14,
      padding: '24px 20px',
      display: 'grid',
      gap: 14,
      alignSelf: 'start',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>
          ForgeTomorrow
        </div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: SLATE, lineHeight: 1.3 }}>
          Build your career with intention.
        </h3>
      </div>

      <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.65 }}>
        ForgeTomorrow connects seekers with coaches and recruiters on a platform built for real career growth — not just job hunting.
      </p>

      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
        {[
          'AI-powered career coaching',
          'Interview prep and resume tools',
          'Direct access to verified coaches',
          'Ethical, privacy-first platform',
        ].map((item) => (
          <li key={item} style={{ fontSize: 13, color: SLATE, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: ORANGE, fontWeight: 700, flexShrink: 0 }}>✦</span>
            {item}
          </li>
        ))}
      </ul>

      <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.55, fontStyle: 'italic' }}>
        Everything needed for coaching, meetings, and career growth in one platform.
      </p>

      <Link
        href="/pricing"
        style={{
          display: 'block',
          background: ORANGE,
          color: 'white',
          textDecoration: 'none',
          textAlign: 'center',
          padding: '11px 16px',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 14,
          boxShadow: '0 2px 8px rgba(255,112,67,0.28)',
        }}
      >
        Explore Plans & Features
      </Link>

      <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
        No credit card required.
      </p>
    </aside>
  );
}

function CSATItem({ label, hint, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontWeight: 700, color: '#263238', display: 'block', marginBottom: 3, fontSize: 14 }}>
        {label}
      </label>
      {hint && (
        <p style={{ margin: '0 0 8px', fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{hint}</p>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} out of 5`}
            style={{
              borderRadius: 10,
              padding: '10px 14px',
              cursor: 'pointer',
              fontSize: 15,
              minWidth: 44,
              fontWeight: 700,
              fontFamily: 'inherit',
              background: value === n ? ORANGE : 'white',
              color: value === n ? 'white' : ORANGE,
              border: `1.5px solid ${ORANGE}`,
              boxShadow: value === n ? '0 2px 8px rgba(255,112,67,0.3)' : 'none',
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

export default function PublicCSATSurvey({
  coachId,
  coachName,
  coachHeadline,
  coachAvatar,
  wallpaperUrl,
  tokenError,
}) {
  const effectiveWallpaper = wallpaperUrl || DEFAULT_WALLPAPER;
  const displayName = coachName || 'your coach';

  const [scores, setScores] = useState(DEFAULT_SCORES);
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setScore = (key, val) => setScores((prev) => ({ ...prev, [key]: val }));

  const submit = async () => {
    const missing = QUESTIONS.find((q) => !scores[q.key]);
    if (missing) {
      alert(`Please rate all six questions (1–5). Missing: "${missing.label}"`);
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

  return (
    <>
      <Head>
        <title>Coaching Feedback — ForgeTomorrow</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundImage: `url(${effectiveWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}>
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: 'linear-gradient(180deg, rgba(10,18,30,0.55) 0%, rgba(10,18,30,0.30) 50%, rgba(10,18,30,0.55) 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <main style={{ padding: '28px 20px 48px', maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            {tokenError ? (
              <div style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,205,210,0.60)', borderRadius: 12, padding: '28px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                <h2 style={{ margin: '0 0 8px', color: SLATE, fontWeight: 900 }}>Link unavailable</h2>
                <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>{tokenError}</p>
              </div>
            ) : sent ? (
              <div style={{ display: 'grid', gap: 20, maxWidth: 560, margin: '0 auto' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.90)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: 14,
                  padding: '28px 28px 30px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                  border: '1px solid rgba(255,255,255,0.30)',
                  textAlign: 'center',
                }}>
                  <img
                    src={THANK_YOU_SEAL}
                    alt="Thank you"
                    style={{
                      display: 'block',
                      width: 'min(75%, 380px)',
                      height: 'auto',
                      margin: '0 auto 14px',
                      objectFit: 'contain',
                    }}
                  />

                  <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    Your feedback contributes to a better coaching experience for future clients and helps maintain the quality of coaching on ForgeTomorrow.
                  </p>
                </div>

                <JoinCard />
              </div>
            ) : (
              <div
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: 24, alignItems: 'start' }}
                className="csat-public-grid"
              >
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.30)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                      {coachAvatar ? (
                        <img
                          src={coachAvatar}
                          alt={displayName}
                          style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,112,67,0.3)', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: `linear-gradient(135deg, ${ORANGE} 0%, #FF8A65 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          fontWeight: 900,
                          color: 'white',
                          border: '2px solid rgba(255,112,67,0.3)',
                        }}>
                          {initials(displayName)}
                        </div>
                      )}

                      <div>
                        <div style={{ fontWeight: 900, fontSize: 16, color: SLATE }}>{displayName}</div>
                        {coachHeadline && (
                          <div style={{ fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>{coachHeadline}</div>
                        )}
                      </div>
                    </div>

                    <h1 style={{ margin: '0 0 6px', color: ORANGE, fontWeight: 900, fontSize: 18 }}>
                      Coaching Feedback
                    </h1>

                    <p style={{ margin: 0, color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
                      Please share your feedback regarding your coaching experience with <strong style={{ color: SLATE }}>{displayName}</strong>. Rate each dimension 1–5. Your responses are private by default.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.30)' }}>
                    {QUESTIONS.map((q) => (
                      <CSATItem
                        key={q.key}
                        label={q.label}
                        hint={q.hint}
                        value={scores[q.key]}
                        onChange={(v) => setScore(q.key, v)}
                      />
                    ))}

                    <div style={{ marginBottom: 18 }}>
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
                        id="anon-external"
                        type="checkbox"
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                        style={{ accentColor: ORANGE, cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
                      />

                      <label htmlFor="anon-external" style={{ color: '#37474F', fontSize: 13, cursor: 'pointer', lineHeight: 1.5 }}>
                        <strong>Submit anonymously to the coach</strong>
                        <span style={{ display: 'block', fontSize: 11, color: MUTED, marginTop: 2 }}>
                          ForgeTomorrow may retain visibility for moderation and platform audit purposes.
                        </span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                      style={{
                        background: submitting ? 'rgba(255,112,67,0.5)' : ORANGE,
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        padding: '12px 28px',
                        fontWeight: 700,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        boxShadow: submitting ? 'none' : '0 2px 8px rgba(255,112,67,0.3)',
                      }}
                    >
                      {submitting ? 'Submitting…' : 'Submit Feedback'}
                    </button>
                  </div>
                </div>

                <JoinCard />
              </div>
            )}
          </main>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .csat-public-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}