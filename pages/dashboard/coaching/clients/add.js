// pages/dashboard/coaching/clients/add.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';
import { getSettings, upsertClientFollowUp } from '@/lib/coaching/followups';

const CLIENTS_KEY = 'coachClients_v1';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function AddClientPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    status: 'Active',
    next: '',
    last: '',
  });
  const [createFollowup, setCreateFollowup] = useState(true);
  const [defaultDays, setDefaultDays] = useState(7);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = getSettings();
    setDefaultDays(typeof s.followupCadenceDays === 'number' ? s.followupCadenceDays : 7);
  }, []);

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function saveClient() {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !email) {
      alert('Please enter both name and email.');
      return;
    }

    const list = readJSON(CLIENTS_KEY, []);
    if (Array.isArray(list) && list.some((c) => (c.email || '').toLowerCase() === email)) {
      alert('A client with this email already exists.');
      return;
    }

    const next = {
      name,
      email,
      status: form.status || 'Active',
      next: form.next || '',
      last: form.last || '',
      profileUrl: '',
      imageUrl: '',
      notes: '',
      documents: [],
    };

    const merged = Array.isArray(list) ? [...list, next] : [next];
    writeJSON(CLIENTS_KEY, merged);

    // Optional: create first follow-up in defaultDays from now @ 5pm
    if (createFollowup) {
      const due = new Date();
      due.setDate(due.getDate() + (defaultDays || 7));
      due.setHours(17, 0, 0, 0);
      upsertClientFollowUp({
        clientId: email,
        clientName: name,
        nextDueAt: due.toISOString(),
        cadenceDays: defaultDays || 7,
      });
    }

    setSavedMsg('Client saved locally.');
  }

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
        Add Client
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Create a new client. Optionally schedule the first follow-up in {defaultDays} days.
      </p>
    </section>
  );

  return (
    <CoachingLayout
      title="Add Client | ForgeTomorrow"
      header={HeaderBox}
      activeNav="clients"
      right={<CoachingRightColumn />}
    >
      <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
        {savedMsg && (
          <div
            style={{
              background: '#E8F5E9',
              border: '1px solid #C8E6C9',
              color: '#2E7D32',
              borderRadius: 10,
              padding: '10px 12px',
              fontWeight: 700,
            }}
          >
            {savedMsg}{' '}
            <span style={{ fontWeight: 400 }}>
              (This list view will be wired in the next step.)
            </span>
          </div>
        )}

        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid #eee',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input value={form.name} onChange={onChange('name')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={form.email} onChange={onChange('email')} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={onChange('status')} style={inputStyle}>
                <option>Active</option>
                <option>At Risk</option>
                <option>New Intake</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Next Session (optional)</label>
              <input
                value={form.next}
                onChange={onChange('next')}
                placeholder="e.g., Aug 28, 10:00 AM"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Last Contact (optional)</label>
              <input
                value={form.last}
                onChange={onChange('last')}
                placeholder="e.g., Aug 20"
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                id="createFollowup"
                type="checkbox"
                checked={createFollowup}
                onChange={(e) => setCreateFollowup(e.target.checked)}
              />
              <label htmlFor="createFollowup" style={{ color: '#263238' }}>
                Create first follow-up in <strong>{defaultDays}</strong> days (at 5:00 PM)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={saveClient} style={primaryBtn}>
              Save Client
            </button>
            <Link href="/dashboard/coaching/clients" style={{ ...secondaryBtn, textDecoration: 'none' }}>
              ← Back to Clients
            </Link>
          </div>
        </section>
      </div>
    </CoachingLayout>
  );
}

/* styles */
const labelStyle = {
  display: 'block',
  fontWeight: 700,
  color: '#263238',
  marginBottom: 6,
};
const inputStyle = {
  width: '100%',
  border: '1px solid #ddd',
  borderRadius: 10,
  padding: '10px 12px',
  outline: 'none',
  background: 'white',
};
const primaryBtn = {
  background: '#FF7043',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '10px 12px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-block',
};
const secondaryBtn = {
  background: 'white',
  color: '#FF7043',
  border: '1px solid #FF7043',
  borderRadius: 10,
  padding: '10px 12px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-block',
};
