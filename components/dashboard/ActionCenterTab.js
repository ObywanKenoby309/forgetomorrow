// components/dashboard/ActionCenterTab.js
//
// Standalone mobile-only Action Center: a persistent right-edge tab showing an
// item count, which slides open into a drawer listing what needs attention.
//
// Mirrors the Forge Hammer tab's sizing/positioning (right edge, gradient pill
// container, image filling it) for visual consistency — but shares no code
// with it. Hammer only exists on resume/cover pages; this only exists on
// dashboard pages.
//
// IMPORTANT: positioning is done via inline `style` props, not styled-jsx
// `<style jsx global>`. This component is imported into pages (not authored
// directly in a page file like Hammer is), and relying on CSS classes here
// risks containing-block issues from ancestor `backdrop-filter`/`transform`
// properties in the surrounding layout, plus styled-jsx injection-order
// quirks when used from a nested component. Inline styles sidestep all of
// that — `position: fixed` set via the style prop is unambiguous.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const ORANGE = '#FF7043';

function useIsMobile(bp = 1100) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < bp);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [bp]);
  return isMobile;
}

/**
 * @param {Object} props
 * @param {string} props.scope - 'SEEKER' | 'RECRUITER' | 'COACH'
 * @param {(path: string) => string} props.withChrome
 * @param {Array<{key:string, bucket:string, title:string, emptyText:string, href:string, icon:string}>} props.tileDefs
 * @param {(notification: Object) => string} props.pickBucket
 * @param {string} [props.allHref]
 */
export default function ActionCenterTab({ scope, withChrome, tileDefs, pickBucket, allHref }) {
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/notifications/list?scope=${encodeURIComponent(scope)}&limit=25&includeRead=0`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        console.error('[ActionCenterTab] load error:', e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 25000);
    return () => { alive = false; clearInterval(t); };
  }, [scope]);

  const buckets = useMemo(() => {
    const b = {};
    for (const def of tileDefs) b[def.bucket] = [];
    for (const n of items) {
      const k = pickBucket(n);
      if (!b[k]) continue;
      b[k].push(n);
    }
    return b;
  }, [items, tileDefs, pickBucket]);

  const tiles = tileDefs.map((def) => ({ ...def, items: (buckets[def.bucket] || []).slice(0, 3) }));
  const sortedTiles = [...tiles].sort((a, b) => (b.items.length > 0 ? 1 : 0) - (a.items.length > 0 ? 1 : 0));
  const totalActions = tiles.reduce((sum, t) => sum + t.items.length, 0);
  const hasActions = totalActions > 0;

  const resolvedAllHref = allHref || withChrome(`/action-center?scope=${scope}`);

  // Desktop: render nothing. The desktop Action Center grid card is rendered
  // separately by the page itself (unchanged), this component is mobile-only.
  if (!isMobile) return null;

  return (
    <>
      {/* Pull tab — fixed to right edge, vertically centered, mirrors Hammer tab sizing */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle Action Center"
        style={{
          position: 'fixed',
          right: open ? 'min(85vw, 360px)' : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 42,
          height: 140,
          padding: 0,
          borderRadius: open ? 0 : '10px 0 0 10px',
          border: open ? '1px solid rgba(255,112,67,0.45)' : 'none',
          borderRight: open ? 'none' : undefined,
          background: open
            ? 'rgba(13,27,42,0.94)'
            : hasActions
              ? `linear-gradient(135deg, ${ORANGE}, #FF8A65)`
              : 'rgba(120,135,150,0.92)',
          color: '#fff',
          fontFamily: 'inherit',
          cursor: 'pointer',
          boxShadow: open ? '-6px 0 20px rgba(0,0,0,0.35)' : '-4px 0 16px rgba(255,112,67,0.45)',
          transition: 'right 0.3s cubic-bezier(0.32,0.72,0,1), background 0.15s',
        }}
      >
        <img
          src="/icons/action-center-tab.png"
          alt="Action Center"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
        {hasActions && (
          <span style={{
            position: 'absolute',
            top: 8,
            right: 8,
            minWidth: 19,
            height: 19,
            padding: '0 4px',
            borderRadius: 999,
            background: '#fff',
            color: '#C2410C',
            fontSize: 11,
            fontWeight: 900,
            lineHeight: '19px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
          }}>
            {totalActions}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 218,
          background: 'rgba(0,0,0,0.50)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 219,
          width: 'min(85vw, 360px)',
          maxWidth: '100vw',
          background: 'rgba(252,252,253,0.98)',
          borderLeft: '1px solid rgba(255,112,67,0.15)',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.30)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'env(safe-area-inset-top, 14px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE }}>Action Center</div>
            <div style={{ fontSize: 12, marginTop: 2, fontWeight: hasActions ? 700 : 500, color: hasActions ? ORANGE : '#90A4AE' }}>
              {hasActions ? `${totalActions} item${totalActions !== 1 ? 's' : ''} need your attention` : "You're all caught up"}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'rgba(0,0,0,0.06)', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >×</button>
        </div>

        <div style={{ padding: '14px 16px', display: 'grid', gap: 8 }}>
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: 64, borderRadius: 12, background: 'rgba(0,0,0,0.04)' }} />
            ))
          ) : (
            sortedTiles.map((t) => <DrawerActionTile key={t.key} {...t} onNavigate={() => setOpen(false)} />)
          )}
        </div>

        <div style={{ padding: '4px 16px 16px' }}>
          <Link
            href={resolvedAllHref}
            onClick={() => setOpen(false)}
            style={{
              display: 'block', textAlign: 'center', textDecoration: 'none',
              fontSize: 13, fontWeight: 800, color: ORANGE,
              padding: '10px 14px', borderRadius: 999,
              border: `1px solid rgba(255,112,67,0.30)`,
              background: 'rgba(255,112,67,0.08)',
            }}
          >
            View all
          </Link>
        </div>
      </div>
    </>
  );
}

function DrawerActionTile({ title, items, emptyText, href, icon, onNavigate }) {
  const hasItems = items.length > 0;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 12, textDecoration: 'none',
        background: hasItems ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
        border: hasItems ? '1px solid rgba(255,112,67,0.22)' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: hasItems ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: hasItems ? 'rgba(255,112,67,0.10)' : 'rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: hasItems ? '#112033' : '#90A4AE' }}>{title}</div>
        <div style={{ fontSize: 12, marginTop: 2, color: hasItems ? '#546E7A' : '#B0BEC5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hasItems ? (items[0].title || 'View item') : emptyText}
        </div>
      </div>
      {hasItems ? (
        <div style={{
          minWidth: 28, height: 28, borderRadius: 999, flexShrink: 0,
          background: ORANGE, color: 'white', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 13, fontWeight: 900,
          boxShadow: '0 4px 10px rgba(255,112,67,0.40)',
        }}>
          {items.length}
        </div>
      ) : (
        <div style={{
          width: 24, height: 24, borderRadius: 999, flexShrink: 0,
          background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 14, color: '#B0BEC5',
        }}>
          ✓
        </div>
      )}
    </Link>
  );
}