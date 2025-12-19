// pages/resources/mentors/spotlight/new.js
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

import { useUserWallpaper } from '@/hooks/useUserWallpaper';

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

  const { wallpaperUrl } = useUserWallpaper();

  const backgroundStyle = useMemo(() => {
    return wallpaperUrl
      ? {
          minHeight: '100%',
          backgroundImage: `url(${wallpaperUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          borderRadius: 12,
          padding: 16,
        }
      : {
          minHeight: '100%',
          backgroundColor: '#ECEFF1',
          borderRadius: 12,
          padding: 16,
        };
  }, [wallpaperUrl]);

  const [form, setForm] = useState({
    name: '',
    headline: '',
    summary: '',
    specialties: [],
    rate: 'Free',
    availability: 'Open to discuss',
    contactEmail: '',
    contactLink: '',
  });

  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSpecialty = (s) =>
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    if (!form.name.trim() || !form.headline.trim() || !form.summary.trim()) {
      setErr('Name, headline, and summary are required.');
      return;
    }
    if (!form.contactEmail.trim() && !form.contactLink.trim()) {
      setErr('Please provide at least one contact method (email or link).');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/hearth/spotlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          headline: form.headline.trim(),
          summary: form.summary.trim(),
          specialties: [...form.specialties],
          rate: form.rate,
          availability: form.availability,
          contactEmail: form.contactEmail.trim(),
          contactLink: form.contactLink.trim(),
        }),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Error saving spotlight.');
      }

      setSent(true);
      setTimeout(() => router.push(withChrome('/hearth/spotlights')), 900);
    } catch (error) {
      console.error(error);
      setErr(error?.message || 'Error saving spotlight.');
    } finally {
      setSaving(false);
    }
  };

  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Post a Hearth Spotlight
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Share what you offer and how seekers can reach you.
      </p>
    </section>
  );

  return (
    <CoachingLayout
      title="Post a Hearth Spotlight | ForgeTomorrow"
      header={HeaderBox}
      activeNav="resources"
      right={<CoachingRightColumn />}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div style={backgroundStyle}>
        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <Link href={withChrome('/hearth/spotlights')} style={btnGhost}>
              ← Back to Spotlights
            </Link>

            <Link href={withChrome('/the-hearth')} style={btnGhost}>
              Back to The Hearth
            </Link>
          </div>

          <div style={{ height: 10 }} aria-hidden="true" />

          {err ? (
            <div
              style={{
                background: '#FFF3E0',
                border: '1px solid #FFCC80',
                borderRadius: 10,
                padding: 10,
                color: '#6D4C41',
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {err}
            </div>
          ) : null}

          {sent ? (
            <div
              style={{
                background: '#E8F5E9',
                border: '1px solid #C8E6C9',
                borderRadius: 10,
                padding: 10,
                color: '#2E7D32',
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              Spotlight published. Redirecting…
            </div>
          ) : null}

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
                <select value={form.availability} onChange={(e) => update('availability', e.target.value)} style={input}>
                  <option>Open to discuss</option>
                  <option>Limited slots</option>
                  <option>Waitlist</option>
                </select>
              </div>
              <div />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Contact email (or leave blank)</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => update('contactEmail', e.target.value)}
                  style={input}
                  placeholder="you@domain.com"
                />
              </div>
              <div>
                <label style={label}>Contact link (Calendly/LinkedIn/etc.)</label>
                <input
                  value={form.contactLink}
                  onChange={(e) => update('contactLink', e.target.value)}
                  style={input}
                  placeholder="https://…"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={btnPrimary} disabled={saving}>
                {saving ? 'Publishing…' : 'Publish Spotlight'}
              </button>
              <Link href={withChrome('/hearth/spotlights')} style={btnGhost}>
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </div>
    </CoachingLayout>
  );
}

/* Styles */
const card = {
  background: 'white',
  border: '1px solid #eee',
  borderRadius: 12,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  padding: 20,
  margin: 0,
};

const label = {
  display: 'block',
  fontSize: 12,
  color: '#607D8B',
  marginBottom: 6,
  fontWeight: 700,
};

const input = {
  border: '1px solid #ddd',
  borderRadius: 10,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  background: 'white',
};

const btnPrimary = {
  background: '#FF7043',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '10px 12px',
  fontWeight: 700,
  textDecoration: 'none',
  cursor: 'pointer',
};

const btnGhost = {
  background: 'white',
  color: '#FF7043',
  border: '1px solid #FF7043',
  borderRadius: 10,
  padding: '10px 12px',
  fontWeight: 700,
  textDecoration: 'none',
  cursor: 'pointer',
};
