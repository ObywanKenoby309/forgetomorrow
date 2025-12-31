// pages/seeker/contacts.js
import React, { useMemo, useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import ContactsOrganizer from '@/components/ContactsOrganizer';

export default function SeekerContactsGatePage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  // preserve current chrome on internal links
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // choose layout by chrome; links always use seeker routes (with chrome)
  const Layout = useMemo(() => {
    switch (chrome) {
      case 'coach':
      case 'coaching':
        return CoachingLayout;
      case 'recruiter':
      case 'recruiters':
      case 'recruiter-smb':
      case 'recruiter-ent':
        return RecruiterLayout;
      case 'seeker':
      default:
        return SeekerLayout;
    }
  }, [chrome]);

  const homeHref = withChrome('/seeker-dashboard');

  // 🔹 Live contacts state (no more fake people)
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await fetch('/api/contacts/summary');
        if (!res.ok) {
          console.error('contacts/summary failed in /seeker/contacts', await res.text());
          setContacts([]);
          return;
        }
        const data = await res.json();
        setContacts(data.contacts || []);
      } catch (err) {
        console.error('contacts/summary error in /seeker/contacts', err);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, []);

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
        Contacts
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        View all your connections and organize them with custom categories.{' '}
        <Link href={homeHref} style={{ color: '#FF7043', fontWeight: 700 }}>
          Back to Home
        </Link>
        .
      </p>
    </section>
  );

  return (
    <Layout
      title="Contacts | ForgeTomorrow"
      header={HeaderBox}
      activeNav="contacts"
      right={<RightRailPlacementManager surfaceId="contacts" />}
    >
      <Head>
        <title>ForgeTomorrow - Contacts</title>
      </Head>

      {/* Center column, similar to Coaching Dashboard width */}
      <div className="w-full max-w-5xl mx-auto px-2 md:px-0">
        <ContactsOrganizer contacts={contacts} loading={loading} />
      </div>
    </Layout>
  );
}
