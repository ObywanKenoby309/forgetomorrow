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
    return () => {
      cancelled = true;
    };
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
        {
          method: 'DELETE',
        }
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: 'coach',
          targetUserId,
        }),
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

      window.location.href = `/coach/messaging?conversationId=${conversationId}`;
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
      const res = await fetch(
        `/api/contacts/search?q=${encodeURIComponent(trimmed)}`
      );

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

  // Save client (internal or external)
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
              // ✅ This is the Forge user id from /api/contacts/search
              contactUserId: selectedContact.id,
              // (optional) keep contactId if you want it later
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  return (
    <CoachingLayout
      title="Clients | ForgeTomorrow"
      activeNav="clients"
      headerDescription="Search, filter, and manage your coaching clients. Clients typically start as contacts - you can add them from your contact list or create external clients for people you coach off-platform."
      right={<CoachingRightColumn />}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div style={{ display: 'grid', gap: 16, width: '100%' }}>
        {/* Filters */}
        <section style={sectionStyle}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 180px 160px',
              gap: 12,
            }}
          >
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
              style={primaryBtn}
            >
              + Add Client
            </button>
          </div>
        </section>

        {/* Table */}
        <section style={sectionStyle}>
          <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 8 }}>
            Clients
          </h2>
          <p
            style={{
              marginTop: 0,
              marginBottom: 16,
              color: '#78909C',
              fontSize: 13,
            }}
          >
            Clients are the people you actively coach. You can add them from
            your contact list (internal users) or as external clients for
            off-platform work.
          </p>

          {loading ? (
            <div style={{ padding: 16, color: '#90A4AE' }}>Loading clients...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0 8px',
                  background: 'transparent',
                }}
              >
                <thead>
                  <tr style={{ background: '#FAFAFA' }}>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Status</Th>
                    <Th>Next Session</Th>
                    <Th>Last Contact</Th>
                    <Th>Actions</Th>
                    <Th>Delete</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id || c.email}
                      style={{
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: 10,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <Td strong>{c.name}</Td>
                      <Td>{c.email}</Td>
                      <Td>
                        <span
                          style={{
                            fontSize: 12,
                            background:
                              c.status === 'At Risk'
                                ? '#FDECEA'
                                : c.status === 'New Intake'
                                ? '#E3F2FD'
                                : '#E8F5E9',
                            color:
                              c.status === 'At Risk'
                                ? '#C62828'
                                : c.status === 'New Intake'
                                ? '#1565C0'
                                : '#2E7D32',
                            padding: '4px 8px',
                            borderRadius: 999,
                          }}
                        >
                          {c.status}
                        </span>
                      </Td>
                      <Td>{c.next}</Td>
                      <Td>{c.last}</Td>
                      <Td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Link
                            href={`/dashboard/coaching/clients/${encodeURIComponent(
                              c.email || ''
                            )}`}
                            style={{
                              background: 'white',
                              border: '1px solid #eee',
                              borderRadius: 8,
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              color: '#FF7043',
                              textDecoration: 'none',
                              display: 'inline-block',
                            }}
                            aria-label={`View profile for ${c.name}`}
                          >
                            View Profile
                          </Link>
                          {c.clientId && (
                            <button
                              type="button"
                              onClick={() => startCoachThread(c.clientId)}
                              style={{
                                background: '#FF7043',
                                border: 'none',
                                borderRadius: 8,
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: 'white',
                              }}
                              aria-label={`Message ${c.name}`}
                            >
                              Message
                            </button>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          style={{
                            background: 'white',
                            border: '1px solid #FF7043',
                            color: '#FF7043',
                            borderRadius: 8,
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                          aria-label={`Delete ${c.name}`}
                          title="Delete client"
                        >
                          Delete
                        </button>
                      </Td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: 16,
                          color: '#90A4AE',
                          background: 'white',
                          border: '1px solid #eee',
                          borderRadius: 10,
                        }}
                      >
                        No clients yet. Use "Add Client" to bring in someone
                        from your contacts or add an external client.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Add Client Modal */}
      {modalOpen && (
        <div style={backdropStyle}>
          <form onSubmit={handleSaveClient} style={modalStyle}>
            <h3 style={{ marginTop: 0, color: '#FF7043' }}>Add Client</h3>

            {/* Mode toggle */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
                background: '#FAFAFA',
                borderRadius: 999,
                padding: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setModalMode('internal')}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: 'none',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background:
                    modalMode === 'internal' ? '#FF7043' : 'transparent',
                  color: modalMode === 'internal' ? 'white' : '#455A64',
                }}
              >
                From contacts
              </button>
              <button
                type="button"
                onClick={() => setModalMode('external')}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: 'none',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background:
                    modalMode === 'external' ? '#FF7043' : 'transparent',
                  color: modalMode === 'external' ? 'white' : '#455A64',
                }}
              >
                External client
              </button>
            </div>

            {modalMode === 'internal' ? (
              <>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 8,
                    fontSize: 12,
                    color: '#78909C',
                  }}
                >
                  Search your contacts to add someone you are coaching.
                </p>
                <input
                  type="text"
                  value={contactQuery}
                  onChange={(e) => searchContacts(e.target.value)}
                  placeholder="Start typing a name or email..."
                  style={{ width: '100%', padding: 8, marginBottom: 8 }}
                />
                <div
  style={{
    maxHeight: 160,
    overflowY: 'auto',
    border: '1px solid #eee',
    borderRadius: 8,
    padding: 4,
    marginBottom: 10,
    background: '#FAFAFA',
  }}
>
  {contactLoading && (
    <div
      style={{
        padding: 6,
        fontSize: 12,
        color: '#90A4AE',
      }}
    >
      Searching…
    </div>
  )}

  {!contactLoading &&
    !contactQuery.trim() &&
    contactResults.length === 0 && (
      <div
        style={{
          padding: 6,
          fontSize: 12,
          color: '#90A4AE',
        }}
      >
        Start typing to search your contacts.
      </div>
    )}

  {!contactLoading &&
    contactQuery.trim() &&
    contactResults.length === 0 && (
      <div
        style={{
          padding: 6,
          fontSize: 12,
          color: '#90A4AE',
        }}
      >
        No contacts matched that search. You can add them as an external client
        instead.
      </div>
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
          padding: '6px 8px',
          marginBottom: 4,
          borderRadius: 6,
          cursor: 'pointer',
          background: isSelected ? '#FFE0B2' : 'white',
          border: isSelected ? '1px solid #FF7043' : '1px solid #eee',
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: '#37474F',
            }}
          >
            {c.name || c.displayName || c.email}
          </div>
          {c.email && (
            <div
              style={{
                fontSize: 12,
                color: '#78909C',
              }}
            >
              {c.email}
            </div>
          )}
        </div>
        {isSelected && (
          <span
            style={{
              fontSize: 11,
              color: '#E65100',
              fontWeight: 700,
            }}
          >
            Selected
          </span>
        )}
      </div>
    );
  })}
