// components/layouts/RecruiterLayout.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePlan } from '@/context/PlanContext';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';

import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

// ✅ Mobile bottom bar + support floating button
import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import SupportFloatingButton from '@/components/SupportFloatingButton';

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
  if (
    raw === 'recruiter-ent' ||
    raw === 'recruiter_enterprise' ||
    raw === 'enterprise' ||
    raw === 'ent'
  )
    return 'recruiter-ent';
  if (raw === 'recruiter-smb' || raw === 'recruiter_smb' || raw === 'smb' || raw === 'recruiter')
    return 'recruiter-smb';
  if (raw.startsWith('recruiter')) {
    if (raw.includes('ent') || raw.includes('enterprise')) return 'recruiter-ent';
    return 'recruiter-smb';
  }
  return '';
}

function setQueryChrome(router, chrome) {
  try {
    if (!router?.isReady) return;
    const nextChrome = normalizeChrome(chrome);
    if (!nextChrome) return;

    const current = normalizeChrome(router.query?.chrome);
    if (current === nextChrome) return;

    const nextQuery = { ...router.query, chrome: nextChrome };
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
      shallow: true,
      scroll: false,
    });
  } catch {
    // no-throw
  }
}

function chromeToVariant(chromeMode) {
  const c = normalizeChrome(chromeMode);
  if (c === 'recruiter-ent') return 'enterprise';
  if (c === 'recruiter-smb') return 'smb';
  return null;
}

