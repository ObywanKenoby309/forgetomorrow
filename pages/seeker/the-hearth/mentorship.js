import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

function RightRail() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 800, color: 'black', marginBottom: 8 }}>Shortcuts</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <Link href="/seeker/the-hearth">Back to Hearth</Link>
          <Link href="/seeker/the-hearth/events">Community Events</Link>
          <Link href="/seeker/the-hearth/resources">Resource Library</Link>
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
    <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>Mentorship Programs</h1>
    <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
      Discover mentors by specialty, experience, and availability.
    </p>
  </section>
);

export default function SeekerHearthMentorship() {
  const Card = ({ name, role, blurb }) => (
    <div style={{
      background: 'white', border: '1px solid #eee', borderRadius: 12,
      padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
    }}>
      <div style={{ fontWeight: 800, color: '#263238' }}>{name}</div>
      <div style={{ color: '#607D8B', fontSize: 14 }}>{role}</div>
      <p style={{ marginTop: 8, color: '#455A64' }}>{blurb}</p>
      <button
        style={{ marginTop: 8, background: '#FF7043', color: 'white', padding: '8px 12px', borderRadius: 8, border: 'none', fontWeight: 700 }}
        onClick={() => alert('Request sent (placeholder)')}
      >
        Request Intro
      </button>
    </div>
  );

  return (
    <SeekerLayout
      title="Mentorship | ForgeTomorrow"
      header={Header}
      right={<RightRail />}
      activeNav="the-hearth"
    >
      <section style={{ display: 'grid', gap: 12 }}>
        <Card name="Ari H." role="Customer Success Director"
              blurb="Coaching on stakeholder management, storytelling, and onboarding playbooks." />
        <Card name="Samira K." role="Product Ops Lead"
              blurb="Help with resume positioning, impact bullets, and cross‑functional collaboration." />
      </section>
    </SeekerLayout>
  );
}
