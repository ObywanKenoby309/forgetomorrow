import Link from 'next/link';
import { useState } from 'react';

export default function MentorDashboard() {
  // Placeholder states for mentees, calendar, services, feedback - expand as needed
  const [mentees, setMentees] = useState([]);
  // You can expand with real data or components later

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '350px 1fr',
        gap: '20px',
        padding: '20px',
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
        {/* Link to Seeker Dashboard */}
        <div>
          <h2 style={{ color: '#FF7043', marginBottom: '12px' }}>Navigate</h2>
          <Link href="/seeker-dashboard" passHref>
            <a
              style={{
                display: 'block',
                backgroundColor: '#FF7043',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                textDecoration: 'none',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
            >
              Go to Seeker Dashboard
            </a>
          </Link>
        </div>

        {/* Other Mentor Features */}
        <div>
          <h2 style={{ color: '#FF7043', marginBottom: '12px' }}>Mentees</h2>
          <p>You can track your mentees here. (Coming soon!)</p>
        </div>
        <div>
          <h2 style={{ color: '#FF7043', marginBottom: '12px' }}>Calendar</h2>
          <p>Manage your appointments and sessions. (Coming soon!)</p>
        </div>
        <div>
          <h2 style={{ color: '#FF7043', marginBottom: '12px' }}>Services & Portfolio</h2>
          <p>Create and showcase your coaching services. (Coming soon!)</p>
        </div>
        <div>
          <h2 style={{ color: '#FF7043', marginBottom: '12px' }}>Feedback & Reviews</h2>
          <p>Collect and view feedback from your mentees. (Coming soon!)</p>
        </div>
        <div>
          <h2 style={{ color: '#FF7043', marginBottom: '12px' }}>Newsletter</h2>
          <p>Create and send newsletters to your network. (Coming soon!)</p>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 0 8px rgba(0,0,0,0.1)',
          minHeight: '100vh',
        }}
      >
        <h1 style={{ color: '#FF7043' }}>Mentor Dashboard</h1>
        <p>Welcome! Use the sidebar to navigate your mentor tools and mentee management.</p>

        {/* Expand with real mentor dashboard components later */}
      </main>
    </div>
  );
}
