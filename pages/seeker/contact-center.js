// pages/seeker/contact-center.js
import React, { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

import ContactsList from '@/components/ContactsList';
import RequestList from '@/components/RequestList';

export default function SeekerContactCenter() {
  // --- Mock data (replace with real data / API later) ---
  const contacts = [
    { id: 1, name: 'Jane Doe', status: 'Open to Opportunities', photo: 'https://via.placeholder.com/48' },
    { id: 4, name: 'Chris Park', status: 'Hiring', photo: 'https://via.placeholder.com/48' },
  ];

  const incomingRequests = [
    { id: 2, name: 'John Smith', photo: 'https://via.placeholder.com/48' },
  ];

  const outgoingRequests = [
    { id: 3, name: 'Alex Johnson', photo: 'https://via.placeholder.com/48' },
  ];

  // --- Derived counts for tabs/badges ---
  const counts = useMemo(() => ({
    contacts: contacts.length,
    invitesIn: incomingRequests.length,
    invitesOut: outgoingRequests.length,
  }), [contacts, incomingRequests, outgoingRequests]);

  // --- Handlers (stubbed for now) ---
  const handleViewProfile = (c) => alert(`View profile for ${c.name} (coming soon)`);
  const handleAccept = (r) => alert(`Accepted request from ${r.name}`);
  const handleDecline = (r) => alert(`Declined request from ${r.name}`);
  const handleCancel = (r) => alert(`Canceled request to ${r.name}`);

  // --- Header card (center column top) ---
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
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Contact Center
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Manage your contacts, invitations, and messages. Jump into <Link href="/seeker/messages" style={{ color: '#FF7043', fontWeight: 700 }}>The Signal</Link> to chat.
      </p>
    </section>
  );

  // --- Right rail (you can customize this later) ---
  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="contacts" />
    </div>
  );

  // --- Simple tabs row (Contacts | The Signal | Invites | Requests) ---
  const TabButton = ({ href, label, badge, active = false }) => (
    <Link
      href={href}
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
      title="Contact Center | ForgeTomorrow"
      header={HeaderBox}
      right={RightRail}
      activeNav="contacts" // add this key in SeekerSidebar to highlight
    >
      <Head><title>ForgeTomorrow - Contact Center</title></Head>

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
          <TabButton href="/seeker/contact-center" label="Contacts" badge={counts.contacts} active />
          <TabButton href="/seeker/messages" label="The Signal" />
          <TabButton href="/seeker/contact-center#invites" label="Invites (Incoming)" badge={counts.invitesIn} />
          <TabButton href="/seeker/contact-center#requests" label="Requests (Outgoing)" badge={counts.invitesOut} />
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
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Contacts</h2>
        <ContactsList contacts={contacts} onViewProfile={handleViewProfile} />
      </section>

      {/* Requests / Invites */}
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
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Invitations & Requests</h2>
        <RequestList
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onCancel={handleCancel}
        />
      </section>
    </SeekerLayout>
  );
}
