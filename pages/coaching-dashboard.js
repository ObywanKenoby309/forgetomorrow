// pages/coaching-dashboard.js
import React from 'react';
import CoachingSidebar from '../components/coaching/CoachingSidebar';
import Link from 'next/link';

export default function CoachingDashboardPage() {
  // --- Mock data (replace with real data later) ---
  const kpis = [
    { label: 'Sessions Today', value: 4 },
    { label: 'Active Clients', value: 18 },
    { label: 'Follow-ups Due', value: 6 },
  ];

  const upcomingSessions = [
    { time: '9:00 AM', client: 'Alex Turner', type: 'Career Strategy' },
    { time: '11:30 AM', client: 'Priya N.', type: 'Resume Review' },
    { time: '2:00 PM', client: 'Michael R.', type: 'Interview Prep' },
  ];

  const clients = [
    { name: 'Alex Turner', status: 'Active', next: 'Aug 14, 10:00 AM' },
    { name: 'Priya N.', status: 'Active', next: 'Aug 15, 1:30 PM' },
    { name: 'Michael R.', status: 'At Risk', next: 'Aug 13, 3:00 PM' },
    { name: 'Dana C.', status: 'New Intake', next: 'Aug 16, 9:00 AM' },
    { name: 'Robert L.', status: 'Active', next: 'Aug 19, 2:30 PM' },
  ];
  // ------------------------------------------------

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
      {/* Sidebar column (300px) */}
      <CoachingSidebar active="overview" />

      {/* Main column with fixed inner width to preserve right margin */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ maxWidth: 860 }}>
          {/* Today (KPI strip + sessions list) */}
          <Section title="Today">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 12 }}>
              {kpis.map((k) => (
                <KPI key={k.label} label={k.label} value={k.value} />
              ))}
            </div>

            <div style={grid3}>
              <Card title="Upcoming Sessions">
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                  {upcomingSessions.map((s, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid #eee',
                        borderRadius: 8,
                        padding: '8px 10px',
                        background: 'white',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{s.time}</span>
                      <span style={{ color: '#455A64' }}>{s.client}</span>
                      <span style={{ fontSize: 12, background: '#FFF3E0', color: '#E65100', padding: '4px 8px', borderRadius: 999 }}>
                        {s.type}
                      </span>
                    </li>
                  ))}
                </ul>
                <div style={{ textAlign: 'right', marginTop: 10 }}>
                  <Link href="/dashboard/coaching/sessions" style={{ color: '#FF7043', fontWeight: 600 }}>
                    View schedule
                  </Link>
                </div>
              </Card>

              <Card title="New Client Intakes">
                <div style={{ color: '#455A64' }}>2 new intakes pending review.</div>
              </Card>

              <Card title="Follow-ups Due">
                <div style={{ color: '#455A64' }}>6 follow-ups due by 5 PM.</div>
              </Card>
            </div>
          </Section>

          {/* Clients (compact table) */}
          <Section title="Clients">
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
                    <Th>Name</Th>
                    <Th>Status</Th>
                    <Th>Next Session</Th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c, i) => (
                    <tr key={c.name} style={{ borderTop: '1px solid #eee' }}>
                      <Td strong>{c.name}</Td>
                      <Td>
                        <span
                          style={{
                            fontSize: 12,
                            background: c.status === 'At Risk' ? '#FDECEA' : c.status === 'New Intake' ? '#E3F2FD' : '#E8F5E9',
                            color: c.status === 'At Risk' ? '#C62828' : c.status === 'New Intake' ? '#1565C0' : '#2E7D32',
                            padding: '4px 8px',
                            borderRadius: 999,
                          }}
                        >
                          {c.status}
                        </span>
                      </Td>
                      <Td>{c.next}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <Link href="/dashboard/coaching/clients" style={{ color: '#FF7043', fontWeight: 600 }}>
                View all clients
              </Link>
            </div>
          </Section>

          {/* Docs & Tools (keep as cards) */}
          <Section title="Docs & Tools">
            <div style={grid3}>
              <Card title="Templates & Guides" />
              <Card title="Resource Library" />
              <Card title="Announcements" />
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}

/* ---------- Local UI helpers (keep inline & minimal) ---------- */

function Section({ title, children }) {
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
      }}
    >
      <div
        style={{
          marginBottom: 12,
          color: '#FF7043',
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Card({ title, children }) {
  return (
    <div
      style={{
        background: '#FAFAFA',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        minHeight: 120,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {children || <div style={{ color: '#90A4AE' }}>Coming soon…</div>}
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 12,
        minHeight: 70,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, color: '#607D8B', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#263238' }}>{value}</div>
    </div>
  );
}

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

const grid3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
};
