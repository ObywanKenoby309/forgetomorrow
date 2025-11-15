// pages/resources/mentors/spotlight/new.js
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Coaching shell (matches follow-ups pattern)
import CoachingLayout from '@/components/layouts/CoachingLayout';

// Sidebars
import CoachingSidebar from '../../../../components/coaching/CoachingSidebar';

const STORAGE_KEY = 'hearthSpotlights_v1';

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
  const [sent, setSent] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleSpecialty = (s) =>
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.headline.trim() || !form.summary.trim()) {
      alert('Name, headline, and summary are required.');
      return;
    }
    if (!form.contactEmail.trim() && !form.contactLink.trim()) {
      alert('Please provide at least one contact method (email or link).');
      return;
    }

    const rec = {
      id: Date.now(),
      name: form.name.trim(),
      headline: form.headline.trim(),
      summary: form.summary.trim(),
      specialties: [...form.specialties],
      rate: form.rate,
      availability: form.availability,
      contactEmail: form.contactEmail.trim(),
      contactLink: form.contactLink.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([rec, ...arr]));
      setSent(true);
      setTimeout(() => router.push('/hearth/spotlights'), 1200);
    } catch (err) {
      console.error(err);
      alert('Error saving locally.');
    }
  };

  // Coaching header (same pattern as follow-ups)
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

  const Body = (
    <div style={layoutWrap}>
      {/* Left sidebar (same width as right) */}
      <CoachingSidebar active="resources" />

      {/* Middle column */}
      <main style={main}>
        {/* Title strip is now supplied via CoachingLayout header prop. Keep a tidy spacer to align grid. */}
        <div style={{ height: 8 }} aria-hidden="true" />

        {/* Form */}
        <section style={card}>
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
              <button type="submit" style={btnPrimary}>Publish Spotlight</button>
              <Link href="/hearth/spotlights" style={btnGhost}>Cancel</Link>
            </div>
          </form>
        </section>
      </main>

      {/* Right rail: keep your placeholder panel for symmetry */}
      <aside style={rightBlank}>
        <div style={{ fontWeight: 700, color: '#263238', marginBottom: 6 }}>Coming soon</div>
        <div style={{ color: '#90A4AE', fontSize: 14 }}>
          This space is reserved for future Spotlights features.
        </div>
      </aside>
    </div>
  );

  // Keep “sent” flow simple, but still inside CoachingLayout so the shell is consistent
  return (
    <CoachingLayout
      title="Post a Hearth Spotlight | ForgeTomorrow"
      header={HeaderBox}
      activeNav="resources"
      // You can add right={<CoachingRightColumn />} later if you want the global coaching right rail
    >
      {Body}
    </CoachingLayout>
  );
}

/* Layout & styles */
const layoutWrap = {
  display: 'grid',
  gridTemplateColumns: '300px 1fr 300px', // symmetrical rails
  gap: 20,
  padding: '120px 20px 20px',
  minHeight: '100vh',
  background: '#ECEFF1',
};

/* Grid gap off so spacer is the ONLY space between title and form */
const main = { display: 'grid', gap: 0 };

/* Card used for the form */
const card = {
  background: 'white',
  border: '1px solid #eee',
  borderRadius: 12,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  padding: 20,
  margin: 0,
};

const rightBlank = {
  background: 'white',
  border: '1px solid #eee',
  borderRadius: 12,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  padding: 16,
  minHeight: 120,
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
