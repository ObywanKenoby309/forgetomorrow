// pages/feedback/public/[token].js
// External CSAT feedback page — no authentication required.
// Token-based. Coach wallpaper pulled to match their profile aesthetic.
// getLayout bypasses _app.js entirely — this page manages its own shell.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const ORANGE   = '#FF7043';
const SLATE    = '#334155';
const MUTED    = '#64748B';
const LIGHT_BG = '#F8FAFC';
const DEFAULT_WALLPAPER = '/images/profile-fallbacks/profile-default-wallpaper.png';

// The six CSAT questions — same as internal page
const QUESTIONS = [
  { key: 'satisfaction',   label: 'Overall satisfaction with your coaching' },
  { key: 'communication',  label: 'Coach communication and responsiveness' },
  { key: 'quality',        label: 'Quality of guidance provided' },
  { key: 'helpfulness',    label: 'Helpfulness of resources or action steps' },
  { key: 'progress',       label: 'Progress made toward your career goal' },
  { key: 'recommendation', label: 'Likelihood you would recommend this coach' },
];

const DEFAULT_SCORES = QUESTIONS.reduce((acc, q) => ({ ...acc, [q.key]: 0 }), {});

// ── Minimal public header ──────────────────────────────────────────────────
function PublicHeader() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(15,23,42,0.08)',
      padding: '0 24px',
      height: 54,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontWeight: 900, fontSize: 18, color: ORANGE, letterSpacing: '-0.01em' }}>
          ForgeTomorrow
        </span>
      </Link>
      <Link href="/auth/signin" style={{
        fontSize: 12, fontWeight: 600, color: MUTED,
        textDecoration: 'none', padding: '5px 12px',
        border: '1px solid rgba(15,23,42,0.10)',
        borderRadius: 8, background: 'white',
      }}>
        Sign In
      </Link>
    </header>
  );
}

// ── Minimal public footer ──────────────────────────────────────────────────
function PublicFooter() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(15,23,42,0.08)',
      padding: '18px 24px',
      textAlign: 'center',
      fontSize: 12,
      color: MUTED,
      background: 'white',
    }}>
      © {new Date().getFullYear()} ForgeTomorrow. All rights reserved.{' '}
      <Link href="/privacy" style={{ color: MUTED }}>Privacy</Link>
      {' · '}
      <Link href="/terms" style={{ color: MUTED }}>Terms</Link>
    </footer>
  );
}

