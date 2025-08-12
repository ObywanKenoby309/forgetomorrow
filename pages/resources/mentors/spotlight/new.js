// pages/resources/mentors/spotlight/new.js
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const STORAGE_KEY = 'hearthSpotlights_v1';

function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
    rate: 'Free', // Free | Paid | Sliding
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
    if (!form.name.trim() || !form.summary.trim() || !form.headline.trim()) {
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

  if (sent) {
    return (
      <div style={pageWrap}>
        <main style={main}>
          <section style={card}>
            <h2 style={{ color: '#FF7043', margin: 0 }}>Spotlight posted!</h2>
            <p style={{ color: '#607D8B', marginTop: 6 }}>Redirecting to Hearth Spotlights…</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/hearth/spotlights" style={btnPrimary}>Go now</Link>
              <button
                type="button"
                onClick={() => setSent(false)}
                style={btnGhost}
              >
                Post another
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <main style={main}>
        {/* Header */}
        <section style={card}>
          <h2 style={{ color: '#FF7043', margin: 0 }}>Post a Hearth Spotlight</h2>
          <p style={{ color: '#607D8B', marginTop: 6, marginBottom: 0 }}>
            Share what you offer and how seekers can reach you.
          </p>
        </section>

        {/* Form */}
        <section style={card}>
          <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Your name</label>
                <input value={form.name} onChange={(e) => update('name', e.target.value)} style={input} required />
              </div>
              <div>
                <label style={label}>Headline</label>
                <input value={form.headline} onChange={(e) => update('headline', e.target.value)} style={input} placeholder="e.g., Senior PM mentor for career pivots" required />
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
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#37474F' }}>
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
                <input type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} style={input} placeholder="you@domain.com" />
              </div>
              <div>
                <label style={label}>Contact link (Calendly/LinkedIn/etc.)</label>
                <input value={form.contactLink} onChange={(e) => update('contactLink', e.target.value)} style={input} placeholder="https://…" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={btnPrimary}>Publish Spotlight</button>
              <Link href="/hearth/spotlights" style={btnGhost}>Cancel</Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

const pageWrap = { display: 'grid', gridTemplateColumns: '1fr', padding: '120px 20px 20px', minHeight: '100vh', backgroundColor: '#ECEFF1', placeItems: 'start center' };
const main = { width: '100%', maxWidth: 860, display: 'grid', gap: 20 };
const card = { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee' };
const label = { display: 'block', fontSize: 12, color: '#607D8B', marginBottom: 6, fontWeight: 700 };
const input = { border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', outline: 'none', width: '100%', background: 'white' };
const btnPrimary = { background: '#FF7043', color: 'white', border: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' };
const btnGhost = { background: 'white', color: '#FF7043', border: '1px solid #FF7043', borderRadius: 10, padding: '10px 12px', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' };
