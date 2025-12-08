// pages/seeker/contact-center.js
import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

import ContactsList from '@/components/ContactsList';
import IncomingRequestsList from '@/components/IncomingRequestsList';
import OutgoingRequestsList from '@/components/OutgoingRequestsList';
import GroupsList from '@/components/GroupsList';
import PagesList from '@/components/PagesList';
import NewslettersList from '@/components/NewslettersList';

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

  useEffect(() => {
    reloadSummary();
  }, []);

  // --- Counts for tabs/badges ---
  const counts = useMemo(
    () => ({
      contacts: contacts.length,
      invitesIn: incomingRequests.length,
      invitesOut: outgoingRequests.length,
    }),
    [contacts, incomingRequests, outgoingRequests]
  );

  // --- Helpers to get the "user" off different shapes ---
  const getPersonFromItem = (item) => {
    if (!item) return null;

    // Incoming/outgoing from API: { requestId, from: {...} } / { requestId, to: {...} }
    if (item.from) return item.from;
    if (item.to) return item.to;

    // Fallback: contacts or older shapes
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

  // For now "Cancel" uses the same decline path (handled by /api/contacts/respond)
  const handleCancel = async (item) => {
    const requestId = item.requestId || item.id;
    if (!requestId) return;

    try {
      const res = await fetch('/api/contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'decline' }),
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

  const openGroup = (g) => {
    console.log('Open group (future)', g);
  };
  const openPage = (p) => {
    console.log('Open page (future)', p);
  };
  const openNewsletter = (n) => {
    console.log('Open newsletter (future)', n);
  };

  // --- Header card ---
  const HeaderBox = (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
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
        Manage your contacts, invitations, and community touchpoints. Jump into{' '}
        <Link
          href={withChrome('/seeker/messages')}
          style={{ color: '#FF7043', fontWeight: 700 }}
        >
          The Signal
        </Link>{' '}
        to chat.
      </p>
    </section>
  );

  // --- Right rail ---
  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="contacts" />
    </div>
  );

  // --- Tabs row ---
  const TabButton = ({ href, label, badge, active = false }) => (
    <Link
      href={withChrome(href)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 10,
        border: '1px solid #eee',
        background: active ? '#FFF3E9' : 'white',
        color: active ? '#D84315' : '#374151',
        fontWeight: 700,
        textDecoration: 'none',
      }}
    >
      <span>{label}</span>
      {typeof badge === 'number' && (
        <span
          style={{
            background: '#ECEFF1',
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

  // Collapsible contacts (default open)
  const [showContacts, setShowContacts] = useState(true);
  const topContacts = useMemo(() => contacts.slice(0, 5), [contacts]);

  return (
    <SeekerLayout
      title="Contact Center | ForgeTomorrow"
      header={HeaderBox}
      right={RightRail}
      activeNav="contacts"
    >
      {/* Tabs row */}
      <section
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 12,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <TabButton
            href="/seeker/contact-center"
            label="Contacts"
            badge={counts.contacts}
            active
          />
          <TabButton href="/seeker/messages" label="The Signal" />
          <TabButton
            href="/seeker/contact-center#invites"
            label="Invites (Incoming)"
            badge={counts.invitesIn}
          />
          <TabButton
            href="/seeker/contact-center#requests"
            label="Requests (Outgoing)"
            badge={counts.invitesOut}
          />
        </div>
      </section>

      {/* Contacts */}
      <section
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
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
                background: '#F1F5F9',
                color: '#334155',
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
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: 'white',
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
              loading={loading}
            />
            <div style={{ marginTop: 8 }}>
              <Link
                href={withChrome('/seeker/contacts')}
                style={{ color: '#FF7043', fontWeight: 700 }}
              >
                View all contacts →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Pending Invites (Incoming) */}
      <section
        id="invites"
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Pending Invites</h2>
        <IncomingRequestsList
          items={incomingRequests}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onViewProfile={handleViewProfile}
        />
      </section>

      {/* Pending Requests (Outgoing) */}
      <section
        id="requests"
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Pending Requests</h2>
        <OutgoingRequestsList
          items={outgoingRequests}
          onCancel={handleCancel}
          onViewProfile={handleViewProfile}
        />
      </section>

      {/* Groups */}
      <section
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Groups</h2>
        <GroupsList groups={groups} onOpen={openGroup} />
      </section>

      {/* Pages */}
      <section
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Pages</h2>
        <PagesList pages={pages} onOpen={openPage} />
      </section>

      {/* Newsletters */}
      <section
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Newsletters</h2>
        <NewslettersList items={newsletters} onOpen={openNewsletter} />
      </section>
    </SeekerLayout>
  );
}
