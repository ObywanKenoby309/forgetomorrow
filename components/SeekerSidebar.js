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
        justifyContent: 'center',
        gap: '32px',
        height: 'fit-content',
        width: '300px',
      }}
    >
      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Seeker Dashboard</h3>
        <Link href="/seeker-dashboard" legacyBehavior>
          <button
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors"
            aria-label="Go to Seeker Dashboard"
          >
            Seeker Dashboard
          </button>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Your Roadmap</h3>
        <Link href="/roadmap" legacyBehavior>
          <button
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors"
            aria-label="Launch Career Roadmap"
          >
            Your Roadmap
          </button>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Open Creator</h3>
        <Link href="/resume-cover" legacyBehavior>
          <button
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors"
            aria-label="Go to Resume and Cover Letter Creator"
          >
            Open Creator
          </button>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">To The Pipeline</h3>
        <Link href="/jobs" legacyBehavior>
          <button
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors"
            aria-label="Open The Pipeline"
          >
            To The Pipeline
          </button>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Visit Your Hearth</h3>
        <Link href="/the-hearth" legacyBehavior>
          <button
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors"
            aria-label="Visit Your Hearth"
          >
            Visit Your Hearth
          </button>
        </Link>
      </div>
    </aside>
  );
}
