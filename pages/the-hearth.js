// pages/the-hearth.js
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import HearthCenter from '@/components/community/HearthCenter';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import Link from 'next/link';
import SupportFloatingButton from '@/components/SupportFloatingButton';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

function RightRail() {
  return (
    <div style={{ display: 'grid', gap: 12, minWidth: 0, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        <RightRailPlacementManager slot="right_rail_1" />
      </div>

      <div
        style={{
          ...GLASS,
          padding: 12,
          display: 'grid',
          gap: 8,
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          fontSize: 18,
          color: '#FF7043',
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          ...ORANGE_HEADING_LIFT,
        }}>
          Community Guidelines
        </div>
        <Link href="/community-guidelines" style={{
          color: '#FF7043',
          fontWeight: 800,
          fontSize: 13,
          lineHeight: 1.2,
          textDecoration: 'none',
        }}>
          Read the guidelines →
        </Link>
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

  const greeting = getTimeGreeting();

  return (
    <Layout
      title="ForgeTomorrow — The Hearth"
      header={
        <SeekerTitleCard
          greeting={greeting}
          title="The Hearth"
          subtitle="Your central place to build connections, find mentors, and grow your professional network with purpose and authenticity."
        />
      }
      headerCard={false}
      right={<RightRail />}
      rightVariant="light"
      activeNav={activeNav}
    >
      <>
        <HearthCenter />
        <SupportFloatingButton />
      </>
    </Layout>
  );
}