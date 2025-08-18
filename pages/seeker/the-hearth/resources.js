import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

function RightRail() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 800, color: 'black', marginBottom: 8 }}>Shortcuts</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <Link href="/seeker/the-hearth">Back to Hearth</Link>
          <Link href="/seeker/the-hearth/mentorship">Mentorship Programs</Link>
          <Link href="/seeker/the-hearth/events">Community Events</Link>
          <Link href="/seeker/the-hearth/forums">Discussion Forums</Link>
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
    <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>Resource Library</h1>
    <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
      Articles and guides now. Paid certs and courses later.
    </p>
  </section>
);

export default function SeekerHearthResources() {
  const Item = ({ title, blurb }) => (
    <div style={{
      background: 'white', border: '1px solid #eee', borderRadius: 12,
      padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
    }}>
      <div style={{ fontWeight: 800, color: '#263238' }}>{title}</div>
      <p style={{ color: '#455A64', marginTop: 6 }}>{blurb}</p>
      <button
        style={{ marginTop: 8, background: '#FF7043', color: 'white', padding: '8px 12px', borderRadius: 8, border: 'none', fontWeight: 700 }}
        onClick={() => alert('Open resource (placeholder)')}
      >
        Read
      </button>
    </div>
  );

  return (
    <SeekerLayout
      title="Resources | ForgeTomorrow"
      header={Header}
      right={<RightRail />}
      activeNav="the-hearth"
    >
      <section style={{ display: 'grid', gap: 12 }}>
        <Item title="Crafting Impact Bullets"
              blurb="Turn duties into outcomes using metrics, levers, and customer value." />
        <Item title="Interview Story Bank"
              blurb="Create STAR stories mapped to the most common behavioral themes." />
      </section>
    </SeekerLayout>
  );
}
