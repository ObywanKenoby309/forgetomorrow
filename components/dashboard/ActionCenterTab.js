// components/dashboard/ActionCenterTab.js
//
// Standalone mobile-only Action Center: a persistent left-edge tab showing an
// item count, which slides open into a drawer listing what needs attention.
//
// Scoped to dashboard pages ONLY — not a global layout component. Each dashboard
// (Seeker, Recruiter, Coach) renders this directly and passes its own `tiles`
// definition, since what counts as "an action" differs per role.
//
// This intentionally does NOT share any code or visual machinery with the
// Forge Hammer drawer — Hammer is a page-specific tool (resume/cover only),
// this is a cross-dashboard status surface. Keeping them separate avoids
// coupling two conceptually different things just because they look similar.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const ORANGE = '#FF7043';

/**
 * @param {Object} props
 * @param {string} props.scope - 'SEEKER' | 'RECRUITER' | 'COACH'
 * @param {(path: string) => string} props.withChrome
 * @param {Array<{key:string, title:string, emptyText:string, href:string, icon:string, bucket:string}>} props.tileDefs
 *   Tile definitions — same shape as the existing seeker dashboard tiles, minus `items`
 *   (this component fetches and buckets the data itself).
 * @param {(notification: Object) => string} props.pickBucket
 *   Function that maps a notification object to one of the bucket keys used in tileDefs.
 * @param {string} [props.allHref] - "View all" link target. Defaults to /action-center?scope=<scope>
 */
export default function ActionCenterTab({ scope, withChrome, tileDefs, pickBucket, allHref }) {
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

  return (
    <>
      <style jsx global>{`
        .ft-actioncenter-tab {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 220;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          width: 36px;
          padding: 12px 0;
          border-radius: 0 12px 12px 0;
          border: none;
          background: ${hasActions ? `linear-gradient(135deg, ${ORANGE}, #FF8A65)` : 'rgba(120,135,150,0.85)'};
          color: #fff;
          font-family: inherit;
          cursor: pointer;
          box-shadow: 4px 0 16px rgba(0,0,0,0.18);
          transition: left 0.3s cubic-bezier(0.32,0.72,0,1), background 0.2s ease;
        }
        .ft-actioncenter-tab.open {
          left: min(85vw, 360px);
          box-shadow: 6px 0 20px rgba(0,0,0,0.30);
        }
        .ft-actioncenter-badge {
          font-size: 13px;
          font-weight: 900;
          line-height: 1;
        }
        .ft-actioncenter-icon {
          width: 18px;
          height: 18px;
          object-fit: contain;
        }
        .ft-actioncenter-backdrop {
          position: fixed; inset: 0; z-index: 218;
          background: rgba(0,0,0,0.50);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .ft-actioncenter-backdrop.open { opacity: 1; pointer-events: all; }
        .ft-actioncenter-drawer {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 219;
          width: min(85vw, 360px);
          max-width: 100vw;
          background: rgba(252,252,253,0.98);
          border-right: 1px solid rgba(255,112,67,0.15);
          box-shadow: 12px 0 40px rgba(0,0,0,0.30);
          display: flex;
          flex-direction: column;
          padding-top: env(safe-area-inset-top, 14px);
          padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 80px);
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.32,0.72,0,1);
          overflow-y: auto;
        }
        .ft-actioncenter-drawer.open { transform: translateX(0); }
      `}</style>

      {/* Edge tab — always visible, badge only shows count when > 0 */}
      <button
        type="button"
        className={`ft-actioncenter-tab${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle Action Center"
      >
        <img src="/icons/action-center-tab.png" alt="" className="ft-actioncenter-icon" />
        {hasActions && <span className="ft-actioncenter-badge">{totalActions}</span>}
      </button>

      {/* Backdrop */}
      <div className={`ft-actioncenter-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

      {/* Drawer */}
      <div className={`ft-actioncenter-drawer${open ? ' open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
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