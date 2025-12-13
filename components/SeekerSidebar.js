// components/SeekerSidebar.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const ORANGE = '#FF7043';
const ORANGE_SOFT = '#FFEDE6';
const CARD_BG = '#FFFFFF';
const CARD_BORDER = '#E6E6E6';
const TEXT_MAIN = '#263238';

// ───────────────── Chevron ─────────────────
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

// ───────────────── Badge ─────────────────
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

// ───────────────── Nav Item ─────────────────
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

// ───────────────── Section ─────────────────
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

// ───────────────── MAIN: SeekerSidebar ─────────────────
export default function SeekerSidebar({ active = '' }) {
  // connections = pending invites (incoming + outgoing)
  // signal = Signal conversations (simple count for now)
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
          // show only "things to handle" as the badge
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
        console.error('SeekerSidebar counts error:', err);
      }
    }

    loadCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <nav style={{ display: 'grid', gap: 12 }}>
      {/* Profile */}
      <NavItem
        href="/profile"
        label="Profile"
        active={active === 'profile'}
      />

      {/* Connections */}
      <Section title="Connections" defaultOpen={false}>
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
        <NavItem href="/feed" label="Community Feed" active={active === 'feed'} />
      </Section>

      {/* Tools */}
      <Section title="Tools" defaultOpen={false}>
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
        <NavItem
          href="/jobs"
          label="Pipeline"
          active={active === 'jobs'}
        />
      </Section>

      {/* Hearth */}
      <NavItem
        href="/seeker/the-hearth"
        label="The Hearth"
        active={active === 'the-hearth'}
      />
    </nav>
  );
}
