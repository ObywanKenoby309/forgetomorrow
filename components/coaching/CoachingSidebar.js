// components/coaching/CoachingSidebar.js
import Link from 'next/link';

export default function CoachingSidebar({ active = 'overview' }) {
  const btn =
    "block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors text-center shadow-md hover:shadow-lg";
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
  const activeStyle = { outline: '2px solid #FFAB91', outlineOffset: '2px' };

  return (
    <aside style={wrap}>
      {/* Back to Seeker */}
      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Job Seeker</h3>
        <Link
          href="/seeker-dashboard"
          className={btn}
          aria-label="Back to Seeker Dashboard"
        >
          Your Seeker Dashboard
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Coaching Overview</h3>
        <Link
          href="/coaching-dashboard"
          className={btn}
          style={active === 'overview' ? activeStyle : undefined}
        >
          Overview
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Clients</h3>
        <Link
          href="/dashboard/coaching/clients"
          className={btn}
          style={active === 'clients' ? activeStyle : undefined}
        >
          Clients
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Sessions</h3>
        <Link
          href="/dashboard/coaching/sessions"
          className={btn}
          style={active === 'sessions' ? activeStyle : undefined}
        >
          Sessions
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Resources</h3>
        <Link
          href="/dashboard/coaching/resources"
          className={btn}
          style={active === 'resources' ? activeStyle : undefined}
        >
          Resources
        </Link>
      </div>

      {/* New: Feedback */}
      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Feedback</h3>
        <Link
          href="/dashboard/coaching/feedback"
          className={btn}
          style={active === 'feedback' ? activeStyle : undefined}
        >
          Feedback
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Applications</h3>
        <Link href="/applications" className={btn}>
          Applications Tracker
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Resume Builder</h3>
        <Link href="/resume/create" className={btn}>
          Resume Builder
        </Link>
      </div>
    </aside>
  );
}
