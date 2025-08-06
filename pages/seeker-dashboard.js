// pages/seeker-dashboard.js
import React from 'react';
import Link from 'next/link';
import ProfileMetrics from '../components/ProfileMetrics';
import JobApplicationTracker from '../components/JobApplicationTracker';

export default function SeekerDashboard() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '350px 1fr',
        gap: '20px',
        padding: '20px',
        paddingTop: '100px', // ✅ Pushes below fixed header
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          borderRight: '1px solid #ccc',
          paddingRight: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          height: 'fit-content',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div>
          <h2 className="text-[#FF7043] mb-3">Resume/Cover Creator</h2>
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
          <h3 className="text-[#FF7043] mb-2">Ready to Apply?</h3>
          <Link href="/jobs" legacyBehavior>
            <button
              className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded font-bold w-full transition-colors"
              aria-label="Explore Job Listings"
            >
              Explore Job Listings
            </button>
          </Link>
        </div>

        <div>
          <h3 className="text-[#FF7043] mb-2">Career Growth</h3>
          <Link href="/hearth" legacyBehavior>
            <button
              className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded font-bold w-full transition-colors"
              aria-label="Visit Your Hearth for Mentors and Resources"
            >
              Visit Your Hearth
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <ProfileMetrics showTopContent showLastProfileViewer />
        <JobApplicationTracker />
      </main>
    </div>
  );
}
