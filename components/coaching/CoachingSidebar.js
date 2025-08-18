// components/coaching/CoachingSidebar.js
import React from 'react';
import Link from 'next/link';

export default function CoachingSidebar({ active = 'overview' }) {
  const navItems = [
    { header: 'Job Seeker', label: 'Your Seeker Dashboard', href: '/seeker-dashboard' },
    { header: 'Coaching Overview', label: 'Overview', href: '/coaching-dashboard', key: 'overview' },
    { header: 'Clients', label: 'Clients', href: '/dashboard/coaching/clients', key: 'clients' },
    { header: 'Sessions', label: 'Sessions', href: '/dashboard/coaching/sessions', key: 'sessions' },
    { header: 'Resources', label: 'Resources', href: '/dashboard/coaching/resources', key: 'resources' },
    { header: 'Feedback', label: 'Feedback', href: '/dashboard/coaching/feedback', key: 'feedback' },
    { header: 'Applications', label: 'Applications Tracker', href: '/applications' },
	{ header: 'Jobs', label: 'To The Pipeline', href: '/dashboard/coaching/jobs' },
    { header: 'Resume Builder', label: 'Resume Builder', href: '/resume/create' },
  ];

  return (
    <div
      style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '300px',
      }}
    >
      {navItems.map((item, idx) => {
        const isActive = active === item.key;
        return (
          <div key={idx}>
            {/* Orange section header */}
            <div
              style={{
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#FF7043',
              }}
            >
              {item.header}
            </div>

            {/* Gradient pill button with darker brand outline if active */}
            <Link
              href={item.href}
              style={{
                display: 'block',
                background: 'linear-gradient(135deg, #FF6F43, #FF8E53)',
                padding: '10px 14px',
                borderRadius: '30px',
                fontWeight: 'bold',
                color: '#fff',
                textAlign: 'center',
                textDecoration: 'none',
                boxShadow: '0 3px 6px rgba(255,112,67,0.4)',
                border: isActive ? '2px solid #37474F' : '2px solid transparent', // Dark slate header color
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,112,67,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 3px 6px rgba(255,112,67,0.4)';
              }}
            >
              {item.label}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
