// pages/seeker/contact-center.js
import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import ContactsList from '@/components/ContactsList';
import IncomingRequestsList from '@/components/IncomingRequestsList';
import OutgoingRequestsList from '@/components/OutgoingRequestsList';
import GroupsList from '@/components/GroupsList';
import PagesList from '@/components/PagesList';
import NewslettersList from '@/components/NewslettersList';
import ContactCenterToolbar from '@/components/contact-center/ContactCenterToolbar';

// ─── Shared styles ────────────────────────────────────────────────────────────
const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
};

// ✅ Mobile clamp helpers (prevents cards from stretching past viewport)
const MOBILE_FULL_WIDTH = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
};

const MOBILE_ROOT = {
  ...MOBILE_FULL_WIDTH,
  minWidth: 0,
  overflowX: 'hidden',
};

// ─── SSR-safe mobile hook ─────────────────────────────────────────────────────
// Returns null on server / first render, then true/false once window is available.
// This prevents both layouts from rendering simultaneously during hydration.
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

// ─── Mobile: collapsible smart card ──────────────────────────────────────────
function CollapsibleCard({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ ...WHITE_CARD, ...MOBILE_FULL_WIDTH, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'transparent',
          border: 'none',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#112033',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
          {typeof count === 'number' && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 999,
                background: count > 0 ? 'rgba(255,112,67,0.12)' : 'rgba(0,0,0,0.04)',
                color: count > 0 ? '#FF7043' : '#607D8B',
                border: `1px solid ${
                  count > 0 ? 'rgba(255,112,67,0.25)' : 'rgba(0,0,0,0.06)'
                }`,
                flexShrink: 0,
              }}
            >
              {count}
            </span>
          )}
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          style={{
            flexShrink: 0,
            transition: 'transform 200ms ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path
            d="M4 6.5L9 11.5L14 6.5"
            stroke="#90A4AE"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          style={{
            padding: '0 16px 16px',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            ...MOBILE_FULL_WIDTH,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Mobile: sticky WRAPPING tab strip (no horizontal scroll) ─────────────────
function MobileTabStrip({ counts, withChrome }) {
  const tabs = [
    { key: 'contacts', label: 'Contacts', href: '/seeker/contact-center', badge: counts.contacts },
    { key: 'invites', label: 'Invites', href: '/seeker/contact-incoming', badge: counts.invitesIn },
    { key: 'requests', label: 'Requests', href: '/seeker/contact-outgoing', badge: counts.invitesOut },
    { key: 'profileViews', label: 'Profile Views', href: '/seeker/profile-views', badge: counts.profileViews },
    { key: 'blocked', label: 'Blocked', href: '/seeker/blocked', badge: 0 },
  ];

  return (
    <div
      style={{
        ...MOBILE_FULL_WIDTH,
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        marginBottom: 12,
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',          // ✅ wrap instead of scroll
          gap: 8,
          padding: '10px 16px',
          minWidth: 0,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === 'contacts'; // current page
          const hasAlert = tab.badge > 0 && tab.key !== 'contacts';

          return (
            <Link
              key={tab.key}
              href={withChrome(tab.href)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 10px',     // ✅ slightly tighter
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: 'none',
                whiteSpace: 'normal',     // ✅ allow wrap
                lineHeight: 1.1,          // ✅ keeps wrapped chips tidy
                background: isActive
                  ? '#FF7043'
                  : hasAlert
                  ? 'rgba(255,112,67,0.10)'
                  : 'rgba(0,0,0,0.04)',
                color: isActive ? 'white' : hasAlert ? '#FF7043' : '#607D8B',
                border: isActive ? 'none' : `1px solid ${hasAlert ? 'rgba(255,112,67,0.25)' : 'transparent'}`,
                boxShadow: isActive ? '0 4px 12px rgba(255,112,67,0.30)' : 'none',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              {tab.label}
              {tab.badge > 0 && (
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
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SeekerContactCenter() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // SSR-safe — null until client measures window
  const isMobile = useIsMobile();

  const [contacts, setContacts] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groups] = useState([]);
  const [pages] = useState([]);
  const [newsletters] = useState([]);
  const [profileViews, setProfileViews] = useState([]);
  const [pvLoading, setPvLoading] = useState(true);
  const [showContacts, setShowContacts] = useState(true);

  const reloadSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contacts/summary');
      if (!res.ok) {
        setContacts([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        return;
      }
      const data = await res.json();
      setContacts(data.contacts || []);
      setIncomingRequests(data.incoming || []);
      setOutgoingRequests(data.outgoing || []);
    } catch {
      setContacts([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const reloadProfileViews = async () => {
    try {
      setPvLoading(true);
      const res = await fetch('/api/profile/views?limit=5');
      if (!res.ok) {
        setProfileViews([]);
        return;
      }
      const data = await res.json();
      setProfileViews(data.views || []);
    } catch {
      setProfileViews([]);
    } finally {
      setPvLoading(false);
    }
  };

  useEffect(() => {
    reloadSummary();
    reloadProfileViews();
  }, []);

  const counts = useMemo(
    () => ({
      contacts: contacts.length,
      invitesIn: incomingRequests.length,
      invitesOut: outgoingRequests.length,
      profileViews: profileViews.length,
    }),
    [contacts, incomingRequests, outgoingRequests, profileViews]
  );

  const topContacts = useMemo(() => contacts.slice(0, 5), [contacts]);
  const incomingPreview = useMemo(() => incomingRequests.slice(0, 3), [incomingRequests]);
  const outgoingPreview = useMemo(() => outgoingRequests.slice(0, 3), [outgoingRequests]);
  const nothingNeedingAttention = incomingRequests.length === 0 && outgoingRequests.length === 0;

  const formatDateTime = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return '';
    }
  };

  const getPersonFromItem = (item) => {
    if (!item) return null;
    if (item.from) return item.from;
    if (item.to) return item.to;
    return item;
  };

  const handleViewProfile = (item) => {
    const person = getPersonFromItem(item);
    if (!person?.id) return;
    router.push(withChrome(`/member-profile?userId=${person.id}`));
  };

  const handleAccept = async (item) => {
    const requestId = item.requestId || item.id;
    if (!requestId) return;
    try {
      const res = await fetch('/api/contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'accept' }),
      });
      if (!res.ok) {
        alert('Could not accept. Please try again.');
        return;
      }
      await reloadSummary();
    } catch {
      alert('Could not accept. Please try again.');
    }
  };

  const handleDecline = async (item) => {
    const requestId = item.requestId || item.id;
    if (!requestId) return;
    try {
      const res = await fetch('/api/contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'decline' }),
      });
      if (!res.ok) {
        alert('Could not decline. Please try again.');
        return;
      }
      await reloadSummary();
    } catch {
      alert('Could not decline. Please try again.');
    }
  };

  const handleCancel = async (item) => {
    const requestId = item.requestId || item.id;
    if (!requestId) return;
    try {
      const res = await fetch('/api/contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'cancel' }),
      });
      if (!res.ok) {
        alert('Could not cancel. Please try again.');
        return;
      }
      await reloadSummary();
    } catch {
      alert('Could not cancel. Please try again.');
    }
  };

  const handleDisconnect = async (item) => {
    const person = getPersonFromItem(item);
    if (!person?.id) return;
    if (!window.confirm(`Disconnect from ${person.name || 'this member'}?`)) return;
    try {
      const res = await fetch('/api/contacts/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactUserId: person.id }),
      });
      if (!res.ok) {
        alert('Could not disconnect. Please try again.');
        return;
      }
      await reloadSummary();
    } catch {
      alert('Could not disconnect. Please try again.');
    }
  };

  const openGroup = (g) => console.log('Open group (future)', g);
  const openPage = (p) => console.log('Open page (future)', p);
  const openNewsletter = (n) => console.log('Open newsletter (future)', n);

  const HeaderBox = (
    <section style={{ ...GLASS, padding: 16, textAlign: 'center' }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>Contact Center</h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        See who you&apos;re connected with, who&apos;s trying to reach you, and who&apos;s been looking at your
        profile. When you&apos;re ready to talk, jump into{' '}
        <Link href={withChrome('/seeker/messages')} style={{ color: '#FF7043', fontWeight: 700 }}>
          The Signal
        </Link>
        .
      </p>
    </section>
  );

  // ── Render nothing until we know which layout to show ──
  if (isMobile === null) {
    return (
      <SeekerLayout
        title="Contact Center | ForgeTomorrow"
        header={HeaderBox}
        right={<RightRailPlacementManager surfaceId="contact_center" />}
        activeNav="contacts"
      />
    );
  }

  // ── MOBILE layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <SeekerLayout title="Contact Center | ForgeTomorrow" header={HeaderBox} right={null} activeNav="contacts">
        <div style={{ ...MOBILE_ROOT, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Sticky tab strip */}
          <MobileTabStrip counts={counts} withChrome={withChrome} />

          {/* 1. Needs Your Attention — always open */}
          <div
            style={{
              ...WHITE_CARD,
              ...MOBILE_FULL_WIDTH,
              padding: 16,
              minWidth: 0,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, minWidth: 0 }}>
              <h2 style={{ color: '#FF7043', margin: 0, fontSize: 16, fontWeight: 800 }}>
                Needs Your Attention
              </h2>
              {!nothingNeedingAttention && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(255,112,67,0.12)',
                    color: '#FF7043',
                    border: '1px solid rgba(255,112,67,0.25)',
                    flexShrink: 0,
                  }}
                >
                  {incomingRequests.length + outgoingRequests.length}
                </span>
              )}
            </div>
            {nothingNeedingAttention ? (
              <p style={{ color: '#607D8B', fontSize: 14, margin: 0 }}>
                You&apos;re all caught up. New invites or requests will appear here first.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                {incomingRequests.length > 0 && (
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#374151', fontWeight: 700 }}>
                      Invites waiting on you
                    </h3>
                    <IncomingRequestsList
                      items={incomingPreview}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      onViewProfile={handleViewProfile}
                    />
                    <Link
                      href={withChrome('/seeker/contact-incoming')}
                      style={{ color: '#FF7043', fontWeight: 700, fontSize: 13, marginTop: 6, display: 'block' }}
                    >
                      Review all invites →
                    </Link>
                  </div>
                )}
                {outgoingRequests.length > 0 && (
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#374151', fontWeight: 700 }}>
                      Requests you&apos;ve sent
                    </h3>
                    <OutgoingRequestsList items={outgoingPreview} onCancel={handleCancel} onViewProfile={handleViewProfile} />
                    <Link
                      href={withChrome('/seeker/contact-outgoing')}
                      style={{ color: '#FF7043', fontWeight: 700, fontSize: 13, marginTop: 6, display: 'block' }}
                    >
                      Review all requests →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Contacts — collapsible, open by default */}
          <CollapsibleCard title="Contacts" count={contacts.length} defaultOpen={true}>
            <div style={{ paddingTop: 12 }}>
              <ContactsList
                contacts={topContacts}
                onViewProfile={handleViewProfile}
                onDisconnect={handleDisconnect}
                loading={loading}
              />
              <Link
                href={withChrome('/seeker/contacts')}
                style={{ color: '#FF7043', fontWeight: 700, fontSize: 13, marginTop: 8, display: 'block' }}
              >
                View all contacts →
              </Link>
            </div>
          </CollapsibleCard>

          {/* 3. Profile Views — collapsible, closed by default */}
          <CollapsibleCard title="Recent Profile Views" count={profileViews.length} defaultOpen={false}>
            <div style={{ paddingTop: 12 }}>
              {pvLoading ? (
                <p style={{ color: '#607D8B', fontSize: 14, margin: 0 }}>Loading views…</p>
              ) : profileViews.length === 0 ? (
                <p style={{ color: '#607D8B', fontSize: 14, margin: 0 }}>
                  No profile views yet. Recruiters, coaches, and peers who visit will show up here.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                  {profileViews.map((v) => (
                    <li
                      key={v.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'rgba(0,0,0,0.03)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        ...MOBILE_FULL_WIDTH,
                      }}
                    >
                      <span style={{ fontWeight: 700, color: v.viewer?.name ? '#111827' : '#6B7280', fontSize: 14 }}>
                        {v.viewer?.name || 'Anonymous ForgeTomorrow member'}
                      </span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        Viewed your profile • {formatDateTime(v.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={withChrome('/seeker/profile-views')}
                style={{ color: '#FF7043', fontWeight: 700, fontSize: 13, marginTop: 8, display: 'block' }}
              >
                View all profile views →
              </Link>
            </div>
          </CollapsibleCard>

          {/* 4. Your Network — Groups/Pages/Newsletters folded into one */}
          <CollapsibleCard title="Your Network" defaultOpen={false}>
            <div style={{ paddingTop: 4 }}>
              <div style={{ paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#FF7043', margin: '0 0 8px', fontSize: 14, fontWeight: 800 }}>Groups</h3>
                <GroupsList groups={groups} onOpen={openGroup} />
              </div>
              <div style={{ paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#FF7043', margin: '0 0 8px', fontSize: 14, fontWeight: 800 }}>Pages</h3>
                <PagesList pages={pages} onOpen={openPage} />
              </div>
              <div style={{ paddingTop: 12 }}>
                <h3 style={{ color: '#FF7043', margin: '0 0 8px', fontSize: 14, fontWeight: 800 }}>Newsletters</h3>
                <NewslettersList items={newsletters} onOpen={openNewsletter} />
              </div>
            </div>
          </CollapsibleCard>
        </div>
      </SeekerLayout>
    );
  }

  // ── DESKTOP layout — original, completely untouched ────────────────────────
  const PAGE_GLASS_WRAP = { ...GLASS, padding: 16, margin: '24px 0 0', width: '100%' };

  return (
    <SeekerLayout
      title="Contact Center | ForgeTomorrow"
      header={HeaderBox}
      right={<RightRailPlacementManager surfaceId="contact_center" />}
      activeNav="contacts"
    >
      <div style={PAGE_GLASS_WRAP}>
        <section style={{ ...WHITE_CARD, padding: 12 }}>
          <ContactCenterToolbar currentTab="contacts" counts={counts} />
        </section>

        <section style={{ ...WHITE_CARD, padding: 16, marginTop: 12 }}>
          <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 8 }}>Needs your attention</h2>
          {nothingNeedingAttention ? (
            <p style={{ color: '#607D8B', fontSize: 14, marginBottom: 0 }}>
              You&apos;re all caught up. When new invites or requests come in, they&apos;ll appear here first.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {incomingRequests.length > 0 && (
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, color: '#374151', fontWeight: 700 }}>
                    Invites waiting on you
                  </h3>
                  <IncomingRequestsList
                    items={incomingPreview}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onViewProfile={handleViewProfile}
                  />
                  <Link
                    href={withChrome('/seeker/contact-incoming')}
                    style={{ color: '#FF7043', fontWeight: 700, fontSize: 13, marginTop: 6, display: 'block' }}
                  >
                    Review all invites →
                  </Link>
                </div>
              )}
              {outgoingRequests.length > 0 && (
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, color: '#374151', fontWeight: 700 }}>
                    Requests you&apos;ve sent
                  </h3>
                  <OutgoingRequestsList
                    items={outgoingPreview}
                    onCancel={handleCancel}
                    onViewProfile={handleViewProfile}
                  />
                  <Link
                    href={withChrome('/seeker/contact-outgoing')}
                    style={{ color: '#FF7043', fontWeight: 700, fontSize: 13, marginTop: 6, display: 'block' }}
                  >
                    Review all requests →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        <section
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            marginTop: 12,
          }}
        >
          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ color: '#FF7043', margin: 0 }}>Contacts</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(0,0,0,0.04)',
                    color: '#334155',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {contacts.length}
                </span>
                <button
                  type="button"
                  onClick={() => setShowContacts((v) => !v)}
                  style={{
                    fontSize: 13,
                    padding: '6px 10px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.92)',
                    cursor: 'pointer',
                  }}
                  aria-expanded={showContacts}
                  aria-controls="contacts-panel"
                >
                  {showContacts ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {showContacts && (
              <div id="contacts-panel">
                <ContactsList
                  contacts={topContacts}
                  onViewProfile={handleViewProfile}
                  onDisconnect={handleDisconnect}
                  loading={loading}
                />
                <Link
                  href={withChrome('/seeker/contacts')}
                  style={{ color: '#FF7043', fontWeight: 700, marginTop: 8, display: 'block' }}
                >
                  View all contacts →
                </Link>
              </div>
            )}
          </section>

          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <h2 style={{ color: '#FF7043', marginTop: 0 }}>Recent Profile Views</h2>
            {pvLoading ? (
              <p style={{ color: '#607D8B', fontSize: 14 }}>Loading views…</p>
            ) : profileViews.length === 0 ? (
              <p style={{ color: '#607D8B', fontSize: 14 }}>
                No one has viewed your profile yet. Once recruiters, coaches, or peers visit your profile, you&apos;ll
                see them here.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                {profileViews.map((v) => (
                  <li
                    key={v.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: v.viewer?.name ? '#111827' : '#6B7280', fontSize: 14 }}>
                      {v.viewer?.name || 'Anonymous ForgeTomorrow member'}
                    </span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      Viewed your profile • {formatDateTime(v.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={withChrome('/seeker/profile-views')}
              style={{ color: '#FF7043', fontWeight: 700, marginTop: 8, display: 'block' }}
            >
              View all profile views →
            </Link>
          </section>
        </section>

        <section
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            marginTop: 12,
          }}
        >
          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <h2 style={{ color: '#FF7043', marginTop: 0 }}>Groups</h2>
            <GroupsList groups={groups} onOpen={openGroup} />
          </section>
          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <h2 style={{ color: '#FF7043', marginTop: 0 }}>Pages</h2>
            <PagesList pages={pages} onOpen={openPage} />
          </section>
          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <h2 style={{ color: '#FF7043', marginTop: 0 }}>Newsletters</h2>
            <NewslettersList items={newsletters} onOpen={openNewsletter} />
          </section>
        </section>
      </div>
    </SeekerLayout>
  );
}

// Prevents static prerendering — required for any page using window/client state
export async function getServerSideProps() {
  return { props: {} };
}