// pages/seeker/contact-incoming.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import IncomingRequestsList from '@/components/IncomingRequestsList';
import ContactCenterToolbar from '@/components/contact-center/ContactCenterToolbar'; // ✅ NEW import

export default function SeekerIncomingInvitesPage() {
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
        Pending Invites
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        These members have requested to connect with you. Review their profiles,
        accept or decline, and then organize confirmed contacts in your
        Contacts view.
      </p>
    </section>
  );

  return (
    <SeekerLayout
      title="Pending Invites | ForgeTomorrow"
      header={HeaderBox}
      right={<RightRailPlacementManager surfaceId="contact_incoming" />}
      activeNav="contacts"
    >
      {/* ✅ Toolbar component */}
      <ContactCenterToolbar currentTab="invites" />

      {/* Incoming list full-page */}
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
          All Pending Invites
        </h2>
        <IncomingRequestsList
          items={incomingRequests}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onViewProfile={handleViewProfile}
        />
        <div style={{ marginTop: 12, fontSize: 14 }}>
          <Link
            href={withChrome('/seeker/contacts')}
            style={{ color: '#FF7043', fontWeight: 700 }}
          >
            Go to Contacts →
          </Link>
        </div>
      </section>
    </SeekerLayout>
  );
}
