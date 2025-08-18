// pages/the-hearth.js
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import HearthCenter from '@/components/community/HearthCenter';
import Link from 'next/link';

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
      <SeekerRightColumn variant="community" />

      {/* Extra quick links */}
      <div
        style={{
          background: 'white',
          borderRadius: 10,
          padding: 12,
          display: 'grid',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F' }}>Shortcuts</div>
        <Link href="/about" style={{ color: '#FF7043', fontWeight: 600 }}>Community Guidelines</Link>
        <Link href="/support" style={{ color: '#FF7043', fontWeight: 600 }}>Get Support</Link>
      </div>

      {/* Rules */}
      <div
        style={{
          background: 'white',
          borderRadius: 10,
          padding: 12,
          display: 'grid',
          gap: 6,
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F' }}>Community Rules</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#607D8B', fontSize: 13 }}>
          <li>Be respectful and constructive</li>
          <li>No spam or solicitations</li>
          <li>Keep personal info private</li>
        </ul>
      </div>
    </div>
  );
}

export default function TheHearth() {
  return (
    <SeekerLayout
      title="ForgeTomorrow — The Hearth"
      header={<HeaderBox />}
      right={<RightRail />}
      activeNav="the-hearth"
    >
      <HearthCenter />
    </SeekerLayout>
  );
}
