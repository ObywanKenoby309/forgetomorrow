// pages/dashboard/coaching/newsletter/index.js
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import CoachingSidebar from '../../../../components/coaching/CoachingSidebar';

const STORAGE_KEY = 'coachNewsletters_v1';

export default function CoachingNewsletterComposerPage() {
  const router = useRouter();

  // --- Mock clients (same style as elsewhere) ---
  const clients = [
    { name: 'Alex Turner', email: 'alex.turner@example.com', status: 'Active' },
    { name: 'Priya N.', email: 'priya.n@example.com', status: 'Active' },
    { name: 'Michael R.', email: 'michael.r@example.com', status: 'At Risk' },
    { name: 'Dana C.', email: 'dana.c@example.com', status: 'New Intake' },
    { name: 'Robert L.', email: 'robert.l@example.com', status: 'Active' },
  ];
  const statuses = ['Active', 'At Risk', 'New Intake'];
  // -----------------------------------------------

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectionMode, setSelectionMode] = useState('All'); // 'All' | 'Status' | 'Manual'
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [manual, setManual] = useState({}); // email -> boolean
  const [preview, setPreview] = useState(false);

  const manualList = clients.map(c => c.email);
  const recipients = useMemo(() => {
    if (selectionMode === 'All') return clients.map(c => c.email);
    if (selectionMode === 'Status')
      return clients.filter(c => c.status === selectedStatus).map(c => c.email);
    // Manual
    return Object.entries(manual)
      .filter(([, v]) => v)
      .map(([email]) => email);
  }, [selectionMode, selectedStatus, manual]);

  const sentCountLabel = useMemo(() => `${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`, [recipients]);

  const handleToggleManual = (email) =>
    setManual(prev => ({ ...prev, [email]: !prev[email] }));

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      alert('Please enter a subject and body.');
      return;
    }
    if (recipients.length === 0) {
      alert('Please select at least one recipient.');
      return;
    }

    const record = {
      id: String(Date.now()),
      subject: subject.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
      recipients,
      stats: { delivered: recipients.length, read: 0 },
    };

    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...existing]));
      alert('Newsletter sent (local only).');
      router.push('/dashboard/coaching/newsletter/sent');
    } catch (e) {
      console.error(e);
      alert('Failed to store newsletter locally.');
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '20px',
        padding: '120px 20px 20px',
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      }}
    >
      <CoachingSidebar active="resources" />

      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ maxWidth: 860 }}>
          {/* Header / Nav */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#FF7043', margin: 0 }}>Compose Newsletter</h2>
              <a href="/dashboard/coaching/newsletter/sent" style={{ color: '#FF7043', fontWeight: 700 }}>
                View Sent →
              </a>
            </div>
          </section>

          {/* Audience */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, alignItems: 'center' }}>
              <strong>Recipients</strong>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['All', 'Status', 'Manual'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectionMode(mode)}
                    style={{
                      background: selectionMode === mode ? '#FF7043' : 'white',
                      color: selectionMode === mode ? 'white' : '#FF7043',
                      border: '1px solid #FF7043',
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {selectionMode === 'Status' && (
                <>
                  <div />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', background: 'white' }}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </>
              )}

              {selectionMode === 'Manual' && (
                <>
                  <div />
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                      gap: 8,
                    }}
                  >
                    {manualList.map((email) => {
                      const c = clients.find(x => x.email === email);
                      return (
                        <label
                          key={email}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            border: '1px solid #eee',
                            borderRadius: 10,
                            padding: '8px 10px',
                            background: '#FAFAFA',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!manual[email]}
                            onChange={() => handleToggleManual(email)}
                          />
                          <span style={{ fontWeight: 600 }}>{c?.name}</span>
                          <span style={{ color: '#607D8B', fontSize: 12 }}>{email}</span>
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: 11,
                              background:
                                c?.status === 'At Risk'
                                  ? '#FDECEA'
                                  : c?.status === 'New Intake'
                                  ? '#E3F2FD'
                                  : '#E8F5E9',
                              color:
                                c?.status === 'At Risk'
                                  ? '#C62828'
                                  : c?.status === 'New Intake'
                                  ? '#1565C0'
                                  : '#2E7D32',
                              padding: '2px 6px',
                              borderRadius: 999,
                            }}
                          >
                            {c?.status}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div style={{ marginTop: 10, color: '#546E7A' }}>
              Targeting: <strong>{sentCountLabel}</strong>
            </div>
          </section>

          {/* Editor */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
              display: 'grid',
              gap: 12,
            }}
          >
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px' }}
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message (you can include your signature here)…"
              rows={10}
              style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
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
                {preview ? 'Hide Preview' : 'Preview'}
              </button>

              <button
                type="button"
                onClick={handleSend}
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
                Send Newsletter
              </button>
            </div>

            {preview && (
              <div
                style={{
                  marginTop: 8,
                  border: '1px solid #eee',
                  borderRadius: 10,
                  padding: 16,
                  background: '#FAFAFA',
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 8 }}>{subject || '(no subject)'}</div>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{body || '(empty message)'}</pre>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
