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
import ContactCenterToolbar from '@/components/contact-center/ContactCenterToolbar'; // ✅ NEW import

export default function SeekerContactCenter() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // --- Live data from /api/contacts/summary ---
  const [contacts, setContacts] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Future: groups/pages/newsletters; keep empty for launch
  const [groups] = useState([]);
  const [pages] = useState([]);
  const [newsletters] = useState([]);

  // --- Recent profile views ---
  const [profileViews, setProfileViews] = useState([]);
  const [pvLoading, setPvLoading] = useState(true);

  const reloadSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contacts/summary');
      if (!res.ok) {
        console.error('contacts/summary failed', await res.text());
        setContacts([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        return;
      }
      const data = await res.json();
      setContacts(data.contacts || []);
      setIncomingRequests(data.incoming || []);
      setOutgoingRequests(data.outgoing || []);
    } catch (err) {
      console.error('contacts/summary error', err);
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
        console.error('profile/views failed', await res.text());
        setProfileViews([]);
        return;
      }
      const data = await res.json();
      setProfileViews(data.views || []);
    } catch (err) {
      console.error('profile/views error', err);
      setProfileViews([]);
    } finally {
      setPvLoading(false);
    }
  };

  useEffect(() => {
    reloadSummary();
    reloadProfileViews();
  }, []);

  // --- Counts for toolbar badges (toolbar handles its own now, but kept for compatibility) ---
  const counts = useMemo(
    () => ({
      contacts: contacts.length,
      invitesIn: incomingRequests.length,
      invitesOut: outgoingRequests.length,
      profileViews: profileViews.length,
    }),
    [contacts, incomingRequests, outgoingRequests, profileViews]
  );

  // --- Helpers to get the "user" from different shapes ---
  const getPersonFromItem = (item) => {
    if (!item) return null;
    if (item.from) return item.from;
    if (item.to) return item.to;
    return item;
  };

  // --- Handlers wired to real routes ---
  const handleViewProfile = (item) => {
    const person = getPersonFromItem(item);
    if (!person?.id) return;
    const params = new URLSearchParams();
    params.set('userId', person.id);
    router.push(withChrome(`/member-profile?${params.toString()}`));
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
        console.error('contacts/respond accept failed', await res.text());
        alert('We could not accept this invitation. Please try again.');
        return;
      }
      await reloadSummary();
    } catch (err) {
      console.error('contacts/respond accept error', err);
      alert('We could not accept this invitation. Please try again.');
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
        console.error('contacts/respond decline failed', await res.text());
        alert('We could not decline this invitation. Please try again.');
        return;
      }
      await reloadSummary();
    } catch (err) {
      console.error('contacts/respond decline error', err);
      alert('We could not decline this invitation. Please try again.');
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
        console.error('contacts/respond cancel failed', await res.text());
        alert('We could not cancel this request. Please try again.');
        return;
      }
      await reloadSummary();
    } catch (err) {
      console.error('contacts/respond cancel error', err);
      alert('We could not cancel this request. Please try again.');
    }
  };

  // 🔹 Disconnect a contact entirely
  const handleDisconnect = async (item) => {
    const person = getPersonFromItem(item);
    if (!person?.id) return;
    const confirmed = window.confirm(
      `Are you sure you want to disconnect from ${person.name || 'this member'}?`
    );
    if (!confirmed) return;
    try {
      const res = await fetch('/api/contacts/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactUserId: person.id }),
      });
      if (!res.ok) {
        console.error('contacts/remove failed', await res.text());
        alert('We could not disconnect this contact. Please try again.');
        return;
      }
      await reloadSummary();
    } catch (err) {
      console.error('contacts/remove error', err);
      alert('We could not disconnect this contact. Please try again.');
    }
  };

  const openGroup = (g) => {
    console.log('Open group (future)', g);
  };
  const openPage = (p) => {
    console.log('Open page (future)', p);
  };
  const openNewsletter = (n) => {
    console.log('Open newsletter (future)', n);
  };

  // ✅ Profile-glass numbers (canonical)
  const GLASS = {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.58)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  // --- Header card (glass) ---
  const HeaderBox = (
    <section
      style={{
        ...GLASS,
        padding: 16,
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          margin: 0,
          color: '#FF7043',
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Contact Center
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        See who you&apos;re connected with, who&apos;s trying to reach you, and who&apos;s
        been looking at your profile. When you&apos;re ready to talk, jump into{' '}
        <Link
          href={withChrome('/seeker/messages')}
          style={{ color: '#FF7043', fontWeight: 700 }}
        >
          The Signal
        </Link>
        .
      </p>
    </section>
  );

  // Contacts preview + toggler
  const [showContacts, setShowContacts] = useState(true);
  const topContacts = useMemo(() => contacts.slice(0, 5), [contacts]);

  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return '';
    }
  };

  const incomingPreview = useMemo(() => incomingRequests.slice(0, 3), [incomingRequests]);
  const outgoingPreview = useMemo(() => outgoingRequests.slice(0, 3), [outgoingRequests]);

  const nothingNeedingAttention =
    incomingRequests.length === 0 && outgoingRequests.length === 0;

  // ✅ Needs attention card (glass + subtle accent border)
  const attentionCardStyle = {
    ...GLASS,
    padding: 16,
    border: `1px solid ${nothingNeedingAttention ? 'rgba(255,255,255,0.22)' : '#FFCCBC'}`,
  };

  return (
    <SeekerLayout
      title="Contact Center | ForgeTomorrow"
      header={HeaderBox}
      right={<RightRailPlacementManager surfaceId="contact_center" />}
      activeNav="contacts"
    >
      {/* ✅ Toolbar component */}
      <ContactCenterToolbar currentTab="contacts" />

      {/* Needs Your Attention */}
      <section style={attentionCardStyle}>
        <h2
          style={{
            color: '#FF7043',
            marginTop: 0,
            marginBottom: 8,
          }}
        >
          Needs your attention
        </h2>
        {nothingNeedingAttention ? (
          <p style={{ color: '#607D8B', fontSize: 14, marginBottom: 0 }}>
            You&apos;re all caught up. When new invites or requests come in, they&apos;ll
            appear here first.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {incomingRequests.length > 0 && (
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#374151',
                    fontWeight: 700,
                  }}
                >
                  Invites waiting on you
                </h3>
                <IncomingRequestsList
                  items={incomingPreview}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onViewProfile={handleViewProfile}
                />
                <div style={{ marginTop: 6 }}>
                  <Link
                    href={withChrome('/seeker/contact-incoming')}
                    style={{ color: '#FF7043', fontWeight: 700, fontSize: 13 }}
                  >
                    Review all invites →
                  </Link>
                </div>
              </div>
            )}

            {outgoingRequests.length > 0 && (
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#374151',
                    fontWeight: 700,
                  }}
                >
                  Requests you&apos;ve sent
                </h3>
                <OutgoingRequestsList
                  items={outgoingPreview}
                  onCancel={handleCancel}
                  onViewProfile={handleViewProfile}
                />
                <div style={{ marginTop: 6 }}>
                  <Link
                    href={withChrome('/seeker/contact-outgoing')}
                    style={{ color: '#FF7043', fontWeight: 700, fontSize: 13 }}
                  >
                    Review all requests →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Contacts + Profile Views side-by-side (but roomy) */}
      <section
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        }}
      >
        {/* Contacts */}
        <section
          style={{
            ...GLASS,
            padding: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <h2 style={{ color: '#FF7043', margin: 0 }}>Contacts</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.75)',
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
                  background: 'rgba(255,255,255,0.75)',
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
              <div style={{ marginTop: 8 }}>
                <Link href={withChrome('/seeker/contacts')} style={{ color: '#FF7043', fontWeight: 700 }}>
                  View all contacts →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Recent Profile Views */}
        <section
          style={{
            ...GLASS,
            padding: 16,
          }}
        >
          <h2 style={{ color: '#FF7043', marginTop: 0 }}>Recent Profile Views</h2>
          {pvLoading ? (
            <p style={{ color: '#607D8B', fontSize: 14 }}>Loading views…</p>
          ) : profileViews.length === 0 ? (
            <p style={{ color: '#607D8B', fontSize: 14 }}>
              No one has viewed your profile yet. Once recruiters, coaches, or peers visit your profile,
              you&apos;ll see them here.
            </p>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gap: 8,
              }}
            >
              {profileViews.map((v) => (
                <li
                  key={v.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: v.viewer?.name ? '#111827' : '#6B7280',
                      fontSize: 14,
                    }}
                  >
                    {v.viewer?.name || 'Anonymous ForgeTomorrow member'}
                  </span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>
                    Viewed your profile • {formatDateTime(v.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: 8 }}>
            <Link
              href={withChrome('/seeker/profile-views')}
              style={{ color: '#FF7043', fontWeight: 700 }}
            >
              View all profile views →
            </Link>
          </div>
        </section>
      </section>

      {/* Groups */}
      <section
        style={{
          ...GLASS,
          padding: 16,
        }}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Groups</h2>
        <GroupsList groups={groups} onOpen={openGroup} />
      </section>

      {/* Pages */}
      <section
        style={{
          ...GLASS,
          padding: 16,
        }}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Pages</h2>
        <PagesList pages={pages} onOpen={openPage} />
      </section>

      {/* Newsletters */}
      <section
        style={{
          ...GLASS,
          padding: 16,
        }}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Newsletters</h2>
        <NewslettersList items={newsletters} onOpen={openNewsletter} />
      </section>
    </SeekerLayout>
  );
}
