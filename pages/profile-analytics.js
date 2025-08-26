// pages/profile-analytics.js
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import SeekerLayout from '@/components/layouts/SeekerLayout';

// Load chart on client only
const ProfileMetrics = dynamic(() => import('@/components/ProfileMetrics'), { ssr: false });

export default function ProfileAnalyticsPage() {
  const router = useRouter();
  const isCoachChrome = router.query.chrome === 'coach';
  const chromeSuffix = isCoachChrome ? '?chrome=coach' : '';

  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Profile Analytics
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        View engagement and top content for your profile.
      </p>
    </section>
  );

  return (
    <>
      <Head><title>Profile Analytics | ForgeTomorrow</title></Head>

      {/* SeekerLayout auto-renders coach chrome when ?chrome=coach is present */}
      <SeekerLayout
        title="Profile Analytics | ForgeTomorrow"
        header={HeaderBox}
        right={null}          // full width, no right rail
        activeNav="profile"   // highlights Profile in seeker chrome (coach chrome will ignore or use its own)
      >
        <div style={{ maxWidth: 860, display: 'grid', gap: 16 }}>
          {/* Small toolbar with back link that preserves ?chrome=coach */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 12,
              border: '1px solid #eee',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <a
              href={`/profile${chromeSuffix}`}
              style={{
                color: '#FF7043',
                fontWeight: 700,
                textDecoration: 'none',
              }}
              aria-label="Back to Profile"
            >
              ← Back to Profile
            </a>
          </section>

          {/* Metrics card */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 16,
              border: '1px solid #eee',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <ProfileMetrics showTopContent showLastProfileViewer />
          </section>
        </div>
      </SeekerLayout>
    </>
  );
}
