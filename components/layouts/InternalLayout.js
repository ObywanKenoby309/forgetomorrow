// components/layouts/InternalLayout.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';
import { usePlan } from '@/context/PlanContext';

// Chrome-specific headers + sidebars
import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

// ✅ mobile bottom bar + support floating button
import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import SupportFloatingButton from '@/components/SupportFloatingButton';

const ALLOWED_MODES = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);

// Profile-standard glass (match site-wide)
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

  if (raw === 'recruiter') return 'recruiter-smb';
  if (raw === 'enterprise') return 'recruiter-ent';

  if (ALLOWED_MODES.has(raw)) return raw;

  if (raw.startsWith('recruiter')) {
    if (raw.includes('ent') || raw.includes('enterprise')) return 'recruiter-ent';
    return 'recruiter-smb';
  }

  return '';
}

function extractChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s.includes('chrome=')) return '';
    const qIndex = s.indexOf('?');
    if (qIndex === -1) return '';
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return normalizeChrome(params.get('chrome'));
  } catch {
    return '';
  }
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

// ── Siderail Toggle Button ─────────────────────────────────────────────────────
function SiderailToggle({ collapsed, onToggle, leftWidth, gap }) {
  const [hovered, setHovered] = useState(false);

  const leftPos = collapsed ? 6 : leftWidth + gap - 14;

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={collapsed ? 'Expand Siderails' : 'Collapse Siderails'}
      style={{
        position: 'fixed',
        left: leftPos,
        top: '44%',
        transform: 'translateY(-50%)',
        zIndex: 300,
        background: hovered
          ? 'rgba(255,112,67,0.18)'
          : 'rgba(13,27,42,0.88)',
        border: `1px solid ${hovered ? 'rgba(255,112,67,0.6)' : 'rgba(255,112,67,0.28)'}`,
        borderRadius: collapsed ? '0 10px 10px 0' : '10px 0 0 10px',
        color: '#FF7043',
        cursor: 'pointer',
        padding: '12px 5px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: hovered
          ? '0 4px 20px rgba(255,112,67,0.25)'
          : '0 2px 12px rgba(0,0,0,0.35)',
        transition: 'left 0.35s ease, background 0.18s, border-color 0.18s, box-shadow 0.18s, border-radius 0.35s',
        outline: 'none',
        minWidth: 22,
      }}
    >
      {collapsed ? (
        <svg width="11" height="18" viewBox="0 0 11 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 2l4.5 7L1 16" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
          <path d="M5.5 2L10 9l-4.5 7" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="11" height="18" viewBox="0 0 11 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2L5.5 9 10 16" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.5 2L1 9l4.5 7" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        </svg>
      )}

      {hovered && (
        <span style={{
          position: 'absolute',
          left: collapsed ? 'calc(100% + 10px)' : 'auto',
          right: collapsed ? 'auto' : 'calc(100% + 10px)',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(13,27,42,0.96)',
          border: '1px solid rgba(255,112,67,0.3)',
          borderRadius: 8,
          padding: '5px 10px',
          fontSize: 11,
          fontWeight: 600,
          color: '#F8F4EF',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '0.02em',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        }}>
          {collapsed ? 'Expand Siderails' : 'Collapse Siderails'}
        </span>
      )}
    </button>
  );
}

