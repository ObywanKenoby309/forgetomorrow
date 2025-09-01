// pages/seeker/contact-center.js
import React, { useMemo, useState } from 'react';
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
  const withChrome = (path) => (chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path);

  // --- Mock data (replace later) ---
  const contacts = [
    { id: 1, name: 'Jane Doe', status: 'Open to Opportunities', photo: 'https://via.placeholder.com/48' },
    { id: 4, name: 'Chris Park', status: 'Hiring', photo: 'https://via.placeholder.com/48' },
  ];

  const incomingRequests = [
    { id: 2, name: 'John Smith', photo: 'https://via.placeholder.com/48', note: 'Let’s connect about CX roles' },
  ];

  const outgoingRequests = [
    { id: 3, name: 'Alex Johnson', photo: 'https://via.placeholder.com/48', note: 'Sent 2 days ago' },
  ];

  const groups = [
    { id: 'g1', name: 'Customer Success Leaders', members: 1240, category: 'Customer Success' },
  ];

  const pages = [
    { id: 'p1', name: 'ForgeTomorrow', industry: 'Talent • HR' },
  ];

  const newsletters = [
    { id: 'n1', title: 'Weekly CS Digest', frequency: 'Weekly', source: 'ForgeTomorrow' },
  ];

  // --- Counts for tabs/badges ---
  const counts = useMemo(() => ({
    contacts: contacts.length,
    invitesIn: incomingRequests.length,
    invitesOut: outgoingRequests.length,
  }), [contacts, incomingRequests, outgoingRequests]);

  // --- Handlers (stubbed) ---
  const handleViewProfile = (c) => alert(`View profile for ${c.name} (coming soon)`);
  const handleAccept = (r) => alert(`Accepted request from ${r.name}`);
  const handleDecline = (r) => alert(`Declined request from ${r.name}`);
  const handleCancel = (r) => alert(`Canceled request to ${r.name}`);
  const openGroup = (g) => alert(`Open group: ${g.name}`);
  const openPage = (p) => alert(`Open page: ${p.name}`);
  const openNewsletter = (n) => alert(`Open newsletter: ${n.title}`);

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
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Contact Center
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Manage your contacts, invitations, and community touchpoints. Jump into{' '}
        <Link href={withChrome('/seeker/messages')} style={{ color: '#FF7043', fontWeight: 700 }}>
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

  // Collapsible contacts (default open per your last version)
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
      <section style={{ background: 'white', borderRadius: 12, padding: 12, border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <TabButton href="/seeker/contact-center" label="Contacts" badge={counts.contacts} active />
          <TabButton href="/seeker/messages" label="The Signal" />
          <TabButton href="/seeker/contact-center#invites" label="Invites (Incoming)" badge={counts.invitesIn} />
          <TabButton href="/seeker/contact-center#requests" label="Requests (Outgoing)" badge={counts.invitesOut} />
        </div>
      </section>

      {/* Contacts */}
      <section style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ color: '#FF7043', margin: 0 }}>Contacts</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#F1F5F9', color: '#334155' }}>
              {contacts.length}
            </span>
            <button
              type="button"
              onClick={() => setShowContacts((v) => !v)}
              style={{ fontSize: 13, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer' }}
              aria-expanded={showContacts}
              aria-controls="contacts-panel"
            >
              {showContacts ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {showContacts && (
          <div id="contacts-panel">
            <ContactsList contacts={topContacts} onViewProfile={handleViewProfile} />
            <div style={{ marginTop: 8 }}>
              <Link href={withChrome('/seeker/contacts')} style={{ color: '#FF7043', fontWeight: 700 }}>
                View all contacts →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Pending Invites (Incoming) */}
      <section id="invites" style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Pending Invites</h2>
        <IncomingRequestsList
          items={incomingRequests}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onViewProfile={handleViewProfile}
        />
      </section>

      {/* Pending Requests (Outgoing) */}
      <section id="requests" style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Pending Requests</h2>
        <OutgoingRequestsList
          items={outgoingRequests}
          onCancel={handleCancel}
          onViewProfile={handleViewProfile}
        />
      </section>

      {/* Groups */}
      <section style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Groups</h2>
        <GroupsList groups={groups} onOpen={openGroup} />
      </section>

      {/* Pages */}
      <section style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Pages</h2>
        <PagesList pages={pages} onOpen={openPage} />
      </section>

      {/* Newsletters */}
      <section style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Newsletters</h2>
        <NewslettersList items={newsletters} onOpen={openNewsletter} />
      </section>
    </SeekerLayout>
  );
}
