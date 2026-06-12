// pages/seeker/the-hearth/events.js
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

function makeLayout(chromeRaw) {
  let Layout = SeekerLayout;
  let activeNav = 'the-hearth';

  if (chromeRaw === 'coach') {
    Layout = CoachingLayout;
    activeNav = 'hearth';
  } else if (chromeRaw === 'recruiter-smb' || chromeRaw === 'recruiter-ent') {
    Layout = RecruiterLayout;
    activeNav = 'hearth';
  }

  return { Layout, activeNav };
}

const Header = (
  <section
    style={{
      background: 'white',
      border: '1px solid #eee',
      borderRadius: 12,
      padding: 'clamp(12px, 4vw, 16px)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      textAlign: 'center',
    }}
  >
    <h1
      style={{
        margin: 0,
        color: '#FF7043',
        fontSize: 'clamp(20px, 5vw, 24px)',
        fontWeight: 800,
        lineHeight: 1.2,
      }}
    >
      Community Events
    </h1>
    <p
      style={{
        margin: '6px auto 0',
        color: '#607D8B',
        maxWidth: 720,
        fontSize: 'clamp(13px, 3.5vw, 15px)',
        lineHeight: 1.5,
      }}
    >
      Workshops, webinars, and networking. Event listings will appear here once we open
      the calendar to the community.
    </p>
  </section>
);

export default function HearthEventsPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const { Layout, activeNav } = makeLayout(chrome);

  return (
    <Layout
      title="Events | ForgeTomorrow"
      header={Header}
      right={<RightRailPlacementManager surfaceId="seeker/the-hearth/events" />}
      activeNav={activeNav}
    >
      <section
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        <div
          style={{
            background: 'white',
            border: '1px dashed #B0BEC5',
            borderRadius: 12,
            padding: 'clamp(14px, 4vw, 20px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(15px, 4vw, 18px)',
              fontWeight: 800,
              color: '#37474F',
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            Event calendar not enabled yet
          </div>
          <p style={{ color: '#607D8B', marginTop: 4, fontSize: 'clamp(13px, 3.5vw, 15px)', lineHeight: 1.5 }}>
            Live resume clinics, recruiter AMAs, and networking sessions will appear here
            once we finish setting up scheduling and moderation.
          </p>
          <p style={{ color: '#607D8B', marginTop: 8, fontSize: 'clamp(13px, 3.5vw, 15px)', lineHeight: 1.5 }}>
            For now, you can keep an eye on this space to see when events are live for the community.
          </p>
        </div>
      </section>
    </Layout>
  );
}