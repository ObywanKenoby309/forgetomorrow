// pages/dashboard/coaching/clients/[email].js
import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

import { getSettings, getAllFollowUps, upsertClientFollowUp } from '@/lib/coaching/followups';

const CLIENTS_KEY = 'coachClients_v1';

// Computes ISO for "lastContact + days" at 5:00 PM local.
function computeNextDueISO(lastContactText, days) {
  const d = new Date(lastContactText);
  if (isNaN(d.getTime())) return null;
  const n = Math.max(1, Number(days) || 7);
  d.setDate(d.getDate() + n);
  d.setHours(17, 0, 0, 0);
  return d.toISOString();
}

const STATUS_COLORS = {
  'Active':   { bg: '#E8F5E9', fg: '#2E7D32' },
  'At Risk':  { bg: '#FDECEA', fg: '#C62828' },
  'New Intake': { bg: '#E3F2FD', fg: '#1565C0' },
};

const MOCK_CLIENTS = [
  {
    name: 'Alex Turner',
    email: 'alex.turner@example.com',
    status: 'Active',
    next: 'Aug 14, 10:00 AM',
    last: 'Aug 10',
    profileUrl: 'https://www.forgetomorrow.com/in/example',
    imageUrl: '',
    notes: 'Prefers morning sessions. Focused on product roles.',
    documents: [
      { title: 'Resume_v3.pdf', type: 'Resume', updated: 'Aug 08, 2025', link: '#' },
      { title: 'CoverLetter_Alex.pdf', type: 'Cover', updated: 'Aug 07, 2025', link: '#' },
    ],
  },
  {
    name: 'Priya N.',
    email: 'priya.n@example.com',
    status: 'Active',
    next: 'Aug 15, 1:30 PM',
    last: 'Aug 11',
    profileUrl: '',
    imageUrl: '',
    notes: 'Switching to data analyst roles; needs SQL project review.',
    documents: [
      { title: 'Resume_Priya.pdf', type: 'Resume', updated: 'Aug 09, 2025', link: '#' },
    ],
  },
  {
    name: 'Michael R.',
    email: 'michael.r@example.com',
    status: 'At Risk',
    next: 'Aug 13, 3:00 PM',
    last: 'Aug 07',
    profileUrl: '',
    imageUrl: '',
    notes: 'Missed last session; struggling with interview anxiety.',
    documents: [],
  },
  {
    name: 'Dana C.',
    email: 'dana.c@example.com',
    status: 'New Intake',
    next: 'Aug 16, 9:00 AM',
    last: 'Aug 12',
    profileUrl: '',
    imageUrl: '',
    notes: 'New intake; gather prior experience and goals.',
    documents: [],
  },
  {
    name: 'Robert L.',
    email: 'robert.l@example.com',
    status: 'Active',
    next: 'Aug 19, 2:30 PM',
    last: 'Aug 09',
    profileUrl: '',
    imageUrl: '',
    notes: '',
    documents: [
      { title: 'Robert_Resume.pdf', type: 'Resume', updated: 'Aug 05, 2025', link: '#' },
    ],
  },
];