</div>


                <label style={{ fontSize: 13, color: '#455A64' }}>
                  Status
                  <select
                    value={newClientStatus}
                    onChange={(e) => setNewClientStatus(e.target.value)}
                    style={{ width: '100%', padding: 8, marginTop: 4 }}
                  >
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="New Intake">New Intake</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 8,
                    fontSize: 12,
                    color: '#78909C',
                  }}
                >
                  Use this for people you coach who do not have a ForgeTomorrow
                  account yet.
                </p>
                <label style={{ fontSize: 13, color: '#455A64' }}>
                  Name
                  <input
                    type="text"
                    value={extName}
                    onChange={(e) => setExtName(e.target.value)}
                    style={{ width: '100%', padding: 8, marginTop: 4 }}
                  />
                </label>
                <label
                  style={{
                    fontSize: 13,
                    color: '#455A64',
                    marginTop: 8,
                  }}
                >
                  Email (optional)
                  <input
                    type="email"
                    value={extEmail}
                    onChange={(e) => setExtEmail(e.target.value)}
                    style={{ width: '100%', padding: 8, marginTop: 4 }}
                  />
                </label>
                <label
                  style={{
                    fontSize: 13,
                    color: '#455A64',
                    marginTop: 8,
                  }}
                >
                  Status
                  <select
                    value={extStatus}
                    onChange={(e) => setExtStatus(e.target.value)}
                    style={{ width: '100%', padding: 8, marginTop: 4 }}
                  >
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="New Intake">New Intake</option>
                  </select>
                </label>
              </>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={closeAddClientModal}
                disabled={saving}
                style={{
                  background: 'white',
                  color: '#FF7043',
                  border: '1px solid #FF7043',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: '#FF7043',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Client'}
              </button>
            </div>
          </form>
        </div>
      )}
    </CoachingLayout>
  );
}

/* ---------- Reused local styles ---------- */
const sectionStyle = {
  background: 'white',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  border: '1px solid #eee',
};

const inputStyle = {
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

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const modalStyle = {
  background: 'white',
  borderRadius: 12,
  padding: 20,
  width: 420,
  maxWidth: '95vw',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};