// ── Join ForgeTomorrow side card ───────────────────────────────────────────
function JoinCard() {
  return (
    <aside style={{
      background: 'white',
      border: '1px solid rgba(255,112,67,0.15)',
      borderRadius: 14,
      padding: '24px 20px',
      display: 'grid',
      gap: 14,
      alignSelf: 'start',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
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

      <Link
        href="/auth/signup"
        style={{
          display: 'block', background: ORANGE, color: 'white',
          textDecoration: 'none', textAlign: 'center',
          padding: '11px 16px', borderRadius: 10, fontWeight: 700, fontSize: 14,
          boxShadow: '0 2px 8px rgba(255,112,67,0.28)',
        }}
      >
        Join ForgeTomorrow Free
      </Link>

      <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
        No credit card required.
      </p>
    </aside>
  );
}

// ── CSAT rating row ────────────────────────────────────────────────────────
function CSATItem({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 22 }}>
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

// ── Page component ─────────────────────────────────────────────────────────
export default function PublicCSATSurvey() {
  const router = useRouter();
  const { token } = router.query;

  const [tokenData,    setTokenData]    = useState(null);
  const [tokenError,   setTokenError]   = useState('');
  const [tokenLoading, setTokenLoading] = useState(true);
  const [wallpaper,    setWallpaper]    = useState('');

  const [scores,     setScores]     = useState(DEFAULT_SCORES);
  const [comment,    setComment]    = useState('');
  const [anonymous,  setAnonymous]  = useState(true);
  const [sent,       setSent]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Resolve token → coachId + coachName
  useEffect(() => {
    if (!token) return;
    setTokenLoading(true);
    fetch(`/api/feedback/resolve-token?token=${encodeURIComponent(String(token))}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.coachId) {
          setTokenData(d);
        } else {
          setTokenError(d?.error || 'This feedback link is invalid or has expired.');
        }
      })
      .catch(() => setTokenError('Could not load this feedback link. Please try again.'))
      .finally(() => setTokenLoading(false));
  }, [token]);

  // Load coach wallpaper once we have coachId
  useEffect(() => {
    if (!tokenData?.coachId) return;
    fetch(`/api/feedback/coach-wallpaper?coachId=${encodeURIComponent(tokenData.coachId)}`)
      .then((r) => r.json())
      .then((d) => { if (d?.wallpaperUrl) setWallpaper(d.wallpaperUrl); })
      .catch(() => {});
  }, [tokenData?.coachId]);

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
        body: JSON.stringify({ coachId: tokenData.coachId, ...scores, comment: comment.trim(), anonymous }),
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

  const displayName  = tokenData?.coachName || 'your coach';
  const effectiveWallpaper = wallpaper || DEFAULT_WALLPAPER;

  return (
    <>
      <Head>
        <title>Coaching Feedback — ForgeTomorrow</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: LIGHT_BG, fontFamily: 'inherit' }}>
        <PublicHeader />

        {/* Coach wallpaper hero strip */}
        {!tokenLoading && !tokenError && (
          <div style={{
            height: 120,
            background: `url(${effectiveWallpaper}) center/cover no-repeat`,
            position: 'relative',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.48) 100%)',
            }} />
            <div style={{
              position: 'absolute', bottom: 16, left: 24,
              color: 'white', fontSize: 13, fontWeight: 700,
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}>
              Feedback for <span style={{ color: '#FFB39A' }}>{displayName}</span>
            </div>
          </div>
        )}

        <main style={{ flex: 1, padding: '28px 20px 48px', maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {tokenLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED, fontSize: 14 }}>
              Loading feedback form…
            </div>
          ) : tokenError ? (
            <div style={{ background: 'white', border: '1px solid #FFCDD2', borderRadius: 12, padding: '28px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
              <h2 style={{ margin: '0 0 8px', color: SLATE, fontWeight: 900 }}>Link unavailable</h2>
              <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>{tokenError}</p>
            </div>
          ) : sent ? (
            <div style={{ display: 'grid', gap: 20, maxWidth: 560, margin: '0 auto' }}>
              <div style={{ background: 'white', borderRadius: 14, padding: '36px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h2 style={{ color: ORANGE, margin: '0 0 10px', fontWeight: 900, fontSize: 22 }}>Thank you!</h2>
                <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  Your feedback has been submitted. {displayName} will use your input to continue improving their coaching.
                </p>
              </div>
              <JoinCard />
            </div>
          ) : (
            <div
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: 24, alignItems: 'start' }}
              className="csat-public-grid"
            >
              {/* Form */}
              <div style={{ display: 'grid', gap: 16 }}>
                {/* Intro card */}
                <div style={{ background: 'white', borderRadius: 14, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <h1 style={{ margin: '0 0 8px', color: ORANGE, fontWeight: 900, fontSize: 20 }}>
                    Coaching Feedback
                  </h1>
                  <p style={{ margin: 0, color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
                    <strong style={{ color: SLATE }}>{displayName}</strong> has requested your feedback on their coaching. Rate each dimension 1–5 and leave an optional comment. Your responses are private.
                  </p>
                </div>

                {/* Questions card */}
                <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  {QUESTIONS.map((q) => (
                    <CSATItem
                      key={q.key}
                      label={q.label}
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
                      color: 'white', border: 'none', borderRadius: 10,
                      padding: '12px 28px', fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: 14, boxShadow: submitting ? 'none' : '0 2px 8px rgba(255,112,67,0.3)',
                    }}
                  >
                    {submitting ? 'Submitting…' : 'Submit Feedback'}
                  </button>
                </div>
              </div>

              {/* Side card */}
              <JoinCard />
            </div>
          )}
        </main>

        <PublicFooter />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .csat-public-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

// Bypass _app.js AppShell entirely — this page is a public standalone shell
PublicCSATSurvey.getLayout = (page) => page;
