// components/coaching/modules/ClientsModule.js
//
// Extracted from pages/dashboard/coaching/clients.js.
// Renders inline — no CoachingLayout, no page wrapper.
// Used by:
//   - pages/dashboard/coaching/client-hub-update.js (inline in hub)
//   - pages/dashboard/coaching/clients.js           (thin page wrapper)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  boxSizing: 'border-box',
};

const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

const inputStyle = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 10,
  padding: '9px 13px',
  outline: 'none',
  background: 'rgba(255,255,255,0.9)',
  fontSize: 13,
  color: '#37474F',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const primaryBtn = {
  background: '#FF7043',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 13,
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
};

const outlineBtn = {
  background: 'white',
  border: '1px solid rgba(255,112,67,0.4)',
  borderRadius: 8,
  padding: '5px 12px',
  cursor: 'pointer',
  fontWeight: 600,
  color: '#FF7043',
  textDecoration: 'none',
  fontSize: 12,
  display: 'inline-block',
  whiteSpace: 'nowrap',
};

const solidBtnSm = {
  background: '#FF7043',
  border: 'none',
  borderRadius: 8,
  padding: '5px 12px',
  cursor: 'pointer',
  fontWeight: 600,
  color: 'white',
  fontSize: 12,
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
};

const deleteBtnSm = {
  background: 'white',
  border: '1px solid #FFCCBC',
  color: '#FF7043',
  borderRadius: 8,
  padding: '5px 12px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
};

const modalInputStyle = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '9px 12px',
  outline: 'none',
  background: 'white',
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const modalLabelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#455A64',
};

function statusBadgeStyle(s) {
  return {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.03em',
    padding: '3px 10px',
    borderRadius: 999,
    background:
      s === 'At Risk'    ? '#FDECEA' :
      s === 'New Intake' ? '#E3F2FD' :
      '#E8F5E9',
    color:
      s === 'At Risk'    ? '#C62828' :
      s === 'New Intake' ? '#1565C0' :
      '#2E7D32',
  };
}

function ActionsDropdown({ client, onDelete, onMessage }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  async function handleReport() {
    setOpen(false);
    const reason = prompt(`Report ${client.name}?\n\nBriefly describe the issue:`);
    if (!reason?.trim()) return;
    try {
      await fetch('/api/contacts/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: client.clientId, reason: reason.trim(), source: 'client-hub', contextType: 'client' }),
      });
      alert('Report submitted. Our team will review it.');
    } catch {
      alert('Could not submit report. Please try again.');
    }
  }

  async function handleBlock() {
    setOpen(false);
    if (!confirm(`Block ${client.name}? They will no longer be able to contact you.`)) return;
    try {
      await fetch('/api/signal/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: client.clientId }),
      });
      alert(`${client.name} has been blocked.`);
    } catch {
      alert('Could not block this user. Please try again.');
    }
  }

  const menuItem = (label, onClick, danger = false) => (
    <button
      type="button"
      onClick={() => { setOpen(false); onClick(); }}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '8px 14px',
        fontSize: 13,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: danger ? '#C62828' : '#37474F',
        fontFamily: 'inherit',
        fontWeight: danger ? 700 : 500,
        borderTop: danger ? '1px solid rgba(0,0,0,0.06)' : 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'white',
          color: '#FF7043',
          border: '1px solid rgba(255,112,67,0.4)',
          borderRadius: 8,
          padding: '5px 12px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        Actions
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5l3 3 3-3" stroke="#FF7043" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            zIndex: 9999,
            background: 'white',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            minWidth: 160,
            overflow: 'hidden',
          }}
        >
          menuItem('View Profile', () => {
			if (client.email) {
				router.push(`/dashboard/coaching/clients/profile?email=${encodeURIComponent(client.email)}`);
			} else if (client.id) {
			router.push(`/dashboard/coaching/clients/profile?email=${encodeURIComponent(client.id)}`);
			}
          })}
          {client.clientId && menuItem('Message', () => onMessage(client.clientId))}
          {client.clientId && menuItem('Report', handleReport)}
          {client.clientId && menuItem('Block', handleBlock)}
          {menuItem('Delete client', () => onDelete(client.id), true)}
        </div>
      )}
    </div>
  );
}

