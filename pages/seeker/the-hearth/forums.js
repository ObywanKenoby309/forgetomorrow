// pages/seeker/the-hearth/forums.js
import Link from 'next/link';
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

export default function HearthForumsPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const { Layout, activeNav } = makeLayout(chrome);

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <RightRailPlacementManager surfaceId="seeker/the-hearth/forums" slot="right_rail_1" />
    </div>
  );

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
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Discussion Forums
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        Topic threads, replies, and reputation are on the roadmap. This area is wired and
        visible now so we can finalize moderation before opening it up.
      </p>
    </section>
  );

  return (
    <Layout
      title="Forums | ForgeTomorrow"
      header={Header}
      right={RightRail}
      activeNav={activeNav}
    >
      <section
        style={{
          background: 'white',
          border: '1px dashed #B0BEC5',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: '#37474F' }}>
          Forums not enabled yet
        </div>

        <p style={{ color: '#607D8B', marginTop: 6 }}>
          We’re finishing moderation tools, spam protection, and reporting workflows so
          that conversations here stay healthy and constructive.
        </p>

        <p style={{ color: '#607D8B', marginTop: 8 }}>
          Once everything is ready, this space will open for topic-based threads,
          replies, and community reputation. For now, you can navigate here to see that
          the Forums area is in place and under review.
        </p>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link href={withChrome('/seeker/the-hearth/events')} style={{ color: '#FF7043', fontWeight: 800 }}>
            Events
          </Link>
          <span style={{ color: '#B0BEC5' }}>•</span>
          <Link href={withChrome('/seeker/the-hearth/resources')} style={{ color: '#FF7043', fontWeight: 800 }}>
            Resources
          </Link>
          <span style={{ color: '#B0BEC5' }}>•</span>
          <Link href={withChrome('/hearth/spotlights')} style={{ color: '#FF7043', fontWeight: 800 }}>
            Spotlights
          </Link>
        </div>
      </section>
    </Layout>
  );
}
