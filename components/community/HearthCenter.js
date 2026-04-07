// components/community/HearthCenter.js
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
    id: 'mentorship',
    title: 'Mentorship Programs',
    desc: 'Connect with experienced mentors to guide your career journey.',
    status: 'New!',
    img: '/icons/mentorship.png',
  },
  {
    id: 'events',
    title: 'Community Events',
    desc: 'Join workshops, webinars, and networking events tailored for growth.',
    status: 'Coming Soon',
    img: '/icons/events.png',
  },
  {
    id: 'forums',
    title: 'Discussion Forums',
    desc: 'Engage in meaningful conversations and share knowledge.',
    status: 'Coming Soon',
    img: '/icons/forums.png',
  },
  {
    id: 'resources',
    title: 'Resource Library',
    desc: 'Access articles, guides, and tools to support your professional growth.',
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

const ORANGE_HEADING_LIFT = {
  color: '#FF7043',
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

// ─── Desktop 2×2 grid ────────────────────────────────────────────────────────
function DesktopGrid({ tiles, activeModule, setActiveModule }) {
  return (
    <>
      <div
        className="hearth-desktop-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        {tiles.map((tile) => (
          <DesktopCard
            key={tile.id}
            tile={tile}
            isActive={activeModule === tile.id}
            onOpen={setActiveModule}
          />
        ))}
      </div>

      <style jsx>{`
        .hearth-desktop-grid {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 112, 67, 0.45) transparent;
        }

        .hearth-desktop-grid::-webkit-scrollbar {
          width: 5px;
        }

        .hearth-desktop-grid::-webkit-scrollbar-track {
          background: transparent;
        }

        .hearth-desktop-grid::-webkit-scrollbar-thumb {
          background: rgba(255, 112, 67, 0);
          border-radius: 999px;
          transition: background 300ms ease;
        }

        .hearth-desktop-grid:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 112, 67, 0.4);
        }

        .hearth-desktop-grid::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 112, 67, 0.65);
        }
      `}</style>
    </>
  );
}

function DesktopCard({ tile, isActive, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(tile.id)}
      style={{
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 14,
        padding: 18,
        border: isActive
          ? '1px solid rgba(255,112,67,0.28)'
          : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isActive
          ? '0 18px 34px rgba(0,0,0,0.14), 0 0 0 6px rgba(255,112,67,0.12)'
          : '0 10px 22px rgba(0,0,0,0.10)',
        textDecoration: 'none',
        transition: 'box-shadow 180ms ease, transform 120ms ease, border-color 180ms ease',
        display: 'block',
        minHeight: 132,
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255,112,67,0.28)';
        e.currentTarget.style.boxShadow =
          '0 18px 34px rgba(0,0,0,0.14), 0 0 0 6px rgba(255,112,67,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = isActive
          ? 'rgba(255,112,67,0.28)'
          : 'rgba(0,0,0,0.06)';
        e.currentTarget.style.boxShadow = isActive
          ? '0 18px 34px rgba(0,0,0,0.14), 0 0 0 6px rgba(255,112,67,0.12)'
          : '0 10px 22px rgba(0,0,0,0.10)';
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
          <HearthIcon src={tile.img} alt={tile.title} size={64} />
        </div>
        <h2 style={{ fontSize: 18, margin: 0, lineHeight: 1.1, ...ORANGE_HEADING_LIFT }}>
          {tile.title}
        </h2>
      </div>
      <p style={{ color: '#37474F', margin: 0, lineHeight: 1.45 }}>{tile.desc}</p>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          {tile.status}
        </span>

        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#FF7043',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Open →
        </span>
      </div>
    </button>
  );
}

// ─── Mobile: Dropdown + Carousel ────────────────────────────────────────────
function MobileLayoutInner({ tiles, activeModule, setActiveModule }) {
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
    setTimeout(() => {
      programmatic.current = false;
    }, 600);
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

  const [showScrollHint, setShowScrollHint] = useState(false);
  const hintTimer = useRef(null);

  const handleCardSelect = (tile) => {
    const next = tile.id === activeModule ? null : tile.id;
    setActiveModule(next);
    if (next) {
      setShowScrollHint(true);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setShowScrollHint(false), 3000);
    }
  };

  useEffect(() => () => clearTimeout(hintTimer.current), []);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ padding: '0 16px 14px', position: 'relative', zIndex: 20 }}>
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
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HearthIcon src={active.img} alt={active.title} size={28} />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#FF7043' }}>
              {active.title}
            </span>
          </div>
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

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% - 14px + 6px)',
              left: 16,
              right: 16,
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
                key={tile.id}
                onClick={() => goTo(i)}
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
                <HearthIcon src={tile.img} alt={tile.title} size={34} />
                <div style={{ flex: 1 }}>
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
                    {activeModule === tile.id ? 'Loaded below' : 'Load below'}
                  </div>
                </div>
                {i === activeIndex && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
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

      <div
        ref={trackRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tiles.map((tile) => (
          <div
            key={tile.id}
            style={{
              flexShrink: 0,
              width: '100%',
              scrollSnapAlign: 'start',
              padding: '0 16px',
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              onClick={() => handleCardSelect(tile)}
              style={{
                display: 'block',
                width: '100%',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 16,
                padding: '22px 20px 20px',
                border:
                  activeModule === tile.id
                    ? '1.5px solid rgba(255,112,67,0.40)'
                    : '1.5px solid rgba(255,112,67,0.15)',
                boxShadow:
                  activeModule === tile.id
                    ? '0 12px 28px rgba(0,0,0,0.12), 0 0 0 3px rgba(255,112,67,0.12)'
                    : '0 12px 28px rgba(0,0,0,0.10)',
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 210,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ flexShrink: 0, lineHeight: 0 }}>
                  <HearthIcon src={tile.img} alt={tile.title} size={64} />
                </div>
                <h2 style={{ fontSize: 22, margin: 0, lineHeight: 1.1, ...ORANGE_HEADING_LIFT }}>
                  {tile.title}
                </h2>
              </div>
              <p
                style={{
                  color: '#37474F',
                  margin: '0 0 18px',
                  lineHeight: 1.55,
                  fontSize: 15,
                }}
              >
                {tile.desc}
              </p>
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
                  {tile.status}
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
                  {activeModule === tile.id ? 'Selected' : 'Open'}
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
            </button>
          </div>
        ))}
      </div>

      {showScrollHint && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 16px',
            marginTop: 4,
            animation: 'fadeInOut 3s ease forwards',
          }}
        >
          <style>{`
            @keyframes fadeInOut {
              0%   { opacity: 0; transform: translateY(-4px); }
              15%  { opacity: 1; transform: translateY(0); }
              70%  { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ animation: 'bounce 1s ease infinite' }}
          >
            <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }`}</style>
            <path
              d="M8 3v10M8 13l-3-3M8 13l3-3"
              stroke="#FF7043"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#FF7043' }}>
            Scroll down to see your selection
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
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
export default function HearthCenter({ activeModule, setActiveModule }) {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section
      style={{
        ...GLASS,
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: isMobile ? 0 : 16,
        paddingRight: isMobile ? 0 : 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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

      {isMobile ? (
        <MobileLayoutInner
          tiles={TILES}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
        />
      ) : (
        <DesktopGrid
          tiles={TILES}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
        />
      )}
    </section>
  );
}