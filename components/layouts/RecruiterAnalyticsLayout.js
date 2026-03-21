// components/layouts/RecruiterAnalyticsLayout.js
//
// Standalone layout for all recruiter analytics pages.
// Does NOT wrap RecruiterLayout — owns its own grid, chrome, wallpaper,
// sidebar, and mobile detection.
//
// Mobile detection strategy:
//   1. Page passes isMobile/isDesktop/mobileShell props (index.js, reports.js, presentation.js)
//   2. Layout reads window.innerWidth synchronously as fallback (SeekerLayout pattern)
//   3. Both agree — no conflict, no desktop-first flash
//
// Desktop grid: 240px sidebar | content (with contentFullBleed for bleed rows) | 240px right rail
// Mobile grid:  single column, right rail not rendered, overflowX hidden

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { usePlan } from "@/context/PlanContext";
import { useUserWallpaper } from "@/hooks/useUserWallpaper";

import RecruiterHeader from "@/components/recruiter/RecruiterHeader";
import RecruiterSidebar from "@/components/recruiter/RecruiterSidebar";
import MobileBottomBar from "@/components/mobile/MobileBottomBar";
import SupportFloatingButton from "@/components/SupportFloatingButton";
import AnalyticsFilterBar from "@/components/analytics/AnalyticsFilterBar";

// ─── Isomorphic layout effect ─────────────────────────────────────────────────
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// ─── Chrome helpers (identical to RecruiterLayout) ────────────────────────────
function normalizeChrome(input) {
  const raw = String(input || "").toLowerCase().trim();
  if (!raw) return "";
  if (["recruiter-ent", "recruiter_enterprise", "enterprise", "ent"].includes(raw)) return "recruiter-ent";
  if (["recruiter-smb", "recruiter_smb", "smb", "recruiter"].includes(raw)) return "recruiter-smb";
  if (raw.startsWith("recruiter")) return raw.includes("ent") ? "recruiter-ent" : "recruiter-smb";
  return "";
}

function setQueryChrome(router, chrome) {
  try {
    if (!router?.isReady) return;
    const next = normalizeChrome(chrome);
    if (!next) return;
    const current = normalizeChrome(router.query?.chrome);
    if (current === next) return;
    router.replace(
      { pathname: router.pathname, query: { ...router.query, chrome: next } },
      undefined,
      { shallow: true, scroll: false }
    );
  } catch {
    /* no-throw */
  }
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";
const GAP = 12;
const PAD = 16;
const LEFT_W = 240;
const RIGHT_W = 240;

// ─── Default right rail ───────────────────────────────────────────────────────
function DefaultRightRail() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ ...GLASS, borderRadius: 18, padding: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: ORANGE,
            marginBottom: 8,
          }}
        >
          Recruiter Intel
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: SLATE, marginBottom: 6 }}>
          Executive Snapshot
        </div>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          Recruiter-facing guidance, quick tips, and contextual notes.
        </div>
      </div>
      <div style={{ ...GLASS, borderRadius: 18, padding: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#94A3B8",
            marginBottom: 8,
          }}
        >
          Sponsored
        </div>
        <div
          style={{
            borderRadius: 12,
            border: "1px dashed rgba(100,116,139,0.24)",
            background: "rgba(255,255,255,0.60)",
            minHeight: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            textAlign: "center",
            color: "#94A3B8",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Reserved ad / sponsor panel
        </div>
      </div>
    </div>
  );
}

