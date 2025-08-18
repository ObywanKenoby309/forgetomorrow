import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function RecruiterSidebar({ active = '' }) {
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard',    href: '/recruiter/dashboard',   key: 'dashboard' },
    { label: 'Candidates',   href: '/recruiter/candidates',  key: 'candidates' },
    { label: 'Job Postings', href: '/recruiter/job-postings', key: 'job-postings' },
    { label: 'Messaging',    href: '/recruiter/messaging',   key: 'messaging' },
  ];

  const activeStyle = { outline: '2px solid #37474F', outlineOffset: '2px' };

  const isActive = (item) =>
    (active && active === item.key) || router.pathname === item.href;

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
      }}
    >
      {navItems.map((item, idx) => (
        <div key={idx}>
          {/* orange header above button (matches Seeker/Coaching) */}
          <div
            style={{
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#FF7043',
            }}
          >
            {item.label}
          </div>

          {/* gradient pill button + metallic active outline */}
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
              transition: 'all 0.25s ease',
              ...(isActive(item) ? activeStyle : {}),
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
      ))}
    </div>
  );
}
