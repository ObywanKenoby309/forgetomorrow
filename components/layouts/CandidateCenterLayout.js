// components/layouts/CandidateCenterLayout.js
// Recruiter-only workspace layout for Candidate Center.
// Based on AnvilLayout — left rail collapses independently, right rail stays visible.
// No seeker/coach chrome switching. RecruiterHeader + RecruiterSidebar only.
import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';
import { usePlan } from '@/context/PlanContext';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import SupportFloatingButton from '@/components/SupportFloatingButton';

const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

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
        background: hovered ? 'rgba(255,112,67,0.18)' : 'rgba(13,27,42,0.88)',
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
        boxShadow: hovered ? '0 4px 20px rgba(255,112,67,0.25)' : '0 2px 12px rgba(0,0,0,0.35)',
        transition: 'left 0.35s ease, background 0.18s, border-color 0.18s, box-shadow 0.18s, border-radius 0.35s',
        outline: 'none',
        minWidth: 22,
      }}
    >
      {collapsed ? (
        <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
          <path d="M1 2l4.5 7L1 16" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
          <path d="M5.5 2L10 9l-4.5 7" stroke="#FF7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
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

export default function CandidateCenterLayout({
  title = 'ForgeTomorrow',
  left,
  header,
  right,
  children,
  activeNav,
  backgroundOverrideUrl = '',
  rightVariant = 'dark',
  rightWidth = 260,
  leftWidth = 240,
  gap = 12,
  pad = 16,
  collapseSiderails = false,
  onToggleSiderails = null,
  showToggle = true,
}) {
  const counts = useSidebarCounts();
  const { isLoaded: planLoaded, plan } = usePlan();
  const { wallpaperUrl } = useUserWallpaper();
  const effectiveLayoutWallpaper = backgroundOverrideUrl || wallpaperUrl;

  // Recruiter variant — enterprise vs smb based on plan
  const recruiterVariant = String(plan || '').toLowerCase() === 'enterprise' ? 'enterprise' : 'smb';

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
    : { minHeight: '100vh', backgroundColor: '#ECEFF1' };

  const hasHeader = Boolean(header);
  const hasRight = Boolean(right);
  const effectiveLeftWidth = !isMobile && collapseSiderails ? 0 : leftWidth;
  // Right rail always stays visible — only left collapses
  const effectiveRightWidth = !isMobile ? (hasRight ? rightWidth : 0) : 0;

  const isRightRailAdOnly =
    React.isValidElement(right) && right.type === RightRailPlacementManager;
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
        <RecruiterHeader />
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
            {left ?? <RecruiterSidebar active={activeNav} variant={recruiterVariant} counts={counts} />}
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
                // Right rail always visible — never tied to collapseSiderails
                opacity: 1,
                pointerEvents: 'auto',
                padding: useLightRightRail ? 0 : 16,
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
        <MobileBottomBar isMobile={isMobile} chromeMode="recruiter-ent" onOpenTools={handleOpenTools} />

        {onToggleSiderails && !isMobile && showToggle && (
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#112033' }}>Navigation</div>
              <button
                type="button"
                onClick={() => setMobileToolsOpen(false)}
                aria-label="Close"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, lineHeight: 1, color: '#546E7A' }}
              >
                ×
              </button>
            </div>
            {left ?? <RecruiterSidebar active={activeNav} variant={recruiterVariant} counts={counts} />}
          </div>
        </div>
      )}
    </>
  );
}