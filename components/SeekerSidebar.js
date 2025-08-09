// components/SeekerSidebar.js
import Link from 'next/link';

export default function SeekerSidebar() {
  return (
    <aside
      style={{
        borderRight: '1px solid #ccc',
        padding: '24px 20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        minHeight: '80vh',
        width: '300px',
      }}
    >
      <div>
        <h2 className="text-[#FF7043] mb-3 font-semibold text-lg">Seeker Tools</h2>
        <nav style={{ display: 'grid', gap: 10 }}>
          {/* NEW: Quick link back to dashboard */}
          <Link href="/seeker-dashboard" style={{ color: '#FF7043', fontWeight: 600 }}>
            ← Seeker Dashboard
          </Link>

          <Link href="/applications" style={{ color: '#455A64' }}>
            Applications Tracker
          </Link>
          <Link href="/pinned-jobs" style={{ color: '#455A64' }}>
            Pinned Jobs
          </Link>
          <Link href="/resume/create" style={{ color: '#455A64' }}>
            Create Resume
          </Link>
        </nav>
      </div>
    </aside>
  );
}
