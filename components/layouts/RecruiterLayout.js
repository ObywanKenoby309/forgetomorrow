// components/layouts/RecruiterLayout.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

const LAST_CHROME_KEY = 'ft_last_chrome';

// Profile-standard glass
const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';

  // canonical
  if (raw === 'recruiter-smb' || raw === 'recruiter_ent' || raw === 'recruiter-ent' || raw === 'recruiter-ent')
    return raw === 'recruiter_ent' ? 'recruiter-ent' : raw;

  // aliases
  if (raw === 'recruiter') return 'recruiter-smb';
  if (raw === 'smb' || raw === 'recruiter_smb' || raw === 'recruiter-smb') return 'recruiter-smb';

  if (
    raw === 'enterprise' ||
    raw === 'ent' ||
    raw === 'recruiter-enterprise' ||
    raw === 'recruiter_enterprise' ||
    raw === 'recruiter-ent'
  ) {
    return 'recruiter-ent';
  }

  if (raw.startsWith('recruiter')) {
    if (raw.includes('ent') || raw.includes('enterprise')) return 'recruiter-ent';
    return 'recruiter-smb';
  }

  return '';
}

function readLastChrome() {
  try {
    if (typeof window === 'undefined') return '';
    return normalizeChrome(window.sessionStorage.getItem(LAST_CHROME_KEY) || '');
  } catch {
    return '';
  }
}

function persistLastChrome(mode) {
  try {
    if (typeof window === 'undefined') return;
    const m = normalizeChrome(mode);
    if (!m) return;
    window.sessionStorage.setItem(LAST_CHROME_KEY, m);
  } catch {
    // ignore
  }
}

function chromeToVariant(chromeMode) {
  const c = normalizeChrome(chromeMode);
  if (c === 'recruiter-ent') return 'enterprise';
  if (c === 'recruiter-smb') return 'smb';
  return null;
}

/**
 * Recruiter-only layout.
 * - Grid/padding/right-rail match SeekerLayout for uniformity.
 * - `headerCard` wraps the header slot (now profile-standard glass).
 * - `role` (org-level permission) and `variant` (smb|enterprise) pass to sidebar.
 * - `activeNav` tells the sidebar which item should be highlighted.
 */
