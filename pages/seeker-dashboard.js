// pages/seeker-dashboard.js
import React from 'react';
import JobSearchSnapshot from '../components/JobSearchSnapshot'; // ✅ new component
import JobApplicationTracker from '../components/JobApplicationTracker';
import SeekerSidebar from '../components/SeekerSidebar';

export default function SeekerDashboard() {
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

      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <JobSearchSnapshot /> {/* ✅ New summary card at top */}

        {/* 🔜 PinnedJobs section will go here */}

        <JobApplicationTracker />
      </main>
    </div>
  );
}
