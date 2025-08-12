// pages/feedback/[coachId].js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const STORAGE_KEY = 'coachCSAT_v1';

export default function CoachCSATSurvey() {
  const router = useRouter();
  const coachId = String(router.query.coachId || router.query.coachID || 'demo-coach');

  // Resolve where to go after submit: ?next= -> sessionStorage 'lastRoute' -> same-origin referrer -> '/'
  const [nextDest, setNextDest] = useState('/');

  useEffect(() => {
    // 1) explicit ?next=
    const qNext = typeof router.query.next === 'string' ? router.query.next.trim() : '';
    if (qNext) {
      setNextDest(qNext);
      return;
    }

    // 2) sessionStorage lastRoute (set by _app.js RouteTracker)
    if (typeof window !== 'undefined') {
      try {
        const last = sessionStorage.getItem('lastRoute') || '';
        // Avoid redirecting back to the feedback page itself
        if (last && last !== router.asPath && !last.startsWith('/feedback/')) {
          setNextDest(last);
          return;
        }
      } catch {
        // ignore storage issues
      }
    }

    // 3) same-origin document.referrer (works for hard reloads / external entries)
    if (typeof window !== 'undefined' && document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin) {
          const path = ref.pathname + ref.search + ref.hash;
          if (path && !path.startsWith('/feedback/')) {
            setNextDest(path);
            return;
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    // 4) fallback already '/'
  }, [router.query.next, router.asPath]);

  const [scores, setScores] = useState({ satisfaction: 0, timeliness: 0, quality: 0 });
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [sent, setSent] = useState(false);

  const setScore = (key, val) => setScores(prev => ({ ...prev, [key]: val }));

  const submit = () => {
    const { satisfaction, timeliness, quality } = scores;
    if (!satisfaction || !timeliness || !quality) {
      alert('Please rate all three items (1–5).');
      return;
    }
    const rec = {
      id: Date.now(),
      coachId,
      satisfaction,
      timeliness,
      quality,
      comment: comment.trim(),
      anonymous,
      createdAt: new Date().toISOString(),
    };
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([rec, ...arr]));
      setSent(true);
    } catch (e) {
      console.error(e);
      alert('Error saving your response locally.');
    }
  };

  // After submit, redirect automatically after 3 seconds
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => {
      router.push(nextDest);
    }, 3000);
    return () => clearTimeout(t);
  }, [sent, nextDest, router]);

  if (sent) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          padding: '120px 20px 20px',
          minHeight: '100vh',
          backgroundColor: '#ECEFF1',
          placeItems: 'start center',
        }}
      >
        <main style={{ width: '100%', maxWidth: 860, display: 'grid', gap: 20 }}>
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <h2 style={{ color: '#FF7043', margin: 0 }}>Thanks for your feedback!</h2>
            <p style={{ color: '#607D8B', marginTop: 6, marginBottom: 10 }}>
              Your input helps us improve service quality.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => router.push(nextDest)}
                style={{
                  background: '#FF7043',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Return now
              </button>
              <span style={{ alignSelf: 'center', color: '#90A4AE', fontSize: 12 }}>
                You’ll be redirected automatically…
              </span>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        padding: '120px 20px 20px',
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
        placeItems: 'start center',
      }}
    >
      <main style={{ width: '100%', maxWidth: 860, display: 'grid', gap: 20 }}>
        {/* Header */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid #eee',
          }}
        >
          <h2 style={{ color: '#FF7043', margin: 0 }}>Client Satisfaction Survey</h2>
          <p style={{ color: '#607D8B', marginTop: 6, marginBottom: 0 }}>
            Coach ID: <strong>{coachId}</strong>
          </p>
        </section>

        {/* Survey */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid #eee',
          }}
        >
          <CSATItem
            label="Overall satisfaction with your coach"
            value={scores.satisfaction}
            onChange={(v) => setScore('satisfaction', v)}
          />
          <CSATItem
            label="Timeliness of responses or sessions"
            value={scores.timeliness}
            onChange={(v) => setScore('timeliness', v)}
          />
          <CSATItem
            label="Quality of coaching provided"
            value={scores.quality}
            onChange={(v) => setScore('quality', v)}
          />

          <div style={{ marginTop: 12 }}>
            <label
              style={{
                fontWeight: 700,
                color: '#263238',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Additional comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder="Any feedback or suggestions…"
              style={{
                border: '1px solid #ddd',
                borderRadius: 10,
                padding: '10px',
                width: '100%',
                background: 'white',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              id="anon"
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            <label htmlFor="anon" style={{ color: '#37474F' }}>
              Submit anonymously
            </label>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={submit}
              style={{
                background: '#FF7043',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                background: 'white',
                color: '#FF7043',
                border: '1px solid #FF7043',
                borderRadius: 10,
                padding: '10px 12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function CSATItem({ label, value, onChange }) {
  return (
    <div style={{ marginTop: 12 }}>
      <label
        style={{
          fontWeight: 700,
          color: '#263238',
          display: 'block',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} out of 5`}
            style={{
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              fontSize: 16,
              minWidth: 40,
              textAlign: 'center',
              background: value === n ? '#FF7043' : 'white',
              color: value === n ? 'white' : '#FF7043',
              border: '1px solid #FF7043',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
