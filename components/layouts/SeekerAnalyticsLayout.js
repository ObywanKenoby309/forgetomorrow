// components/layouts/SeekerAnalyticsLayout.js
//
// Dedicated layout for the seeker profile analytics page.
// Mirrors RecruiterAnalyticsLayout structure and patterns exactly,
// but uses seeker chrome (SeekerHeader, SeekerSidebar) and
// seeker-appropriate nav tabs (Overview / Visibility / Strength / Activity).
//
// Mobile detection strategy matches RecruiterAnalyticsLayout:
//   1. Page may pass isMobile/isDesktop props
//   2. Layout reads window.innerWidth synchronously as fallback
//   3. Both agree — no conflict, no desktop-first flash
//
// Desktop grid: 240px sidebar | content | 260px right rail
// Mobile grid:  single column, right rail not rendered

import React, {
  useEffect,
  useIsomorphicLayoutEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { usePlan } from "@/context/PlanContext";
import { useUserWallpaper } from "@/hooks/useUserWallpaper";
import useSidebarCounts from "@/components/hooks/useSidebarCounts";

import SeekerHeader from "@/components/seeker/SeekerHeader";
import SeekerSidebar from "@/components/SeekerSidebar";
import CoachingHeader from "@/components/coaching/CoachingHeader";
import CoachingSidebar from "@/components/coaching/CoachingSidebar";
import RecruiterHeader from "@/components/recruiter/RecruiterHeader";
import RecruiterSidebar from "@/components/recruiter/RecruiterSidebar";
import MobileBottomBar from "@/components/mobile/MobileBottomBar";
import SupportFloatingButton from "@/components/SupportFloatingButton";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";

// ─── Isomorphic layout effect ─────────────────────────────────────────────────
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// ─── Design tokens (matches RecruiterAnalyticsLayout exactly) ─────────────────
const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const ORANGE = "#FF7043";
const SLATE = "#1E293B";
const MUTED = "#64748B";
const GAP = 12;
const PAD = 16;
const LEFT_W = 240;
const RIGHT_W = 260;

// ─── Seeker analytics nav tabs ────────────────────────────────────────────────
// One tab per major section group in profile-analytics.js
const SEEKER_TABS = [
  { id: "overview",    label: "Overview" },
  { id: "visibility",  label: "Visibility" },
  { id: "strength",    label: "Profile Strength" },
  { id: "activity",    label: "Activity" },
];

// ─── Analytics title card ─────────────────────────────────────────────────────
function AnalyticsTitleCard({ title, subtitle, description }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: ORANGE,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          textShadow: "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
          margin: 0,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: SLATE,
          lineHeight: 1.1,
          marginTop: 2,
          letterSpacing: "-0.01em",
        }}
      >
        {subtitle}
      </div>
      <p
        style={{
          fontSize: 14,
          color: MUTED,
          marginTop: 8,
          maxWidth: 680,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.6,
          fontWeight: 600,
        }}
      >
        {description}
      </p>
    </div>
  );
}