export default function InternalLayout({
  title = 'ForgeTomorrow',
  left,
  header,
  right,
  children,
  activeNav,

  forceChrome,
  chrome,
  backgroundOverrideUrl = '',

  rightVariant = 'dark',
  rightWidth = 260,
  leftWidth = 240,
  gap = 12,
  pad = 16,

  collapseSiderails = false,
  onToggleSiderails = null,
}) {
  const router = useRouter();
  const counts = useSidebarCounts();
  const { isLoaded: planLoaded, plan, role } = usePlan();

  const [chromeMode, setChromeMode] = useState(() => normalizeChrome(forceChrome || chrome) || 'seeker');

  useEffect(() => {
    if (!router?.isReady) return;

    const override = normalizeChrome(forceChrome || chrome);
    if (override && ALLOWED_MODES.has(override)) {
      setChromeMode(override);
      return;
    }

    const q = normalizeChrome(router?.query?.chrome);
    if (q && ALLOWED_MODES.has(q)) {
      if ((q === 'recruiter-smb' || q === 'recruiter-ent') && planLoaded) {
        const isEnterprise = String(plan || '').toLowerCase() === 'enterprise';
        const canonical = isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
        setChromeMode(canonical);
        setQueryChrome(router, canonical);
        return;
      }
      setChromeMode(q);
      return;
    }

    const fromPath = extractChromeFromAsPath(router?.asPath);
    if (fromPath && ALLOWED_MODES.has(fromPath)) {
      if ((fromPath === 'recruiter-smb' || fromPath === 'recruiter-ent') && planLoaded) {
        const isEnterprise = String(plan || '').toLowerCase() === 'enterprise';
        const canonical = isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
        setChromeMode(canonical);
        setQueryChrome(router, canonical);
        return;
      }
      setChromeMode(fromPath);
      return;
    }

    if (planLoaded) {
      const dbRole = String(role || '').toLowerCase();
      const isRecruiterAccount =
        dbRole === 'recruiter' ||
        dbRole === 'site_admin' ||
        dbRole === 'owner' ||
        dbRole === 'admin' ||
        dbRole === 'billing';
      const isCoachAccount = dbRole === 'coach';
      const isEnterprise = String(plan || '').toLowerCase() === 'enterprise';

      const dbPreferred = isRecruiterAccount
        ? isEnterprise ? 'recruiter-ent' : 'recruiter-smb'
        : isCoachAccount ? 'coach' : 'seeker';
      setChromeMode(dbPreferred);

      if (dbPreferred === 'recruiter-ent' || dbPreferred === 'recruiter-smb') {
        setQueryChrome(router, dbPreferred);
      }
      return;
    }

    setChromeMode('seeker');
  }, [forceChrome, chrome, router?.isReady, router?.query?.chrome, router?.asPath, planLoaded, plan, role]);

  const { HeaderComp, SidebarComp, sidebarProps } = useMemo(() => {
    switch (chromeMode) {
      case 'coach':
        return {
          HeaderComp: CoachingHeader,
          SidebarComp: CoachingSidebar,
          sidebarProps: { active: activeNav, counts },
        };
      case 'recruiter-smb':
      case 'recruiter-ent':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: {
            active: activeNav,
            variant: chromeMode === 'recruiter-ent' ? 'enterprise' : 'smb',
            counts,
          },
        };
      case 'seeker':
      default:
        return {
          HeaderComp: SeekerHeader,
          SidebarComp: SeekerSidebar,
          sidebarProps: { active: activeNav, counts },
        };
    }
  }, [chromeMode, activeNav, counts]);

  const { wallpaperUrl } = useUserWallpaper();
  const effectiveLayoutWallpaper = backgroundOverrideUrl || wallpaperUrl;

  const [isMobile, setIsMobile] = useState(true);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const backgroundStyle = effectiveLayoutWallpaper
    ? {
        minHeight: '100vh',
        backgroundImage: `url(${effectiveLayoutWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: isMobile ? 'scroll' : 'fixed',
      }
    : {
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      };

  const hasHeader = Boolean(header);
  const hasRight = Boolean(right);

  const effectiveLeftWidth = !isMobile && collapseSiderails ? 0 : leftWidth;
  const effectiveRightWidth = !isMobile && collapseSiderails ? 0 : (hasRight ? rightWidth : 0);

  const isRightRailAdOnly =
    React.isValidElement(right) &&
    right.type === RightRailPlacementManager;

  const useLightRightRail = rightVariant === 'light' || isRightRailAdOnly;

  const rightBase = {
    gridArea: 'right',
    alignSelf: 'start',
    borderRadius: 14,
    boxSizing: 'border-box',
    width: hasRight && !isMobile ? rightWidth : '100%',
    minWidth: hasRight && !isMobile ? rightWidth : 0,
    maxWidth: hasRight && !isMobile ? rightWidth : '100%',
    minInlineSize: 0,
  };

  const rightDark = {
    border: GLASS.border,
    background: GLASS.background,
    boxShadow: GLASS.boxShadow,
    backdropFilter: GLASS.backdropFilter,
    WebkitBackdropFilter: GLASS.WebkitBackdropFilter,
    padding: 16,
    color: '#112033',
  };

  const rightLight = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    boxShadow: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    borderRadius: 0,
  };

  const containerPadding = {
    paddingTop: pad,
    paddingBottom: isMobile ? pad + 84 : pad,
    paddingLeft: pad,
    paddingRight: hasRight ? Math.max(8, pad - 4) : pad,
  };

  const desktopGrid = !hasHeader
    ? !hasRight
      ? {
          display: 'grid',
          gridTemplateColumns: `${effectiveLeftWidth}px minmax(0, 1fr)`,
          gridTemplateRows: '1fr',
          gridTemplateAreas: `"left content"`,
          transition: 'grid-template-columns 0.35s ease',
        }
      : {
          display: 'grid',
          gridTemplateColumns: `${effectiveLeftWidth}px minmax(0, 1fr) ${effectiveRightWidth}px`,
          gridTemplateRows: '1fr',
          gridTemplateAreas: `"left content right"`,
          transition: 'grid-template-columns 0.35s ease',
        }
    : {
        display: 'grid',
        gridTemplateColumns: `${effectiveLeftWidth}px minmax(0, 1fr) ${effectiveRightWidth}px`,
        gridTemplateRows: 'auto 1fr',
        gridTemplateAreas: hasRight
          ? `"left header right"
             "left content right"`
          : `"left header header"
             "left content content"`,
        transition: 'grid-template-columns 0.35s ease',
      };

  const mobileGrid = !hasHeader
    ? hasRight
      ? {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: 'auto auto',
          gridTemplateAreas: `"content" "right"`,
        }
      : {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: 'auto',
          gridTemplateAreas: `"content"`,
        }
    : {
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

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div style={backgroundStyle}>
        <HeaderComp />

        <div
          style={{
            ...gridStyles,
            gap,
            ...containerPadding,
            alignItems: 'start',
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '100vw',
            minWidth: 0,
            overflowX: 'hidden',
          }}
        >
          <aside
            style={{
              gridArea: 'left',
              alignSelf: 'start',
              minWidth: 0,
              display: isMobile ? 'none' : 'block',
              overflow: 'hidden',
              opacity: collapseSiderails ? 0 : 1,
              pointerEvents: collapseSiderails ? 'none' : 'auto',
              transition: 'opacity 0.25s ease',
            }}
          >
            {left ?? <SidebarComp {...sidebarProps} />}
          </aside>

          {hasHeader ? (
            <header style={{ gridArea: 'header', alignSelf: 'start', minWidth: 0 }}>
              {header}
            </header>
          ) : null}

          {hasRight ? (
            <aside
              style={{
                ...rightBase,
                ...(useLightRightRail ? rightLight : rightDark),
                overflow: 'hidden',
                opacity: collapseSiderails ? 0 : 1,
                pointerEvents: collapseSiderails ? 'none' : 'auto',
                padding: collapseSiderails ? 0 : (useLightRightRail ? 0 : 16),
                transition: 'opacity 0.25s ease, padding 0.35s ease',
              }}
            >
              {right}
            </aside>
          ) : null}

          <main style={{ gridArea: 'content', minWidth: 0, width: '100%', maxWidth: '100%' }}>
            <div style={{ display: 'grid', gap, width: '100%', minWidth: 0 }}>
              {children}
            </div>
          </main>
        </div>

        <SupportFloatingButton />

        <MobileBottomBar isMobile={isMobile} chromeMode={chromeMode} onOpenTools={handleOpenTools} />

        {onToggleSiderails && !isMobile && (
          <SiderailToggle
            collapsed={collapseSiderails}
            onToggle={onToggleSiderails}
            leftWidth={leftWidth}
            gap={gap + pad}
          />
        )}
      </div>

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
            {left ?? <SidebarComp {...sidebarProps} />}
          </div>
        </div>
      )}
    </>
  );
}