// components/coaching/modules/ClientsModule.js
//
// Extracted from pages/dashboard/coaching/clients.js.
// Renders inline — no CoachingLayout, no page wrapper.
// Used by:
//   - pages/dashboard/coaching/client-hub-update.js (inline in hub)
//   - pages/dashboard/coaching/clients.js           (thin page wrapper)

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

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

export default function ClientsModule() {
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('All');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen]             = useState(false);
  const [modalMode, setModalMode]             = useState('internal');
  const [saving, setSaving]                   = useState(false);
  const [contactQuery, setContactQuery]       = useState('');
  const [contactResults, setContactResults]   = useState([]);
  const [contactLoading, setContactLoading]   = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newClientStatus, setNewClientStatus] = useState('Active');
  const [extName, setExtName]                 = useState('');
  const [extEmail, setExtEmail]               = useState('');
  const [extStatus, setExtStatus]             = useState('Active');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/coaching/clients');
        if (!res.ok) { if (!cancelled) setClients([]); return; }
        const data = await res.json();
        if (!cancelled) setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch { if (!cancelled) setClients([]); }
      finally  { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => clients.filter((c) => {
    const bySearch = !search
      || (c.name  || '').toLowerCase().includes(search.toLowerCase())
      || (c.email || '').toLowerCase().includes(search.toLowerCase());
    const byStatus = status === 'All' ? true : c.status === status;
    return bySearch && byStatus;
  }), [clients, search, status]);

  const handleDelete = async (id) => {
    if (!id) return;
    if (!confirm('Delete this client? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/coaching/clients/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) { alert('Could not delete client. Please try again.'); return; }
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch { alert('Could not delete client. Please try again.'); }
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
      if (!res.ok) { alert(json.error || 'Could not start conversation.'); return; }
      if (json.conversationId) window.location.href = `/coaching/messaging?conversationId=${json.conversationId}`;
    } catch { alert('Could not start conversation.'); }
  };

  const searchContacts = async (query) => {
    setContactQuery(query);
    setSelectedContact(null);
    if (!query.trim()) { setContactResults([]); return; }
    try {
      setContactLoading(true);
      const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) { setContactResults([]); return; }
      const data = await res.json();
      setContactResults(Array.isArray(data.contacts) ? data.contacts : (data.results || []));
    } catch { setContactResults([]); }
    finally { setContactLoading(false); }
  };

  const openAddClientModal = () => {
    setModalMode('internal');
    setContactQuery(''); setContactResults([]); setSelectedContact(null);
    setNewClientStatus('Active'); setExtName(''); setExtEmail(''); setExtStatus('Active');
    setModalOpen(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (modalMode === 'internal' && !selectedContact) { alert('Please select a contact.'); return; }
    if (modalMode === 'external' && !extName.trim())  { alert('Please enter a name.'); return; }
    try {
      setSaving(true);
      const payload = modalMode === 'internal'
        ? { mode: 'internal', status: newClientStatus, contactUserId: selectedContact.id, contactId: selectedContact.contactId }
        : { mode: 'external', status: extStatus, name: extName.trim(), email: extEmail.trim() || null };
      const res  = await fetch('/api/coaching/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { alert(json.error || 'Could not add client.'); return; }
      const created = json.client || json;
      setClients((prev) => {
        if (!created?.id) return prev;
        const idx = prev.findIndex((c) => c.id === created.id);
        if (idx >= 0) { const copy = [...prev]; copy[idx] = created; return copy; }
        return [...prev, created];
      });
      setModalOpen(false);
    } catch { alert('Could not add client. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <style>{`
        .cm-filter-grid { display: grid; grid-template-columns: 1fr 180px 160px; gap: 12px; align-items: center; }
        .cm-table-wrap  { display: block; overflow-x: auto; }
        .cm-table { width: 100%; border-collapse: separate; border-spacing: 0 6px; }
        .cm-table thead tr { background: rgba(0,0,0,0.03); }
        .cm-table thead th { text-align: left; padding: 9px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #78909C; border-bottom: 1px solid rgba(0,0,0,0.06); white-space: nowrap; }
        .cm-table thead th:first-child { border-radius: 8px 0 0 8px; }
        .cm-table thead th:last-child  { border-radius: 0 8px 8px 0; }
        .cm-table tbody tr { background: rgba(255,255,255,0.85); box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: box-shadow 0.15s, transform 0.15s; }
        .cm-table tbody tr:hover { box-shadow: 0 4px 12px rgba(255,112,67,0.12); transform: translateY(-1px); }
        .cm-table tbody td { padding: 11px 14px; font-size: 13px; color: #37474F; vertical-align: middle; }
        .cm-table tbody td:first-child { border-radius: 10px 0 0 10px; font-weight: 600; color: #263238; }
        .cm-table tbody td:last-child  { border-radius: 0 10px 10px 0; }
        .cm-cards { display: none; }
        @media (max-width: 768px) {
          .cm-filter-grid { grid-template-columns: 1fr; }
          .cm-filter-grid .cm-add-btn { width: 100%; }
          .cm-table-wrap { display: none; }
          .cm-cards { display: grid; gap: 10px; }
        }
      `}</style>

      <div style={{ display: 'grid', gap: 14 }}>

        {/* Filters + Add */}
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

        {/* Client list */}
        <div style={{ ...GLASS, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 18, color: '#FF7043', ...ORANGE_HEADING_LIFT }}>Clients</div>
            <div style={{ fontSize: 12, color: '#90A4AE' }}>{filtered.length} {filtered.length === 1 ? 'client' : 'clients'}</div>
          </div>

          {loading ? (
            <div style={{ padding: '24px 0', color: '#90A4AE', fontSize: 13 }}>Loading clients…</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="cm-table-wrap">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Status</th>
                      <th>Next Session</th><th>Last Contact</th>
                      <th>Actions</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '20px 14px', color: '#90A4AE', fontStyle: 'italic' }}>
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
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Link href={`/dashboard/coaching/clients/${encodeURIComponent(c.email || '')}`} style={outlineBtn}>
                              View Profile
                            </Link>
                            {c.clientId && (
                              <button type="button" onClick={() => startCoachThread(c.clientId)} style={solidBtnSm}>
                                Message
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <button type="button" onClick={() => handleDelete(c.id)} style={deleteBtnSm}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
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
                    <div style={{ display: 'grid', gridTemplateColumns: c.clientId ? '1fr 1fr' : '1fr', gap: 8 }}>
                      <Link href={`/dashboard/coaching/clients/${encodeURIComponent(c.email || '')}`} style={{ ...outlineBtn, textAlign: 'center', display: 'block' }}>
                        View Profile
                      </Link>
                      {c.clientId && (
                        <button type="button" onClick={() => startCoachThread(c.clientId)} style={{ ...solidBtnSm, width: '100%' }}>
                          Message
                        </button>
                      )}
                    </div>
                    <button type="button" onClick={() => handleDelete(c.id)} style={{ ...deleteBtnSm, width: '100%' }}>Delete</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
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