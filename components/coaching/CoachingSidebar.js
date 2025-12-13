// components/coaching/CoachingSidebar.js
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

export default function CoachingSidebar({
  active = 'overview',
  counts = {
    clients: 0,
    sessions: 0,
    feedback: 0,
    connections: 0,
    signal: 0,
    feed: 0,
  },
}) {
  return (
    <nav
      aria-label="Coach navigation"
      style={{
        display: 'grid',
        gap: 6,
        position: 'sticky',
        top: 24,
        alignSelf: 'start',
        height: 'fit-content',
        background: CARD_BG,
        borderRadius: 16,
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
        padding: 12,
      }}
    >
      {/* Profile + Overview */}
      <NavItem
        href="/profile?chrome=coach"
        label="Profile"
        active={active === 'profile'}
      />
      <NavItem
        href="/coaching-dashboard"
        label="Overview"
        active={active === 'overview'}
      />

      {/* Connections */}
      <SectionLabel>Connections</SectionLabel>
      <NavItem
        href="/seeker/contact-center?chrome=coach"
        label="Contact Center"
        active={active === 'contacts'}
        badge={counts.connections}
      />
      <NavItem
        href="/seeker/messages?chrome=coach"
        label="The Signal"
        active={active === 'messages'}
        badge={counts.signal}
      />
      <NavItem
        href="/feed?chrome=coach"
        label="Community Feed"
        active={active === 'feed'}
        badge={counts.feed}
      />

      {/* Coaching Tools */}
      <SectionLabel>Coaching Tools</SectionLabel>
      <NavItem
        href="/dashboard/coaching/clients"
        label="Clients"
        active={active === 'clients'}
        badge={counts.clients}
      />
      <NavItem
        href="/dashboard/coaching/sessions"
        label="Sessions"
        active={active === 'sessions'}
        badge={counts.sessions}
      />
      <NavItem
        href="/dashboard/coaching/sessions/calendar"
        label="Calendar"
        active={active === 'calendar'}
      />
      <NavItem
        href="/dashboard/coaching/resources"
        label="Resources"
        active={active === 'resources'}
      />
      <NavItem
        href="/dashboard/coaching/feedback"
        label="Feedback"
        active={active === 'feedback'}
        badge={counts.feedback}
      />
      <NavItem
        href="/coaching/messaging"
        label="Messaging"
        active={active === 'coach-messages'}
      />

      {/* Jobs */}
      <SectionLabel>Jobs</SectionLabel>
      <NavItem
        href="/jobs?chrome=coach"
        label="Apply to Jobs"
        active={active === 'jobs'}
      />

      {/* Seeker Tools (coach chrome) */}
      <SectionLabel>Seeker Tools</SectionLabel>
      <NavItem
        href="/seeker-dashboard?chrome=coach"
        label="Seeker Dashboard"
        active={active === 'seeker-dashboard'}
      />
      <NavItem
        href="/resume-cover?chrome=coach"
        label="Resume &amp; Cover"
        active={active === 'resume-cover'}
      />
      <NavItem
        href="/roadmap?chrome=coach"
        label="Career Roadmap"
        active={active === 'roadmap'}
      />
      <NavItem
        href="/seeker/calendar?chrome=coach"
        label="Seeker Calendar"
        active={active === 'seeker-calendar'}
      />

      {/* Hearth */}
      <SectionLabel>Resources</SectionLabel>
      <NavItem
        href="/the-hearth?chrome=coach"
        label="The Hearth"
        active={active === 'hearth'}
      />
    </nav>
  );
}
