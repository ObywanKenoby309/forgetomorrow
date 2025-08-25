// components/coaching/CoachingSidebar.js
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router'; // 👈 NEW

const ORANGE = '#FF7043';
const ORANGE_SOFT = '#FFEDE6';
const CARD_BG = '#FFFFFF';
const CARD_BORDER = '#E6E6E6';
const TEXT_MAIN = '#263238';

function Chevron({ open }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 0, height: 0,
        borderTop: '6px solid transparent',
        borderBottom: '6px solid transparent',
        borderLeft: `8px solid ${ORANGE}`,
        transition: 'transform 120ms ease',
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
      }}
    />
  );
}

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
    border: `1px solid ${CARD_BORDER}`,
    transition: 'background 120ms ease, color 120ms ease',
  };
  return (
    <Link
      href={href}
      style={base}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = ORANGE_SOFT; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = CARD_BG; }}
    >
      <span style={{ flex: '0 1 auto' }}>{label}</span>
      <Badge value={badge} />
    </Link>
  );
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          borderRadius: 12, padding: '10px 14px',
          background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
          fontWeight: 800, color: TEXT_MAIN, cursor: 'pointer',
        }}
      >
        <Chevron open={open} />
        <span>{title}</span>
      </button>

      {open && (
        <div
          style={{
            display: 'grid', gap: 8,
            background: '#F9FAFB',
            border: `1px solid ${CARD_BORDER}`,
            borderRadius: 12, padding: 8,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function CoachingSidebar({
  active = 'overview', // kept for backward-compat, but URL now drives highlighting
  counts = { clients: 0, sessions: 0, feedback: 0 },
  initialOpen = { coaching: false, seeker: false },
}) {
  const router = useRouter();
  const normalize = (p) => (p || '').split('?')[0].replace(/\/$/, '') || '/';
  const here = normalize(router.pathname); // e.g., "/seeker/jobs" (query ignored)

  const isActive = (href) => normalize(href) === here;

  return (
    <nav
      style={{
        display: 'grid',
        gap: 12,
        position: 'sticky',
        top: 24,
        alignSelf: 'start',
        height: 'fit-content',
      }}
    >
      {/* Coaching Overview */}
      <NavItem
        href="/coaching-dashboard"
        label="Overview"
        active={isActive('/coaching-dashboard')}
      />

      {/* Coaching Tools */}
      <Section title="Coaching Tools" defaultOpen={!!initialOpen.coaching}>
        <NavItem
          href="/dashboard/coaching/clients"
          label="Clients"
          active={isActive('/dashboard/coaching/clients')}
          badge={counts.clients}
        />
        <NavItem
          href="/dashboard/coaching/sessions"
          label="Sessions"
          active={isActive('/dashboard/coaching/sessions')}
          badge={counts.sessions}
        />
        <NavItem
          href="/dashboard/coaching/sessions/calendar"
          label="Calendar"
          active={isActive('/dashboard/coaching/sessions/calendar')}
        />
        <NavItem
          href="/dashboard/coaching/resources"
          label="Resources"
          active={isActive('/dashboard/coaching/resources')}
        />
        <NavItem
          href="/dashboard/coaching/feedback"
          label="Feedback"
          active={isActive('/dashboard/coaching/feedback')}
          badge={counts.feedback}
        />
        <NavItem
          href="/dashboard/coaching/jobs"
          label="To The Pipeline"
          active={isActive('/dashboard/coaching/jobs')}
        />
      </Section>

      {/* Seeker Tools (render Seeker pages with coach chrome via ?chrome=coach) */}
      <Section title="Seeker Tools" defaultOpen={!!initialOpen.seeker}>
        <NavItem
          href="/seeker-dashboard?chrome=coach"
          label="Seeker Dashboard"
          active={isActive('/seeker-dashboard')}
        />
        <NavItem
          href="/seeker/jobs?chrome=coach"
          label="Jobs"
          active={isActive('/seeker/jobs')}
        />
        <NavItem
          href="/seeker/applications?chrome=coach"
          label="Applications"
          active={isActive('/seeker/applications')}
        />
        <NavItem
          href="/resume-cover?chrome=coach"
          label="Resume & Cover"
          active={isActive('/resume-cover')}
        />
        <NavItem
          href="/roadmap?chrome=coach"
          label="Career Roadmap"
          active={isActive('/roadmap')}
        />
        <NavItem
          href="/seeker/calendar?chrome=coach"
          label="Seeker Calendar"
          active={isActive('/seeker/calendar')}
        />
      </Section>
    </nav>
  );
}
