// components/SeekerSidebar.js
import React from 'react';
import Link from 'next/link';

const ORANGE = '#FF7043';
const ORANGE_SOFT = '#FFEDE6';
const CARD_BG = '#FFFFFF';
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
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 14,
    color: active ? '#FFFFFF' : TEXT_MAIN,
    background: active ? ORANGE : 'transparent',
    borderRadius: 10,
    transition:
      'background 120ms ease, color 120ms ease, box-shadow 120ms ease, transform 80ms ease',
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
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      {active && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 6,
            bottom: 6,
            width: 3,
            borderRadius: 999,
            background: '#FFFFFF',
            opacity: 0.8,
          }}
        />
      )}

      <span style={{ marginLeft: active ? 6 : 0 }}>{label}</span>
      <Badge value={badge} />
    </Link>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#90A4AE',
        padding: '4px 2px 0',
      }}
    >
      {children}
    </div>
  );
}

export default function SeekerSidebar({
  active = '',
  counts = { connections: 0, signal: 0, feed: 0 },
}) {
  return (
    <nav
      aria-label="Seeker navigation"
      style={{
        background: CARD_BG,
        borderRadius: 16,
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
        padding: 12,
        display: 'grid',
        gap: 4,
      }}
    >
      {/* Profile */}
      <NavItem href="/profile" label="Profile" active={active === 'profile'} />

      {/* Connections */}
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
        badge={counts.feed}
      />

      {/* Tools */}
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

      {/* Resources */}
      <SectionLabel>Resources</SectionLabel>
      <NavItem
        href="/the-hearth"
        label="The Hearth"
        active={active === 'the-hearth'}
      />
    </nav>
  );
}
