// components/coaching/CoachingSidebar.js
import React from 'react';
import Link from 'next/link';

// ✅ NEW
import { useEffect, useState } from 'react';

const ORANGE = '#FF7043';
const TEXT_MAIN = '#263238';

// ✅ Glass standard (align with RecruiterSidebar canonical frosted glass)
const GLASS_BG = 'rgba(255,255,255,0.68)';
const GLASS_BORDER = 'rgba(255,255,255,0.22)';
const GLASS_SHADOW = '0 10px 26px rgba(0,0,0,0.12)';
const GLASS_BLUR = 'blur(12px)';

// Hover / subtle fills on glass
const HOVER_BG = 'rgba(255,112,67,0.10)'; // orange tint but still “breathes”
const ACTIVE_SHADOW = '0 12px 24px rgba(0,0,0,0.12)';

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
        boxShadow: '0 10px 18px rgba(0,0,0,0.10)',
      }}
    >
      {value > 99 ? '99+' : value}
    </span>
  );
}

// ✅ NEW: subtle dot (used for Action Center unread indicator)
function Dot({ show }) {
  if (!show) return null;
  return (
    <span
      aria-label="Unread updates"
      title="Unread updates"
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: 999,
        background: ORANGE,
        boxShadow: '0 6px 12px rgba(0,0,0,0.12)',
        marginLeft: 8,
        flex: '0 0 auto',
      }}
    />
  );
}

function NavItem({ href, label, active, badge, dot }) {
  const base = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 14,
    color: active ? '#FFFFFF' : TEXT_MAIN,
    background: active ? ORANGE : 'transparent',
    borderRadius: 12,
    transition:
      'background 120ms ease, color 120ms ease, box-shadow 120ms ease, transform 80ms ease',
    boxShadow: active ? ACTIVE_SHADOW : 'none',
  };

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      style={base}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = HOVER_BG;
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
            top: 7,
            bottom: 7,
            width: 3,
            borderRadius: 999,
            background: '#FFFFFF',
            opacity: 0.85,
          }}
        />
      )}
      <span style={{ marginLeft: active ? 6 : 0 }}>{label}</span>

      {/* ✅ NEW: dot indicator (Action Center unread) */}
      <Dot show={dot} />

      <Badge value={badge} />
    </Link>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(31, 41, 55, 0.55)',
        padding: '8px 4px 2px',
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

  // ✅ NEW: DB-backed staff fields (from session/user)
  employee = false,
  department = '',
}) {
  const dept = String(department || '').trim().toLowerCase();
  const staffAccess = employee === true && dept.length > 0;

  // ✅ NEW: unread dot for Action Center (shown on Dashboard in sidebar)
  const [hasActionUnread, setHasActionUnread] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count?scope=COACH', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;

        setHasActionUnread(!!data?.hasUnread);
      } catch {
        // swallow - no dot if API fails
      }
    };

    load();
    const t = setInterval(load, 25000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

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

        // ✅ Glass container (match Recruiter)
        background: GLASS_BG,
        borderRadius: 18,
        border: `1px solid ${GLASS_BORDER}`,
        boxShadow: GLASS_SHADOW,
        padding: 12,
        backdropFilter: GLASS_BLUR,
        WebkitBackdropFilter: GLASS_BLUR,
      }}
    >
      {/* Profile + Dashboard */}
      <NavItem
        href="/profile?chrome=coach"
        label="Profile"
        active={active === 'profile'}
      />
      <NavItem
        href="/coaching-dashboard"
        label="Dashboard"
        active={active === 'dashboard'}
        dot={hasActionUnread}
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

      {/* Seeker Tools (coach chrome) */}
      <SectionLabel>Seeker Tools</SectionLabel>
      <NavItem
        href="/seeker-dashboard?chrome=coach"
        label="Seeker Dashboard"
        active={active === 'seeker-dashboard'}
      />
      <NavItem
        href="/jobs?chrome=coach"
        label="Apply to Jobs"
        active={active === 'jobs'}
      />
      <NavItem
        href="/anvil?chrome=coach"
        label="The Anvil"
        active={active === 'anvil' || active === 'roadmap'}
      />

      {/* Resources */}
      <SectionLabel>Resources</SectionLabel>
      <NavItem
        href="/the-hearth?chrome=coach"
        label="The Hearth"
        active={active === 'hearth'}
      />

      {/* ✅ NEW: Staff tools (DB-backed via employee + department) */}
      {staffAccess ? (
        <>
          <SectionLabel>Staff Tools</SectionLabel>
          <NavItem
            href="/internal/dashboard"
            label="Forge Workspace"
            active={active === 'forge-workspace'}
          />
        </>
      ) : null}
    </nav>
  );
}
