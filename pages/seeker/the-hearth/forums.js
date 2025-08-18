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
    <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>Discussion Forums</h1>
    <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
      Coming soon — topic threads, replies, and reputation.
    </p>
  </section>
);

export default function SeekerHearthForums() {
  return (
    <SeekerLayout
      title="Forums | ForgeTomorrow"
      header={Header}
      right={<RightRail />}
      activeNav="the-hearth"
    >
      <section style={{
        background: 'white', border: '1px dashed #B0BEC5', borderRadius: 12,
        padding: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', textAlign: 'center'
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#37474F' }}>🔒 Not Yet Enabled</div>
        <p style={{ color: '#607D8B', marginTop: 6 }}>
          We’re polishing threads, mentions, and moderation. Stay tuned!
        </p>
      </section>
    </SeekerLayout>
  );
}
