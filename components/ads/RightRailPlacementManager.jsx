// components/ads/RightRailPlacementManager.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { resolveSurfaceId, getDefaultRailSlotsForSurface } from '@/lib/ads/surfaceMap';

function Card({ title, children }) {
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 12,
        border: '1px solid #eee',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
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
    // Keep consistent with SeekerLayout allowed modes
    if (raw === 'coach') return 'coach';
    if (raw === 'recruiter-smb') return 'recruiter-smb';
    if (raw === 'recruiter-ent') return 'recruiter-ent';
    return 'seeker';
  } catch {
    return 'seeker';
  }
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
  // Optional: hard stop rendering on surfaces that shouldn't have rail yet
  allowUnknownSurface = false,
}) {
  const router = useRouter();
  const chromeMode = useMemo(() => getChromeFromRouter(router), [router]);

  const resolvedSurfaceId = useMemo(() => {
    if (surfaceIdProp) return String(surfaceIdProp);
    // router.asPath is stable enough for surface resolution
    return resolveSurfaceId(router?.asPath || router?.pathname || '/');
  }, [surfaceIdProp, router?.asPath, router?.pathname]);

  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Guard: If unknown surface and not allowed, show nothing.
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

    // Optional: if surface has no rail slots configured, render nothing.
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
        // Fail closed: show nothing + a lightweight placeholder (only while we have no ads)
        setPlacements([]);
        setLoading(false);
      });

    return () => controller.abort();
  }, [resolvedSurfaceId, slot, chromeMode, shouldRender]);

  // Pre-ads behavior: if no placements exist, show a single "reserved space" card.
  // This is intentional so marketing can truthfully say: "the system is live and ready."
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
        <Card title="Sponsored">
          <p className="text-sm text-gray-600">
            This space is reserved for contextual placements. Once campaigns are enabled, ads can appear
            here without changing page code.
          </p>
          <p className="text-xs text-gray-500" style={{ marginTop: 8 }}>
            Surface: <span style={{ fontWeight: 700 }}>{resolvedSurfaceId}</span> · Slot:{' '}
            <span style={{ fontWeight: 700 }}>{slot}</span>
          </p>
        </Card>
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
            {/* Minimal renderer for now. Later we render by placement.type */}
            {p?.body ? (
              <div className="text-sm text-gray-700">{p.body}</div>
            ) : (
              <div className="text-sm text-gray-700">
                Placement is live. Renderer will be expanded when campaigns are wired.
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
