import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import { readContactsData } from '@/lib/contactsStore';

export default function FollowingPeoplePage() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    const { follows } = readContactsData();
    setPeople(follows?.people || []);
  }, []);

  const HeaderBox = (
    <section style={{
      background: 'white', borderRadius: 12, padding: 16,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee', textAlign: 'center'
    }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Following — People
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Creators and professionals you follow across ForgeTomorrow.
      </p>
    </section>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="contacts" />
    </div>
  );

  return (
    <SeekerLayout title="Following — People | ForgeTomorrow" header={HeaderBox} right={RightRail} activeNav="contacts">
      <Head><title>ForgeTomorrow — Following: People</title></Head>

      <section style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={{ color: '#FF7043', marginTop: 0 }}>People you follow</h2>
          <Link href="/seeker/contact-center?tab=contacts" style={{ color: '#FF7043', fontWeight: 700 }}>
            ← Back to Contact Center
          </Link>
        </div>

        {people.length === 0 ? (
          <p className="text-gray-600">You aren’t following anyone yet.</p>
        ) : (
          <ul className="space-y-3">
            {people.map(p => (
              <li key={p.id} className="flex items-center gap-3 p-3 border rounded bg-white">
                <img src={p.photo} alt="" width={40} height={40} className="rounded-full object-cover" />
                <div>
                  <div className="font-semibold">{p.name}</div>
                  {p.title && <div className="text-sm text-gray-600">{p.title}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SeekerLayout>
  );
}
