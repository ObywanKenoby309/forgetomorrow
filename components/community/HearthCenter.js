// components/community/HearthCenter.js
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/router';

function HearthIcon({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      width={28}
      height={28}
      style={{
        display: 'block',
        width: 28,
        height: 28,
        objectFit: 'contain',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))',
      }}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function HearthCenter() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const GLASS = {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.58)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  const tiles = [
    {
      title: 'Mentorship Programs',
      desc: 'Connect with experienced mentors to guide your career journey.',
      href: '/hearth/spotlights',
      status: 'New!',
      img: '/icons/mentorship.png',
    },
    {
      title: 'Community Events',
      desc: 'Join workshops, webinars, and networking events tailored for growth.',
      href: '/seeker/the-hearth/events',
      status: 'Coming Soon',
      img: '/icons/events.png',
    },
    {
      title: 'Discussion Forums',
      desc: 'Engage in meaningful conversations and share knowledge.',
      href: '/seeker/the-hearth/forums',
      status: 'Coming Soon',
      img: '/icons/forums.png',
    },
    {
      title: 'Resource Library',
      desc: 'Access articles, guides, and tools to support your professional growth.',
      href: '/seeker/the-hearth/resources',
      status: 'New!',
      img: '/icons/resource_library.png',
    },
  ];

  return (
    <section
      style={{
        ...GLASS,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* subtle internal glow to make the whole module feel premium */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -120,
          background:
            'radial-gradient(circle at 35% 30%, rgba(255,112,67,0.20), rgba(255,112,67,0.00) 55%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        {tiles.map(({ title, desc, href, status, img }) => (
          <Link
            key={title}
            href={withChrome(href)}
            style={{
              background: 'rgba(255,255,255,0.92)',
              borderRadius: 14,
              padding: 18,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 10px 22px rgba(0,0,0,0.10)',
              textDecoration: 'none',
              transition:
                'box-shadow 180ms ease, transform 120ms ease, border-color 180ms ease',
              display: 'block',
              minHeight: 132,
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              // lift + glow (controlled)
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(255,112,67,0.28)';
              e.currentTarget.style.boxShadow =
                '0 18px 34px rgba(0,0,0,0.14), 0 0 0 6px rgba(255,112,67,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
              e.currentTarget.style.boxShadow = '0 10px 22px rgba(0,0,0,0.10)';
            }}
          >
            {/* corner glow */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: -60,
                top: -60,
                width: 160,
                height: 160,
                background:
                  'radial-gradient(circle, rgba(255,112,67,0.20), rgba(255,112,67,0.00) 70%)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(255,112,67,0.10)',
                  border: '1px solid rgba(255,112,67,0.22)',
                }}
              >
                <HearthIcon src={img} alt={title} />
              </div>

              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  margin: 0,
                  color: '#FF7043',
                  lineHeight: 1.1,
                }}
              >
                {title}
              </h2>
            </div>

            <p style={{ color: '#37474F', margin: 0, lineHeight: 1.45 }}>
              {desc}
            </p>

            <div style={{ marginTop: 12 }}>
  <span
    style={{
      fontSize: 12,
      fontWeight: 800,
      color: '#FF7043',
      background: 'rgba(255,112,67,0.10)',
      border: '1px solid rgba(255,112,67,0.20)',
      padding: '5px 10px',
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    }}
  >
    {status}
  </span>
</div>
          </Link>
        ))}
      </div>
    </section>
  );
}