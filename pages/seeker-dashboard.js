// pages/seeker-dashboard.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import SeekerSidebar from '../components/SeekerSidebar';
import JobSearchSnapshot from '../components/JobSearchSnapshot';
import PinnedJobsPreview from '../components/PinnedJobsPreview';
import ResumeTrackerPreview from '../components/ResumeTrackerPreview';
import ResumeTrackerSummary from '../components/ResumeTrackerSummary';

const STORAGE_KEY = 'applicationsTracker';

export default function SeekerDashboard() {
  const [trackerData, setTrackerData] = useState({
    Pinned: [],
    Applied: [],
    Interviewing: [],
    Offers: [],
    Rejected: [],
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTrackerData(JSON.parse(saved));
    }
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '20px',
        padding: '120px 20px 20px',
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      }}
    >
      <SeekerSidebar />

      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Summary Counts */}
        <ResumeTrackerSummary trackerData={trackerData} />

        <JobSearchSnapshot />

        <section
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <h2 style={{ color: '#FF7043', margin: 0 }}>Pinned Jobs</h2>
            <Link href="/pinned-jobs" style={{ color: '#FF7043', fontWeight: 600 }}>
              View all
            </Link>
          </div>
          <PinnedJobsPreview />
        </section>

        <section
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <h2 style={{ color: '#FF7043', margin: 0 }}>Resume / Application Tracker</h2>
            <Link href="/applications" style={{ color: '#FF7043', fontWeight: 600 }}>
              View all
            </Link>
          </div>
          <ResumeTrackerPreview />
        </section>
      </main>
    </div>
  );
}