// ─── Seeker analytics nav tabs (rendered in PAGE as a normal card, not in layout)
// Exported so profile-analytics.js can import and use it directly.
export function SeekerAnalyticsNavBar({ activeTab, onTabChange, isMobile }) {
  const SEEKER_TABS = [
    { id: "overview",   label: "Overview",         hint: "KPIs + visibility + actions" },
    { id: "visibility", label: "Visibility",        hint: "Reach trend + viewers" },
    { id: "strength",   label: "Profile Strength",  hint: "Completion + momentum" },
    { id: "activity",   label: "Activity",          hint: "Content + connections" },
  ];

  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.22)",
        background: "rgba(255,255,255,0.68)",
        boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: isMobile ? 10 : 12,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))",
          gap: 8,
        }}
      >
        {SEEKER_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                border: active ? "1px solid rgba(255,112,67,0.36)" : "1px solid rgba(51,65,85,0.10)",
                background: active ? "rgba(255,112,67,0.14)" : "rgba(255,255,255,0.62)",
                color: active ? ORANGE : SLATE,
                borderRadius: 14,
                padding: isMobile ? "10px 10px" : "12px 14px",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: active ? "0 6px 16px rgba(255,112,67,0.14)" : "none",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.2 }}>{tab.label}</div>
              {!isMobile && (
                <div style={{ fontSize: 11, color: active ? ORANGE : MUTED, marginTop: 3, fontWeight: 700 }}>
                  {tab.hint}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function SeekerAnalyticsLayout({
  title = "Profile Analytics — ForgeTomorrow",
  suiteTitle = "Profile Analytics",
  pageSubtitle = "Understand how your profile performs, who's viewing it, and what actions will accelerate your visibility.",
  activeTab = "overview",
  onTabChange,
  children,
  right,
  hideDesktopRightRail = false,
  isMobile: isMobileProp = null,
  isDesktop: isDesktopProp = null,
}) {
  const router = useRouter();
  const { plan, role: planRole } = usePlan();
  const { wallpaperUrl } = useUserWallpaper();
  const seekerCounts = useSidebarCounts();

  const [profileSlug, setProfileSlug] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/profile/details", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        const slug =
          data?.user?.slug || data?.details?.slug || data?.slug || "";
        if (slug) setProfileSlug(String(slug));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Respect ?chrome= param so coach/recruiter chrome is preserved when they view this page
  const rawChrome = String(router.query?.chrome || "").toLowerCase().trim();
  const chromeMode = rawChrome === "coach"
    ? "coach"
    : rawChrome === "recruiter-ent" || rawChrome === "enterprise"
      ? "recruiter-ent"
      : rawChrome === "recruiter-smb" || rawChrome === "recruiter" || rawChrome === "smb"
        ? "recruiter-smb"
        : "seeker";

  const isRecruiter     = chromeMode === "recruiter-smb" || chromeMode === "recruiter-ent";
  const isCoach         = chromeMode === "coach";
  const resolvedVariant = chromeMode === "recruiter-ent" ? "enterprise" : "smb";

  const HeaderComp  = isRecruiter ? RecruiterHeader  : isCoach ? CoachingHeader  : SeekerHeader;
  const SidebarComp = isRecruiter ? RecruiterSidebar : isCoach ? CoachingSidebar : SeekerSidebar;

  const [isMobileInternal, setIsMobileInternal] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });

  useIsoLayoutEffect(() => {
    const check = () => setIsMobileInternal(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isMobile = isMobileProp !== null ? isMobileProp : isMobileInternal;
  const isDesktop = isDesktopProp !== null ? isDesktopProp : !isMobile;

  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  const backgroundStyle = wallpaperUrl
    ? {
        minHeight: "100vh",
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: isMobile ? "scroll" : "fixed",
      }
    : { minHeight: "100vh", backgroundColor: "#ECEFF1" };

  const desktopGrid = hideDesktopRightRail
    ? {
        display: "grid",
        gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr)`,
        gridTemplateRows: "1fr",
        gridTemplateAreas: `"left content"`,
      }
    : {
        display: "grid",
        gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr) ${RIGHT_W}px`,
        gridTemplateRows: "1fr",
        gridTemplateAreas: `"left content right"`,
      };

  const mobileGrid = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "auto",
    gridTemplateAreas: `"content"`,
  };

  const gridStyles = isMobile ? mobileGrid : desktopGrid;

  const SEEKER_TAB_LABELS = { overview: "Overview", visibility: "Visibility", strength: "Profile Strength", activity: "Activity" };
  const activeLabel = SEEKER_TAB_LABELS[activeTab] || "Overview";

  const rightRail = right || <RightRailPlacementManager slot="right_rail_1" />;

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
            gap: GAP,
            paddingTop: PAD,
            paddingBottom: isMobile ? PAD + 84 : PAD,
            paddingLeft: PAD,
            paddingRight: isMobile ? PAD : Math.max(8, PAD - 4),
            alignItems: "start",
            boxSizing: "border-box",
            width: "100%",
            maxWidth: "100vw",
            overflowX: "hidden",
            minWidth: 0,
          }}
        >
          {/* ── Desktop sidebar ── */}
          <aside
            style={{
              gridArea: "left",
              alignSelf: "start",
              minWidth: 0,
              position: "relative",
              zIndex: 1,
              display: isMobile ? "none" : "block",
            }}
          >
            <SidebarComp
              active="analytics"
              counts={!isRecruiter && !isCoach ? seekerCounts : undefined}
              profileSlug={profileSlug}
              role={isRecruiter ? (planRole || "recruiter") : undefined}
              variant={isRecruiter ? resolvedVariant : undefined}
            />
          </aside>

          {/* ── Main content ── */}
          <main
            style={{
              gridArea: "content",
              minWidth: 0,
              width: "100%",
              maxWidth: "100%",
              position: "relative",
              zIndex: 1,
              ...(isMobile ? { overflowX: "hidden" } : {}),
            }}
          >
            <div
              style={{
                display: "grid",
                gap: GAP,
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
              }}
            >
              {/* Title card */}
              <section style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
                <AnalyticsTitleCard
                  title={suiteTitle}
                  subtitle={activeLabel}
                  description={pageSubtitle}
                />
              </section>

              {/* Page content — tab nav + inlay rendered by page, matching Sora's pattern */}
              {children}
            </div>
          </main>

          {/* ── Desktop right rail ── */}
          {isDesktop && !hideDesktopRightRail && (
            <aside
              style={{
                gridArea: "right",
                alignSelf: "start",
                width: RIGHT_W,
                minWidth: RIGHT_W,
                maxWidth: RIGHT_W,
                minInlineSize: 0,
                boxSizing: "border-box",
                position: "relative",
                zIndex: 1,
                borderRadius: 18,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                background: "transparent",
                border: "none",
                boxShadow: "none",
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
              }}
            >
              {rightRail}
            </aside>
          )}
        </div>
      </div>

      <SupportFloatingButton />

      <MobileBottomBar
        isMobile={isMobile}
        chromeMode={chromeMode}
        onOpenTools={handleOpenTools}
      />

      {/* ── Mobile sidebar drawer ── */}
      {isMobile && mobileToolsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            pointerEvents: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setMobileToolsOpen(false)}
            aria-label="Dismiss menu"
            style={{
              position: "absolute",
              inset: 0,
              border: "none",
              background: "rgba(0,0,0,0.38)",
              cursor: "pointer",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(320px, 80vw)",
              minWidth: 240,
              maxWidth: 280,
              maxHeight: "82vh",
              marginBottom: "calc(70px + env(safe-area-inset-bottom))",
              borderTopRightRadius: 18,
              borderBottomRightRadius: 18,
              border: "1px solid rgba(255,255,255,0.18)",
              background:
                "linear-gradient(180deg, rgba(13,27,42,0.96), rgba(18,32,48,0.92))",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              padding: "10px 10px 12px",
              boxSizing: "border-box",
              overflowY: "auto",
              boxShadow: "14px -14px 38px rgba(0,0,0,0.38)",
            }}
          >
            <SidebarComp
              active="analytics"
              counts={!isRecruiter && !isCoach ? seekerCounts : undefined}
              profileSlug={profileSlug}
              role={isRecruiter ? (planRole || "recruiter") : undefined}
              variant={isRecruiter ? resolvedVariant : undefined}
            />
          </div>
        </div>
      )}
    </>
  );
}