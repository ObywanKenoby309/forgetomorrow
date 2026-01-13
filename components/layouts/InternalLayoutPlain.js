// components/layouts/InternalLayoutPlain.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import InternalSidebar from '@/components/internal/InternalSidebar';

// ✅ Plain background (presentation-safe)
const BG = '#F6F7F9';
const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

const ORANGE = '#FF7043';

const ALLOWED_HATS = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);
function normalizeHat(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (ALLOWED_HATS.has(raw)) return raw;
  if (raw === 'recruiter') return 'recruiter-smb';
  if (raw === 'enterprise' || raw === 'ent') return 'recruiter-ent';
  if (raw === 'smb') return 'recruiter-smb';
  return 'seeker';
}

export default function InternalLayoutPlain({
  title = 'ForgeTomorrow — Internal Workspace',
  activeNav = 'dashboard',
  headerTitle = '',
  headerSubtitle = '',
  children,

  // Staff identity (UI-first; DB enforcement via getServerSideProps on pages)
  employee = false,
  department = '',

  // Optional: allow pages to pass initial hat
  initialHat = 'seeker',
}) {
  const [isMobile, setIsMobile] = useState(true);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [hat, setHat] = useState(() => normalizeHat(initialHat));

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const topBar = useMemo(() => {
    return (
      <section
        style={{
          ...CARD,
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minWidth: 0,
        }}
        aria-label="Internal workspace header"
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>
            {headerTitle || 'Workspace'}
          </div>
          {headerSubtitle ? (
            <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: 'rgba(17,24,39,0.65)' }}>
              {headerSubtitle}
            </div>
          ) : null}
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.55)' }}>
            {employee ? 'Employee Access' : 'Limited Access'} {department ? `• ${department}` : ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Hat switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.65)' }}>View as</div>
            <select
              value={hat}
              onChange={(e) => setHat(normalizeHat(e.target.value))}
              aria-label="Select Forge Site view (hat)"
              style={{
                border: '1px solid rgba(17,24,39,0.18)',
                borderRadius: 12,
                padding: '8px 10px',
                fontSize: 13,
                fontWeight: 800,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="seeker">Seeker</option>
              <option value="coach">Coach</option>
              <option value="recruiter-smb">Recruiter SMB</option>
              <option value="recruiter-ent">Recruiter ENT</option>
            </select>
          </div>

          {/* Jump to Forge Site */}
          <a
            href={`/seeker-dashboard?chrome=${encodeURIComponent(hat)}`}
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              padding: '9px 12px',
              background: ORANGE,
              color: '#fff',
              fontWeight: 900,
              fontSize: 13,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 10px 18px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            aria-label="Open Forge Site with selected hat"
          >
            Open Forge Site
          </a>

          {/* Mobile tools */}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileToolsOpen(true)}
              style={{
                borderRadius: 12,
                padding: '9px 12px',
                background: '#111827',
                color: '#fff',
                fontWeight: 900,
                fontSize: 13,
                border: '1px solid rgba(0,0,0,0.08)',
                cursor: 'pointer',
              }}
              aria-label="Open internal navigation"
            >
              Tools
            </button>
          ) : null}
        </div>
      </section>
    );
  }, [headerTitle, headerSubtitle, employee, department, hat, isMobile]);

  const GRID_GAP = 12;
  const PAD = 16;
  const LEFT_W = 260;

  const desktopGrid = {
    display: 'grid',
    gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr)`,
    gridTemplateRows: 'auto 1fr',
    gridTemplateAreas: `"left header" "left content"`,
  };

  const mobileGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'auto 1fr',
    gridTemplateAreas: `"header" "content"`,
  };

  const gridStyles = isMobile ? mobileGrid : desktopGrid;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div style={{ minHeight: '100vh', background: BG }}>
        <div
          style={{
            ...gridStyles,
            gap: GRID_GAP,
            padding: PAD,
            alignItems: 'start',
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden',
          }}
        >
          {/* LEFT */}
          {!isMobile ? (
            <aside style={{ gridArea: 'left', alignSelf: 'start', minWidth: 0 }}>
              <InternalSidebar active={activeNav} hat={hat} />
            </aside>
          ) : null}

          {/* HEADER */}
          <header style={{ gridArea: 'header', alignSelf: 'start', minWidth: 0 }}>{topBar}</header>

          {/* CONTENT */}
          <main style={{ gridArea: 'content', minWidth: 0 }}>
            <div style={{ display: 'grid', gap: GRID_GAP, minWidth: 0 }}>{children}</div>
          </main>
        </div>

        {/* MOBILE TOOLS SHEET */}
        {isMobile && mobileToolsOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => setMobileToolsOpen(false)}
              aria-label="Dismiss Tools"
              style={{
                position: 'absolute',
                inset: 0,
                border: 'none',
                background: 'rgba(0,0,0,0.55)',
                cursor: 'pointer',
              }}
            />

            <div
              style={{
                position: 'relative',
                zIndex: 1,
                width: 'min(760px, 100%)',
                maxHeight: '82vh',
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                border: '1px solid rgba(17,24,39,0.12)',
                background: '#FFFFFF',
                padding: 16,
                boxSizing: 'border-box',
                overflowY: 'auto',
                boxShadow: '0 -10px 26px rgba(0,0,0,0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#111827' }}>Internal Tools</div>
                <button
                  type="button"
                  onClick={() => setMobileToolsOpen(false)}
                  aria-label="Close Tools"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 22,
                    lineHeight: 1,
                    color: '#6B7280',
                  }}
                >
                  ×
                </button>
              </div>

              <InternalSidebar active={activeNav} hat={hat} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
