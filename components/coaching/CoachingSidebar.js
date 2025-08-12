// components/coaching/CoachingSidebar.js
import Link from 'next/link';

export default function CoachingSidebar({ active = 'overview' }) {
  const btn = "block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors text-center";
  const wrap = {
    borderRight: '1px solid #ccc',
    padding: '24px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '32px',
    height: 'fit-content',
    width: '300px',
  };
  const activeStyle = { outline: '2px solid #FFAB91' };

  return (
    <aside style={wrap}>
      {/* Back to Seeker */}
      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Job Seeker</h3>
        <Link href="/seeker-dashboard" legacyBehavior>
          <a className={btn} aria-label="Back to Seeker Dashboard">Your Seeker Dashboard</a>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Coaching Overview</h3>
        <Link href="/coaching-dashboard" legacyBehavior>
          <a className={btn} style={active === 'overview' ? activeStyle : undefined}>Overview</a>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Clients</h3>
        <Link href="/dashboard/coaching/clients" legacyBehavior>
          <a className={btn} style={active === 'clients' ? activeStyle : undefined}>Clients</a>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Sessions</h3>
        <Link href="/dashboard/coaching/sessions" legacyBehavior>
          <a className={btn} style={active === 'sessions' ? activeStyle : undefined}>Sessions</a>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Resources</h3>
        <Link href="/dashboard/coaching/resources" legacyBehavior>
          <a className={btn} style={active === 'resources' ? activeStyle : undefined}>Resources</a>
        </Link>
      </div>

      {/* New: Feedback */}
      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Feedback</h3>
        <Link href="/dashboard/coaching/feedback" legacyBehavior>
          <a className={btn} style={active === 'feedback' ? activeStyle : undefined}>Feedback</a>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Applications</h3>
        <Link href="/applications" legacyBehavior>
          <a className={btn}>Applications Tracker</a>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Resume Builder</h3>
        <Link href="/resume/create" legacyBehavior>
          <a className={btn}>Resume Builder</a>
        </Link>
      </div>
    </aside>
  );
}