export default function RecruiterLayout({
  title = 'ForgeTomorrow — Recruiter',
  header,
  right,
  children,

  // ✅ Default true, but ONLY renders if header is actually provided.
  headerCard = true,

  role: roleProp = 'recruiter',
  variant: variantProp = 'smb',
  counts,
  initialOpen,
  activeNav = 'dashboard',

  // ✅ NEW (optional): DB-backed staff fields to pass through to sidebar
  employee = false,
  department = '',

  // ✅ NEW: Seeker-style page-only opt-in to allow content to span under the left rail (desktop only)
  // Default false so no other recruiter pages change.
  contentFullBleed = false,
}) {
  const router = useRouter();
  const hasHeader = Boolean(header);
  const hasRight = Boolean(right);

  const { isLoaded: planLoaded, plan, role: planRole } = usePlan();

  // ---- WALLPAPER / BACKGROUND (matches SeekerLayout behavior) ----
  const { wallpaperUrl } = useUserWallpaper();

  const backgroundStyle = wallpaperUrl
    ? {
        minHeight: '100vh',
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    : {
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      };

  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(true);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- DB-first recruiter chrome: enterprise users must be recruiter-ent ---
  const chromeMode = useMemo(() => {
    const urlChrome = normalizeChrome(router?.query?.chrome);

    // DB truth
    const dbPlan = String(plan || '').toLowerCase();
    const isEnterprise = dbPlan === 'enterprise';

    // If URL asked for recruiter chrome, we will canonicalize in an effect.
    if (urlChrome) return urlChrome;

    // No URL chrome: use DB preference once loaded, else safe default
    if (planLoaded) return isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
    return 'recruiter-smb';
  }, [router?.query?.chrome, planLoaded, plan]);

  // Canonicalize URL based on DB once loaded (kills SMB reinfection)
  useEffect(() => {
    if (!router?.isReady) return;
    if (!planLoaded) return;

    const urlChrome = normalizeChrome(router.query?.chrome);

    const dbPlan = String(plan || '').toLowerCase();
    const isEnterprise = dbPlan === 'enterprise';

    const canonical = isEnterprise ? 'recruiter-ent' : 'recruiter-smb';

    // Only force-correct recruiter chrome values (don’t stomp other pages’ modes)
    if (urlChrome === 'recruiter-smb' || urlChrome === 'recruiter-ent') {
      setQueryChrome(router, canonical);
    } else if (!urlChrome) {
      // Stamp chrome for recruiter pages to keep internal nav consistent
      setQueryChrome(router, canonical);
    }
  }, [router?.isReady, router?.query?.chrome, planLoaded, plan]);

  // Variant: allow DB chrome to control unless explicitly passed enterprise
  const resolvedVariant = useMemo(() => {
    const inferred = chromeToVariant(chromeMode);
    if (!inferred) return variantProp;
    if (variantProp === 'enterprise') return 'enterprise';
    if (variantProp === 'smb') return inferred;
    return variantProp;
  }, [chromeMode, variantProp]);

  // Optional: prefer PlanContext role if present (prevents passing stale role props)
  const resolvedRole = planRole || roleProp;

  // --- Desktop vs mobile grid configs ---
  const GAP = 12;
  const PAD = 16;
  const LEFT_W = 240;
  const RIGHT_W = 240;

  // ✅ KEY: if no header + no right, we run headerless + rightless grid (Seeker-style page-owned layout)
  const desktopGrid = useMemo(() => {
    if (!hasHeader && !hasRight) {
      return {
        display: 'grid',
        gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr)`,
        gridTemplateRows: '1fr',
        gridTemplateAreas: `"left content"`,
      };
    }

    // If header is absent but right exists, keep a 2-row grid but don’t render header row
    // (This is rare, but safe.)
    if (!hasHeader && hasRight) {
      return {
        display: 'grid',
        gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr) ${RIGHT_W}px`,
        gridTemplateRows: '1fr',
        gridTemplateAreas: `"left content right"`,
      };
    }

    // Standard behavior (existing)
    return {
      display: 'grid',
      gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr) ${hasRight ? `${RIGHT_W}px` : '0px'}`,
      gridTemplateRows: 'auto 1fr',
      gridTemplateAreas: hasRight
        ? `"left header right"
           "left content right"`
        : `"left header header"
           "left content content"`,
    };
  }, [hasHeader, hasRight]);

  const mobileGrid = useMemo(() => {
    // On mobile, even headerless pages still stack cleanly
    if (!hasHeader && !hasRight) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto',
        gridTemplateAreas: `"content"`,
      };
    }

    if (!hasHeader && hasRight) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto auto',
        gridTemplateAreas: `"content" "right"`,
      };
    }

    return {
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
  }, [hasHeader, hasRight]);

  const gridStyles = isMobile ? mobileGrid : desktopGrid;

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

  // ✅ Stable callback so MobileBottomBar memo does NOT re-render on every parent refresh
  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  // ✅ Seeker-style: page-only opt-in for full-bleed content (desktop only)
  const mainOverrides = {
    position: 'relative',
    zIndex: 1,
  };

  // ✅ Ensure side rail stays above full-bleed content (same layering strategy as SeekerLayout)
  const leftRailLayer = { position: 'relative', zIndex: 10 };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div style={backgroundStyle}>
        <RecruiterHeader />

        <div
          style={{
            ...gridStyles,
            gap: GAP,
            paddingTop: PAD,
            paddingBottom: isMobile ? PAD + 84 : PAD,
            paddingLeft: PAD,
            paddingRight: hasRight ? Math.max(8, PAD - 4) : PAD,
            alignItems: 'start',
            boxSizing: 'border-box',

            // ✅ FIX (mobile overflow): hard clamp layout to viewport
            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Left rail */}
          <aside
            style={{
              ...leftRailLayer,
              gridArea: 'left',
              alignSelf: 'start',
              minWidth: 0,
              display: isMobile ? 'none' : 'block',
            }}
          >
            <RecruiterSidebar
              active={activeNav}
              role={resolvedRole}
              variant={resolvedVariant}
              counts={counts}
              initialOpen={initialOpen}
              employee={employee}
              department={department}
            />
          </aside>

          {/* Header (ONLY if provided) */}
          {hasHeader ? (
            headerCard ? (
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
              </section>
            ) : (
              <header style={{ gridArea: 'header', alignSelf: 'start', minWidth: 0 }}>
                {header}
              </header>
            )
          ) : null}

          {/* Right rail (ONLY if provided) */}
          {hasRight ? <aside style={rightRailStyle}>{right}</aside> : null}

          {/* Main content */}
          <main
            style={{
              gridArea: 'content',
              minWidth: 0,
              width: '100%',
              maxWidth: '100%',

              // ✅ Only remove overflow clipping on dashboard (contentFullBleed).
              // All other recruiter pages keep overflowX: 'hidden' for mobile safety.
              ...(!contentFullBleed ? { overflowX: 'hidden' } : {}),

              ...mainOverrides,
            }}
          >
            <div style={{ display: 'grid', gap: GAP, width: '100%', minWidth: 0, maxWidth: '100%' }}>
              {children}
            </div>
          </main>
        </div>
      </div>

      <SupportFloatingButton />

      <MobileBottomBar isMobile={isMobile} chromeMode={chromeMode} onOpenTools={handleOpenTools} />

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
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: 16,
              boxSizing: 'border-box',
              overflowY: 'auto',
              boxShadow: '0 -10px 26px rgba(0,0,0,0.22)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: '#112033' }}>Tools</div>
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
                  color: '#546E7A',
                }}
              >
                ×
              </button>
            </div>

            <RecruiterSidebar
              active={activeNav}
              role={resolvedRole}
              variant={resolvedVariant}
              counts={counts}
              initialOpen={initialOpen}
              employee={employee}
              department={department}
            />
          </div>
        </div>
      )}
    </>
  );
}