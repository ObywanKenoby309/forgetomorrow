// components/ads/RightRailPlacementManager.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { resolveSurfaceId, getDefaultRailSlotsForSurface } from '@/lib/ads/surfaceMap';

// ✅ Profile/Dashboard-standard glass
const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const HOUSE_AD_COPY = {
  en: {
    seeker: {
      eyebrow: 'Advertise with ForgeTomorrow',
      headline: 'Reach the people building what’s next.',
      email: 'sales@forgetomorrow.com',
    },
    coaching: {
      eyebrow: 'Advertise with ForgeTomorrow',
      headline: 'Put your brand beside growth in motion.',
      email: 'sales@forgetomorrow.com',
    },
    recruiter: {
      eyebrow: 'Advertise with ForgeTomorrow',
      headline: 'Reach decision-makers with intent.',
      email: 'sales@forgetomorrow.com',
    },
  },
  es: {
    seeker: {
      eyebrow: 'Anúnciate con ForgeTomorrow',
      headline: 'Llega a las personas que están construyendo lo que sigue.',
      email: 'sales@forgetomorrow.com',
    },
    coaching: {
      eyebrow: 'Anúnciate con ForgeTomorrow',
      headline: 'Coloca tu marca junto al crecimiento en movimiento.',
      email: 'sales@forgetomorrow.com',
    },
    recruiter: {
      eyebrow: 'Anúnciate con ForgeTomorrow',
      headline: 'Llega a quienes toman decisiones con intención.',
      email: 'sales@forgetomorrow.com',
    },
  },
  fr: {
    seeker: {
      eyebrow: 'Annoncez avec ForgeTomorrow',
      headline: 'Touchez ceux qui construisent ce qui vient ensuite.',
      email: 'sales@forgetomorrow.com',
    },
    coaching: {
      eyebrow: 'Annoncez avec ForgeTomorrow',
      headline: 'Placez votre marque aux côtés d’une croissance en mouvement.',
      email: 'sales@forgetomorrow.com',
    },
    recruiter: {
      eyebrow: 'Annoncez avec ForgeTomorrow',
      headline: 'Touchez les décideurs avec intention.',
      email: 'sales@forgetomorrow.com',
    },
  },
  de: {
    seeker: {
      eyebrow: 'Werben Sie mit ForgeTomorrow',
      headline: 'Erreichen Sie die Menschen, die das Morgen gestalten.',
      email: 'sales@forgetomorrow.com',
    },
    coaching: {
      eyebrow: 'Werben Sie mit ForgeTomorrow',
      headline: 'Platzieren Sie Ihre Marke neben Wachstum in Bewegung.',
      email: 'sales@forgetomorrow.com',
    },
    recruiter: {
      eyebrow: 'Werben Sie mit ForgeTomorrow',
      headline: 'Erreichen Sie Entscheidungsträger mit klarer Absicht.',
      email: 'sales@forgetomorrow.com',
    },
  },
};

const HOUSE_AD_IMAGES = {
  seeker: '/ads/house/seeker-house-ad.webp',
  coaching: '/ads/house/coaching-house-ad.webp',
  recruiter: '/ads/house/recruiter-house-ad.webp',
};

