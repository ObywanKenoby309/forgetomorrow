// components/coaching/dashboard/FollowUpsCard.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { countDueToday } from '@/lib/coaching/followups';

export default function FollowUpsCard({ linkHref = '/dashboard/coaching/clients/followups?due=today' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCount(countDueToday());
    const onStorage = (e) => {
      if (e.key === 'coachFollowUps_v1' || e.key === 'coachSettings_v1') {
        setCount(countDueToday());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div
      style={{
        background: '#FAFAFA',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        minHeight: 120,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Follow-ups Due</div>
      <div style={{ color: '#455A64' }}>
        {count === 0 ? 'No follow-ups due today.' : `${count} follow-up${count > 1 ? 's' : ''} due by 5 PM.`}
      </div>
      <div style={{ textAlign: 'right', marginTop: 'auto' }}>
        <Link href={linkHref} style={{ color: '#FF7043', fontWeight: 600 }}>
          Open follow-ups
        </Link>
      </div>
    </div>
  );
}
