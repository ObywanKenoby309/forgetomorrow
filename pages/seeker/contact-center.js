// pages/seeker/contact-center.js
// Unified Contact Center — all five views swap inline via activeTab state.
// No URL changes, no router calls, no redirects. Sub-pages remain unchanged.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import ContactsList from '@/components/ContactsList';
import IncomingRequestsList from '@/components/IncomingRequestsList';
import OutgoingRequestsList from '@/components/OutgoingRequestsList';
import GroupsList from '@/components/GroupsList';
import PagesList from '@/components/PagesList';
import NewslettersList from '@/components/NewslettersList';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import InvitesView from '@/components/contact-center/InvitesView';
import RequestsView from '@/components/contact-center/RequestsView';
import ProfileViewsView from '@/components/contact-center/ProfileViewsView';
import BlockedView from '@/components/contact-center/BlockedView';

// ─── Design tokens ────────────────────────────────────────────────────────────
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

const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

const MOBILE_ROOT = {
  width: '100%', maxWidth: '100%', boxSizing: 'border-box',
  minWidth: 0, overflowX: 'hidden',
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { key: 'contacts',     label: 'Contacts',      mobileLabel: 'Contacts'  },
  { key: 'invites',      label: 'Invites',        mobileLabel: 'Invites'   },
  { key: 'requests',     label: 'Requests',       mobileLabel: 'Requests'  },
  { key: 'profileViews', label: 'Profile Views',  mobileLabel: 'Views'     },
  { key: 'blocked',      label: 'Blocked Users',  mobileLabel: 'Blocked'   },
];

// ─── SSR-safe mobile hook ─────────────────────────────────────────────────────
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

