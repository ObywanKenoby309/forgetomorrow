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

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

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

  const homeHref = withChrome('/seeker-dashboard');

  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await fetch('/api/contacts/summary');
        if (!res.ok) {
          console.error('contacts/summary failed in /seeker/contacts', await res.text());
          setContacts([]);
          setCategories([]);
          setAssignments([]);
          return;
        }

        const data = await res.json();

        setContacts(data.contacts || []);
        setCategories(data.categories || []);
        setAssignments(data.assignments || []);
      } catch (err) {
        console.error('contacts/summary error in /seeker/contacts', err);
        setContacts([]);
        setCategories([]);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, []);

  const HeaderBox = (
    <section
      style={{
        ...GLASS,
        padding: '24px 16px',
        textAlign: 'center',
        margin: '0 auto',
        maxWidth: 1320,
      }}
    >
      <h1
        style={{
          margin: 0,
          color: '#FF7043',
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        Contacts
      </h1>
      <p
        style={{
          margin: '8px auto 0',
          color: '#546E7A',
          maxWidth: 760,
          fontSize: 15,
          fontWeight: 500,
          lineHeight: 1.55,
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