export default function RecruiterLayout({
  title = 'ForgeTomorrow — Recruiter',
  header,
  right,
  children,
  headerCard = true,
  role = 'recruiter', // 'owner' | 'admin' | 'billing' | 'recruiter' | 'hiringManager'
  variant = 'smb', // 'smb' | 'enterprise'
  counts, // optional badges
  initialOpen, // optional section defaults
  activeNav = 'dashboard', // default active nav item
}) {
  const router = useRouter();
  const hasRight = Boolean(right);

  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        setIsMobile(width < 1024);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Chrome-aware recruiter tier (URL wins, else last saved) ---
  const chromeMode = useMemo(() => {
    const fromUrl = normalizeChrome(router?.query?.chrome);
    if (fromUrl) return fromUrl;

    const last = readLastChrome();
    if (last) return last;

    return 'recruiter-smb';
  }, [router?.query?.chrome]);

  useEffect(() => {
    persistLastChrome(chromeMode);
  }, [chromeMode]);

  // If caller didn’t intentionally override variant, we can auto-derive from chrome.
  // (We treat the default 'smb' as "not an intentional override".)
  const resolvedVariant = useMemo(() => {
    const inferred = chromeToVariant(chromeMode);
    if (!inferred) return variant;

    // If the page explicitly passed variant (common on enterprise pages), respect it.
    // If it's just the default 'smb', let chrome upgrade it to enterprise when appropriate.
    if (variant === 'enterprise') return 'enterprise';
    if (variant === 'smb') return inferred;

    return variant;
  }, [chromeMode, variant]);

  // --- Desktop vs mobile grid configs (aligned to SeekerLayout defaults) ---
  const GAP = 12;
  const PAD = 16;
  const LEFT_W = 240;
  const RIGHT_W = 240; // your recruiter layout uses 240; keep it stable

  const desktopGrid = {
    display: 'grid',
    gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr) ${hasRight ? `${RIGHT_W}px` : '0px'}`,
    gridTemplateRows: 'auto 1fr',
    gridTemplateAreas: hasRight
      ? `"left header right"
         "left content right"`
      : `"left header header"
         "left content content"`,
  };

  const mobileGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: hasRight ? 'auto auto auto' : 'auto auto',
    gridTemplateAreas: hasRight
      ? `"header"
         "content"
         "right"`
      : `"header"
         "content"`,
  };

  const gridStyles = isMobile ? mobileGrid : desktopGrid;

  // Right rail styles (kept as your dark rail)
  const rightRailStyle = {
    gridArea: 'right',
    alignSelf: 'start',
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    minHeight: 120,
    boxSizing: 'border-box',
    width: isMobile ? '100%' : RIGHT_W,
    minWidth: isMobile ? 0 : RIGHT_W,
    maxWidth: isMobile ? '100%' : RIGHT_W,
    minInlineSize: 0,
    color: 'white',
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <RecruiterHeader />

      <div
        style={{
          ...gridStyles,
          gap: GAP,
          paddingTop: PAD,
          paddingBottom: PAD,
          paddingLeft: PAD,
          paddingRight: hasRight ? Math.max(8, PAD - 4) : PAD,
          alignItems: 'start',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT — Sidebar (hidden on mobile, moved into overlay) */}
        <aside
          style={{
            gridArea: 'left',
            alignSelf: 'start',
            minWidth: 0,
            display: isMobile ? 'none' : 'block',
          }}
        >
          <RecruiterSidebar
            active={activeNav}
            role={role}
            variant={resolvedVariant}
            counts={counts}
            initialOpen={initialOpen}
          />
        </aside>

        {/* PAGE-LEVEL HEADER SLOT (glass by default) */}
        {headerCard ? (
          <section
            style={{
              gridArea: 'header',
              borderRadius: 14,
              padding: '8px 12px',
              minWidth: 0,
              boxSizing: 'border-box',
              ...GLASS,
            }}
          >
            {header}

            {/* Mobile-only "Open Sidebar" button under header content */}
            {isMobile && (
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #CFD8DC',
                    background: '#ECEFF1',
                    color: '#263238',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 16 }}>☰</span>
                  <span>Open Sidebar</span>
                </button>
              </div>
            )}
          </section>
        ) : (
          <header
            style={{
              gridArea: 'header',
              alignSelf: 'start',
              marginTop: 0,
              paddingTop: 0,
              minWidth: 0,
            }}
          >
            {header}

            {/* Mobile-only "Open Sidebar" button (non-card header mode) */}
            {isMobile && (
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #CFD8DC',
                    background: '#ECEFF1',
                    color: '#263238',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 16 }}>☰</span>
                  <span>Open Sidebar</span>
                </button>
              </div>
            )}
          </header>
        )}

        {/* RIGHT — Dark Rail */}
        {hasRight && <aside style={rightRailStyle}>{right}</aside>}

        {/* CONTENT */}
        <main style={{ gridArea: 'content', minWidth: 0 }}>
          <div style={{ display: 'grid', gap: GAP, width: '100%', minWidth: 0 }}>
            {children}
          </div>
        </main>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobile && mobileSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              width: '80%',
              maxWidth: 320,
              background: '#FFFFFF',
              padding: 16,
              boxSizing: 'border-box',
              overflowY: 'auto',
              boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header row inside sidebar overlay */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#263238' }}>
                Navigation
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close sidebar"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 20,
                  lineHeight: 1,
                  color: '#546E7A',
                }}
              >
                ×
              </button>
            </div>

            <RecruiterSidebar
              active={activeNav}
              role={role}
              variant={resolvedVariant}
              counts={counts}
              initialOpen={initialOpen}
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Dismiss sidebar"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
          />
        </div>
      )}
    </>
  );
}
