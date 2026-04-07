// pages/seeker/contacts.js
import React, { useMemo, useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import ContactsOrganizer from '@/components/ContactsOrganizer';

export default function SeekerContactsGatePage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

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

  // ✅ Data state (DO NOT REMOVE — required)
  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load contacts data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/contacts/summary');
        const json = await res.json();

        setContacts(json.contacts || []);
        setCategories(json.categories || []);
        setAssignments(json.assignments || []);
      } catch (err) {
        console.error('Failed to load contacts summary', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ✅ Simplified
  const contactCenterHref = withChrome('/seeker/contact-center');
  const greeting = getTimeGreeting();

  const HeaderBox = (
    <SeekerTitleCard
      greeting={greeting}
      title="Contacts"
      subtitle={
  <>
    View all your connections and organize them with custom categories.{' '}
    <span style={{ whiteSpace: 'nowrap' }}>
      <Link href={contactCenterHref} style={{ color: '#FF7043', fontWeight: 700 }}>
        ← To Contact Center
      </Link>
    </span>
  </>
}
    />
  );

  return (
    <Layout
      title="Contacts | ForgeTomorrow"
      header={HeaderBox}
      activeNav="contacts"
      right={<RightRailPlacementManager surfaceId="contacts" />}
      rightVariant="light"
    >
      <Head>
        <title>ForgeTomorrow - Contacts</title>
      </Head>

      <div
        style={{
          width: '100%',
          maxWidth: 'none',
          marginTop: 24,
        }}
      >
        <ContactsOrganizer
          chrome={chrome}
          contacts={contacts}
          categories={categories}
          assignments={assignments}
          loading={loading}
        />
      </div>
    </Layout>
  );
}