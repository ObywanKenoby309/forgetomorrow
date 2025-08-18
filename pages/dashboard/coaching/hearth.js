// pages/dashboard/coaching/hearth.js
import CoachingLayout from '@/components/layouts/CoachingLayout';
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
        Community hub for coaches and seekers—share tips, resources, and wins.
      </p>
    </section>
  );
}

function RightRail() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Simple right-rail for coaches (white cards inside dark rail) */}
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
        <Link href="/coaching-dashboard" style={{ color: '#FF7043', fontWeight: 600 }}>Coaching Overview</Link>
        <Link href="/dashboard/coaching/clients" style={{ color: '#FF7043', fontWeight: 600 }}>Clients</Link>
        <Link href="/dashboard/coaching/sessions" style={{ color: '#FF7043', fontWeight: 600 }}>Sessions</Link>
      </div>

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
          <li>Coach respectfully; no self‑promotion spam</li>
          <li>Protect client confidentiality</li>
          <li>Keep advice actionable</li>
        </ul>
      </div>
    </div>
  );
}

export default function CoachingHearthPage() {
  return (
    <CoachingLayout
      title="The Hearth — Coaching | ForgeTomorrow"
      headerTitle="The Hearth"
      headerDescription="Community hub for collaboration between coaches and seekers."
      right={<RightRail />}
      activeNav="overview" /* or add 'hearth' later if you add it to CoachingSidebar */
    >
      <HearthCenter />
    </CoachingLayout>
  );
}
