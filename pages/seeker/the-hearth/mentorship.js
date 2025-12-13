import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

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

function RightRail({ withChrome }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ fontWeight: 800, color: 'black', marginBottom: 8 }}>
          Shortcuts
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <Link href={withChrome('/the-hearth')}>Back to Hearth</Link>
          <Link href={withChrome('/seeker/the-hearth/events')}>
            Community Events
          </Link>
          <Link href={withChrome('/seeker/the-hearth/resources')}>
            Resource Library
          </Link>
          <Link href={withChrome('/seeker/the-hearth/forums')}>
            Discussion Forums
          </Link>
        </div>
      </div>
    </div>
  );
}

const Header = (
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
        margin: 0,
        color: '#FF7043',
        fontSize: 24,
        fontWeight: 800,
      }}
    >
      Mentorship Programs
    </h1>
    <p
      style={{
        margin: '6px auto 0',
        color: '#607D8B',
        maxWidth: 720,
      }}
    >
      Discover mentors by specialty, experience, and availability—coming soon.
    </p>
  </section>
);

export default function HearthMentorshipPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const { Layout, activeNav } = makeLayout(chrome);

  return (
    <Layout
      title="Mentorship | ForgeTomorrow"
      header={Header}
      right={<RightRail withChrome={withChrome} />}
      activeNav={activeNav}
    >
      <section
        style={{
          background: 'white',
          border: '1px dashed #B0BEC5',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#37474F',
            marginBottom: 6,
          }}
        >
          Mentorship programs are not live yet
        </div>
        <p style={{ color: '#607D8B', marginTop: 4 }}>
          This space will host verified mentors and structured mentoring programs across
          roles, industries, and regions. You’ll be able to filter by specialty,
          availability, and style of support.
        </p>
        <p style={{ color: '#607D8B', marginTop: 8 }}>
          If you’re interested in mentoring when this launches, please contact our
          support team using the orange support button in the lower-right corner.
        </p>
      </section>
    </Layout>
  );
}
