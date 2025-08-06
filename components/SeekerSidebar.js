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
        minHeight: '80vh',
        width: '300px',
      }}
    >
      <div>
        <h2 className="text-[#FF7043] mb-3 font-semibold text-lg">Resume/Cover Creator</h2>
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
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Ready to Apply?</h3>
        <Link href="/jobs" legacyBehavior>
          <button
            className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-5 py-3 rounded font-bold w-full transition-colors"
            aria-label="Open The Pipeline"
          >
            Open The Pipeline
          </button>
        </Link>
      </div>

      <div>
        <h3 className="text-[#FF7043] mb-3 font-semibold text-lg">Career Growth</h3>
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
