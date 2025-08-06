// pages/seeker-dashboard.js
import React from 'react';
import ProfileMetrics from '../components/ProfileMetrics';
import JobApplicationTracker from '../components/JobApplicationTracker';
import SeekerSidebar from '../components/SeekerSidebar'; // ✅ import new sidebar

export default function SeekerDashboard() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '20px',
        padding: '120px 20px 20px', // space below header
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
        <ProfileMetrics showTopContent showLastProfileViewer />
        <JobApplicationTracker />
      </main>
    </div>
  );
}
