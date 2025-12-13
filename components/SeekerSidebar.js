// components/SeekerSidebar.js
import React from 'react';
import Link from 'next/link';

const ORANGE = '#FF7043';
const ORANGE_SOFT = '#FFEDE6';
const CARD_BG = '#FFFFFF';
const CARD_BORDER = '#E6E6E6';
const TEXT_MAIN = '#263238';

function Badge({ value }) {
  if (!value) return null;
  return (
    <span
      aria-label={`${value} unread`}
      style={{
        marginLeft: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 22,
        height: 20,
        padding: '0 6px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        color: '#fff',
        background: ORANGE,
      }}
    >
      {value > 99 ? '99+' : value}
    </span>
  );
}

function NavItem({ href, label, active, badge }) {
  const base = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: '10px 14px',
    textDecoration: 'none',
    fontWeight: 700,
    color: active ? '#FFFFFF' : TEXT_MAIN,
    background: active ? ORANGE : CARD_BG,
    border: `1px solid ${active ? '#FFAB91' : CARD_BORDER}`,
    boxShadow: active ? '0 0 0 1px #FFCCBC' : '0 1px 2px rgba(0,0,0,0.04)',
    transition: 'background 120ms ease, color 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
  };

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      style={base}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = ORANGE_SOFT;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = CARD_BG;
      }}
    >
      <span style={{ flex: '0 1 auto' }}>{label}</span>
      <Badge value={badge} />
    </Link>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: '#90A4AE',
        padding: '2px 4px',
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}

export default function SeekerSidebar({
  active = '',
  counts = { connections: 0, signal: 0 },
}) {
  return (
    <nav
      style={{
        display: 'grid',
        gap: 10,
      }}
    >
      {/* Profile */}
      <NavItem href="/profile" label="Profile" active={active === 'profile'} />

      {/* Connections group */}
      <SectionLabel>Connections</SectionLabel>
      <NavItem
        href="/seeker/contact-center"
        label="Contact Center"
        active={active === 'contacts'}
        badge={counts.connections}
      />
      <NavItem
        href="/seeker/messages"
        label="The Signal"
        active={active === 'messages'}
        badge={counts.signal}
      />
      <NavItem
        href="/feed"
        label="Community Feed"
        active={active === 'feed'}
      />

      {/* Tools group */}
      <SectionLabel>Tools</SectionLabel>
      <NavItem
        href="/seeker-dashboard"
        label="Dashboard"
        active={active === 'dashboard'}
      />
      <NavItem
        href="/seeker/calendar"
        label="Calendar"
        active={active === 'calendar'}
      />
      <NavItem
        href="/roadmap"
        label="Career Roadmap"
        active={active === 'roadmap'}
      />
      <NavItem
        href="/resume-cover"
        label="Creator"
        active={active === 'resume-cover'}
      />
      <NavItem href="/jobs" label="Pipeline" active={active === 'jobs'} />

      {/* Hearth */}
      <SectionLabel>Resources</SectionLabel>
      <NavItem
        href="/seeker/the-hearth"
        label="The Hearth"
        active={active === 'the-hearth'}
      />
    </nav>
  );
}
