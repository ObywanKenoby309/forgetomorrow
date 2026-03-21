// components/layouts/RecruiterAnalyticsLayout.js
//
// Thin layout shell for all recruiter analytics pages.
// Filter bar logic lives in AnalyticsFilterBar component.
// Data hooks live in hooks/useAnalyticsData.
// Utilities live in lib/analytics/analyticsUtils.

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import AnalyticsFilterBar from "@/components/analytics/AnalyticsFilterBar";

const GLASS = {
  border:               "1px solid rgba(255,255,255,0.22)",
  background:           "rgba(255,255,255,0.68)",
  boxShadow:            "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const ORANGE = "#FF7043";
const SLATE  = "#334155";
const MUTED  = "#64748B";
const GAP    = 12;

function DefaultRightRail() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ ...GLASS, borderRadius: 18, padding: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: ORANGE, marginBottom: 8 }}>
          Recruiter Intel
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: SLATE, marginBottom: 6 }}>Executive Snapshot</div>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          Use this area for recruiter-facing guidance, quick tips, and short contextual notes.
        </div>
      </div>
      <div style={{ ...GLASS, borderRadius: 18, padding: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 8 }}>
          Sponsored
        </div>
        <div style={{ borderRadius: 12, border: "1px dashed rgba(100,116,139,0.24)", background: "rgba(255,255,255,0.60)", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "center", color: "#94A3B8", fontSize: 13, fontWeight: 700 }}>
          Reserved ad / sponsor panel
        </div>
      </div>
    </div>
  );
}

function AnalyticsHeader({ subtitle, activeTab, suiteTitle = "Recruiter Analytics" }) {
  const activeLabel =
    activeTab === "command"      ? "Command Center"       :
    activeTab === "reports"      ? "Report Details"       :
                                   "Presentation Visuals";
  return (
    <div style={{ textAlign: "center" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: ORANGE, lineHeight: 1.05, margin: 0 }}>
        {suiteTitle}
      </h1>
      <div style={{ fontSize: 22, fontWeight: 900, color: SLATE, lineHeight: 1.1, marginTop: 2 }}>
        {activeLabel}
      </div>
      <p style={{ fontSize: 14, color: "#475569", marginTop: 8, maxWidth: 760, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
        {subtitle}
      </p>
    </div>
  );
}

export default function RecruiterAnalyticsLayout({
  title        = "Recruiter Analytics — ForgeTomorrow",
  suiteTitle   = "Recruiter Analytics",
  pageSubtitle = "A recruiter analytics command center built for quick reads, deeper report details, and presentation-ready visuals.",
  activeTab    = "command",
  filters,
  onFilterChange,
  children,
  right,
  isMobile    = false,
  isDesktop   = false,
  mobileShell = false,
}) {
  const router = useRouter();

  // Synchronous isMobile detection — same pattern as SeekerLayout.
  // Reads window.innerWidth immediately in the useState initializer
  // so the correct value is known on frame 1, before any paint.
  // No timeout, no flash, no blank state.
  const [isMounted, setIsMounted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return true;
  });
  const [screenIsMobile, setScreenIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    setIsMounted(true);
    const check = () => setScreenIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Use screenIsMobile to override the isMobile/isDesktop props from the page.
  // This ensures RecruiterLayout always receives the correct props on first paint.
  const resolvedIsMobile  = isMounted ? screenIsMobile : isMobile;
  const resolvedIsDesktop = isMounted ? !screenIsMobile : isDesktop;

  const activeReport = typeof router.query?.report === "string" ? router.query.report : "funnel";
  const rightRail    = right || <DefaultRightRail />;
  const activeRight  = resolvedIsDesktop ? rightRail : null;
  const fullBleed    = resolvedIsDesktop;

  function handleNavigate(pathname, extraQuery = {}) {
    router.push({
      pathname,
      query: {
        ...(filters?.range       ? { range:       filters.range }       : {}),
        ...(filters?.jobId       ? { jobId:       filters.jobId }       : {}),
        ...(filters?.recruiterId ? { recruiterId: filters.recruiterId } : {}),
        ...(filters?.companyId   ? { companyId:   filters.companyId }   : {}),
        ...(filters?.from        ? { from:        filters.from }        : {}),
        ...(filters?.to          ? { to:          filters.to }          : {}),
        ...extraQuery,
      },
    }, undefined, { shallow: false });
  }

  return (
    <RecruiterLayout
      title={title}
      activeNav="analytics"
      right={activeRight}
      contentFullBleed={fullBleed}
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

        {/* Filter bar — self-contained, owns its own isMobile state */}
        <AnalyticsFilterBar
          activeTab={activeTab}
          activeReport={activeReport}
          filters={filters}
          onFilterChange={onFilterChange}
          onNavigate={handleNavigate}
        />

        {children}
      </div>
    </RecruiterLayout>
  );
}