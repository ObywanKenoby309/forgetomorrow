// pages/resources/mentors/spotlight/new.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingTitleCard from '@/components/coaching/CoachingTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const SPECIALTY_OPTIONS = [
  'Resume Review',
  'Interview Prep',
  'Career Strategy',
  'Portfolio Review',
  'Networking',
  'Salary/Negotiation',
  'Career Pivot',
];

export default function NewSpotlightPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'coach').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const greeting = getTimeGreeting();

  const [accountName, setAccountName] = useState('');
  const [accountLoading, setAccountLoading] = useState(true);

  const [form, setForm] = useState({
    headline: '',
    hook: '',
    summary: '',
    whyICoach: '',
    specialties: [],
    rate: 'Free',
    availability: 'Open to discuss',
  });

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
    return accountName.trim() && form.headline.trim() && form.summary.trim();
  }, [accountName, form]);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      setAccountLoading(true);
      setError('');
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) throw new Error('Failed to load account');

        const data = await res.json();
        if (!active) return;

        const user = data?.user;
        if (!user) {
          router.push('/login');
          return;
        }

        const lockedName =
          user.name ||
          [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
          user.email ||
          '';

        if (!lockedName) {
          throw new Error('No account name found');
        }

        setAccountName(lockedName);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError('Unable to load your account name. Please try again.');
      } finally {
        if (active) setAccountLoading(false);
      }
    }

    loadAccount();
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
      const res = await fetch('/api/hearth/spotlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: accountName,
          headline: form.headline,
          hook: form.hook || null,
          summary: form.summary,
          whyICoach: form.whyICoach || null,
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
        throw new Error(data?.error || 'Failed to save spotlight');
      }

      setSent(true);
      setTimeout(() => router.push(withChrome('/hearth/spotlights')), 900);
    } catch (err) {
      console.error(err);
      setError('Unable to publish spotlight. Please try again.');
      setSaving(false);
    }
  };

  const HeaderBox = (
    <CoachingTitleCard
      greeting={greeting}
      title="Post a Hearth Spotlight"
      subtitle="Share what you offer. Clients will connect through ForgeTomorrow messaging and scheduling."
      isMobile={false}
    />
  );

  const RightRail = <RightRailPlacementManager slot="right_rail_1" />;

  return (
    <CoachingLayout
      title="Post a Hearth Spotlight | ForgeTomorrow"
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

        {accountLoading ? (
          <div style={{ color: '#90A4AE' }}>Loading your account…</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Account name</label>
                <div style={lockedField}>{accountName}</div>
                <div style={fieldNote}>This is tied to the name on your registered account.</div>
              </div>

              <div>
                <label style={label}>
                  Headline <Required />
                </label>
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
              <label style={label}>
                One-line hook
                <span style={fieldHint}> — the first thing seekers read on your card</span>
              </label>
              <input
                value={form.hook}
                onChange={(e) => update('hook', e.target.value)}
                style={input}
                placeholder="e.g., Land interviews faster — backed by 10 years of recruiter strategy"
                maxLength={120}
              />
              <div style={charCount}>{form.hook.length}/120</div>
            </div>

            <div>
              <label style={label}>
                Short summary <Required />
              </label>
              <textarea
                value={form.summary}
                onChange={(e) => update('summary', e.target.value)}
                rows={4}
                placeholder="1–3 sentences on how you help and who you help best…"
                style={{ ...input, resize: 'vertical' }}
                required
              />
            </div>

            <div>
              <label style={label}>
                Why I coach
                <span style={fieldHint}> — shows as a quote on your detail card</span>
              </label>
              <textarea
                value={form.whyICoach}
                onChange={(e) => update('whyICoach', e.target.value)}
                rows={3}
                placeholder="Your personal reason for coaching. Be honest — this builds more trust than any credential."
                style={{ ...input, resize: 'vertical' }}
                maxLength={300}
              />
              <div style={charCount}>{form.whyICoach.length}/300</div>
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
                      background: form.specialties.includes(s)
                        ? 'rgba(255,112,67,0.1)'
                        : 'rgba(255,255,255,0.65)',
                      border: form.specialties.includes(s)
                        ? '1px solid rgba(255,112,67,0.4)'
                        : '1px solid rgba(0,0,0,0.06)',
                      borderRadius: 999,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.specialties.includes(s)}
                      onChange={() => toggleSpecialty(s)}
                      style={{ accentColor: '#FF7043' }}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Rate</label>
                <select
                  value={form.rate}
                  onChange={(e) => update('rate', e.target.value)}
                  style={input}
                >
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
                {saving ? 'Publishing…' : 'Publish Spotlight'}
              </button>
              <Link href={withChrome('/hearth/spotlights')} style={btnGhost}>
                Cancel
              </Link>
            </div>
          </form>
        )}
      </section>
    </CoachingLayout>
  );
}

function Required() {
  return <span style={{ color: '#FF7043', marginLeft: 2 }}>*</span>;
}

const glassBase = {
  background: 'rgba(255,255,255,0.78)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 14,
  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const glassCard = { ...glassBase, padding: 20, margin: 0 };
const label = {
  display: 'block',
  fontSize: 12,
  color: '#607D8B',
  marginBottom: 6,
  fontWeight: 800,
};
const fieldHint = { fontWeight: 400, color: '#90A4AE' };
const fieldNote = { fontSize: 11, color: '#90A4AE', marginTop: 6 };
const charCount = { fontSize: 11, color: '#90A4AE', textAlign: 'right', marginTop: 3 };
const input = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 12,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  background: 'rgba(255,255,255,0.85)',
  fontFamily: 'inherit',
  fontSize: 13,
};
const lockedField = {
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  padding: '10px 12px',
  width: '100%',
  background: 'rgba(248,250,252,0.95)',
  color: '#37474F',
  fontSize: 13,
  fontWeight: 700,
};
const btnPrimary = {
  background: '#FF7043',
  color: 'white',
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  fontWeight: 800,
  cursor: 'pointer',
  fontSize: 13,
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
  fontSize: 13,
};
const warnBox = {
  background: 'rgba(255,243,224,0.9)',
  border: '1px solid #FFCC80',
  borderRadius: 12,
  padding: 10,
  color: '#6D4C41',
  fontSize: 13,
  marginBottom: 12,
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
};