// components/shared/hearth/HearthLandingContent.js
import Link from 'next/link';

export default function HearthLandingContent() {
  const tiles = [
    {
      title: 'Mentorship Programs',
      desc: 'Connect with experienced mentors to guide your journey.',
      href: '/hearth/spotlights',
    },
    { title: 'Community Events', desc: 'Workshops, webinars, and networking.', href: '/hearth/events' },
    { title: 'Discussion Forums', desc: 'Conversations and knowledge sharing.', href: '/hearth/forums' },
    { title: 'Resource Library', desc: 'Articles, guides, and tools.', href: '/hearth/resources' },
  ];

  // ✅ Seeker Dashboard glass baseline
  const GLASS = {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.58)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  // ✅ White card tile (clean, no black)
  const TILE = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(17,24,39,0.10)',
    borderRadius: 14,
    padding: 16,
    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
    textDecoration: 'none',
    display: 'block',
    minWidth: 0,
  };

  return (
    <section style={{ ...GLASS, padding: 16 }}>
      <h1
        style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 900,
          color: '#FF7043',
          textAlign: 'center',
        }}
      >
        The Hearth
      </h1>

      <p
        style={{
          margin: '8px auto 0',
          fontSize: 15,
          color: '#546E7A',
          maxWidth: 760,
          textAlign: 'center',
          fontWeight: 600,
        }}
      >
        Your place to build connections, find mentors, and grow your network with purpose.
      </p>

      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 12,
          maxWidth: 920,
          marginLeft: 'auto',
          marginRight: 'auto',
          minWidth: 0,
        }}
        className="sm:grid-cols-2"
      >
        {tiles.map(({ title, desc, href }) => (
          <Link
            key={title}
            href={href}
            style={TILE}
            className="focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
          >
            <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#FF7043',
                  lineHeight: 1.2,
                }}
              >
                {title}
              </h2>
              <p style={{ margin: 0, color: '#455A64', fontSize: 14, fontWeight: 600 }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}