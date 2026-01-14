// components/internal/InternalSidebar.js
import React from 'react';
import Link from 'next/link';

const ORANGE = '#FF7043';

const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(17,24,39,0.55)',
        padding: '10px 6px 6px',
      }}
    >
      {children}
    </div>
  );
}

function NavItem({ href, label, active, subtle }) {
  const base = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: 900,
    fontSize: 13,
    color: active ? '#fff' : subtle ? 'rgba(17,24,39,0.72)' : '#111827',
    background: active ? ORANGE : 'transparent',
    border: active ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
    transition: 'background 120ms ease, color 120ms ease, transform 80ms ease',
  };

  return (
    <Link
      href={href}
      style={base}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'rgba(255,112,67,0.08)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ minWidth: 0 }}>{label}</span>
      {active ? <span style={{ fontWeight: 900, opacity: 0.95 }}>›</span> : null}
    </Link>
  );
}

export default function InternalSidebar({ active = 'dashboard', hat = 'seeker' }) {
  return (
    <nav aria-label="Employee Suite navigation" style={{ ...CARD, padding: 12, display: 'grid', gap: 6 }}>
      <SectionLabel>Employee Suite</SectionLabel>

      {/* ✅ IMPORTANT: always allow return to Dashboard */}
      <NavItem href="/internal/dashboard" label="Dashboard" active={active === 'dashboard'} />

      <NavItem href="/internal/tickets/new" label="Create Ticket" active={active === 'new'} />
      <NavItem href="/internal/tickets/mine" label="My Opened Tickets" active={active === 'mine'} />
      <NavItem href="/internal/queues" label="Queue Management" active={active === 'queues'} />
      <NavItem href="/internal/reports" label="Reports" active={active === 'reports'} />

      <SectionLabel>Forge Site</SectionLabel>
      <NavItem href={`/seeker-dashboard?chrome=${encodeURIComponent(hat)}`} label="Open Site" active={false} subtle />
    </nav>
  );
}
