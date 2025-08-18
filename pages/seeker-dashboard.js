// pages/seeker-dashboard.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

import ResumeTrackerSummary from '@/components/ResumeTrackerSummary';
import PinnedJobsPreview from '@/components/PinnedJobsPreview';
// Read-only board preview (same data as /seeker/applications)
import ApplicationsBoard from '@/components/applications/ApplicationsBoard';

const STORAGE_KEY = 'applicationsTracker';

/** Compact, single‑row snapshot */
function CompactSnapshot({ trackerData }) {
  const applied = Array.isArray(trackerData?.Applied) ? trackerData.Applied.length : 0;
  const interviewing = Array.isArray(trackerData?.Interviewing) ? trackerData.Interviewing.length : 0;
  const offers = Array.isArray(trackerData?.Offers) ? trackerData.Offers.length : 0;

  // placeholders until tracked
  const viewedByEmployers = trackerData?.viewedByEmployers ?? 0;
  const lastApplicationSent = trackerData?.lastApplicationAt
    ? new Date(trackerData.lastApplicationAt).toLocaleDateString()
    : '—';

  const Tile = ({ title, value, bg, text }) => (
    <div
      style={{
        background: bg,
        color: text,
        borderRadius: 10,
        padding: '10px 12px',
        border: '1px solid rgba(0,0,0,0.06)',
        display: 'grid',
        gap: 4,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.9 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
      <Tile title="Applications Sent" value={applied} bg="#FFE0CC" text="#6A2E1B" />
      <Tile title="Viewed by Employers" value={viewedByEmployers} bg="#DFF1E2" text="#1B5E20" />
      <Tile title="Interviews Scheduled" value={interviewing} bg="#D9EAFE" text="#0D47A1" />
      <Tile title="Offers Received" value={offers} bg="#FAD1DD" text="#8E1836" />
      <Tile title="Last Application Sent" value={lastApplicationSent} bg="#DBF3F6" text="#0D5961" />
    </div>
  );
}

export default function SeekerDashboard() {
  const [trackerData, setTrackerData] = useState({
    Pinned: [],
    Applied: [],
    Interviewing: [],
    Offers: [],
    Rejected: [],
  });

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      try {
        setTrackerData(JSON.parse(saved));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Header box (center column, top)
  const HeaderBox = (
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
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Your Job Seeker Dashboard
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Track your pipeline, keep an eye on pinned roles, and quickly jump back into your
        resume or applications.
      </p>
    </section>
  );

  // Right rail content (Shortcuts only)
  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="dashboard" />
    </div>
  );

  return (
    <SeekerLayout
      title="Seeker Dashboard | ForgeTomorrow"
      header={HeaderBox}
      right={RightRail}
      activeNav="dashboard"
    >
      {/* CENTER COLUMN CONTENT */}
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Summary Counts */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <ResumeTrackerSummary trackerData={trackerData} />
        </section>

        {/* Snapshot — compact single-row */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 12,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <h2 style={{ color: '#FF7043', margin: 0, fontSize: '1.05rem', lineHeight: 1.2 }}>
              Job Search Snapshot
            </h2>
          </div>
          <CompactSnapshot trackerData={trackerData} />
        </section>

        {/* Pinned Jobs */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #eee',
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

        {/* Resume / Application Tracker — read-only board preview */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <ApplicationsBoard
            stagesData={trackerData}
            compact
            columns={5}
            title="Resume / Application Tracker"
            actions={
              <Link href="/seeker/applications" style={{ color: '#FF7043', fontWeight: 600 }}>
                View all
              </Link>
            }
            // no handlers: renders read-only preview here
          />
        </section>
      </div>
    </SeekerLayout>
  );
}
