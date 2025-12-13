// pages/the-hearth.js
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import HearthCenter from '@/components/community/HearthCenter';
import Link from 'next/link';
import SupportFloatingButton from '@/components/SupportFloatingButton';

function HeaderBox() {
  return (
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
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Community guidelines + support */}
      <div
        style={{
          background: 'white',
          borderRadius: 10,
          padding: 12,
          display: 'grid',
          gap: 8,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          border: '1px solid #eee',
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
        <p
          style={{
            margin: 0,
            color: '#607D8B',
            fontSize: 13,
          }}
        >
          Need help? Use the orange “Need help? Chat with Support” button at the
          bottom-right of the screen to contact our team.
        </p>
      </div>

      {/* Advertisement slot for The Hearth */}
      <div
        style={{
          background: 'white',
          borderRadius: 10,
          padding: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          border: '1px solid #eee',
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F', marginBottom: 4 }}>
          Partner Spotlight
        </div>
        <p style={{ margin: 0, color: '#607D8B', fontSize: 13 }}>
          Your advertisement could be here. Contact{' '}
          <a
            href="mailto:sales@forgetomorrow.com"
            style={{ color: '#FF7043', fontWeight: 600 }}
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
    >
      <>
        <HearthCenter />
        <SupportFloatingButton />
      </>
    </Layout>
  );
}
