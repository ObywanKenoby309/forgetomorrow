// components/contact-center/ContactCenterToolbar.js
// Unified navigation bar for the Contact Center suite.
// On mobile: pill-style sticky strip matching contact-center.js MobileTabStrip.
// On desktop: card-style tab row with badge counts.
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(null);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

const TABS = [
  { key: 'contacts',     label: 'Contacts',      href: '/seeker/contact-center',  countKey: 'contacts'    },
  { key: 'invites',      label: 'Invites',        href: '/seeker/contact-incoming', countKey: 'invitesIn'   },
  { key: 'requests',     label: 'Requests',       href: '/seeker/contact-outgoing', countKey: 'invitesOut'  },
  { key: 'profileViews', label: 'Profile Views',  href: '/seeker/profile-views',   countKey: 'profileViews'},
  { key: 'blocked',      label: 'Blocked',        href: '/seeker/blocked',          countKey: 'blocked'     },
];

export default function ContactCenterToolbar({ currentTab = 'contacts', counts: propCounts }) {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const isMobile = useIsMobile();

  // Fetch counts if parent didn't provide them
  const [fetchedCounts, setFetchedCounts] = useState({
    contacts: 0, invitesIn: 0, invitesOut: 0, profileViews: 0, blocked: 0,
  });

  useEffect(() => {
    if (propCounts) return;
    (async () => {
      try {
        const [summaryRes, pvRes, blockedRes] = await Promise.all([
          fetch('/api/contacts/summary'),
          fetch('/api/profile/views?limit=5'),
          fetch('/api/signal/blocked?countOnly=true'),
        ]);
        const summary = summaryRes.ok ? await summaryRes.json() : {};
        const pv      = pvRes.ok      ? await pvRes.json()      : {};
        const blocked = blockedRes.ok  ? await blockedRes.json() : {};
        setFetchedCounts({
          contacts:     summary.contacts?.length   || 0,
          invitesIn:    summary.incoming?.length   || 0,
          invitesOut:   summary.outgoing?.length   || 0,
          profileViews: pv.views?.length           || 0,
          blocked:      blocked.count              || 0,
        });
      } catch { /* silent */ }
    })();
  }, [propCounts]);

  const counts = propCounts || fetchedCounts;

  // ── MOBILE: pill strip matching contact-center.js MobileTabStrip ──────────
  if (isMobile) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            padding: '10px 16px',
            minWidth: 0,
          }}
        >
          {TABS.map((tab) => {
            const isActive = currentTab === tab.key;
            const badge = counts[tab.countKey] || 0;
            const hasAlert = badge > 0 && tab.key !== 'contacts';

            return (
              <Link
                key={tab.key}
                href={withChrome(tab.href)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: 'none',
                  whiteSpace: 'normal',
                  lineHeight: 1.1,
                  background: isActive
                    ? '#FF7043'
                    : hasAlert
                    ? 'rgba(255,112,67,0.10)'
                    : 'rgba(0,0,0,0.04)',
                  color: isActive ? 'white' : hasAlert ? '#FF7043' : '#607D8B',
                  border: isActive
                    ? 'none'
                    : `1px solid ${hasAlert ? 'rgba(255,112,67,0.25)' : 'transparent'}`,
                  boxShadow: isActive ? '0 4px 12px rgba(255,112,67,0.30)' : 'none',
                  boxSizing: 'border-box',
                }}
              >
                {tab.label}
                {badge > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      borderRadius: 999,
                      padding: '1px 6px',
                      background: isActive ? 'rgba(255,255,255,0.30)' : 'rgba(255,112,67,0.20)',
                      color: isActive ? 'white' : '#374151',
                      flexShrink: 0,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DESKTOP: original card-style tab row ──────────────────────────────────
  // isMobile === null (SSR/hydration) or false — render desktop version
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 12,
        border: '1px solid #eee',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const isActive = currentTab === tab.key;
          const badge = counts[tab.countKey] || 0;
          const hasBadge = badge > 0;
          const highlight = hasBadge && tab.key !== 'contacts';

          return (
            <Link
              key={tab.key}
              href={withChrome(tab.href)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 10,
                border: `1px solid ${isActive || highlight ? '#FFCCBC' : '#eee'}`,
                background: isActive || highlight ? '#FFF3E9' : 'white',
                color: isActive || highlight ? '#D84315' : '#374151',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>{tab.label}</span>
              {typeof badge === 'number' && (
                <span
                  style={{
                    background: hasBadge ? '#FFE0B2' : '#ECEFF1',
                    color: '#374151',
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}