// ─── Tab nav ──────────────────────────────────────────────────────────────────
function TabNav({ activeTab, onTabChange, counts, isMobile }) {
  if (isMobile) {
    return (
      <div style={{
        width: '100%', boxSizing: 'border-box',
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 16px' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const badge = counts[tab.key] || 0;
            const hasAlert = badge > 0 && tab.key !== 'contacts';
            return (
              <button key={tab.key} type="button" onClick={() => onTabChange(tab.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 10px', borderRadius: 999,
                  fontWeight: 800, fontSize: 13, fontFamily: 'inherit',
                  border: isActive ? 'none' : `1px solid ${hasAlert ? 'rgba(255,112,67,0.25)' : 'transparent'}`,
                  background: isActive ? '#FF7043' : hasAlert ? 'rgba(255,112,67,0.10)' : 'rgba(0,0,0,0.04)',
                  color: isActive ? 'white' : hasAlert ? '#FF7043' : '#607D8B',
                  boxShadow: isActive ? '0 4px 12px rgba(255,112,67,0.30)' : 'none',
                  cursor: 'pointer',
                }}>
                {tab.mobileLabel}
                {badge > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 900, borderRadius: 999, padding: '1px 6px', background: isActive ? 'rgba(255,255,255,0.30)' : 'rgba(255,112,67,0.20)', color: isActive ? 'white' : '#374151', flexShrink: 0 }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...WHITE_CARD, padding: 12, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const badge = counts[tab.key] || 0;
        const highlight = badge > 0 && tab.key !== 'contacts';
        return (
          <button key={tab.key} type="button" onClick={() => onTabChange(tab.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 10,
              border: `1px solid ${isActive || highlight ? '#FFCCBC' : '#eee'}`,
              background: isActive || highlight ? '#FFF3E9' : 'white',
              color: isActive || highlight ? '#D84315' : '#374151',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            {tab.label}
            <span style={{ background: badge > 0 ? '#FFE0B2' : '#ECEFF1', color: '#374151', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 800 }}>
              {badge}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── CollapsibleCard (mobile contacts overview) ───────────────────────────────
function CollapsibleCard({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ ...WHITE_CARD, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#112033', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          {typeof count === 'number' && (
            <span style={{ fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: count > 0 ? 'rgba(255,112,67,0.12)' : 'rgba(0,0,0,0.04)', color: count > 0 ? '#FF7043' : '#607D8B', border: `1px solid ${count > 0 ? 'rgba(255,112,67,0.25)' : 'rgba(0,0,0,0.06)'}`, flexShrink: 0 }}>
              {count}
            </span>
          )}
        </div>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, transition: 'transform 200ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M4 6.5L9 11.5L14 6.5" stroke="#90A4AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', width: '100%', boxSizing: 'border-box' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SeekerContactCenter() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const isMobile = useIsMobile();

  // ── Active tab — pure state, no URL changes ───────────────────────────────
  const [activeTab, setActiveTab] = useState('contacts');

  // ── Core data — contacts, incoming, outgoing ──────────────────────────────
  const [contacts, setContacts] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [coreLoading, setCoreLoading] = useState(true);

  const reloadCore = useCallback(async () => {
    setCoreLoading(true);
    try {
      const res = await fetch('/api/contacts/summary');
      if (!res.ok) return;
      const data = await res.json();
      setContacts(data.contacts || []);
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch { /* silent */ }
    finally { setCoreLoading(false); }
  }, []);

  useEffect(() => { reloadCore(); }, [reloadCore]);

  // ── Profile views — lazy load on first tab visit ──────────────────────────
  const [profileViews, setProfileViews] = useState([]);
  const [pvLoading, setPvLoading] = useState(false);
  const pvLoaded = useRef(false);

  useEffect(() => {
    if (activeTab !== 'profileViews' || pvLoaded.current) return;
    pvLoaded.current = true;
    setPvLoading(true);
    fetch('/api/profile/views?limit=50')
      .then(r => r.ok ? r.json() : {})
      .then(d => setProfileViews(d.views || []))
      .catch(() => {})
      .finally(() => setPvLoading(false));
  }, [activeTab]);

  // ── Blocked users — lazy load on first tab visit ──────────────────────────
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const blockedLoaded = useRef(false);

  useEffect(() => {
    if (activeTab !== 'blocked' || blockedLoaded.current) return;
    blockedLoaded.current = true;
    setBlockedLoading(true);
    fetch('/api/signal/blocked')
      .then(r => r.ok ? r.json() : {})
      .then(d => setBlockedUsers(d.blocked || []))
      .catch(() => {})
      .finally(() => setBlockedLoading(false));
  }, [activeTab]);

  // ── Preview profile views for contacts tab overview ───────────────────────
  const [pvPreview, setPvPreview] = useState([]);
  useEffect(() => {
    fetch('/api/profile/views?limit=5')
      .then(r => r.ok ? r.json() : {})
      .then(d => setPvPreview(d.views || []))
      .catch(() => {});
  }, []);

  // ── Groups / Pages / Newsletters ─────────────────────────────────────────
  const [groups] = useState([]);
  const [pages] = useState([]);
  const [newsletters] = useState([]);

  // ── Badge counts ─────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    contacts:     contacts.length,
    invites:      incoming.length,
    requests:     outgoing.length,
    profileViews: profileViews.length,
    blocked:      blockedUsers.length,
  }), [contacts, incoming, outgoing, profileViews, blockedUsers]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const getPersonFromItem = (item) => item?.from || item?.to || item;

  const handleViewProfile = useCallback((item) => {
    const person = getPersonFromItem(item);
    if (!person?.slug) return;
    router.push(withChrome(`/profile/${person.slug}`));
  }, [router]);

  const handleAccept = useCallback(async (item) => {
    const requestId = item.requestId || item.id;
    if (!requestId) return;
    const res = await fetch('/api/contacts/respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, action: 'accept' }) });
    if (!res.ok) { alert('Could not accept. Please try again.'); return; }
    await reloadCore();
  }, [reloadCore]);

  const handleDecline = useCallback(async (item) => {
    const requestId = item.requestId || item.id;
    if (!requestId) return;
    const res = await fetch('/api/contacts/respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, action: 'decline' }) });
    if (!res.ok) { alert('Could not decline. Please try again.'); return; }
    await reloadCore();
  }, [reloadCore]);

  const handleCancel = useCallback(async (item) => {
    const requestId = item.requestId || item.id;
    if (!requestId) return;
    const res = await fetch('/api/contacts/respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, action: 'cancel' }) });
    if (!res.ok) { alert('Could not cancel. Please try again.'); return; }
    await reloadCore();
  }, [reloadCore]);

  const handleDisconnect = useCallback(async (item) => {
    const person = getPersonFromItem(item);
    if (!person?.id) return;
    if (!window.confirm(`Disconnect from ${person.name || 'this member'}?`)) return;
    const res = await fetch('/api/contacts/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactUserId: person.id }) });
    if (!res.ok) { alert('Could not disconnect. Please try again.'); return; }
    await reloadCore();
  }, [reloadCore]);

  const handleUnblock = useCallback(async (blockedId, name) => {
    if (!window.confirm(`Unblock ${name || 'this member'}?`)) return;
    const res = await fetch('/api/signal/blocked', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blockedId }) });
    if (!res.ok) { alert('Could not unblock. Please try again.'); return; }
    setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
  }, []);

  const greeting = getTimeGreeting();

  const HeaderBox = (
    <SeekerTitleCard
      greeting={greeting}
      title="Contact Center"
      subtitle={
        <>
          See who you&apos;re connected with, who&apos;s trying to reach you, and who&apos;s been looking at your profile. When you&apos;re ready to talk, jump into{' '}
          <Link href={withChrome('/seeker/messages')} style={{ color: '#FF7043', fontWeight: 700 }}>The Signal</Link>.
        </>
      }
      isMobile={isMobile === true}
    />
  );

  // SSR shell
  if (isMobile === null) {
    return (
      <SeekerLayout title="Contact Center | ForgeTomorrow" header={HeaderBox}
        right={<RightRailPlacementManager surfaceId="contact_center" />}
        rightVariant="light" activeNav="contacts" />
    );
  }

  const tabNav = <TabNav activeTab={activeTab} onTabChange={setActiveTab} counts={counts} isMobile={isMobile} />;

  const nothingNeedingAttention = incoming.length === 0 && outgoing.length === 0;

  // ── Non-contacts tab content ──────────────────────────────────────────────
  const tabContent = (() => {
    switch (activeTab) {
      case 'invites':
        return <InvitesView isMobile={isMobile} incoming={incoming} loading={coreLoading} onAccept={handleAccept} onDecline={handleDecline} onViewProfile={handleViewProfile} />;
      case 'requests':
        return <RequestsView isMobile={isMobile} outgoing={outgoing} loading={coreLoading} onCancel={handleCancel} onViewProfile={handleViewProfile} />;
      case 'profileViews':
        return <ProfileViewsView isMobile={isMobile} views={profileViews} loading={pvLoading} onViewProfile={(v) => v.viewer?.slug && router.push(withChrome(`/profile/${v.viewer.slug}`))} />;
      case 'blocked':
        return <BlockedView isMobile={isMobile} blockedUsers={blockedUsers} loading={blockedLoading} onUnblock={handleUnblock} />;
      default:
        return null;
    }
  })();

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <SeekerLayout title="Contact Center | ForgeTomorrow" header={HeaderBox}
        right={<RightRailPlacementManager surfaceId="contact_center" />}
        rightVariant="light" activeNav="contacts">
        <div style={{ ...MOBILE_ROOT, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tabNav}

          {activeTab === 'contacts' && (
            <>
              <div style={{ ...WHITE_CARD, padding: 16, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <h2 style={{ color: '#FF7043', margin: 0, fontSize: 18, lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>
                    Needs Your Attention
                  </h2>
                  {!nothingNeedingAttention && (
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,112,67,0.12)', color: '#FF7043', border: '1px solid rgba(255,112,67,0.25)', flexShrink: 0 }}>
                      {incoming.length + outgoing.length}
                    </span>
                  )}
                </div>
                {nothingNeedingAttention ? (
                  <p style={{ color: '#607D8B', fontSize: 14, margin: 0 }}>You&apos;re all caught up.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {incoming.length > 0 && (
                      <div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#112033', fontWeight: 700 }}>Invites waiting on you</h3>
                        <IncomingRequestsList items={incoming.slice(0, 3)} onAccept={handleAccept} onDecline={handleDecline} onViewProfile={handleViewProfile} />
                        {incoming.length > 3 && (
                          <button type="button" onClick={() => setActiveTab('invites')}
                            style={{ color: '#FF7043', fontWeight: 800, fontSize: 13, marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                            See all {incoming.length} invites →
                          </button>
                        )}
                      </div>
                    )}
                    {outgoing.length > 0 && (
                      <div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#112033', fontWeight: 700 }}>Requests you&apos;ve sent</h3>
                        <OutgoingRequestsList items={outgoing.slice(0, 3)} onCancel={handleCancel} onViewProfile={handleViewProfile} />
                        {outgoing.length > 3 && (
                          <button type="button" onClick={() => setActiveTab('requests')}
                            style={{ color: '#FF7043', fontWeight: 800, fontSize: 13, marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                            See all {outgoing.length} requests →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <CollapsibleCard title="Contacts" count={contacts.length} defaultOpen>
                <div style={{ paddingTop: 12 }}>
                  <ContactsList contacts={contacts.slice(0, 5)} onViewProfile={handleViewProfile} onDisconnect={handleDisconnect} loading={coreLoading} />
                  {contacts.length > 5 && (
                    <p style={{ color: '#607D8B', fontSize: 13, marginTop: 8 }}>Showing 5 of {contacts.length}.</p>
                  )}
                </div>
              </CollapsibleCard>

              <CollapsibleCard title="Your Network" defaultOpen={false}>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#FF7043', margin: '0 0 8px', fontSize: 16, lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>Groups</h3>
                    <GroupsList groups={groups} />
                  </div>
                  <div style={{ paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#FF7043', margin: '0 0 8px', fontSize: 16, lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>Pages</h3>
                    <PagesList pages={pages} />
                  </div>
                  <div style={{ paddingTop: 12 }}>
                    <h3 style={{ color: '#FF7043', margin: '0 0 8px', fontSize: 16, lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>Newsletters</h3>
                    <NewslettersList items={newsletters} />
                  </div>
                </div>
              </CollapsibleCard>
            </>
          )}

          {tabContent}
        </div>
      </SeekerLayout>
    );
  }

  // ── DESKTOP ───────────────────────────────────────────────────────────────
  return (
    <SeekerLayout title="Contact Center | ForgeTomorrow" header={HeaderBox}
      right={<RightRailPlacementManager surfaceId="contact_center" />}
      rightVariant="light" activeNav="contacts">
      <div style={{ ...GLASS, padding: 16, width: '100%' }}>
        {tabNav}

        {activeTab === 'contacts' && (
          <>
            <section style={{ ...WHITE_CARD, padding: 16, marginBottom: 12 }}>
              <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 8, fontSize: 18, lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>Needs your attention</h2>
              {nothingNeedingAttention ? (
                <p style={{ color: '#607D8B', fontSize: 14, marginBottom: 0 }}>You&apos;re all caught up.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {incoming.length > 0 && (
                    <div>
                      <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#112033', fontWeight: 700 }}>Invites waiting on you</h3>
                      <IncomingRequestsList items={incoming.slice(0, 3)} onAccept={handleAccept} onDecline={handleDecline} onViewProfile={handleViewProfile} />
                      {incoming.length > 3 && (
                        <button type="button" onClick={() => setActiveTab('invites')}
                          style={{ color: '#FF7043', fontWeight: 800, fontSize: 13, marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                          See all {incoming.length} invites →
                        </button>
                      )}
                    </div>
                  )}
                  {outgoing.length > 0 && (
                    <div>
                      <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#112033', fontWeight: 700 }}>Requests you&apos;ve sent</h3>
                      <OutgoingRequestsList items={outgoing.slice(0, 3)} onCancel={handleCancel} onViewProfile={handleViewProfile} />
                      {outgoing.length > 3 && (
                        <button type="button" onClick={() => setActiveTab('requests')}
                          style={{ color: '#FF7043', fontWeight: 800, fontSize: 13, marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                          See all {outgoing.length} requests →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', marginBottom: 12 }}>
              <section style={{ ...WHITE_CARD, padding: 16 }}>
                <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 8, fontSize: 18, lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>Contacts</h2>
                <ContactsList contacts={contacts.slice(0, 5)} onViewProfile={handleViewProfile} onDisconnect={handleDisconnect} loading={coreLoading} />
                {contacts.length > 5 && (
                  <p style={{ color: '#607D8B', fontSize: 13, marginTop: 8 }}>Showing 5 of {contacts.length}.</p>
                )}
              </section>
              <section style={{ ...WHITE_CARD, padding: 16 }}>
                <h2 style={{ color: '#FF7043', marginTop: 0, fontSize: 18, lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>Recent Profile Views</h2>
                {pvPreview.length === 0
                  ? <p style={{ color: '#607D8B', fontSize: 14 }}>No profile views yet.</p>
                  : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                      {pvPreview.map((v) => (
                        <li key={v.id} style={{ display: 'flex', flexDirection: 'column', padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                          <span style={{ fontWeight: 700, color: v.viewer?.name ? '#111827' : '#6B7280', fontSize: 14 }}>{v.viewer?.name || 'Anonymous ForgeTomorrow member'}</span>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>Viewed your profile</span>
                        </li>
                      ))}
                    </ul>
                  )
                }
                <button type="button" onClick={() => setActiveTab('profileViews')}
                  style={{ color: '#FF7043', fontWeight: 800, marginTop: 8, display: 'block', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  View all profile views →
                </button>
              </section>
            </section>

            <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <section style={{ ...WHITE_CARD, padding: 16 }}>
                <h2 style={{ color: '#FF7043', marginTop: 0, fontSize: 18, lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>Groups</h2>
                <GroupsList groups={groups} />
              </section>
              <section style={{ ...WHITE_CARD, padding: 16 }}>
                <h2 style={{ color: '#FF7043', marginTop: 0, fontSize: 18, lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>Pages</h2>
                <PagesList pages={pages} />
              </section>
              <section style={{ ...WHITE_CARD, padding: 16 }}>
                <h2 style={{ color: '#FF7043', marginTop: 0, fontSize: 18, lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>Newsletters</h2>
                <NewslettersList items={newsletters} />
              </section>
            </section>
          </>
        )}

        {tabContent && <div>{tabContent}</div>}
      </div>
    </SeekerLayout>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}