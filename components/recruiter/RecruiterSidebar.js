// components/recruiter/RecruiterSidebar.js
import React from 'react';
import Link from 'next/link';
import { usePlan } from '@/context/PlanContext';

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

export default function RecruiterSidebar({
  active = 'dashboard',
  role: roleProp,
  variant,
  counts = {
    candidates: 0,
    jobs: 0,
    messages: 0,
    connections: 0,
    signal: 0,
  },
  initialOpen = { recruiter: true, seeker: false, connections: false }, // kept for compatibility (unused)
}) {
  const { isEnterprise: planIsEnterprise, can, role: ctxRole } = usePlan();

  const role = roleProp || ctxRole;
  const isEnterprise =
    typeof variant === 'string' ? variant === 'enterprise' : planIsEnterprise;

  const chromeRecruiter = isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
  const canSeeSettings = can('recruiter.settings.view');

  return (
    <nav
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
        href={`/profile?chrome=${chromeRecruiter}`}
        label="Profile"
        active={active === 'profile'}
      />
      <NavItem
        href="/recruiter/dashboard"
        label="Overview"
        active={active === 'dashboard'}
      />

      {/* Connections */}
      <SectionLabel>Connections</SectionLabel>
      <NavItem
        href={`/seeker/contact-center?chrome=${chromeRecruiter}`}
        label="Contact Center"
        active={active === 'contacts'}
        badge={counts.connections}
      />
      <NavItem
        href={`/seeker/messages?chrome=${chromeRecruiter}`}
        label="The Signal"
        active={active === 'messages'}
        badge={counts.signal}
      />
      <NavItem
        href={`/feed?chrome=${chromeRecruiter}`}
        label="Community Feed"
        active={active === 'feed'}
      />

      {/* Recruiter Tools */}
      <SectionLabel>Recruiter Tools</SectionLabel>
      <NavItem
        href="/recruiter/candidates"
        label="Candidates"
        active={active === 'candidates'}
        badge={counts.candidates}
      />
      <NavItem
        href="/recruiter/job-postings"
        label="Job Posting"
        active={active === 'job-postings'}
        badge={counts.jobs}
      />
      <NavItem
        href="/recruiter/messaging"
        label="Messaging"
        active={active === 'messaging'}
        badge={counts.messages}
      />
      <NavItem
        href="/recruiter/calendar"
        label="Calendar"
        active={active === 'calendar'}
      />
      {isEnterprise && (
        <>
          <NavItem
            href="/recruiter/analytics"
            label="Analytics"
            active={active === 'analytics'}
          />
          <NavItem
            href="/recruiter/pools"
            label="Talent Pools"
            active={active === 'pools'}
          />
        </>
      )}
      {canSeeSettings && (
        <NavItem
          href="/recruiter/settings"
          label="Settings"
          active={active === 'settings'}
        />
      )}

      {/* Seeker Tools */}
      <SectionLabel>Seeker Tools</SectionLabel>
      <NavItem
        href={`/seeker-dashboard?chrome=${chromeRecruiter}`}
        label="Seeker Dashboard"
        active={active === 'seeker-dashboard'}
      />
      <NavItem
        href={`/jobs?chrome=${chromeRecruiter}`}
        label="Apply to Jobs"
        active={active === 'jobs'}
      />
      <NavItem
        href={`/resume-cover?chrome=${chromeRecruiter}`}
        label="Resume &amp; Cover"
        active={active === 'resume-cover'}
      />
      <NavItem
        href={`/roadmap?chrome=${chromeRecruiter}`}
        label="Career Roadmap"
        active={active === 'roadmap'}
      />
      <NavItem
        href={`/seeker/calendar?chrome=${chromeRecruiter}`}
        label="Seeker Calendar"
        active={active === 'seeker-calendar'}
      />

      {/* Hearth / Resources */}
      <SectionLabel>Resources</SectionLabel>
      <NavItem
        href={`/seeker/the-hearth?chrome=${chromeRecruiter}`}
        label="The Hearth"
        active={active === 'hearth'}
      />
    </nav>
  );
}
