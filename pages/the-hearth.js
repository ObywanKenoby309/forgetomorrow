// pages/the-hearth.js
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import HearthCenter from '@/components/community/HearthCenter';
import Link from 'next/link';
import SupportFloatingButton from '@/components/SupportFloatingButton';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

function HeaderBox() {
  return (
    <section
      style={{
        ...GLASS,
        padding: 16,
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          color: '#FF7043',
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
        }}
      >
        The Hearth
      </h1>
      <p
        style={{
          marginTop: 8,
          color: '#546E7A',
          fontSize: 14,
        }}
      >
        Your central place to build connections, find mentors, and grow your professional
        network with purpose and authenticity.
      </p>
    </section>
  );
}

function RightRail() {
  return (
    <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      <div
        style={{
          ...GLASS,
          padding: 12,
          display: 'grid',
          gap: 8,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F' }}>
          Community Guidelines &amp; Support
        </div>
        <Link
          href="/community-guidelines"
          style={{ color: '#FF7043', fontWeight: 600 }}
        >
          Community Guidelines
        </Link>
      </div>

      <div style={{ minWidth: 0 }}>
        <RightRailPlacementManager slot="right_rail_1" />
      </div>
    </div>
  );
}

export default function TheHearth() {
  const router = useRouter();
  const chromeRaw = String(router.query.chrome || 'seeker').toLowerCase();

  let Layout = SeekerLayout;
  let activeNav = 'the-hearth';

  if (chromeRaw === 'coach') {
    Layout = CoachingLayout;
    activeNav = 'hearth';
  } else if (chromeRaw === 'recruiter-smb' || chromeRaw === 'recruiter-ent') {
    Layout = RecruiterLayout;
    activeNav = 'hearth';
  }

  return (
    <Layout
      title="ForgeTomorrow — The Hearth"
      header={<HeaderBox />}
      right={<RightRail />}
      activeNav={activeNav}
      rightVariant="light"
    >
      <>
        <HearthCenter />
        <SupportFloatingButton />
      </>
    </Layout>
  );
}