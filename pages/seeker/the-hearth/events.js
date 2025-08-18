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
    <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>Community Events</h1>
    <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
      Workshops, webinars, and networking. RSVP and add to calendar.
    </p>
  </section>
);

export default function SeekerHearthEvents() {
  const Event = ({ title, when, where, desc }) => (
    <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 800, color: '#263238' }}>{title}</div>
      <div style={{ color: '#607D8B', fontSize: 14, marginTop: 2 }}>{when} • {where}</div>
      <p style={{ color: '#455A64', marginTop: 8 }}>{desc}</p>
      <button
        style={{ marginTop: 8, background: '#FF7043', color: 'white', padding: '8px 12px', borderRadius: 8, border: 'none', fontWeight: 700 }}
        onClick={() => alert('RSVP saved (placeholder)')}
      >
        RSVP
      </button>
    </div>
  );

  return (
    <SeekerLayout
      title="Events | ForgeTomorrow"
      header={Header}
      right={<RightRail />}
      activeNav="the-hearth"
    >
      <section style={{ display: 'grid', gap: 12 }}>
        <Event title="Resume Clinic Live" when="Thu, 7pm CT" where="Virtual"
               desc="Hands‑on resume tightening with live Q&A." />
        <Event title="CSM Roundtable" when="Next Tue, 6pm CT" where="Nashville (Hybrid)"
               desc="Discussion on value realization & adoption plays." />
      </section>
    </SeekerLayout>
  );
}
