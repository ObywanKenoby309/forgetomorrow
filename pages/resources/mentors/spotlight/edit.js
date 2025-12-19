// pages/resources/mentors/spotlight/edit.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Coaching shell
import CoachingLayout from '@/components/layouts/CoachingLayout';

const SPECIALTY_OPTIONS = [
  'Resume Review',
  'Interview Prep',
  'Career Strategy',
  'Portfolio Review',
  'Networking',
  'Salary/Negotiation',
  'Career Pivot',
];

export default function EditSpotlightPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'coach').toLowerCase();

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [form, setForm] = useState({
    name: '',
    headline: '',
    summary: '',
    specialties: [],
    rate: 'Free',
    availability: 'Open to discuss',
  });

  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleSpecialty = (s) =>
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }));

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.headline.trim()) return false;
    if (!form.summary.trim()) return false;
    return true;
  }, [form]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/spotlight/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to load spotlight');
        }

        const data = await res.json();
        if (!active) return;

        const s = data?.spotlight;
        if (!s?.id) {
          // No spotlight yet → bounce to create
          router.push(withChrome('/resources/mentors/spotlight/new'));
          return;
        }

        setForm({
          name: s.name || '',
          headline: s.headline || '',
          summary: s.summary || '',
          specialties: Array.isArray(s.specialties) ? s.specialties : [],
          rate: s.rate || 'Free',
          availability: s.availability || 'Open to discuss',
        });
      } catch (e) {
        console.error(e);
        if (!active) return;
        setError('Unable to load your spotlight. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSent(false);

    if (!canSubmit || saving) return;

    setSaving(true);

    try {
      const res = await fetch('/api/spotlight/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          headline: form.headline,
          summary: form.summary,
          specialties: form.specialties,
          rate: form.rate,
          availability: form.availability,
        }),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update spotlight');
      }

      setSent(true);

      setTimeout(() => {
        router.push(withChrome('/hearth/spotlights'));
      }, 900);
    } catch (err) {
      console.error(err);
      setError('Unable to update spotlight. Please try again.');
      setSaving(false);
    }
  };

  const HeaderBox = (
    <section style={glassHero}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Edit Your Hearth Spotlight
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Update your offering. Your public Spotlight card updates immediately after save.
      </p>
    </section>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 14 }}>Spotlight publishing</div>
      <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.4 }}>
        External links are removed. This will route through ForgeTomorrow:
        <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
          <li>Messaging (coach slug)</li>
          <li>Calendar scheduling (coach slug)</li>
        </ul>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          paddingTop: 12,
          display: 'grid',
          gap: 10,
        }}
      >
        <Link
          href={withChrome('/hearth/spotlights')}
          style={{
            display: 'block',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'white',
            borderRadius: 10,
            padding: '10px 12px',
            fontWeight: 800,
            textDecoration: 'none',
            textAlign: 'center',
          }}
        >
          View Spotlights
        </Link>
      </div>
    </div>
  );

  return (
    <CoachingLayout
      title="Edit Hearth Spotlight | ForgeTomorrow"
      header={HeaderBox}
      activeNav="resources"
      right={RightRail}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <section style={glassCard}>
        {error && <div style={warnBox}>{error}</div>}
        {sent && <div style={okBox}>Saved. Redirecting to Spotlights…</div>}

        <div style={infoBox}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Contact is platform-native</div>
          <div>
            This spotlight routes through ForgeTomorrow messaging and calendar scheduling tied to your coach slug.
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#90A4AE' }}>Loading your spotlight…</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Your name</label>
                <input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  style={input}
                  required
                />
              </div>
              <div>
                <label style={label}>Headline</label>
                <input
                  value={form.headline}
                  onChange={(e) => update('headline', e.target.value)}
                  style={input}
                  placeholder="e.g., Senior PM mentor for career pivots"
                  required
                />
              </div>
            </div>

            <div>
              <label style={label}>Short summary</label>
              <textarea
                value={form.summary}
                onChange={(e) => update('summary', e.target.value)}
                rows={5}
                placeholder="1–3 sentences on how you can help…"
                style={{ ...input, resize: 'vertical' }}
                required
              />
            </div>

            <div>
              <label style={label}>Specialties</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SPECIALTY_OPTIONS.map((s) => (
                  <label
                    key={s}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14,
                      color: '#37474F',
                      background: 'rgba(255,255,255,0.65)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: 999,
                      padding: '6px 10px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.specialties.includes(s)}
                      onChange={() => toggleSpecialty(s)}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Rate</label>
                <select value={form.rate} onChange={(e) => update('rate', e.target.value)} style={input}>
                  <option>Free</option>
                  <option>Paid</option>
                  <option>Sliding</option>
                </select>
              </div>
              <div>
                <label style={label}>Availability</label>
                <select
                  value={form.availability}
                  onChange={(e) => update('availability', e.target.value)}
                  style={input}
                >
                  <option>Open to discuss</option>
                  <option>Limited slots</option>
                  <option>Waitlist</option>
                </select>
              </div>
              <div />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="submit" style={btnPrimary} disabled={!canSubmit || saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <Link href={withChrome('/dashboard/coaching/resources')} style={btnGhost}>
                Back to Resources
              </Link>
            </div>
          </form>
        )}
      </section>
    </CoachingLayout>
  );
}

/* ---------- Glass styles (matches your New page) ---------- */

const glassBase = {
  background: 'rgba(255,255,255,0.78)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 14,
  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const glassHero = {
  ...glassBase,
  padding: 16,
  textAlign: 'center',
};

const glassCard = {
  ...glassBase,
  padding: 20,
  margin: 0,
};

const label = {
  display: 'block',
  fontSize: 12,
  color: '#607D8B',
  marginBottom: 6,
  fontWeight: 800,
};

const input = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 12,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  background: 'rgba(255,255,255,0.85)',
};

const btnPrimary = {
  background: '#FF7043',
  color: 'white',
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  fontWeight: 800,
  textDecoration: 'none',
  cursor: 'pointer',
};

const btnGhost = {
  background: 'rgba(255,255,255,0.85)',
  color: '#FF7043',
  border: '1px solid #FF7043',
  borderRadius: 12,
  padding: '10px 14px',
  fontWeight: 800,
  textDecoration: 'none',
  cursor: 'pointer',
};

const warnBox = {
  background: 'rgba(255,243,224,0.9)',
  border: '1px solid #FFCC80',
  borderRadius: 12,
  padding: 10,
  color: '#6D4C41',
  fontSize: 13,
  marginBottom: 12,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const okBox = {
  background: 'rgba(232,245,233,0.9)',
  border: '1px solid #C8E6C9',
  borderRadius: 12,
  padding: 10,
  color: '#2E7D32',
  fontSize: 13,
  marginBottom: 12,
  fontWeight: 800,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const infoBox = {
  background: 'rgba(227,242,253,0.9)',
  border: '1px solid #BBDEFB',
  borderRadius: 12,
  padding: 12,
  color: '#0D47A1',
  fontSize: 13,
  marginBottom: 12,
  lineHeight: 1.4,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
