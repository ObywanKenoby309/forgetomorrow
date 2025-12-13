// components/recruiter/RecruiterSidebar.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePlan } from '@/context/PlanContext';

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
        width: 0,
        height: 0,
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
      aria-current={active ? 'page' : undefined}
      style={base}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = ORANGE_SOFT;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = CARD_BG;
      }}
    >
      <span>{label}</span>
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
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderRadius: 12,
          padding: '10px 14px',
          background: CARD_BG,
          border: `1px solid ${CARD_BORDER}`,
          fontWeight: 800,
          color: TEXT_MAIN,
          cursor: 'pointer',
        }}
      >
        <Chevron open={open} />
        <span>{title}</span>
      </button>

      {open && (
        <div
          style={{
            display: 'grid',
            gap: 8,
            background: '#F9FAFB',
            border: `1px solid ${CARD_BORDER}`,
            borderRadius: 12,
            padding: 8,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function RecruiterSidebar({
  active = 'dashboard',
  role: roleProp,
  variant,
  initialOpen = { recruiter: true, seeker: false, connections: false },
}) {
  const { isEnterprise: planIsEnterprise, can, role: ctxRole } = usePlan();

  const [counts, setCounts] = useState({
    connections: 0,
    signal: 0,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadCounts() {
      try {
        const [contactsRes, threadsRes] = await Promise.all([
          fetch('/api/contacts/summary'),
          fetch('/api/signal/threads'),
        ]);

        let connections = 0;
        let signal = 0;

        if (contactsRes.ok) {
          const data = await contactsRes.json();
          const incoming = Array.isArray(data.incoming)
            ? data.incoming.length
            : 0;
          const outgoing = Array.isArray(data.outgoing)
            ? data.outgoing.length
            : 0;
          connections = incoming + outgoing;
        }

        if (threadsRes.ok) {
          const data = await threadsRes.json();
          signal = Array.isArray(data.threads) ? data.threads.length : 0;
        }

        if (isMounted) {
          setCounts({ connections, signal });
        }
      } catch (err) {
        console.error('RecruiterSidebar counts error:', err);
      }
    }

    loadCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const role = roleProp || ctxRole;
  const isEnterprise =
    typeof variant === 'string' ? variant === 'enterprise' : planIsEnterprise;

  const chromeRecruiter = isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
  const canSeeSettings = can('recruiter.settings.view');

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

      <Section title="Connections" defaultOpen={!!initialOpen.connections}>
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
      </Section>

      <Section title="Recruiter Tools" defaultOpen={!!initialOpen.recruiter}>
        <NavItem
          href="/recruiter/candidates"
          label="Candidates"
          active={active === 'candidates'}
        />
        <NavItem
          href="/recruiter/job-postings"
          label="Job Posting"
          active={active === 'job-postings'}
        />
        <NavItem
          href="/recruiter/messaging"
          label="Messaging"
          active={active === 'messaging'}
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
      </Section>

      <Section title="Seeker Tools" defaultOpen={!!initialOpen.seeker}>
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
          label="Resume & Cover"
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
      </Section>

      <NavItem
        href={`/seeker/the-hearth?chrome=${chromeRecruiter}`}
        label="The Hearth"
        active={active === 'hearth'}
      />
    </nav>
  );
}
