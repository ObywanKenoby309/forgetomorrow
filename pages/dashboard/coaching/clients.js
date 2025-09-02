// pages/dashboard/coaching/clients.js
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

export default function CoachingClientsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');

  // --- Mock data (state, so Delete can modify it) ---
  const [clients, setClients] = useState([
    { name: 'Alex Turner', email: 'alex.turner@example.com', status: 'Active',   next: 'Aug 14, 10:00 AM', last: 'Aug 10' },
    { name: 'Priya N.',    email: 'priya.n@example.com',     status: 'Active',   next: 'Aug 15, 1:30 PM', last: 'Aug 11' },
    { name: 'Michael R.',  email: 'michael.r@example.com',   status: 'At Risk',  next: 'Aug 13, 3:00 PM', last: 'Aug 07' },
    { name: 'Dana C.',     email: 'dana.c@example.com',      status: 'New Intake', next: 'Aug 16, 9:00 AM', last: 'Aug 12' },
    { name: 'Robert L.',   email: 'robert.l@example.com',    status: 'Active',   next: 'Aug 19, 2:30 PM', last: 'Aug 09' },
  ]);
  // ---------------------------------------------------

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const bySearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const byStatus = status === 'All' ? true : c.status === status;
      return bySearch && byStatus;
    });
  }, [clients, search, status]);

  const handleDelete = (email) => {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    setClients(prev => prev.filter(c => c.email !== email));
  };

  return (
    <CoachingLayout
      title="Clients | ForgeTomorrow"
      activeNav="clients"
      headerDescription="Search, filter, and manage your coaching clients."
      right={<CoachingRightColumn />}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {/* Center column content */}
      {/* CHANGED: remove maxWidth cap so center column can use full width */}
      <div style={{ display: 'grid', gap: 16, width: '100%' }}>
        {/* Filters */}
        <section style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 160px', gap: 12 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
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
              onClick={() => alert('Add Client (coming soon)')}
              style={primaryBtn}
            >
              + Add Client
            </button>
          </div>
        </section>

        {/* Table */}
        <section style={sectionStyle}>
          <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 12 }}>Clients</h2>

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
                    key={c.email}
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
                            c.status === 'At Risk' ? '#FDECEA'
                            : c.status === 'New Intake' ? '#E3F2FD'
                            : '#E8F5E9',
                          color:
                            c.status === 'At Risk' ? '#C62828'
                            : c.status === 'New Intake' ? '#1565C0'
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
                      <Link
                        href={`/dashboard/coaching/clients/${encodeURIComponent(c.email)}`}
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
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.email)}
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
                      No clients match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
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
