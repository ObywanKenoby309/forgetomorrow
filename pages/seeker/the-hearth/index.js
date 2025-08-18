import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

function RightRail() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{
        background: 'white', border: '1px solid #eee', borderRadius: 12,
        padding: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontWeight: 800, color: 'black', marginBottom: 8 }}>Shortcuts</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <Link href="/seeker/the-hearth/mentorship" style={{ color: '#FF7043', fontWeight: 600 }}>Mentorship Programs</Link>
          <Link href="/seeker/the-hearth/events" style={{ color: '#FF7043', fontWeight: 600 }}>Community Events</Link>
          <Link href="/seeker/the-hearth/forums" style={{ color: '#FF7043', fontWeight: 600 }}>Discussion Forums</Link>
          <Link href="/seeker/the-hearth/resources" style={{ color: '#FF7043', fontWeight: 600 }}>Resource Library</Link>
        </div>
      </div>
    </div>
  );
}

const Header = (
  <section style={{
    background: 'white', border: '1px solid #eee', borderRadius: 12,
    padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', textAlign: 'center'
  }}>
    <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>The Hearth</h1>
    <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
      Build connections, find mentors, join events, and grow your career with a supportive community.
    </p>
  </section>
);

export default function SeekerHearthHome() {
  const Tile = ({ href, title, desc }) => (
    <Link
      href={href}
      style={{
        background: '#F5F7F8', border: '1px solid #e5e7eb', borderRadius: 12,
        padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', textDecoration: 'none'
      }}
    >
      <div style={{ color: '#FF7043', fontWeight: 800, fontSize: 18 }}>{title}</div>
      <div style={{ color: '#455A64', marginTop: 6 }}>{desc}</div>
    </Link>
  );

  return (
    <SeekerLayout
      title="The Hearth | ForgeTomorrow"
      header={Header}
      right={<RightRail />}
      activeNav="the-hearth"
    >
      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        <Tile href="/seeker/the-hearth/mentorship" title="Mentorship Programs"
              desc="Browse mentors and find a match aligned to your goals." />
        <Tile href="/seeker/the-hearth/events" title="Community Events"
              desc="Workshops, webinars, and networking — online & in‑person." />
        <Tile href="/seeker/the-hearth/forums" title="Discussion Forums"
              desc="Discuss challenges and share wins with the community." />
        <Tile href="/seeker/the-hearth/resources" title="Resource Library"
              desc="Articles, guides, and training to level up." />
      </section>
    </SeekerLayout>
  );
}
