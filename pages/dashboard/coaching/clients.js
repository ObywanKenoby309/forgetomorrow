// pages/dashboard/coaching/clients.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

export default function CoachingClientsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');

  // Live clients from API
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add-client modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('internal'); // 'internal' | 'external'
  const [saving, setSaving] = useState(false);

  // Internal (from contacts) picker
  const [contactQuery, setContactQuery] = useState('');
  const [contactResults, setContactResults] = useState([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newClientStatus, setNewClientStatus] = useState('Active');

  // External client fields
  const [extName, setExtName] = useState('');
  const [extEmail, setExtEmail] = useState('');
  const [extStatus, setExtStatus] = useState('Active');

  // Load coaching clients for the logged-in coach
  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      try {
        const res = await fetch('/api/coaching/clients');
        if (!res.ok) {
          console.error('Failed to load coaching clients:', await res.text());
          if (!cancelled) setClients([]);
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setClients(Array.isArray(data.clients) ? data.clients : []);
        }
      } catch (err) {
        console.error('Error loading coaching clients:', err);
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadClients();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const bySearch =
        !search ||
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase());
      const byStatus = status === 'All' ? true : c.status === status;
      return bySearch && byStatus;
    });
  }, [clients, search, status]);

  const handleDelete = async (id) => {
    if (!id) return;
    if (!confirm('Delete this client? This cannot be undone.')) return;

    try {
      const res = await fetch(
        `/api/coaching/clients/${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        console.error('Failed to delete coaching client:', await res.text());
        alert('Could not delete client. Please try again.');
        return;
      }

      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting coaching client:', err);
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
        console.error('Failed to start coach conversation:', json);
        alert(json.error || 'Could not start conversation.');
        return;
      }

      const conversationId = json.conversationId;
      if (!conversationId) {
        alert('Conversation started, but no ID returned.');
        return;
      }

      window.location.href = `/coaching/messaging?conversationId=${conversationId}`;
    } catch (err) {
      console.error('Error starting coach thread:', err);
      alert('Could not start conversation.');
    }
  };

  // Contacts search (for internal Add Client)
  const searchContacts = async (query) => {
    setContactQuery(query);
    setSelectedContact(null);

    const trimmed = query.trim();
    if (!trimmed) {
      setContactResults([]);
      return;
    }

    try {
      setContactLoading(true);
      const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(trimmed)}`);

      if (!res.ok) {
        console.error('Failed to search contacts:', await res.text());
        setContactResults([]);
        return;
      }

      const data = await res.json();
      const list =
        Array.isArray(data.contacts) || Array.isArray(data.results)
          ? (data.contacts || data.results)
          : [];

      setContactResults(list);
    } catch (err) {
      console.error('Error searching contacts:', err);
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

  const closeAddClientModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();

    if (modalMode === 'internal') {
      if (!selectedContact) {
        alert('Please select a contact to add as a client.');
        return;
      }
    } else {
      if (!extName.trim()) {
        alert('Please enter a name for this client.');
        return;
      }
    }

    try {
      setSaving(true);

      const payload =
        modalMode === 'internal'
          ? {
              mode: 'internal',
              status: newClientStatus,
              contactUserId: selectedContact.id,
              contactId: selectedContact.contactId,
            }
          : {
              mode: 'external',
              status: extStatus,
              name: extName.trim(),
              email: extEmail.trim() || null,
            };

      const res = await fetch('/api/coaching/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Failed to add client:', json);
        alert(json.error || 'Could not add client. Please try again.');
        return;
      }

      const created = json.client || json;

      setClients((prev) => {
        if (!created || !created.id) return prev;
        const existingIndex = prev.findIndex((c) => c.id === created.id);
        if (existingIndex >= 0) {
          const copy = [...prev];
          copy[existingIndex] = created;
          return copy;
        }
        return [...prev, created];
      });

      setModalOpen(false);
    } catch (err) {
      console.error('Error creating client:', err);
      alert('Could not add client. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const statusBadgeStyle = (s) => ({
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.03em',
    padding: '3px 10px',
    borderRadius: 999,
    background:
      s === 'At Risk' ? '#FDECEA' :
      s === 'New Intake' ? '#E3F2FD' :
      '#E8F5E9',
    color:
      s === 'At Risk' ? '#C62828' :
      s === 'New Intake' ? '#1565C0' :
      '#2E7D32',
  });

  return (
    <CoachingLayout
      title="Clients | ForgeTomorrow"
      activeNav="clients"
      headerDescription="Search, filter, and manage your coaching clients. Clients typically start as contacts - you can add them from your contact list or create external clients for people you coach off-platform."
      right={<CoachingRightColumn />}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {/* ── Responsive styles (not scoped jsx — works reliably across all Next.js versions) ── */}
      <style>{`
        .cc-filter-grid {
          display: grid;
          grid-template-columns: 1fr 180px 160px;
          gap: 12px;
          align-items: center;
        }

        /* ── Desktop table ── */
        .cc-table-wrap { display: block; overflow-x: auto; }

        .cc-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 6px;
        }

        .cc-table thead tr {
          background: #F5F7F9;
        }

        .cc-table thead th {
          text-align: left;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #78909C;
          border-bottom: 1px solid #ECEFF1;
          white-space: nowrap;
        }

        .cc-table thead th:first-child { border-radius: 8px 0 0 8px; }
        .cc-table thead th:last-child  { border-radius: 0 8px 8px 0; }

        .cc-table tbody tr {
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }

        .cc-table tbody tr:hover {
          box-shadow: 0 4px 12px rgba(255,112,67,0.12);
          transform: translateY(-1px);
        }

        .cc-table tbody td {
          padding: 12px 14px;
          font-size: 14px;
          color: #37474F;
          vertical-align: middle;
          background: white;
        }

        .cc-table tbody td:first-child {
          border-radius: 10px 0 0 10px;
          font-weight: 600;
          color: #263238;
        }

        .cc-table tbody td:last-child {
          border-radius: 0 10px 10px 0;
        }

        /* ── Mobile cards (hidden on desktop) ── */
        .cc-cards { display: none; }

        @media (max-width: 768px) {
          .cc-filter-grid {
            grid-template-columns: 1fr;
          }

          .cc-filter-grid .cc-add-btn {
            width: 100%;
          }

          .cc-table-wrap { display: none; }

          .cc-cards {
            display: grid;
            gap: 10px;
          }
        }
      `}</style>

      <div style={{ display: 'grid', gap: 16, width: '100%' }}>

        {/* ── Filters ── */}
        <section style={sectionStyle}>
          <div className="cc-filter-grid">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={inputStyle}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="At Risk">At Risk</option>
              <option value="New Intake">New Intake</option>
            </select>
            <button
              type="button"
              onClick={openAddClientModal}
              className="cc-add-btn"
              style={primaryBtn}
            >
              + Add Client
            </button>
          </div>
        </section>

        {/* ── Client list ── */}
        <section style={sectionStyle}>
          <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 4, fontSize: 18, fontWeight: 800 }}>
            Clients
          </h2>
          <p style={{ marginTop: 0, marginBottom: 20, color: '#78909C', fontSize: 13, lineHeight: 1.5 }}>
            Clients are the people you actively coach. You can add them from your contact list (internal users) or as external clients for off-platform work.
          </p>

          {loading ? (
            <div style={{ padding: '24px 0', color: '#90A4AE', fontSize: 14 }}>Loading clients…</div>
          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Next Session</th>
                      <th>Last Contact</th>
                      <th>Actions</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '20px 14px', color: '#90A4AE', fontStyle: 'italic', background: '#FAFAFA', borderRadius: 10 }}>
                          No clients yet. Use "+ Add Client" to get started.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((c) => (
                        <tr key={c.id || c.email}>
                          <td>{c.name}</td>
                          <td style={{ color: '#546E7A', fontSize: 13 }}>{c.email || <span style={{ color: '#B0BEC5' }}>—</span>}</td>
                          <td><span style={statusBadgeStyle(c.status)}>{c.status}</span></td>
                          <td style={{ color: '#607D8B', fontSize: 13 }}>{c.next || '—'}</td>
                          <td style={{ color: '#607D8B', fontSize: 13 }}>{c.last || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <Link
                                href={`/dashboard/coaching/clients/${encodeURIComponent(c.email || '')}`}
                                style={outlineBtn}
                                aria-label={`View profile for ${c.name}`}
                              >
                                View Profile
                              </Link>
                              {c.clientId && (
                                <button
                                  type="button"
                                  onClick={() => startCoachThread(c.clientId)}
                                  style={solidBtnSm}
                                  aria-label={`Message ${c.name}`}
                                >
                                  Message
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id)}
                              style={deleteBtnSm}
                              aria-label={`Delete ${c.name}`}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="cc-cards">
                {filtered.length === 0 ? (
                  <div style={{ padding: 16, color: '#90A4AE', background: '#FAFAFA', border: '1px solid #eee', borderRadius: 10, fontSize: 13 }}>
                    No clients yet. Use "+ Add Client" to get started.
                  </div>
                ) : (
                  filtered.map((c) => (
                    <div
                      key={c.id || c.email}
                      style={{
                        background: 'white',
                        border: '1px solid #ECEFF1',
                        borderRadius: 12,
                        padding: '14px 16px',
                        display: 'grid',
                        gap: 10,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}
                    >
                      {/* Name + status row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#263238' }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>{c.email || 'No email added'}</div>
                        </div>
                        <span style={statusBadgeStyle(c.status)}>{c.status}</span>
                      </div>

                      {/* Session info */}
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#546E7A' }}>
                        <span>Next: <strong>{c.next || '—'}</strong></span>
                        <span>Last: <strong>{c.last || '—'}</strong></span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'grid', gridTemplateColumns: c.clientId ? '1fr 1fr' : '1fr', gap: 8 }}>
                        <Link
                          href={`/dashboard/coaching/clients/${encodeURIComponent(c.email || '')}`}
                          style={{ ...outlineBtn, textAlign: 'center', display: 'block' }}
                          aria-label={`View profile for ${c.name}`}
                        >
                          View Profile
                        </Link>
                        {c.clientId && (
                          <button
                            type="button"
                            onClick={() => startCoachThread(c.clientId)}
                            style={{ ...solidBtnSm, width: '100%' }}
                            aria-label={`Message ${c.name}`}
                          >
                            Message
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        style={{ ...deleteBtnSm, width: '100%' }}
                        aria-label={`Delete ${c.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Add Client Modal ── */}
      {modalOpen && (
        <div style={backdropStyle}>
          <form onSubmit={handleSaveClient} style={modalStyle}>
            <h3 style={{ marginTop: 0, color: '#FF7043', fontSize: 17, fontWeight: 800 }}>Add Client</h3>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: '#F0F2F4', borderRadius: 999, padding: 4 }}>
              {['internal', 'external'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModalMode(mode)}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    border: 'none',
                    padding: '7px 8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                    transition: 'all 0.15s ease',
                    background: modalMode === mode ? '#FF7043' : 'transparent',
                    color: modalMode === mode ? 'white' : '#607D8B',
                  }}
                >
                  {mode === 'internal' ? 'From Contacts' : 'External Client'}
                </button>
              ))}
            </div>

            {modalMode === 'internal' ? (
              <>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#78909C' }}>
                  Search your contacts to add someone you are coaching.
                </p>
                <input
                  type="text"
                  value={contactQuery}
                  onChange={(e) => searchContacts(e.target.value)}
                  placeholder="Start typing a name or email…"
                  style={{ ...modalInputStyle, marginBottom: 8 }}
                />
                <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #ECEFF1', borderRadius: 8, padding: 4, marginBottom: 10, background: '#FAFAFA' }}>
                  {contactLoading && <div style={{ padding: 8, fontSize: 12, color: '#90A4AE' }}>Searching…</div>}
                  {!contactLoading && !contactQuery.trim() && contactResults.length === 0 && (
                    <div style={{ padding: 8, fontSize: 12, color: '#90A4AE' }}>Start typing to search your contacts.</div>
                  )}
                  {!contactLoading && contactQuery.trim() && contactResults.length === 0 && (
                    <div style={{ padding: 8, fontSize: 12, color: '#90A4AE' }}>No contacts matched. Try adding them as an external client instead.</div>
                  )}
                  {contactResults.map((c) => {
                    const isSelected = selectedContact && selectedContact.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedContact(c)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '7px 10px',
                          marginBottom: 3,
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: isSelected ? '#FFF3E0' : 'white',
                          border: isSelected ? '1px solid #FF7043' : '1px solid #ECEFF1',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#37474F' }}>
                            {c.name || c.displayName || c.email}
                          </div>
                          {c.email && <div style={{ fontSize: 12, color: '#78909C' }}>{c.email}</div>}
                        </div>
                        {isSelected && <span style={{ fontSize: 11, color: '#FF7043', fontWeight: 700 }}>✓ Selected</span>}
                      </div>
                    );
                  })}
                </div>
                <label style={modalLabelStyle}>
                  Status
                  <select value={newClientStatus} onChange={(e) => setNewClientStatus(e.target.value)} style={{ ...modalInputStyle, marginTop: 4 }}>
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="New Intake">New Intake</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#78909C' }}>
                  Use this for people you coach who don't have a ForgeTomorrow account yet.
                </p>
                <label style={modalLabelStyle}>
                  Name
                  <input type="text" value={extName} onChange={(e) => setExtName(e.target.value)} style={{ ...modalInputStyle, marginTop: 4 }} />
                </label>
                <label style={{ ...modalLabelStyle, marginTop: 10 }}>
                  Email <span style={{ color: '#90A4AE', fontWeight: 400 }}>(optional)</span>
                  <input type="email" value={extEmail} onChange={(e) => setExtEmail(e.target.value)} style={{ ...modalInputStyle, marginTop: 4 }} />
                </label>
                <label style={{ ...modalLabelStyle, marginTop: 10 }}>
                  Status
                  <select value={extStatus} onChange={(e) => setExtStatus(e.target.value)} style={{ ...modalInputStyle, marginTop: 4 }}>
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="New Intake">New Intake</option>
                  </select>
                </label>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button
                type="button"
                onClick={closeAddClientModal}
                disabled={saving}
                style={{ background: 'white', color: '#FF7043', border: '1px solid #FF7043', borderRadius: 10, padding: '9px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ background: '#FF7043', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                {saving ? 'Saving…' : 'Save Client'}
              </button>
            </div>
          </form>
        </div>
      )}
    </CoachingLayout>
  );
}

/* ── Shared styles ── */
const sectionStyle = {
  background: 'white',
  borderRadius: 14,
  padding: '20px 22px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  border: '1px solid #ECEFF1',
};

const inputStyle = {
  border: '1px solid #ddd',
  borderRadius: 10,
  padding: '10px 13px',
  outline: 'none',
  background: 'white',
  fontSize: 14,
  color: '#37474F',
  width: '100%',
  boxSizing: 'border-box',
};

const primaryBtn = {
  background: '#FF7043',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 14,
  whiteSpace: 'nowrap',
};

const outlineBtn = {
  background: 'white',
  border: '1px solid #E0E0E0',
  borderRadius: 8,
  padding: '6px 12px',
  cursor: 'pointer',
  fontWeight: 600,
  color: '#FF7043',
  textDecoration: 'none',
  fontSize: 13,
  display: 'inline-block',
  whiteSpace: 'nowrap',
};

const solidBtnSm = {
  background: '#FF7043',
  border: 'none',
  borderRadius: 8,
  padding: '6px 12px',
  cursor: 'pointer',
  fontWeight: 600,
  color: 'white',
  fontSize: 13,
  whiteSpace: 'nowrap',
};

const deleteBtnSm = {
  background: 'white',
  border: '1px solid #FFCCBC',
  color: '#FF7043',
  borderRadius: 8,
  padding: '6px 12px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: 'nowrap',
};

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const modalStyle = {
  background: 'white',
  borderRadius: 14,
  padding: '22px 24px',
  width: 'min(440px, 95vw)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
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
};

const modalLabelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#455A64',
};