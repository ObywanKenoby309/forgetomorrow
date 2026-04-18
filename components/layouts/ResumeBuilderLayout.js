// components/layouts/ResumeBuilderLayout.js
//
// Full-width layout for the Resume Builder.
// Keeps the ForgeTomorrow top nav and wallpaper — removes left sidebar and right ad rail.
// The entire viewport below the nav is the builder canvas.
//
// DO NOT use SeekerLayout on the resume builder page.
// This layout owns that page entirely.
//
// Props:
//   title       — <title> string
//   children    — the 3-zone builder grid
//   forceChrome — optional chrome override (seeker / recruiter-smb / recruiter-ent / coach)

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';
import { usePlan } from '@/context/PlanContext';

import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';

// ✅ Match SeekerLayout: isomorphic layout effect
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const ALLOWED_MODES = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';
  if (ALLOWED_MODES.has(raw)) return raw;
  if (raw === 'recruiter') return 'recruiter-smb';
  if (raw === 'recruiter_smb' || raw === 'smb') return 'recruiter-smb';
  if (raw === 'recruiter-ent' || raw === 'enterprise' || raw === 'ent') return 'recruiter-ent';
  if (raw.startsWith('recruiter')) {
    return raw.includes('ent') ? 'recruiter-ent' : 'recruiter-smb';
  }
  if (raw === 'coach') return 'coach';
  if (raw === 'seeker') return 'seeker';
  return '';
}

export default function ResumeBuilderLayout({
  title = 'Resume Builder | ForgeTomorrow',
  children,
  forceChrome,
}) {
  const router = useRouter();
  const { isLoaded: planLoaded, plan, role } = usePlan();

  // ── Chrome mode (same logic as SeekerLayout) ──────────────────────────────
  const [chromeMode, setChromeMode] = useState(() => {
    return normalizeChrome(forceChrome) || 'seeker';
  });

  useEffect(() => {
    if (!router?.isReady) return;

    const forced = normalizeChrome(forceChrome);
    if (forced) { setChromeMode(forced); return; }

    const urlChrome = normalizeChrome(router.query?.chrome);
    const dbRole = String(role || '').toLowerCase();
    const dbPlan = String(plan || '').toLowerCase();

    const isRecruiterAccount = ['recruiter', 'site_admin', 'owner', 'admin', 'billing'].includes(dbRole);
    const isCoachAccount = dbRole === 'coach';
    const isEnterpriseAccount = dbPlan === 'enterprise';

    const dbPreferred = planLoaded && isRecruiterAccount
      ? isEnterpriseAccount ? 'recruiter-ent' : 'recruiter-smb'
      : planLoaded && isCoachAccount ? 'coach' : 'seeker';

    if (urlChrome === 'recruiter-smb' || urlChrome === 'recruiter-ent') {
      if (planLoaded && isRecruiterAccount) {
        setChromeMode(isEnterpriseAccount ? 'recruiter-ent' : 'recruiter-smb');
        return;
      }
      setChromeMode(urlChrome);
      return;
    }

    if (urlChrome === 'coach' || urlChrome === 'seeker') {
      setChromeMode(urlChrome);
      return;
    }

    if (planLoaded) setChromeMode(dbPreferred);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router?.isReady, router?.query?.chrome, forceChrome, planLoaded, plan, role]);

  // ── Header selection ───────────────────────────────────────────────────────
  const HeaderComp = useMemo(() => {
    switch (chromeMode) {
      case 'coach':        return CoachingHeader;
      case 'recruiter-smb':
      case 'recruiter-ent': return RecruiterHeader;
      default:             return SeekerHeader;
    }
  }, [chromeMode]);

  // ── Sidebar + counts ───────────────────────────────────────────────────────
  const seekerCounts = useSidebarCounts();

  const { SidebarComp, sidebarProps } = useMemo(() => {
    switch (chromeMode) {
      case 'coach':
        return { SidebarComp: CoachingSidebar, sidebarProps: { active: 'resume-cover' } };
      case 'recruiter-smb':
      case 'recruiter-ent':
        return { SidebarComp: RecruiterSidebar, sidebarProps: { active: 'resume-cover' } };
      default:
        return { SidebarComp: SeekerSidebar, sidebarProps: { active: 'resume-cover', counts: seekerCounts } };
    }
  }, [chromeMode, seekerCounts]);

  // ── Mobile ─────────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  });

  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  useIsomorphicLayoutEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Wallpaper ──────────────────────────────────────────────────────────────
  const { wallpaperUrl } = useUserWallpaper();

  const backgroundStyle = wallpaperUrl
    ? {
        minHeight: '100vh',
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: isMobile ? 'scroll' : 'fixed',
      }
    : {
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div style={backgroundStyle}>
        {/* Top nav — same as any other page */}
        <HeaderComp />

        {/* Page: left sidebar | right content+adrail */}
        <div
          style={{
            display: isMobile ? 'block' : 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '240px minmax(0, 1fr)',
            gap: 12,
            alignItems: 'start',
            width: '100%',
            maxWidth: '100vw',
            boxSizing: 'border-box',
            padding: isMobile ? '12px 10px 100px' : '12px 12px 24px',
            overflowX: 'hidden',
          }}
        >
          {/* Left sidebar */}
          {!isMobile && (
            <aside style={{ position: 'sticky', top: 12, alignSelf: 'start', zIndex: 10 }}>
              <SidebarComp {...sidebarProps} />
            </aside>
          )}

          {/* Right side: ad rail top-right + content below spanning full width */}
          <div style={{ minWidth: 0, position: 'relative' }}>
            {/* Ad rail — positioned top right, does not affect content flow */}
            {!isMobile && (
              <div style={{ position: 'absolute', top: 0, right: 0, width: 260, zIndex: 10 }}>
                <RightRailPlacementManager slot="right_rail_1" />
              </div>
            )}

            {/* Builder content — full width, ad rail floats above it */}
            <div style={{ minWidth: 0, paddingRight: isMobile ? 0 : 272 }}>
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar — same as SeekerLayout */}
      <MobileBottomBar
        isMobile={isMobile}
        chromeMode={chromeMode}
        onOpenTools={handleOpenTools}
      />

      {/* Mobile tools sheet — minimal, no sidebar needed for builder */}
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
            aria-label="Dismiss"
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
              <div style={{ fontSize: 14, fontWeight: 800, color: '#112033' }}>
                Resume Builder
              </div>
              <button
                type="button"
                onClick={() => setMobileToolsOpen(false)}
                aria-label="Close"
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
            <SeekerSidebar active="resume-cover" counts={seekerCounts} />
          </div>
        </div>
      )}
    </>
  );
}