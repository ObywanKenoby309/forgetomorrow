// pages/the-hearth.js
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import HearthCenter from '@/components/community/HearthCenter';
import Link from 'next/link';
import SupportFloatingButton from '@/components/SupportFloatingButton';

// ✅ Match Seeker Dashboard glass styling (STYLE match, not format change)
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
        boxSizing: 'border-box',
        width: '100%',
        minWidth: 0,
      }}
    >
      <h1
        style={{
          color: '#FF7043',
          fontSize: 24,
          fontWeight: 800,
          margin: 0,
        }}
      >
        The Hearth
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          fontSize: 14,
          maxWidth: 720,
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
      {/* Community guidelines + support */}
      <div
        style={{
          ...GLASS,
          borderRadius: 12,
          padding: 14,
          display: 'grid',
          gap: 8,
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F' }}>
          Community Guidelines &amp; Support
        </div>

        <Link href="/community-guidelines" style={{ color: '#FF7043', fontWeight: 700 }}>
          Community Guidelines
        </Link>

        <p style={{ margin: 0, color: '#607D8B', fontSize: 13, lineHeight: 1.35 }}>
          Need help? Use the orange “Need help? Chat with Support” button at the
          bottom-right of the screen to contact our team.
        </p>
      </div>

      {/* Advertisement slot for The Hearth */}
      <div
        style={{
          ...GLASS,
          borderRadius: 12,
          padding: 14,
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F', marginBottom: 6 }}>
          Partner Spotlight
        </div>

        <p style={{ margin: 0, color: '#607D8B', fontSize: 13, lineHeight: 1.35 }}>
          Your advertisement could be here. Contact{' '}
          <a
            href="mailto:sales@forgetomorrow.com"
            style={{ color: '#FF7043', fontWeight: 700 }}
          >
            sales@forgetomorrow.com
          </a>
          .
        </p>
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
      rightVariant="light" // ✅ ensures no black right-rail container on any chrome
    >
      <>
        <HearthCenter />
        <SupportFloatingButton />
      </>
    </Layout>
  );
}