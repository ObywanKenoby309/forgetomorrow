// pages/seeker/contact-outgoing.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

import IncomingRequestsList from '@/components/IncomingRequestsList';
import OutgoingRequestsList from '@/components/OutgoingRequestsList';

export default function SeekerOutgoingRequestsPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [contacts, setContacts] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const counts = useMemo(
    () => ({
      contacts: contacts.length,
      invitesIn: incomingRequests.length,
      invitesOut: outgoingRequests.length,
    }),
    [contacts, incomingRequests, outgoingRequests]
  );

  const getPersonFromItem = (item) => {
    if (!item) return null;
    if (item.from) return item.from;
    if (item.to) return item.to;
    return item;
  };

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
        Pending Requests
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        These are the connection requests you&apos;ve sent that haven&apos;t
        been accepted yet. You can review profiles, keep them pending, or
        cancel requests at any time.
      </p>
    </section>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="contacts" />
    </div>
  );

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

  return (
    <SeekerLayout
      title="Pending Requests | ForgeTomorrow"
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
          />
          <TabButton
            href="/seeker/contact-incoming"
            label="Invites (Incoming)"
            badge={counts.invitesIn}
          />
          <TabButton
            href="/seeker/contact-outgoing"
            label="Requests (Outgoing)"
            badge={counts.invitesOut}
            active
          />
        </div>
      </section>

      {/* Outgoing list full-page */}
      <section
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 8 }}>
          All Pending Requests
        </h2>
        <OutgoingRequestsList
          items={outgoingRequests}
          onCancel={handleCancel}
          onViewProfile={handleViewProfile}
        />
        <div style={{ marginTop: 12, fontSize: 14 }}>
          <Link
            href={withChrome('/seeker/contact-center')}
            style={{ color: '#FF7043', fontWeight: 700 }}
          >
            Go to Contacts →
          </Link>
        </div>
      </section>

      {/* Optional: small panel for incoming preview */}
      <section
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <h3 style={{ color: '#FF7043', marginTop: 0, marginBottom: 8 }}>
          Incoming Invites
        </h3>
        <IncomingRequestsList
          items={incomingRequests.slice(0, 3)}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onViewProfile={handleViewProfile}
        />
        <div style={{ marginTop: 8, fontSize: 14 }}>
          <Link
            href={withChrome('/seeker/contact-incoming')}
            style={{ color: '#FF7043', fontWeight: 700 }}
          >
            View all incoming →
          </Link>
        </div>
      </section>
    </SeekerLayout>
  );
}
