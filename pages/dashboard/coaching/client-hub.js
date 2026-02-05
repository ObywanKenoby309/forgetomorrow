// pages/dashboard/coaching/client-hub.js
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';

function HeaderBox() {
  return (
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
      <h1
        style={{
          color: '#FF7043',
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
        }}
      >
        Client Hub
      </h1>
      <p
        style={{
          marginTop: 8,
          color: '#546E7A',
          fontSize: 14,
        }}
      >
        Manage clients, sessions, and feedback - in one place.
      </p>
    </section>
  );
}

function RightRail() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          background: 'white',
          borderRadius: 10,
          padding: 12,
          display: 'grid',
          gap: 8,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          border: '1px solid #eee',
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F' }}>Shortcuts</div>
        <Link href="/dashboard/coaching/clients" style={{ color: '#FF7043', fontWeight: 700 }}>
          Clients
        </Link>
        <Link href="/dashboard/coaching/sessions" style={{ color: '#FF7043', fontWeight: 700 }}>
          Sessions
        </Link>
        <Link href="/dashboard/coaching/feedback" style={{ color: '#FF7043', fontWeight: 700 }}>
          Feedback
        </Link>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: 10,
          padding: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          border: '1px solid #eee',
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F', marginBottom: 4 }}>
          Need help?
        </div>
        <p style={{ margin: 0, color: '#607D8B', fontSize: 13 }}>
          Use the orange “Need help? Chat with Support” button at the bottom-right of the screen.
        </p>
      </div>
    </div>
  );
}

function HubCard({ title, description, href }) {
  return (
    <Link
      href={href}
      style={{
        background: 'white',
        borderRadius: 14,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textDecoration: 'none',
        color: 'inherit',
        display: 'grid',
        gap: 8,
        minHeight: 120,
      }}
    >
      <div style={{ fontWeight: 900, color: '#37474F', fontSize: 16 }}>{title}</div>
      <div style={{ color: '#607D8B', fontSize: 13, lineHeight: 1.45 }}>{description}</div>
      <div style={{ marginTop: 'auto', color: '#FF7043', fontWeight: 800, fontSize: 13 }}>
        Open →
      </div>
    </Link>
  );
}

export default function ClientHub() {
  return (
    <CoachingLayout
      title="ForgeTomorrow — Client Hub"
      header={<HeaderBox />}
      right={<RightRail />}
      activeNav="client-hub"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
        }}
      >
        <HubCard
          title="Clients"
          description="Manage active clients, goals, and coaching plans."
          href="/dashboard/coaching/clients"
        />
        <HubCard
          title="Sessions"
          description="Schedule, track, and review upcoming and past sessions."
          href="/dashboard/coaching/sessions"
        />
        <HubCard
          title="Feedback"
          description="Review coaching feedback and trends to keep improving outcomes."
          href="/dashboard/coaching/feedback"
        />
      </div>
    </CoachingLayout>
  );
}
