// pages/seeker/contact-outgoing.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import OutgoingRequestsList from '@/components/OutgoingRequestsList';
import ContactCenterToolbar from '@/components/contact-center/ContactCenterToolbar';

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
    router.push(withChrome(`/profile/${person.slug}`));
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

  const greeting = getTimeGreeting();
  const contactCenterHref = withChrome('/seeker/contact-center');

  const HeaderBox = (
    <SeekerTitleCard
      greeting={greeting}
      title="Pending Requests"
      subtitle={
        <>
          These are the connection requests you&apos;ve sent that haven&apos;t been accepted yet. Review profiles, keep them pending, or cancel requests at any time.{' '}
          <Link href={contactCenterHref} style={{ color: '#FF7043', fontWeight: 700 }}>
            ← To Contact Center
          </Link>
        </>
      }
    />
  );

  return (
    <SeekerLayout
      title="Pending Requests | ForgeTomorrow"
      header={HeaderBox}
      right={<RightRailPlacementManager surfaceId="contact_outgoing" />}
      rightVariant="light"
      activeNav="contacts"
    >
      <ContactCenterToolbar currentTab="requests" counts={counts} />

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