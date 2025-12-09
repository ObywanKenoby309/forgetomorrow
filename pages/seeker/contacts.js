// pages/seeker/contacts.js
import React, { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import ContactsOrganizer from '@/components/ContactsOrganizer';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

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
        return RecruiterLayout;
      case 'seeker':
      default:
        return SeekerLayout;
    }
  }, [chrome]);

  const homeHref = withChrome('/seeker-dashboard');

  // 🔸 Temporary mock data so you can see the organizer layout.
  // We'll remove these and swap to real contacts in the final pass.
  const contacts = useMemo(
    () => [
      {
        id: 1,
        name: 'Jane Doe',
        status: 'Open to Opportunities',
        photo: 'https://via.placeholder.com/64',
      },
      {
        id: 2,
        name: 'John Smith',
        status: 'Looking for Remote Roles',
        photo: 'https://via.placeholder.com/64',
      },
      {
        id: 3,
        name: 'Alex Johnson',
        status: 'Networking',
        photo: 'https://via.placeholder.com/64',
      },
      {
        id: 4,
        name: 'Chris Park',
        status: 'Hiring',
        photo: 'https://via.placeholder.com/64',
      },
      {
        id: 5,
        name: 'Priya N.',
        status: 'Open to Projects',
        photo: 'https://via.placeholder.com/64',
      },
      {
        id: 6,
        name: 'Michael R.',
        status: 'Exploring',
        photo: 'https://via.placeholder.com/64',
      },
    ],
    []
  );

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
    <Layout title="Contacts | ForgeTomorrow" header={HeaderBox} activeNav="contacts">
      <Head>
        <title>ForgeTomorrow - Contacts</title>
      </Head>

      {/* Main + right rail grid */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,2.3fr)_minmax(260px,1fr)] gap-6">
        {/* Main contacts organizer */}
        <div>
          <ContactsOrganizer contacts={contacts} />
        </div>

        {/* Right rail – using SeekerRightColumn for now.
            Later this becomes: Recent profile views + contextual ads. */}
        <aside className="space-y-4">
          <SeekerRightColumn variant="contacts" />
        </aside>
      </div>
    </Layout>
  );
}
