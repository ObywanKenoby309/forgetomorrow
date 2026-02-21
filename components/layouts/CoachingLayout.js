// components/layouts/CoachingLayout.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';

import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import SupportFloatingButton from '@/components/SupportFloatingButton';

// ✅ NEW: Plan gating for AI Partner
import { usePlan } from '@/context/PlanContext';

// ✅ NEW: Desktop AI Partner (floating orb + 1 window per mode)
import AiWindowsHost from '@/components/ai/AiWindowsHost';

const UI = {
  GAP: 12,
  PAD: 16,
  LEFT_W: 240,
  RIGHT_W: 240,
  CARD_PAD: 14,
};

const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

// ✅ NEW: AI Partner entitlement for coaching layout (Prisma enums)
// Only COACH with plan COACH gets the AI Partner orb/windows here.
// Allowed modes: seeker + coach
function getCoachAiPartnerAccess(planLoaded, role, plan) {
  if (!planLoaded) return { enabled: false, modes: [] };

  const r = String(role || '').toUpperCase().trim(); // COACH | ...
  const p = String(plan || '').toUpperCase().trim(); // COACH | ...

  const enabled = r === 'COACH' && p === 'COACH';
  if (!enabled) return { enabled: false, modes: [] };

  return { enabled: true, modes: ['seeker', 'coach'] };
}

export default function CoachingLayout({
  title = 'ForgeTomorrow — Coaching',
  header,
  headerTitle = '',
  headerDescription = '',
  left,
  right,
  children,
  activeNav = 'overview',
  sidebarInitialOpen,
  employee = false,
  department = '',

  // ✅ Same pattern as RecruiterLayout — dashboard opts in, all other pages unaffected
  contentFullBleed = false,
}) {
  const defaultFromNav =
    {
      overview: 'Your Coaching Dashboard',
      clients: 'Clients',
      sessions: 'Sessions',
      resources: 'Resources',
      feedback: 'Feedback',
      jobs: 'To The Pipeline',
      calendar: 'Calendar',
    }[activeNav] || 'Coaching';

  const pageTitle = headerTitle || defaultFromNav;
  const hasRight = Boolean(right);
  const hasHeader = Boolean(header);

  // ✅ PlanContext (DB-first)
  const { isLoaded: planLoaded, plan, role } = usePlan();

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

  // ✅ Matches RecruiterLayout: no header + no right = Seeker-style page-owned layout
  const desktopGrid = (!hasHeader && !hasRight)
    ? {
        display: 'grid',
        gridTemplateColumns: `${UI.LEFT_W}px minmax(0, 1fr)`,
        gridTemplateRows: '1fr',
        gridTemplateAreas: `"left content"`,
      }
    : {
        display: 'grid',
        gridTemplateColumns: `${UI.LEFT_W}px minmax(0, 1fr) ${hasRight ? `${UI.RIGHT_W}px` : '0px'}`,
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
      ? `"header" "content" "right"`
      : `"header" "content"`,
  };

  const gridStyles = isMobile ? mobileGrid : desktopGrid;
  const chromeMode = 'coach';

  // ✅ Same stacking strategy as RecruiterLayout
  const leftRailLayer = { position: 'relative', zIndex: 10 };
  const mainOverrides = { position: 'relative', zIndex: 1 };

  // ✅ NEW: AI Partner access (desktop-only render for now)
  const aiAccess = useMemo(() => getCoachAiPartnerAccess(planLoaded, role, plan), [planLoaded, role, plan]);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <CoachingHeader />

      <div
        style={{
          ...gridStyles,
          gap: UI.GAP,
          paddingTop: UI.PAD,
          paddingBottom: isMobile ? UI.PAD + 84 : UI.PAD,
          paddingLeft: UI.PAD,
          paddingRight: hasRight ? Math.max(8, UI.PAD - 4) : UI.PAD,
          alignItems: 'start',
          boxSizing: 'border-box',
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
            display: isMobile ? 'none' : 'block',
            minWidth: 0,
          }}
        >
          {left || (
            <CoachingSidebar
              initialOpen={sidebarInitialOpen}
              active={activeNav}
              employee={employee}
              department={department}
            />
          )}
        </aside>

        {/* Header (ONLY if provided — dashboard does NOT pass this) */}
        {hasHeader ? (
          <header style={{ gridArea: 'header', alignSelf: 'start', marginTop: 0, paddingTop: 0, minWidth: 0 }}>
            {header ?? (
              <section
                style={{
                  borderRadius: 14,
                  padding: UI.CARD_PAD,
                  textAlign: 'center',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  ...GLASS,
                }}
                aria-label="Coaching overview"
              >
                <h1 style={{ margin: 0, color: '#FF7043', fontSize: 22, fontWeight: 900 }}>{pageTitle}</h1>
                {headerDescription && (
                  <p style={{ margin: '6px auto 0', color: '#455A64', maxWidth: 760, fontWeight: 600 }}>
                    {headerDescription}
                  </p>
                )}
              </section>
            )}
          </header>
        ) : null}

        {/* Right rail (ONLY if provided) */}
        {hasRight && (
          <aside
            style={{
              gridArea: 'right',
              alignSelf: 'start',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              minHeight: 120,
              boxSizing: 'border-box',
              width: isMobile ? '100%' : UI.RIGHT_W,
              minWidth: isMobile ? 0 : UI.RIGHT_W,
              maxWidth: isMobile ? '100%' : UI.RIGHT_W,
              minInlineSize: 0,
              color: 'white',
            }}
          >
            {right}
          </aside>
        )}

        {/* Main content */}
        <main
          style={{
            gridArea: 'content',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            // ✅ Only remove overflow clipping for dashboard (contentFullBleed).
            // All other coaching pages keep overflowX: 'hidden' for mobile safety.
            ...(!contentFullBleed ? { overflowX: 'hidden' } : {}),
            ...mainOverrides,
          }}
        >
          <div style={{ display: 'grid', gap: UI.GAP, width: '100%', minWidth: 0, maxWidth: '100%' }}>
            {children}
          </div>
        </main>
      </div>

      <SupportFloatingButton />
      <MobileBottomBar isMobile={isMobile} chromeMode={chromeMode} onOpenTools={handleOpenTools} />

      {/* ✅ NEW: Desktop AI Partner (Coach only; allows Seeker + Coach modes) */}
      {!isMobile && aiAccess.enabled ? <AiWindowsHost allowedModes={aiAccess.modes} /> : null}

      {isMobile && mobileToolsOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setMobileToolsOpen(false)}
            aria-label="Dismiss Tools"
            style={{ position: 'absolute', inset: 0, border: 'none', background: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}
          />
          <div
            style={{
              position: 'relative', zIndex: 1, width: 'min(760px, 100%)', maxHeight: '82vh',
              borderTopLeftRadius: 18, borderTopRightRadius: 18,
              border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              padding: 16, boxSizing: 'border-box', overflowY: 'auto',
              boxShadow: '0 -10px 26px rgba(0,0,0,0.22)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#112033' }}>Tools</div>
              <button
                type="button"
                onClick={() => setMobileToolsOpen(false)}
                aria-label="Close Tools"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, lineHeight: 1, color: '#546E7A' }}
              >×</button>
            </div>
            {left || (
              <CoachingSidebar
                initialOpen={sidebarInitialOpen}
                active={activeNav}
                employee={employee}
                department={department}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}