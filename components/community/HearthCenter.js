import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/router';

export default function HearthCenter() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const tiles = [
    {
      title: 'Mentorship Programs',
      desc: 'Connect with experienced mentors to guide your career journey.',
      href: '/hearth/spotlights',
      status: 'New!',
    },
    {
      title: 'Community Events',
      desc: 'Join workshops, webinars, and networking events tailored for growth.',
      href: '/seeker/the-hearth/events',
      status: 'Coming Soon',
    },
    {
      title: 'Discussion Forums',
      desc: 'Engage in meaningful conversations and share knowledge.',
      href: '/seeker/the-hearth/forums',
      status: 'Coming Soon',
    },
    {
      title: 'Resource Library',
      desc: 'Access articles, guides, and tools to support your professional growth.',
      href: '/seeker/the-hearth/resources',
      status: 'New!',
    },
  ];

  // ✅ Matches Seeker Dashboard glass baseline
  const GLASS = {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.58)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  return (
    <section
      style={{
        ...GLASS,
        padding: 16,
        boxSizing: 'border-box',
        width: '100%',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          minWidth: 0,
        }}
      >
        {tiles.map(({ title, desc, href, status }) => (
          <Link
            key={title}
            href={withChrome(href)}
            style={{
              background: 'white',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              textDecoration: 'none',
              transition: 'box-shadow 160ms ease, transform 80ms ease',
              display: 'block',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 18px rgba(0,0,0,0.12)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
                color: '#FF7043',
              }}
            >
              {title}
            </h2>
            <p style={{ color: '#37474F', marginBottom: 8 }}>{desc}</p>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#FF7043',
              }}
            >
              {status}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}