// ─── Page title card ──────────────────────────────────────────────────────────
function AnalyticsHeader({ subtitle, activeTab, suiteTitle = "Recruiter Analytics" }) {
  const activeLabel =
    activeTab === "command"
      ? "Command Center"
      : activeTab === "reports"
        ? "Report Details"
        : "Presentation Visuals";

  return (
    <div style={{ textAlign: "center" }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: ORANGE,
          lineHeight: 1.05,
          margin: 0,
        }}
      >
        {suiteTitle}
      </h1>
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: SLATE,
          lineHeight: 1.1,
          marginTop: 2,
        }}
      >
        {activeLabel}
      </div>
      <p
        style={{
          fontSize: 14,
          color: "#475569",
          marginTop: 8,
          maxWidth: 760,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function RecruiterAnalyticsLayout({
  title = "Recruiter Analytics — ForgeTomorrow",
  suiteTitle = "Recruiter Analytics",
  pageSubtitle = "A recruiter analytics command center built for quick reads, deeper report details, and presentation-ready visuals.",
  activeTab = "command",
  filters,
  onFilterChange,
  children,
  right,
  hideDesktopRightRail = false,
  // Props from page — trusted as source of truth when provided
  isMobile: isMobileProp = null,
  isDesktop: isDesktopProp = null,
  mobileShell: mobileShellProp = false,
}) {
  const router = useRouter();
  const { isLoaded: planLoaded, plan, role: planRole } = usePlan();
  const { wallpaperUrl } = useUserWallpaper();

  // ── Profile slug ──────────────────────────────────────────────────────────
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
        const slug = data?.user?.slug || data?.details?.slug || data?.slug || "";
        if (slug) setProfileSlug(String(slug));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // ── Chrome resolution (mirrors RecruiterLayout) ───────────────────────────
  const chromeMode = useMemo(() => {
    const urlChrome = normalizeChrome(router?.query?.chrome);
    const isEnterprise = String(plan || "").toLowerCase() === "enterprise";
    if (urlChrome) return urlChrome;
    if (planLoaded) return isEnterprise ? "recruiter-ent" : "recruiter-smb";
    return "recruiter-smb";
  }, [router?.query?.chrome, planLoaded, plan]);

  useEffect(() => {
    if (!router?.isReady || !planLoaded) return;
    const urlChrome = normalizeChrome(router.query?.chrome);
    const isEnterprise = String(plan || "").toLowerCase() === "enterprise";
    const canonical = isEnterprise ? "recruiter-ent" : "recruiter-smb";
    if (urlChrome === "recruiter-smb" || urlChrome === "recruiter-ent" || !urlChrome) {
      setQueryChrome(router, canonical);
    }
  }, [router?.isReady, router?.query?.chrome, planLoaded, plan]);

  const resolvedVariant = useMemo(() => {
    const c = normalizeChrome(chromeMode);
    return c === "recruiter-ent" ? "enterprise" : "smb";
  }, [chromeMode]);

  // ── isMobile — synchronous detection, syncs with prop from page ──────────
  const [isMobileInternal, setIsMobileInternal] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });

  useIsomorphicLayoutEffect(() => {
    const check = () => setIsMobileInternal(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isMobile = isMobileProp !== null ? isMobileProp : isMobileInternal;
  const isDesktop = !isMobile;

  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  // ── Wallpaper ─────────────────────────────────────────────────────────────
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

  // ── Grid templates ────────────────────────────────────────────────────────
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

  // ── Filter navigation ─────────────────────────────────────────────────────
  const activeReport = typeof router.query?.report === "string" ? router.query.report : "funnel";

  function handleNavigate(pathname, extraQuery = {}) {
    router.push(
      {
        pathname,
        query: {
          ...(filters?.range ? { range: filters.range } : {}),
          ...(filters?.jobId ? { jobId: filters.jobId } : {}),
          ...(filters?.recruiterId ? { recruiterId: filters.recruiterId } : {}),
          ...(filters?.companyId ? { companyId: filters.companyId } : {}),
          ...(filters?.from ? { from: filters.from } : {}),
          ...(filters?.to ? { to: filters.to } : {}),
          ...extraQuery,
        },
      },
      undefined,
      { shallow: false }
    );
  }

  const rightRail = right || <DefaultRightRail />;

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
            paddingRight: isMobile ? PAD : Math.max(8, PAD - 4),
            alignItems: "start",
            boxSizing: "border-box",
            width: "100%",
            maxWidth: "100vw",
            overflowX: "hidden",
            minWidth: 0,
          }}
        >
          {/* Left sidebar — desktop only */}
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
            <RecruiterSidebar
              active="analytics"
              role={planRole || "recruiter"}
              variant={resolvedVariant}
              profileSlug={profileSlug}
            />
          </aside>

          {/* Main content */}
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
            <div style={{ display: "grid", gap: GAP, width: "100%", minWidth: 0 }}>
              {/* Page title card */}
              <section style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
                <AnalyticsHeader
                  suiteTitle={suiteTitle}
                  subtitle={pageSubtitle}
                  activeTab={activeTab}
                />
              </section>

              {/* Filter bar */}
              <AnalyticsFilterBar
                activeTab={activeTab}
                activeReport={activeReport}
                filters={filters}
                onFilterChange={onFilterChange}
                onNavigate={handleNavigate}
              />

              {children}
            </div>
          </main>

          {/* Right rail — desktop only */}
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
                ...GLASS,
                borderRadius: 18,
                padding: 16,
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

      {isMobile && mobileToolsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={() => setMobileToolsOpen(false)}
            aria-label="Dismiss Tools"
            style={{
              position: "absolute",
              inset: 0,
              border: "none",
              background: "rgba(0,0,0,0.55)",
              cursor: "pointer",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(760px, 100%)",
              maxHeight: "82vh",
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              padding: 16,
              boxSizing: "border-box",
              overflowY: "auto",
              boxShadow: "0 -10px 26px rgba(0,0,0,0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: "#112033" }}>Tools</div>
              <button
                type="button"
                onClick={() => setMobileToolsOpen(false)}
                aria-label="Close Tools"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 22,
                  lineHeight: 1,
                  color: "#546E7A",
                }}
              >
                ×
              </button>
            </div>
            <RecruiterSidebar
              active="analytics"
              role={planRole || "recruiter"}
              variant={resolvedVariant}
              profileSlug={profileSlug}
            />
          </div>
        </div>
      )}
    </>
  );
}