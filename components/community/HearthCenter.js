// components/community/HearthCenter.js
import Link from 'next/link';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

function HearthIcon({ src, alt, size = 64 }) {
  const sizeStyle = typeof size === 'number' ? `${size}px` : size;
  return (
    <img
      src={src}
      alt={alt}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      style={{
        display: 'block',
        width: sizeStyle,
        height: sizeStyle,
        objectFit: 'contain',
        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.18))',
      }}
      loading="lazy"
      decoding="async"
    />
  );
}

const TILES = [
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

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

// ─── Desktop 2×2 grid (unchanged) ───────────────────────────────────────────
function DesktopGrid({ tiles, withChrome }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 16,
      }}
    >
      {tiles.map(({ title, desc, href, status, img }) => (
        <DesktopCard
          key={title}
          title={title}
          desc={desc}
          href={withChrome(href)}
          status={status}
          img={img}
        />
      ))}
    </div>
  );
}

function DesktopCard({ title, desc, href, status, img }) {
  return (
    <Link
      href={href}
      style={{
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 14,
        padding: 18,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 10px 22px rgba(0,0,0,0.10)',
        textDecoration: 'none',
        transition: 'box-shadow 180ms ease, transform 120ms ease, border-color 180ms ease',
        display: 'block',
        minHeight: 132,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ flexShrink: 0, lineHeight: 0 }}>
          <HearthIcon src={img} alt={title} size={64} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FF7043', lineHeight: 1.1 }}>
          {title}
        </h2>
      </div>
      <p style={{ color: '#37474F', margin: 0, lineHeight: 1.45 }}>{desc}</p>
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
  );
}