export default function ClientsModule() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('internal');
  const [saving, setSaving] = useState(false);
  const [contactQuery, setContactQuery] = useState('');
  const [contactResults, setContactResults] = useState([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newClientStatus, setNewClientStatus] = useState('Active');
  const [extName, setExtName] = useState('');
  const [extEmail, setExtEmail] = useState('');
  const [extStatus, setExtStatus] = useState('Active');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/coaching/clients');
        if (!res.ok) {
          if (!cancelled) setClients([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch {
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => clients.filter((c) => {
    const bySearch = !search
      || (c.name || '').toLowerCase().includes(search.toLowerCase())
      || (c.email || '').toLowerCase().includes(search.toLowerCase());
    const byStatus = status === 'All' ? true : c.status === status;
    return bySearch && byStatus;
  }), [clients, search, status]);

  const handleDelete = async (id) => {
    if (!id) return;
    if (!confirm('Delete this client? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/coaching/clients/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('Could not delete client. Please try again.');
        return;
      }
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Could not delete client. Please try again.');
    }
  };

  const startCoachThread = async (targetUserId) => {
    if (!targetUserId) return;
    try {
      const res = await fetch('/api/messages/start-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'coach', targetUserId }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Could not start conversation.');
        return;
      }
      if (json.conversationId) window.location.href = `/coaching/messaging?conversationId=${json.conversationId}`;
    } catch {
      alert('Could not start conversation.');
    }
  };

  const searchContacts = async (query) => {
    setContactQuery(query);
    setSelectedContact(null);
    if (!query.trim()) {
      setContactResults([]);
      return;
    }
    try {
      setContactLoading(true);
      const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) {
        setContactResults([]);
        return;
      }
      const data = await res.json();
      setContactResults(Array.isArray(data.contacts) ? data.contacts : (data.results || []));
    } catch {
      setContactResults([]);
    } finally {
      setContactLoading(false);
    }
  };

  const openAddClientModal = () => {
    setModalMode('internal');
    setContactQuery('');
    setContactResults([]);
    setSelectedContact(null);
    setNewClientStatus('Active');
    setExtName('');
    setExtEmail('');
    setExtStatus('Active');
    setModalOpen(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (modalMode === 'internal' && !selectedContact) {
      alert('Please select a contact.');
      return;
    }
    if (modalMode === 'external' && !extName.trim()) {
      alert('Please enter a name.');
      return;
    }
    try {
      setSaving(true);
      const payload = modalMode === 'internal'
        ? { mode: 'internal', status: newClientStatus, contactUserId: selectedContact.id, contactId: selectedContact.contactId }
        : { mode: 'external', status: extStatus, name: extName.trim(), email: extEmail.trim() || null };
      const res = await fetch('/api/coaching/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || 'Could not add client.');
        return;
      }
      const created = json.client || json;
      setClients((prev) => {
        if (!created?.id) return prev;
        const idx = prev.findIndex((c) => c.id === created.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = created;
          return copy;
        }
        return [...prev, created];
      });
      setModalOpen(false);
    } catch {
      alert('Could not add client. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .cm-filter-grid { display: grid; grid-template-columns: 1fr 180px 160px; gap: 12px; align-items: center; }
        .cm-table-wrap  { display: block; overflow-x: auto; overflow-y: visible; }
        .cm-table { width: 100%; border-collapse: separate; border-spacing: 0 6px; table-layout: fixed; overflow: visible; }
        .cm-table thead th:nth-child(1) { width: 16%; }
        .cm-table thead th:nth-child(2) { width: 22%; }
        .cm-table thead th:nth-child(3) { width: 13%; }
        .cm-table thead th:nth-child(4) { width: 16%; }
        .cm-table thead th:nth-child(5) { width: 16%; }
        .cm-table thead th:nth-child(6) { width: 17%; text-align: right; }
        .cm-table thead tr { background: rgba(0,0,0,0.03); }
        .cm-table thead th { text-align: left; padding: 9px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #78909C; border-bottom: 1px solid rgba(0,0,0,0.06); white-space: nowrap; }
        .cm-table thead th:first-child { border-radius: 8px 0 0 8px; }
        .cm-table thead th:last-child  { border-radius: 0 8px 8px 0; }
        .cm-table tbody tr { background: rgba(255,255,255,0.85); box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: box-shadow 0.15s; }
        .cm-table tbody tr:hover { box-shadow: 0 4px 12px rgba(255,112,67,0.12); }
        .cm-table tbody td { padding: 11px 14px; font-size: 13px; color: #37474F; vertical-align: middle; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cm-table tbody td:first-child { border-radius: 10px 0 0 10px; font-weight: 600; color: #263238; }
        .cm-table tbody td:last-child  { border-radius: 0 10px 10px 0; overflow: visible; }
        .cm-cards { display: none; }
        @media (max-width: 768px) {
          .cm-filter-grid { grid-template-columns: 1fr; }
          .cm-filter-grid .cm-add-btn { width: 100%; }
          .cm-table-wrap { display: none; }
          .cm-cards { display: grid; gap: 10px; }
        }
      `}</style>

      <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
        <div style={{ ...GLASS, padding: '14px 16px' }}>
          <div className="cm-filter-grid">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" style={inputStyle} />
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="At Risk">At Risk</option>
              <option value="New Intake">New Intake</option>
            </select>
            <button type="button" onClick={openAddClientModal} className="cm-add-btn" style={primaryBtn}>
              + Add Client
            </button>
          </div>
        </div>

        <div style={{ ...GLASS, padding: '18px 20px', overflow: 'visible', backdropFilter: 'none', WebkitBackdropFilter: 'none', background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.55)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 18, color: '#FF7043', ...ORANGE_HEADING_LIFT }}>Clients</div>
            <div style={{ fontSize: 12, color: '#90A4AE' }}>{filtered.length} {filtered.length === 1 ? 'client' : 'clients'}</div>
          </div>

          {loading ? (
            <div style={{ padding: '24px 0', color: '#90A4AE', fontSize: 13 }}>Loading clients…</div>
          ) : (
            <>
              <div className="cm-table-wrap">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Status</th>
                      <th>Next Session</th><th>Last Contact</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px 14px', color: '#90A4AE', fontStyle: 'italic' }}>
                          No clients yet. Use "+ Add Client" to get started.
                        </td>
                      </tr>
                    ) : filtered.map((c) => (
                      <tr key={c.id || c.email}>
                        <td>{c.name}</td>
                        <td style={{ color: '#546E7A' }}>{c.email || <span style={{ color: '#B0BEC5' }}>—</span>}</td>
                        <td><span style={statusBadgeStyle(c.status)}>{c.status}</span></td>
                        <td style={{ color: '#607D8B' }}>{c.next || '—'}</td>
                        <td style={{ color: '#607D8B' }}>{c.last || '—'}</td>
                        <td style={{ textAlign: 'right', overflow: 'visible' }}>
                          <ActionsDropdown
                            client={c}
                            onDelete={handleDelete}
                            onMessage={startCoachThread}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="cm-cards">
                {filtered.length === 0 ? (
                  <div style={{ padding: 14, color: '#90A4AE', background: 'rgba(255,255,255,0.6)', borderRadius: 10, border: '1px dashed rgba(0,0,0,0.1)', fontSize: 13 }}>
                    No clients yet. Use "+ Add Client" to get started.
                  </div>
                ) : filtered.map((c) => (
                  <div key={c.id || c.email} style={{ ...WHITE_CARD, padding: '14px 16px', display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#263238' }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>{c.email || 'No email'}</div>
                      </div>
                      <span style={statusBadgeStyle(c.status)}>{c.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#546E7A' }}>
                      <span>Next: <strong>{c.next || '—'}</strong></span>
                      <span>Last: <strong>{c.last || '—'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <ActionsDropdown
                        client={c}
                        onDelete={handleDelete}
                        onMessage={startCoachThread}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <form onSubmit={handleSaveClient} style={{ background: 'white', borderRadius: 14, padding: '22px 24px', width: 'min(440px,95vw)', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <h3 style={{ marginTop: 0, color: '#FF7043', fontSize: 17, fontWeight: 800 }}>Add Client</h3>

            <div style={{ display: 'flex', gap: 4, marginBottom: 4, background: '#F0F2F4', borderRadius: 999, padding: 4 }}>
              {['internal', 'external'].map((mode) => (
                <button key={mode} type="button" onClick={() => setModalMode(mode)} style={{ flex: 1, borderRadius: 999, border: 'none', padding: '7px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: modalMode === mode ? '#FF7043' : 'transparent', color: modalMode === mode ? 'white' : '#607D8B' }}>
                  {mode === 'internal' ? 'From Contacts' : 'External Client'}
                </button>
              ))}
            </div>

            {modalMode === 'internal' ? (
              <>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#78909C' }}>Search your contacts to add someone you are coaching.</p>
                <input type="text" value={contactQuery} onChange={(e) => searchContacts(e.target.value)} placeholder="Start typing a name or email…" style={{ ...modalInputStyle, marginBottom: 6 }} />
                <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #ECEFF1', borderRadius: 8, padding: 4, marginBottom: 8, background: '#FAFAFA' }}>
                  {contactLoading && <div style={{ padding: 8, fontSize: 12, color: '#90A4AE' }}>Searching…</div>}
                  {!contactLoading && !contactQuery.trim() && <div style={{ padding: 8, fontSize: 12, color: '#90A4AE' }}>Start typing to search your contacts.</div>}
                  {!contactLoading && contactQuery.trim() && contactResults.length === 0 && <div style={{ padding: 8, fontSize: 12, color: '#90A4AE' }}>No contacts matched. Try adding them as an external client instead.</div>}
                  {contactResults.map((c) => {
                    const isSel = selectedContact?.id === c.id;
                    return (
                      <div key={c.id} onClick={() => setSelectedContact(c)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', marginBottom: 3, borderRadius: 6, cursor: 'pointer', background: isSel ? '#FFF3E0' : 'white', border: isSel ? '1px solid #FF7043' : '1px solid #ECEFF1' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#37474F' }}>{c.name || c.displayName || c.email}</div>
                          {c.email && <div style={{ fontSize: 12, color: '#78909C' }}>{c.email}</div>}
                        </div>
                        {isSel && <span style={{ fontSize: 11, color: '#FF7043', fontWeight: 700 }}>✓ Selected</span>}
                      </div>
                    );
                  })}
                </div>
                <label style={modalLabelStyle}>Status
                  <select value={newClientStatus} onChange={(e) => setNewClientStatus(e.target.value)} style={{ ...modalInputStyle, marginTop: 4 }}>
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="New Intake">New Intake</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#78909C' }}>Use this for people you coach who don't have a ForgeTomorrow account yet.</p>
                <label style={modalLabelStyle}>Name
                  <input type="text" value={extName} onChange={(e) => setExtName(e.target.value)} style={{ ...modalInputStyle, marginTop: 4 }} />
                </label>
                <label style={{ ...modalLabelStyle, marginTop: 8 }}>Email <span style={{ color: '#90A4AE', fontWeight: 400 }}>(optional)</span>
                  <input type="email" value={extEmail} onChange={(e) => setExtEmail(e.target.value)} style={{ ...modalInputStyle, marginTop: 4 }} />
                </label>
                <label style={{ ...modalLabelStyle, marginTop: 8 }}>Status
                  <select value={extStatus} onChange={(e) => setExtStatus(e.target.value)} style={{ ...modalInputStyle, marginTop: 4 }}>
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="New Intake">New Intake</option>
                  </select>
                </label>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button type="button" onClick={() => { if (!saving) setModalOpen(false); }} disabled={saving} style={{ background: 'white', color: '#FF7043', border: '1px solid #FF7043', borderRadius: 10, padding: '9px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: '#FF7043', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>{saving ? 'Saving…' : 'Save Client'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}