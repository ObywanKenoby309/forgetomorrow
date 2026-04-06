// components/ads/RightRailPlacementManager.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { resolveSurface, getDefaultRailSlotsForSurface } from '@/lib/ads/surfaceMap';

// ─── Constants ────────────────────────────────────────────────────────────────

const CAROUSEL_INTERVAL_MS = 5000; // 5 seconds — premium, not anxious

const HOUSE_AD_IMAGES = {
  seeker:    '/ads/house/seeker-house-ad.png',
  coaching:  '/ads/house/coaching-house-ad.png',
  recruiter: '/ads/house/recruiter-house-ad.png',
};

const CAROUSEL_ORDER = ['seeker', 'recruiter', 'coaching'];

const HOUSE_AD_COPY = {
  en: {
    seeker: {
      eyebrow: 'Advertise with ForgeTomorrow',
      headline: 'Reach the people building what\u2019s next.',
    },
    coaching: {
      eyebrow: 'Advertise with ForgeTomorrow',
      headline: 'Put your brand beside growth in motion.',
    },
    recruiter: {
      eyebrow: 'Advertise with ForgeTomorrow',
      headline: 'Reach decision\u2011makers with intent.',
    },
  },
  es: {
    seeker: {
      eyebrow: 'Anúnciate con ForgeTomorrow',
      headline: 'Llega a las personas que construyen el futuro.',
    },
    coaching: {
      eyebrow: 'Anúnciate con ForgeTomorrow',
      headline: 'Coloca tu marca junto al crecimiento en movimiento.',
    },
    recruiter: {
      eyebrow: 'Anúnciate con ForgeTomorrow',
      headline: 'Llega a quienes toman decisiones con intención.',
    },
  },
  fr: {
    seeker: {
      eyebrow: 'Annoncez avec ForgeTomorrow',
      headline: 'Touchez ceux qui construisent ce qui vient ensuite.',
    },
    coaching: {
      eyebrow: 'Annoncez avec ForgeTomorrow',
      headline: 'Placez votre marque aux côtés d\u2019une croissance en mouvement.',
    },
    recruiter: {
      eyebrow: 'Annoncez avec ForgeTomorrow',
      headline: 'Touchez les décideurs avec intention.',
    },
  },
  de: {
    seeker: {
      eyebrow: 'Werben Sie mit ForgeTomorrow',
      headline: 'Erreichen Sie die Menschen, die das Morgen gestalten.',
    },
    coaching: {
      eyebrow: 'Werben Sie mit ForgeTomorrow',
      headline: 'Platzieren Sie Ihre Marke neben Wachstum in Bewegung.',
    },
    recruiter: {
      eyebrow: 'Werben Sie mit ForgeTomorrow',
      headline: 'Erreichen Sie Entscheidungsträger mit klarer Absicht.',
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLanguageKey() {
  if (typeof navigator === 'undefined') return 'en';
  const raw = String(navigator.language || 'en').toLowerCase();
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('de')) return 'de';
  return 'en';
}

function getCopy(variant, languageKey) {
  const lang = HOUSE_AD_COPY[languageKey] || HOUSE_AD_COPY.en;
  return lang[variant] || HOUSE_AD_COPY.en[variant] || HOUSE_AD_COPY.en.seeker;
}

// ─── Shared ad card shell ─────────────────────────────────────────────────────

function AdShell({ variant, languageKey, children }) {
  const copy = getCopy(variant, languageKey);
  const bg   = HOUSE_AD_IMAGES[variant] || HOUSE_AD_IMAGES.seeker;

  return (
    <a
      href="/advertise"
      aria-label={`${copy.eyebrow} — ${copy.headline}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 18,
        minHeight: 380,
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
        backgroundColor: '#0a0f1a',
        backgroundImage: [
          'linear-gradient(180deg, rgba(7,11,19,0.08) 0%, rgba(7,11,19,0.50) 45%, rgba(7,11,19,0.88) 100%)',
          'linear-gradient(90deg, rgba(7,11,19,0.72) 0%, rgba(7,11,19,0.30) 50%, rgba(7,11,19,0.10) 100%)',
          `url("${bg}")`,
        ].join(', '),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        cursor: 'pointer',
      }}
    >
      {/* orange + white radial glow overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: [
            'radial-gradient(circle at top left, rgba(255,112,67,0.22), transparent 36%)',
            'radial-gradient(circle at bottom right, rgba(255,255,255,0.07), transparent 30%)',
          ].join(', '),
        }}
      />

      {/* content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 380,
          padding: '16px 16px 14px',
        }}
      >
        {/* top: eyebrow + headline */}
        <div>
          <div
            style={{
              display: 'inline-block',
              marginBottom: 12,
              padding: '5px 10px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.88)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {copy.eyebrow}
          </div>

          <div
            style={{
              maxWidth: 230,
              color: '#ffffff',
              fontSize: 28,
              lineHeight: 1.06,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              textShadow: '0 4px 20px rgba(0,0,0,0.40)',
            }}
          >
            {copy.headline}
          </div>
        </div>

        {/* bottom: divider + CTA + optional extra slot (carousel dots) */}
        <div>
          <div
            style={{
              width: 52,
              height: 3,
              borderRadius: 999,
              marginBottom: 12,
              background: 'linear-gradient(90deg, #FF7043 0%, rgba(255,112,67,0.15) 100%)',
              boxShadow: '0 0 12px rgba(255,112,67,0.30)',
            }}
          />

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 13px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(8,12,20,0.60)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.24)',
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="#FF7043"
              strokeWidth="2"
              style={{ flexShrink: 0 }}
            >
              <path d="M4 6h16v12H4z" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            <span>sales@forgetomorrow.com</span>
          </div>

          {/* slot for carousel dots or anything extra */}
          {children}
        </div>
      </div>
    </a>
  );
}

// ─── Single targeted ad ───────────────────────────────────────────────────────

function HouseAdCard({ segment }) {
  const [languageKey, setLanguageKey] = useState('en');

  useEffect(() => {
    setLanguageKey(getLanguageKey());
  }, []);

  // coaching segment maps to 'coaching' variant; recruiter → 'recruiter'; everything else → 'seeker'
  const variant =
    segment === 'coaching'  ? 'coaching'  :
    segment === 'recruiter' ? 'recruiter' :
    'seeker';

  return <AdShell variant={variant} languageKey={languageKey} />;
}

// ─── Community carousel (all 3 rotate, no user controls) ─────────────────────

function HouseAdCarousel() {
  const [languageKey, setLanguageKey] = useState('en');
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setLanguageKey(getLanguageKey());
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      // fade out → swap → fade in
      setFading(true);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % CAROUSEL_ORDER.length);
        setFading(false);
      }, 300);
    }, CAROUSEL_INTERVAL_MS);

    return () => clearInterval(timerRef.current);
  }, []);

  const variant = CAROUSEL_ORDER[activeIndex];

  return (
    <div
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      <AdShell variant={variant} languageKey={languageKey}>
        {/* position indicator dots — decorative only, no interaction */}
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            gap: 5,
            marginTop: 10,
          }}
        >
          {CAROUSEL_ORDER.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIndex ? 18 : 6,
                height: 4,
                borderRadius: 999,
                background:
                  i === activeIndex
                    ? '#FF7043'
                    : 'rgba(255,255,255,0.28)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
      </AdShell>
    </div>
  );
}

// ─── Placement fetch ──────────────────────────────────────────────────────────

async function fetchPlacements({ surfaceId, slot, segment, signal }) {
  const params = new URLSearchParams({
    surfaceId: String(surfaceId || ''),
    slot:      String(slot      || ''),
    segment:   String(segment   || ''),
  });

  const res = await fetch(`/api/ads/placements?${params.toString()}`, {
    method:  'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`placements_fetch_failed:${res.status}:${txt}`);
  }

  const data = await res.json();
  return Array.isArray(data?.placements) ? data.placements : [];
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * RightRailPlacementManager
 *
 * Resolves page intent via surfaceMap → picks the correct house ad variant.
 * When the DB returns real placements, they render instead of house ads.
 *
 * Pages with segment 'none' render nothing at all.
 * Community surfaces get the auto-advancing carousel.
 * All other surfaces get a single targeted house ad.
 */
export default function RightRailPlacementManager({
  surfaceId: surfaceIdProp,
  slot = 'right_rail_1',
  allowUnknownSurface = false,
}) {
  const router = useRouter();

  const surface = useMemo(() => {
    const path = router?.asPath || router?.pathname || '/';
    if (surfaceIdProp) {
      // caller provided surfaceId directly — still resolve segment/carousel from map
      const resolved = resolveSurface(path);
      return { ...resolved, surfaceId: String(surfaceIdProp) };
    }
    return resolveSurface(path);
  }, [surfaceIdProp, router?.asPath, router?.pathname]);

  const { surfaceId, segment, carousel } = surface;

  const [placements, setPlacements] = useState([]);
  const [loading, setLoading]       = useState(true);

  const shouldRender = useMemo(() => {
    if (segment === 'none') return false;
    if (allowUnknownSurface) return true;
    return surfaceId && surfaceId !== 'unknown' && surfaceId !== 'no_ad';
  }, [segment, surfaceId, allowUnknownSurface]);

  useEffect(() => {
    if (!shouldRender) {
      setPlacements([]);
      setLoading(false);
      return;
    }

    const allowedSlots = getDefaultRailSlotsForSurface(surfaceId);
    if (!allowedSlots.includes(slot)) {
      setPlacements([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetchPlacements({ surfaceId, slot, segment, signal: controller.signal })
      .then((rows) => {
        setPlacements(rows);
        setLoading(false);
      })
      .catch(() => {
        setPlacements([]);
        setLoading(false);
      });

    return () => controller.abort();
  }, [surfaceId, slot, segment, shouldRender]);

  // ── Nothing to show ──
  if (!shouldRender) return null;

  // ── Silent load — no flash card ──
  if (loading) return null;

  // ── Real DB placements (future) ──
  if (placements && placements.length > 0) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {placements.map((p) => {
          const key   = String(p?.id || p?.key || `placement-${Math.random()}`);
          const title = p?.title || (p?.type ? String(p.type).replace(/_/g, ' ') : 'Sponsored');
          return (
            <section
              key={key}
              style={{
                borderRadius: 12,
                padding: 12,
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                boxSizing: 'border-box',
              }}
            >
              <h3 style={{ margin: 0, marginBottom: 8, fontWeight: 800, color: '#263238' }}>
                {title}
              </h3>
              {p?.body ? <div style={{ fontSize: 14, color: '#334155' }}>{p.body}</div> : null}
            </section>
          );
        })}
      </div>
    );
  }

  // ── House ads (current default) ──
  return carousel ? <HouseAdCarousel /> : <HouseAdCard segment={segment} />;
}
