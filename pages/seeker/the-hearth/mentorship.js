// pages/seeker/the-hearth/mentorship.js
import { useRouter } from 'next/router';
import Link from 'next/link';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

// ─────────────────────────────────────────────
// Shared chrome helper (same pattern as /the-hearth)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Right rail shortcuts (no full-page background)
// ─────────────────────────────────────────────
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
        <div style={{ fontWeight: 800, color: '#263238', marginBottom: 8 }}>
          Shortcuts
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <Link href={withChrome('/the-hearth')}>Back to The Hearth</Link>
          <Link href={withChrome('/seeker/the-hearth/events')}>Community Events</Link>
          <Link href={withChrome('/seeker/the-hearth/resources')}>Resource Library</Link>
          <Link href={withChrome('/seeker/the-hearth/forums')}>Discussion Forums</Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Header — card only, no global background
// ─────────────────────────────────────────────
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
      Mentorship Programs
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
      Discover mentors by specialty, experience, and availability — coming soon.
    </p>
  </section>
);

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────
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
          padding: 'clamp(14px, 4vw, 20px)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          textAlign: 'left',
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
          Mentorship programs are not live yet
        </div>
        <p style={{ color: '#607D8B', marginTop: 4, fontSize: 'clamp(13px, 3.5vw, 15px)', lineHeight: 1.5 }}>
          This space will host verified mentors and structured mentoring programs across
          roles, industries, and regions. You&rsquo;ll be able to filter by specialty,
          availability, and style of support.
        </p>
        <p style={{ color: '#607D8B', marginTop: 8, fontSize: 'clamp(13px, 3.5vw, 15px)', lineHeight: 1.5 }}>
          If you&rsquo;re interested in mentoring when this launches, please contact our support
          team using the orange support button in the lower-right corner.
        </p>
      </section>
    </Layout>
  );
}