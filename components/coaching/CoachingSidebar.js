// components/coaching/CoachingSidebar.js
import Link from 'next/link';

export default function CoachingSidebar({ active = 'overview' }) {
  const Item = ({ id, href, label }) => {
    const isActive = active === id;
    return (
      <Link
        href={href}
        style={{
          display: 'block',
          padding: '10px 12px',
          borderRadius: 8,
          textDecoration: 'none',
          color: isActive ? '#FF7043' : '#455A64',
          background: isActive ? 'rgba(255,112,67,0.08)' : 'transparent',
          fontWeight: isActive ? 700 : 500,
          border: isActive ? '1px solid rgba(255,112,67,0.25)' : '1px solid transparent',
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <aside
      style={{
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        border: '1px solid #eee',
      }}
    >
      <div style={{ fontWeight: 700, color: '#FF7043', fontSize: 18, marginBottom: 6 }}>
        Coaching
      </div>
      <Item id="overview" href="/coaching-dashboard" label="Overview" />
      <Item id="clients" href="/dashboard/coaching/clients" label="Clients" />
      <Item id="sessions" href="/dashboard/coaching/sessions" label="Sessions" />
      <Item id="resources" href="/dashboard/coaching/resources" label="Resources" />
      <div style={{ height: 1, background: '#eee', margin: '8px 0' }} />
      <Item id="applications" href="/applications" label="Applications Tracker" />
      <Item id="resume" href="/resume/create" label="Resume Builder" />
    </aside>
  );
}