function Card({ title, children }) {
  return (
    <section
      style={{
        ...GLASS,
        borderRadius: 12,
        padding: 12,
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      {title ? (
        <h3
          style={{
            margin: 0,
            marginBottom: 8,
            fontWeight: 800,
            color: '#263238',
          }}
        >
          {title}
        </h3>
      ) : null}
      <div>{children}</div>
    </section>
  );
}

function getChromeFromRouter(router) {
  try {
    const raw = String(router?.query?.chrome || '').toLowerCase();
    if (raw === 'coach') return 'coach';
    if (raw === 'recruiter-smb') return 'recruiter-smb';
    if (raw === 'recruiter-ent') return 'recruiter-ent';
    return 'seeker';
  } catch {
    return 'seeker';
  }
}

function getHouseAdVariant(chromeMode) {
  if (chromeMode === 'coach') return 'coaching';
  if (chromeMode === 'recruiter-smb' || chromeMode === 'recruiter-ent') return 'recruiter';
  return 'seeker';
}

function getLanguageKey() {
  if (typeof navigator === 'undefined') return 'en';

  const raw = String(navigator.language || 'en').toLowerCase();

  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('de')) return 'de';
  return 'en';
}

function HouseAdCard({ variant }) {
  const [languageKey, setLanguageKey] = useState('en');

  useEffect(() => {
    setLanguageKey(getLanguageKey());
  }, []);

  const copySet = HOUSE_AD_COPY[languageKey] || HOUSE_AD_COPY.en;
  const copy = copySet[variant] || HOUSE_AD_COPY.en[variant] || HOUSE_AD_COPY.en.seeker;
  const backgroundImage = HOUSE_AD_IMAGES[variant] || HOUSE_AD_IMAGES.seeker;

  return (
    <section
      aria-label="Advertise with ForgeTomorrow"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 18,
        minHeight: 420,
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 16px 34px rgba(0,0,0,0.24)',
        backgroundColor: '#0f1720',
        backgroundImage: `linear-gradient(180deg, rgba(7,11,19,0.10) 0%, rgba(7,11,19,0.42) 38%, rgba(7,11,19,0.82) 100%), linear-gradient(90deg, rgba(7,11,19,0.68) 0%, rgba(7,11,19,0.34) 45%, rgba(7,11,19,0.12) 100%), url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at top left, rgba(255,112,67,0.20), transparent 34%), radial-gradient(circle at bottom right, rgba(255,255,255,0.08), transparent 28%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 420,
          padding: '18px 18px 16px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-block',
              marginBottom: 14,
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.20)',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.92)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {copy.eyebrow}
          </div>

          <div
            style={{
              maxWidth: 240,
              color: '#ffffff',
              fontSize: 34,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              textShadow: '0 4px 18px rgba(0,0,0,0.34)',
            }}
          >
            {copy.headline}
          </div>
        </div>

        <div>
          <div
            style={{
              width: 64,
              height: 3,
              borderRadius: 999,
              marginBottom: 14,
              background: 'linear-gradient(90deg, #FF7043 0%, rgba(255,112,67,0.18) 100%)',
              boxShadow: '0 0 14px rgba(255,112,67,0.26)',
            }}
          />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(8,12,20,0.55)',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.2,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 8px 18px rgba(0,0,0,0.22)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                color: '#FF7043',
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16v12H4z" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </span>
            <span>{copy.email}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

async function fetchPlacements({ surfaceId, slot, chromeMode, signal }) {
  const params = new URLSearchParams({
    surfaceId: String(surfaceId || ''),
    slot: String(slot || ''),
    chrome: String(chromeMode || ''),
  });

  const res = await fetch(`/api/ads/placements?${params.toString()}`, {
    method: 'GET',
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

/**
 * RightRailPlacementManager
 * - Resolves surfaceId (unless provided)
 * - Requests DB-backed placements from API (currently returns empty)
 * - Renders placements as right-rail cards
 *
 * Note: This is PRE-ADS plumbing. When ads are ready, the API will return placements.
 */
export default function RightRailPlacementManager({
  surfaceId: surfaceIdProp,
  slot = 'right_rail_1',
  allowUnknownSurface = false,
}) {
  const router = useRouter();
  const chromeMode = useMemo(() => getChromeFromRouter(router), [router]);

  const resolvedSurfaceId = useMemo(() => {
    if (surfaceIdProp) return String(surfaceIdProp);
    return resolveSurfaceId(router?.asPath || router?.pathname || '/');
  }, [surfaceIdProp, router?.asPath, router?.pathname]);

  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  const shouldRender = useMemo(() => {
    if (allowUnknownSurface) return true;
    return resolvedSurfaceId && resolvedSurfaceId !== 'unknown';
  }, [allowUnknownSurface, resolvedSurfaceId]);

  useEffect(() => {
    if (!shouldRender) {
      setPlacements([]);
      setLoading(false);
      return;
    }

    const allowedSlots = getDefaultRailSlotsForSurface(resolvedSurfaceId);
    if (!allowedSlots.includes(slot)) {
      setPlacements([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetchPlacements({
      surfaceId: resolvedSurfaceId,
      slot,
      chromeMode,
      signal: controller.signal,
    })
      .then((rows) => {
        setPlacements(rows);
        setLoading(false);
      })
      .catch(() => {
        setPlacements([]);
        setLoading(false);
      });

    return () => controller.abort();
  }, [resolvedSurfaceId, slot, chromeMode, shouldRender]);

  if (!shouldRender) return null;

  if (loading) {
    return (
      <div className="grid gap-3">
        <Card title="Loading">
          <p className="text-sm text-gray-600">Preparing placements…</p>
        </Card>
      </div>
    );
  }

  if (!placements || placements.length === 0) {
    return (
      <div className="grid gap-3">
        <HouseAdCard variant={getHouseAdVariant(chromeMode)} />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {placements.map((p) => {
        const key = String(p?.id || p?.key || `${p?.type || 'placement'}-${Math.random()}`);
        const title = p?.title || (p?.type ? String(p.type).replace(/_/g, ' ') : 'Sponsored');

        return (
          <Card key={key} title={title}>
            {p?.body ? (
  <div className="text-sm text-gray-700">{p.body}</div>
) : null}
          </Card>
        );
      })}
    </div>
  );
}