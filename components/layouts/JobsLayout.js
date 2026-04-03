import React, { useMemo, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePlan } from '@/context/PlanContext';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';

import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';
import MobileBottomBar from '@/components/mobile/MobileBottomBar';

const ALLOWED_MODES = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const KPI_GLASS = {
  ...GLASS,
  background: 'rgba(255,255,255,0.68)',
  boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
};

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';

  if (ALLOWED_MODES.has(raw)) return raw;

  if (raw.startsWith('recruiter')) {
    if (raw.includes('ent') || raw.includes('enterprise')) return 'recruiter-ent';
    return 'recruiter-smb';
  }

  if (raw === 'coach') return 'coach';
  return 'seeker';
}

export default function JobsLayout({
  title = 'ForgeTomorrow - Jobs',
  children,
  activeNav = 'jobs',
}) {
  const router = useRouter();
  const { plan, role } = usePlan();

  const [isMobile, setIsMobile] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 1024);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chromeMode = useMemo(() => {
    const urlChrome = normalizeChrome(router.query?.chrome);
    if (urlChrome) return urlChrome;

    const dbRole = String(role || '').toLowerCase();
    const dbPlan = String(plan || '').toLowerCase();

    if (dbRole === 'coach') return 'coach';

    if (
      dbRole === 'recruiter' ||
      dbRole === 'site_admin' ||
      dbRole === 'owner' ||
      dbRole === 'admin' ||
      dbRole === 'billing'
    ) {
      return dbPlan === 'enterprise' ? 'recruiter-ent' : 'recruiter-smb';
    }

    return 'seeker';
  }, [router.query?.chrome, role, plan]);

  const handleOpenTools = () => setMobileToolsOpen(true);

  const { HeaderComp, SidebarComp, sidebarProps } = useMemo(() => {
    switch (chromeMode) {
      case 'coach':
        return {
          HeaderComp: CoachingHeader,
          SidebarComp: CoachingSidebar,
          sidebarProps: { active: activeNav },
        };
      case 'recruiter-smb':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: { active: activeNav, variant: 'smb' },
        };
      case 'recruiter-ent':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: { active: activeNav, variant: 'enterprise' },
        };
      default:
        return {
          HeaderComp: SeekerHeader,
          SidebarComp: SeekerSidebar,
          sidebarProps: { active: activeNav },
        };
    }
  }, [chromeMode, activeNav]);

    return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <HeaderComp />

      {isMobile ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 12,
            padding: '12px 12px 96px',
            alignItems: 'start',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <main style={{ width: '100%', minWidth: 0 }}>
            {children}
          </main>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '240px minmax(0, 1fr) 260px',
            gap: 12,
            padding: 16,
            alignItems: 'start',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <aside style={{ minWidth: 0 }}>
            <SidebarComp {...sidebarProps} />
          </aside>

          <main style={{ width: '100%', minWidth: 0 }}>
            {children}
          </main>

          <aside
            aria-label="Sponsored"
            style={{
              ...KPI_GLASS,
              padding: 14,
              minWidth: 0,
              boxSizing: 'border-box',
              alignSelf: 'start',
              position: 'sticky',
              top: 16,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                marginBottom: 8,
                fontSize: 15,
                color: '#0F172A',
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
              }}
            >
              Sponsored
            </div>

            <div style={{ ...GLASS, padding: 10 }}>
              <RightRailPlacementManager slot="right_rail_1" />
            </div>
          </aside>
        </div>
      )}

      <MobileBottomBar
        isMobile={isMobile}
        chromeMode={chromeMode}
        onOpenTools={handleOpenTools}
      />

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

            <SidebarComp {...sidebarProps} />
          </div>
        </div>
      )}
    </>
  );
}