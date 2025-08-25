import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import { readContactsData } from '@/lib/contactsStore';

export default function FollowingNewslettersPage() {
  const [newsletters, setNewsletters] = useState([]);

  useEffect(() => {
    const { follows } = readContactsData();
    setNewsletters(follows?.newsletters || []);
  }, []);

  const HeaderBox = (
    <section style={{
      background: 'white', borderRadius: 12, padding: 16,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee', textAlign: 'center'
    }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Following — Newsletters
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Newsletters you’re subscribed to on ForgeTomorrow.
      </p>
    </section>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="contacts" />
    </div>
  );

  return (
    <SeekerLayout title="Following — Newsletters | ForgeTomorrow" header={HeaderBox} right={RightRail} activeNav="contacts">
      <Head><title>ForgeTomorrow — Following: Newsletters</title></Head>

      <section style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={{ color: '#FF7043', marginTop: 0 }}>Newsletters you follow</h2>
          <Link href="/seeker/contact-center?tab=contacts" style={{ color: '#FF7043', fontWeight: 700 }}>
            ← Back to Contact Center
          </Link>
        </div>

        {newsletters.length === 0 ? (
          <p className="text-gray-600">No newsletters followed yet.</p>
        ) : (
          <ul className="space-y-3">
            {newsletters.map(n => (
              <li key={n.id} className="p-3 border rounded bg-white">
                <div className="font-semibold">{n.title || n.name}</div>
                {n.author && <div className="text-sm text-gray-600">by {n.author}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </SeekerLayout>
  );
}