// ─── Mobile: Dropdown + Carousel ────────────────────────────────────────────
function MobileLayout({ tiles, withChrome }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const carouselRef = useRef(null);
  const isScrolling = useRef(false);

  // Dropdown → Carousel
  const selectTile = useCallback((index) => {
    setActiveIndex(index);
    setDropdownOpen(false);
    const carousel = carouselRef.current;
    if (!carousel) return;
    const cardWidth = carousel.offsetWidth;
    isScrolling.current = true;
    carousel.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    setTimeout(() => { isScrolling.current = false; }, 500);
  }, []);

  // Carousel swipe → Dropdown
  const handleScroll = useCallback(() => {
    if (isScrolling.current) return;
    const carousel = carouselRef.current;
    if (!carousel) return;
    const cardWidth = carousel.offsetWidth;
    const index = Math.round(carousel.scrollLeft / cardWidth);
    if (index !== activeIndex) setActiveIndex(index);
  }, [activeIndex]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.addEventListener('scroll', handleScroll, { passive: true });
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const active = tiles[activeIndex];

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Dropdown ── */}
      <div style={{ marginBottom: 14, position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.95)',
            border: '1.5px solid rgba(255,112,67,0.30)',
            borderRadius: 12,
            padding: '13px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HearthIcon src={active.img} alt={active.title} size={32} />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#FF7043' }}>
              {active.title}
            </span>
          </div>
          {/* Chevron */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{
              flexShrink: 0,
              transition: 'transform 200ms ease',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="#FF7043"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'rgba(255,255,255,0.98)',
              border: '1.5px solid rgba(255,112,67,0.20)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {tiles.map((tile, i) => (
              <button
                key={tile.title}
                onClick={() => selectTile(i)}
                style={{
                  width: '100%',
                  background: i === activeIndex ? 'rgba(255,112,67,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom:
                    i < tiles.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  padding: '13px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <HearthIcon src={tile.img} alt={tile.title} size={36} />
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: i === activeIndex ? '#FF7043' : '#37474F',
                      lineHeight: 1.2,
                    }}
                  >
                    {tile.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>
                    {tile.status}
                  </div>
                </div>
                {i === activeIndex && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    style={{ marginLeft: 'auto', flexShrink: 0 }}
                  >
                    <path
                      d="M4 9L7.5 12.5L14 6"
                      stroke="#FF7043"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Carousel ── */}
      <div
        ref={carouselRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'auto', // JS handles smooth
          gap: 0,
          // hide scrollbar
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        <style>{`
          .hearth-carousel::-webkit-scrollbar { display: none; }
        `}</style>
        <div
          className="hearth-carousel"
          ref={carouselRef}
          style={{ display: 'contents' }}
        />
        {tiles.map(({ title, desc, href, status, img }, i) => (
          <div
            key={title}
            style={{
              flexShrink: 0,
              width: '100%',
              scrollSnapAlign: 'start',
              paddingRight: i < tiles.length - 1 ? 0 : 0,
            }}
          >
            <Link
              href={withChrome(href)}
              style={{
                display: 'block',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 16,
                padding: '22px 20px 20px',
                border: '1.5px solid rgba(255,112,67,0.15)',
                boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 200,
              }}
            >
              {/* Corner glow */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: -70,
                  top: -70,
                  width: 200,
                  height: 200,
                  background:
                    'radial-gradient(circle, rgba(255,112,67,0.18), rgba(255,112,67,0.00) 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Icon + Title row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ flexShrink: 0, lineHeight: 0 }}>
                  <HearthIcon src={img} alt={title} size={64} />
                </div>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    margin: 0,
                    color: '#FF7043',
                    lineHeight: 1.1,
                  }}
                >
                  {title}
                </h2>
              </div>

              {/* Description */}
              <p
                style={{
                  color: '#37474F',
                  margin: '0 0 16px',
                  lineHeight: 1.55,
                  fontSize: 15,
                }}
              >
                {desc}
              </p>

              {/* Footer row: status + CTA */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#FF7043',
                    background: 'rgba(255,112,67,0.10)',
                    border: '1px solid rgba(255,112,67,0.20)',
                    padding: '5px 10px',
                    borderRadius: 999,
                  }}
                >
                  {status}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FF7043',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Explore
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8H13M13 8L9 4M13 8L9 12"
                      stroke="#FF7043"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* ── Dot indicators ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginTop: 12,
        }}
      >
        {tiles.map((_, i) => (
          <button
            key={i}
            onClick={() => selectTile(i)}
            aria-label={`Go to ${tiles[i].title}`}
            style={{
              width: i === activeIndex ? 24 : 8,
              height: 8,
              borderRadius: 999,
              background: i === activeIndex ? '#FF7043' : 'rgba(255,112,67,0.25)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'width 220ms ease, background 220ms ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Root component ──────────────────────────────────────────────────────────
export default function HearthCenter() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // Simple SSR-safe mobile detection via CSS — we render both and hide one
  return (
    <section
      className="hearth-section"
      style={{
        ...GLASS,
        padding: 16,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -120,
          background:
            'radial-gradient(circle at 35% 30%, rgba(255,112,67,0.20), rgba(255,112,67,0.00) 55%)',
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />

      <style>{`
        .hearth-desktop { display: grid; }
        .hearth-mobile  { display: none;  }
        @media (max-width: 639px) {
          .hearth-desktop { display: none; }
          .hearth-mobile  { display: block; }
          .hearth-section { padding-left: 0 !important; padding-right: 0 !important; }
        }
        /* hide scrollbar on carousel wrapper */
        .hearth-scroll-track {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hearth-scroll-track::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Desktop */}
      <div className="hearth-desktop" style={{ position: 'relative', gap: 16 }}>
        <DesktopGrid tiles={TILES} withChrome={withChrome} />
      </div>

      {/* Mobile */}
      <div className="hearth-mobile" style={{ position: 'relative' }}>
        <MobileLayoutInner tiles={TILES} withChrome={withChrome} />
      </div>
    </section>
  );
}

// Wraps MobileLayout and wires the scroll track ref properly
function MobileLayoutInner({ tiles, withChrome }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trackRef = useRef(null);
  const programmatic = useRef(false);

  const goTo = useCallback((index) => {
    setActiveIndex(index);
    setDropdownOpen(false);
    const track = trackRef.current;
    if (!track) return;
    programmatic.current = true;
    track.scrollTo({ left: index * track.offsetWidth, behavior: 'smooth' });
    setTimeout(() => { programmatic.current = false; }, 600);
  }, []);

  const handleScroll = useCallback(() => {
    if (programmatic.current) return;
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.offsetWidth);
    if (index >= 0 && index < tiles.length) setActiveIndex(index);
  }, [tiles.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => track.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const active = tiles[activeIndex];

  return (
    <div style={{ position: 'relative' }}>
      {/* Dropdown trigger */}
      <div style={{ marginBottom: 14, position: 'relative', zIndex: 20, padding: '0 16px' }}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.95)',
            border: '1.5px solid rgba(255,112,67,0.35)',
            borderRadius: 12,
            padding: '13px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HearthIcon src={active.img} alt={active.title} size={28} />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#FF7043' }}>
              {active.title}
            </span>
          </div>
          <svg
            width="20" height="20" viewBox="0 0 20 20" fill="none"
            style={{
              flexShrink: 0,
              transition: 'transform 200ms ease',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <path d="M5 7.5L10 12.5L15 7.5" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0, right: 0,
              background: 'rgba(255,255,255,0.98)',
              border: '1.5px solid rgba(255,112,67,0.20)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 20px 48px rgba(0,0,0,0.16)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            {tiles.map((tile, i) => (
              <button
                key={tile.title}
                onClick={() => goTo(i)}
                style={{
                  width: '100%',
                  background: i === activeIndex ? 'rgba(255,112,67,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: i < tiles.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  padding: '13px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <HearthIcon src={tile.img} alt={tile.title} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: i === activeIndex ? '#FF7043' : '#37474F', lineHeight: 1.2 }}>
                    {tile.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>{tile.status}</div>
                </div>
                {i === activeIndex && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M4 9L7.5 12.5L14 6" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Carousel track — full bleed, mobile wrapper owns the edge-to-edge */}
      <div ref={trackRef} className="hearth-scroll-track">
        {tiles.map(({ title, desc, href, status, img }, i) => (
          <div
            key={title}
            style={{ flexShrink: 0, width: '100%', scrollSnapAlign: 'start', padding: '0 16px', boxSizing: 'border-box' }}
          >
            <Link
              href={withChrome(href)}
              style={{
                display: 'block',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 16,
                padding: '22px 20px 20px',
                border: '1.5px solid rgba(255,112,67,0.15)',
                boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 210,
              }}
            >
              <div aria-hidden="true" style={{
                position: 'absolute', right: -70, top: -70,
                width: 200, height: 200,
                background: 'radial-gradient(circle, rgba(255,112,67,0.18), rgba(255,112,67,0.00) 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ flexShrink: 0, lineHeight: 0 }}>
                  <HearthIcon src={img} alt={title} size={64} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: '#FF7043', lineHeight: 1.1 }}>
                  {title}
                </h2>
              </div>

              <p style={{ color: '#37474F', margin: '0 0 18px', lineHeight: 1.55, fontSize: 15 }}>
                {desc}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 12, fontWeight: 800, color: '#FF7043',
                  background: 'rgba(255,112,67,0.10)',
                  border: '1px solid rgba(255,112,67,0.20)',
                  padding: '5px 10px', borderRadius: 999,
                }}>
                  {status}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FF7043', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Explore
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#FF7043" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, padding: '0 16px' }}>
        {tiles.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to ${tiles[i].title}`}
            style={{
              width: i === activeIndex ? 24 : 8,
              height: 8,
              borderRadius: 999,
              background: i === activeIndex ? '#FF7043' : 'rgba(255,112,67,0.25)',
              border: 'none', padding: 0, cursor: 'pointer',
              transition: 'width 220ms ease, background 220ms ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}