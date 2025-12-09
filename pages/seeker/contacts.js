// pages/seeker/contacts.js
import React, { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
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

  // 🔸 Right rail – gives us space for shortcuts / ads
  const rightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="contacts" />
    </div>
  );

  // Mock data (placeholder for now; we’ll remove for live)
  const contacts = useMemo(
    () => [
      { id: 1, name: 'Jane Doe', status: 'Open to Opportunities', photo: 'https://via.placeholder.com/64' },
      { id: 2, name: 'John Smith', status: 'Looking for Remote Roles', photo: 'https://via.placeholder.com/64' },
      { id: 3, name: 'Alex Johnson', status: 'Networking', photo: 'https://via.placeholder.com/64' },
      { id: 4, name: 'Chris Park', status: 'Hiring', photo: 'https://via.placeholder.com/64' },
      { id: 5, name: 'Priya N.', status: 'Open to Projects', photo: 'https://via.placeholder.com/64' },
      { id: 6, name: 'Michael R.', status: 'Exploring', photo: 'https://via.placeholder.com/64' },
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
    <Layout
      title="Contacts | ForgeTomorrow"
      header={HeaderBox}
      activeNav="contacts"
      right={rightRail}
    >
      <Head>
        <title>ForgeTomorrow - Contacts</title>
      </Head>

      {/* Center column, similar to Coaching Dashboard width */}
      <div className="w-full max-w-5xl mx-auto px-2 md:px-0">
        <ContactsOrganizer contacts={contacts} />
      </div>
    </Layout>
  );
}
