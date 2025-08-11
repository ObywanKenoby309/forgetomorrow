// components/GenericSidebar.js
import Link from 'next/link';

export default function GenericSidebar() {
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
        width: '300px', // match SeekerSidebar width exactly
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
      aria-label="Navigation sidebar"
    >
      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Seeker Dashboard</h3>
        <Link href="/seeker-dashboard" legacyBehavior>
          <a
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors text-center"
            aria-label="Go to Seeker Dashboard"
          >
            Seeker Dashboard
          </a>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Your Roadmap</h3>
        <Link href="/roadmap" legacyBehavior>
          <a
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors text-center"
            aria-label="Launch Career Roadmap"
          >
            Your Roadmap
          </a>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Open Creator</h3>
        <Link href="/resume-cover" legacyBehavior>
          <a
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors text-center"
            aria-label="Go to Resume and Cover Letter Creator"
          >
            Open Creator
          </a>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">To The Pipeline</h3>
        <Link href="/jobs" legacyBehavior>
          <a
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors text-center"
            aria-label="Open The Pipeline"
          >
            To The Pipeline
          </a>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Visit Your Hearth</h3>
        <Link href="/the-hearth" legacyBehavior>
          <a
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors text-center"
            aria-label="Visit Your Hearth"
          >
            Visit Your Hearth
          </a>
        </Link>
      </div>
    </aside>
  );
}