export default function ClientProfilePage() {
  const router = useRouter();
  const emailParam = router.query.email ? decodeURIComponent(router.query.email) : '';

  // 1) Try localStorage first; then fall back to mock
  const [loadedLocal, setLoadedLocal] = useState(false);
  const [localClient, setLocalClient] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !emailParam) return;
    try {
      const raw = localStorage.getItem(CLIENTS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const rec = Array.isArray(list)
        ? list.find(c => (c.email || '').toLowerCase() === emailParam.toLowerCase())
        : null;
      setLocalClient(rec || null);
    } catch {
      setLocalClient(null);
    } finally {
      setLoadedLocal(true);
    }
  }, [emailParam]);

  const foundMock = useMemo(
    () => MOCK_CLIENTS.find(c => c.email === emailParam),
    [emailParam]
  );

  const source = localClient || foundMock || null;

  // Build form AFTER we know if local exists; avoid flashing "not found"
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (!source) return setForm(null);
    setForm({
      name: source.name || '',
      email: source.email || '',
      status: source.status || 'Active',
      next: source.next || '',
      last: source.last || '',
      profileUrl: source.profileUrl || '',
      imageUrl: source.imageUrl || '',
      notes: source.notes || '',
      documents: source.documents || [],
    });
  }, [source?.email]);

  // cadence + next follow-up
  const [coachDefaultDays, setCoachDefaultDays] = useState(7);
  const [cadenceDays, setCadenceDays] = useState(7);
  const [existingNextDueISO, setExistingNextDueISO] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !form?.email) return;
    const s = getSettings();
    const def = typeof s.followupCadenceDays === 'number' ? s.followupCadenceDays : 7;
    setCoachDefaultDays(def);
    setCadenceDays(def);

    const list = getAllFollowUps();
    const rec = list.find(f => f.id === `fu_${form.email}`);
    if (rec?.nextDueAt) setExistingNextDueISO(rec.nextDueAt);
    if (typeof rec?.cadenceDays === 'number') setCadenceDays(rec.cadenceDays);
  }, [form?.email]);

  const statusColors = STATUS_COLORS[form?.status] || { bg: '#FFF3E0', fg: '#E65100' };
  const onChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onSave = () => {
    try {
      const raw = localStorage.getItem(CLIENTS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const idx = Array.isArray(list)
        ? list.findIndex(c => (c.email || '').toLowerCase() === (form.email || '').toLowerCase())
        : -1;
      const record = {
        name: form.name,
        email: form.email,
        status: form.status,
        next: form.next,
        last: form.last,
        profileUrl: form.profileUrl || '',
        imageUrl: form.imageUrl || '',
        notes: form.notes || '',
        documents: form.documents || [],
      };
      if (idx >= 0) list[idx] = record;
      else list.push(record);
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(list));
      alert('Saved (local only).');
    } catch {
      alert('Saved locally (best effort).');
    }
  };

  const initials = (name) =>
    (name || '')
      .split(' ')
      .filter(Boolean)
      .map(part => part[0]?.toUpperCase())
      .slice(0, 2)
      .join('');

  const fmtNext = (iso) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const setFromLastContact = () => {
    const iso = computeNextDueISO(form.last, cadenceDays);
    if (!iso) {
      alert('Please enter a valid "Last Contact" (e.g., Aug 20 or 2025-08-20).');
      return;
    }
    const days = Math.max(1, Number(cadenceDays) || coachDefaultDays || 7);
    upsertClientFollowUp({
      clientId: form.email,
      clientName: form.name,
      nextDueAt: iso,
      cadenceDays: days,
    });
    setExistingNextDueISO(iso);
    alert('Follow-up scheduled.');
  };

  // Loading / Not Found states
  if (!loadedLocal) {
    return (
      <CoachingLayout
        title="Client Profile | ForgeTomorrow"
        headerTitle="Client Profile"
        headerDescription=""
        right={<CoachingRightColumn />}
        activeNav="clients"
      >
        <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
          <section style={sectionStyle}>
            <div style={{ color: '#90A4AE' }}>Loading…</div>
          </section>
        </div>
      </CoachingLayout>
    );
  }

  if (!form) {
    return (
      <CoachingLayout
        title="Client Profile | ForgeTomorrow"
        headerTitle="Client Profile"
        headerDescription=""
        right={<CoachingRightColumn />}
        activeNav="clients"
      >
        <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
          <section style={sectionStyle}>
            <h2 style={{ color: '#FF7043', margin: 0 }}>Client Not Found</h2>
            <p style={{ color: '#607D8B' }}>
              We couldn’t find a client for <strong>{emailParam || '(no email provided)'}</strong>.
            </p>
            <Link href="/dashboard/coaching/clients" style={{ color: '#FF7043', fontWeight: 700 }}>
              ← Back to Clients
            </Link>
          </section>
        </div>
      </CoachingLayout>
    );
  }

  return (
    <CoachingLayout
      title="Client Profile | ForgeTomorrow"
      headerTitle="Client Profile"
      headerDescription="View details, set cadence, and schedule the next follow-up."
      right={<CoachingRightColumn />}
      activeNav="clients"
    >
      <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
        {/* Top: Avatar + Profile Link */}
        <section style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 12,
                background: '#FAFAFA',
                border: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                fontWeight: 800,
                fontSize: 28,
                color: '#455A64',
              }}
            >
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt={form.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials(form.name)
              )}
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <label style={labelStyle}>Profile Link</label>
              <input
                value={form.profileUrl}
                onChange={onChange('profileUrl')}
                placeholder="https://example.com/profile (optional external link)"
                style={inputStyle}
              />
              <div>
                <a
                  href={`/profile/${encodeURIComponent(form.email)}`}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  View full profile on ForgeTomorrow.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Details */}
        <section style={sectionStyle}>
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={form.status}
                  onChange={onChange('status')}
                  style={inputStyle}
                >
                  <option>Active</option>
                  <option>At Risk</option>
                  <option>New Intake</option>
                </select>
                <span
                  style={{
                    fontSize: 12,
                    background: statusColors.bg,
                    color: statusColors.fg,
                    padding: '4px 8px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {form.status}
                </span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Next Session</label>
              <input value={form.next} onChange={onChange('next')} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Last Contact</label>
              <input value={form.last} onChange={onChange('last')} style={inputStyle} />
            </div>

            {/* Follow-up Cadence + action */}
            <div>
              <label style={labelStyle}>Follow-up Cadence (days)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  min={1}
                  value={cadenceDays}
                  onChange={(e) => setCadenceDays(Math.max(1, Number(e.target.value) || 1))}
                  style={{ ...inputStyle, width: 140 }}
                />
                <button type="button" onClick={setFromLastContact} style={secondaryBtn}>
                  Set from Last Contact
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#90A4AE' }}>
                Default: {coachDefaultDays} day{coachDefaultDays === 1 ? '' : 's'}
              </div>
              {existingNextDueISO && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#607D8B' }}>
                  Next follow-up: <strong>{fmtNext(existingNextDueISO)}</strong>
                </div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={form.notes}
                onChange={onChange('notes')}
                rows={6}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Session notes, goals, next steps…"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={onSave} style={primaryBtn}>
              Save
            </button>
            <button type="button" onClick={() => alert('Upload coming soon')} style={secondaryBtn}>
              Upload Document
            </button>
          </div>
        </section>

        {/* Documents */}
        <section style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0, color: '#FF7043' }}>Saved Documents</h3>
            <button type="button" onClick={() => alert('Upload coming soon')} style={secondaryBtn}>
              + Add Document
            </button>
          </div>

          {form.documents.length === 0 ? (
            <div style={{ color: '#90A4AE' }}>No documents yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <thead>
                  <tr style={{ background: '#FAFAFA' }}>
                    <Th>Title</Th>
                    <Th>Type</Th>
                    <Th>Updated</Th>
                    <Th>Link</Th>
                  </tr>
                </thead>
                <tbody>
                  {form.documents.map((doc) => (
                    <tr key={doc.title} style={{ borderTop: '1px solid #eee' }}>
                      <Td strong>{doc.title}</Td>
                      <Td>{doc.type}</Td>
                      <Td>{doc.updated}</Td>
                      <Td>
                        <a href={doc.link} style={{ color: '#FF7043', fontWeight: 600 }}>
                          View
                        </a>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </CoachingLayout>
  );
}

/* ---------- Styles ---------- */
const sectionStyle = {
  background: 'white',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  border: '1px solid #eee',
};
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
};
const secondaryBtn = {
  background: 'white',
  color: '#FF7043',
  border: '1px solid #FF7043',
  borderRadius: 10,
  padding: '10px 12px',
  fontWeight: 700,
  cursor: 'pointer',
};
function Th({ children }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '10px 12px',
        fontSize: 13,
        color: '#546E7A',
        borderBottom: '1px solid #eee',
      }}
    >
      {children}
    </th>
  );
}
function Td({ children, strong = false }) {
  return (
    <td
      style={{
        padding: '10px 12px',
        fontSize: 14,
        color: '#37474F',
        fontWeight: strong ? 600 : 400,
        background: 'white',
      }}
    >
      {children}
    </td>
  );
}
