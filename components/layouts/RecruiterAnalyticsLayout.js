// components/layouts/RecruiterAnalyticsLayout.js
//
// Layout blueprint — matches the mockup exactly:
//
// ┌─────────────────────────────────────────┬──────────────┐
// │ Analytics Header + Filter bar (rows 1-2)│  Right Rail  │
// ├─────────────────────────────────────────│  col 2       │
// │ KPI row 6-col              (row 3)      │  rows 1-3    │
// ├─────────────────────────────────────────┴──────────────┤
// │ Executive Ov. │ Recruiter Act. │ Intelligence Panel     │ ← marginLeft: -256 (3-col)
// ├───────────────────────────────────────────────────────  │
// │ Source Perf.  │ App Funnel     │ Report Gateways        │ ← marginLeft: -256 (3-col)
// └────────────────────────────────────────────────────────┘
//
// RecruiterLayout receives:
//   - NO header prop (page owns the internal grid)
//   - right={<RightRail />} so RecruiterLayout renders a real RIGHT_W grid column
//   - contentFullBleed so <main> overflowX clipping is removed for negative-margin rows
//
// LEFT_W = 240, RIGHT_W = 240, GAP = 12 (from RecruiterLayout constants)
// marginLeft for bleed rows = -(LEFT_W + GAP) = -252
// But we're inside <main> which is already right of sidebar, so bleed goes left INTO sidebar area.
// The bottom 3-col rows use marginLeft: -252 + extend right past the right rail too.
// Actually: bottom rows just need to span full viewport content area.
// Strategy: bottom rows get marginLeft: 0 but gridTemplateColumns uses the full available width
// INCLUDING the right rail column by using a negative right margin too.
// RIGHT_W=240 + GAP=12 = 252 right bleed as well.
// So: marginLeft: 0, marginRight: -252 on bottom section container... 
// Wait — let's be precise. RecruiterLayout RIGHT_W=240, GAP=12.
// <main> sits in col 2 of the outer grid (between sidebar col and right col).
// To span INTO right rail: marginRight: -(240 + 12) = -252
// Bottom rows: marginLeft: 0 (already at left edge of content), marginRight: -252
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

// ─── Design system tokens ───────────────────────────────────────────────────
// Radii: 22px page-level | 18px section cards | 12px chips/mini
const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const SOFT_GLASS = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 8px 22px rgba(15,23,42,0.10)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";

const GAP = 12;

const MODE_TABS = [
  { key: "command", label: "Command Center", href: "/recruiter/analytics" },
  { key: "reports", label: "Report Details", href: "/recruiter/analytics/reports" },
  { key: "presentation", label: "Presentation Visuals", href: "/recruiter/analytics/presentation" },
];

const REPORT_LINKS = [
  { key: "funnel", label: "Funnel" },
  { key: "sources", label: "Sources" },
  { key: "recruiters", label: "Recruiters" },
  { key: "timeToFill", label: "Time-to-Fill" },
  { key: "qualityOfHire", label: "Quality of Hire" },
  { key: "talentIntel", label: "Talent Intel" },
];

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `1px solid ${ORANGE}` : "1px solid rgba(51,65,85,0.14)",
        background: active ? ORANGE : "rgba(255,255,255,0.78)",
        color: active ? "#fff" : SLATE,
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 12.5,
        fontWeight: 800,
        whiteSpace: "nowrap",
        cursor: "pointer",
        boxShadow: active ? "0 6px 16px rgba(255,112,67,0.24)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `1px solid ${ORANGE}` : "1px solid rgba(51,65,85,0.14)",
        background: active ? ORANGE : "rgba(255,255,255,0.84)",
        color: active ? "#fff" : SLATE,
        borderRadius: 999,
        padding: "6px 12px",
        fontSize: 11.5,
        fontWeight: 800,
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function AnalyticsHeader({ subtitle, activeTab, suiteTitle = "Recruiter Analytics" }) {
  const activeLabel =
    activeTab === "command"
      ? "Command Center"
      : activeTab === "reports"
      ? "Report Details"
      : "Presentation Visuals";

  return (
    <div style={{ textAlign: "center" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: ORANGE, lineHeight: 1.05, margin: 0 }}>
        {suiteTitle}
      </h1>
      <div style={{ fontSize: 22, fontWeight: 900, color: SLATE, lineHeight: 1.1, marginTop: 2 }}>
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
          Use this area for recruiter-facing guidance, quick tips, and short contextual notes
          while the main page handles the analytics workflow.
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

function LabelCell({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: MUTED,
        minWidth: 44,
        paddingTop: 2,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

const SELECT_STYLE = {
  borderRadius: 999,
  border: "1px solid rgba(51,65,85,0.14)",
  background: "rgba(255,255,255,0.84)",
  color: SLATE,
  fontSize: 12,
  fontWeight: 700,
  padding: "7px 12px",
  outline: "none",
};

const EXPORT_STYLE = {
  borderRadius: 999,
  border: "1px solid rgba(51,65,85,0.14)",
  background: "rgba(255,255,255,0.92)",
  color: SLATE,
  fontSize: 12,
  fontWeight: 800,
  padding: "7px 14px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const DATE_INPUT_STYLE = {
  borderRadius: 999,
  border: "1px solid rgba(51,65,85,0.14)",
  background: "rgba(255,255,255,0.84)",
  color: SLATE,
  fontSize: 12,
  fontWeight: 700,
  padding: "7px 12px",
  outline: "none",
};

// ─── Horizontal scroll strip — used for tab/pill rows on mobile ──────────────
// Hides the scrollbar but keeps it functional (touch + mouse).
const SCROLL_STRIP_BASE = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "none",        // Firefox
  msOverflowStyle: "none",       // IE/Edge legacy
  paddingBottom: 2,              // room for focus rings
};

export default function RecruiterAnalyticsLayout({
  title = "Recruiter Analytics — ForgeTomorrow",
  suiteTitle = "Recruiter Analytics",
  pageSubtitle = "A recruiter analytics command center built for quick reads, deeper report details, and presentation-ready visuals.",
  activeTab = "command",
  filters,
  onFilterChange,
  children,
  right,
}) {
  const router = useRouter();

  // ── Mobile detection (hydration-safe) ──────────────────────────────────────
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const period = filters?.range || "30d";
  const activeReport = typeof router.query?.report === "string" ? router.query.report : "funnel";

  const pushWithFilters = (pathname, extraQuery = {}) => {
    const nextQuery = {
      ...(filters?.range ? { range: filters.range } : {}),
      ...(filters?.jobId ? { jobId: filters.jobId } : {}),
      ...(filters?.recruiterId ? { recruiterId: filters.recruiterId } : {}),
      ...(filters?.companyId ? { companyId: filters.companyId } : {}),
      ...(filters?.from ? { from: filters.from } : {}),
      ...(filters?.to ? { to: filters.to } : {}),
      ...extraQuery,
    };

    router.push({ pathname, query: nextQuery }, undefined, { shallow: false });
  };

  const rightRail = right || <DefaultRightRail />;

  return (
    <RecruiterLayout title={title} activeNav="analytics" right={rightRail} contentFullBleed>
      <div style={{ display: "grid", gap: GAP, width: "100%", minWidth: 0 }}>
        <section style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
          <AnalyticsHeader
            suiteTitle={suiteTitle}
            subtitle={pageSubtitle}
            activeTab={activeTab}
          />
        </section>

        <section style={{ ...GLASS, borderRadius: 18, padding: 14 }}>
          <div style={{ display: "grid", gap: 10 }}>

            {/* ── View tabs row ──────────────────────────────────────────────
                Desktop: flex-wrap. Mobile: horizontal scroll strip (no wrap,
                no squash). The Refresh badge moves below on mobile.          */}
            <div
              style={{
                display: "flex",
                alignItems: isMobile === true ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: 10,
                flexDirection: isMobile === true ? "column" : "row",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
                <LabelCell>View:</LabelCell>
                {/* Scroll strip on mobile, normal flex on desktop */}
                <div
                  style={
                    isMobile === true
                      ? { ...SCROLL_STRIP_BASE, flex: 1 }
                      : { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 }
                  }
                >
                  {MODE_TABS.map((tab) => (
                    <TabButton
                      key={tab.key}
                      active={activeTab === tab.key}
                      onClick={() => pushWithFilters(tab.href)}
                    >
                      {tab.label}
                    </TabButton>
                  ))}
                </div>
                {/* Refresh badge: inline on desktop, hidden here (shown below) on mobile */}
                {!(isMobile === true) && (
                  <div style={{ textAlign: "left", flexShrink: 0, marginLeft: 6 }}>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>Refresh</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: SLATE }}>30s live</div>
                  </div>
                )}
              </div>

              {/* Refresh badge on mobile — sits under the tab row */}
              {isMobile === true && (
                <div style={{ fontSize: 11, color: "#94A3B8", paddingLeft: 2 }}>
                  Auto-refresh · <span style={{ fontWeight: 800, color: SLATE }}>30s live</span>
                </div>
              )}
            </div>

            {/* ── Report tabs row ────────────────────────────────────────────
                Same treatment — scroll strip on mobile.                       */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <LabelCell>Report:</LabelCell>
              <div
                style={
                  isMobile === true
                    ? { ...SCROLL_STRIP_BASE, flex: 1 }
                    : { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 }
                }
              >
                {REPORT_LINKS.map((tab) => (
                  <TabButton
                    key={tab.key}
                    active={activeTab === "reports" && activeReport === tab.key}
                    onClick={() =>
                      pushWithFilters("/recruiter/analytics/reports", { report: tab.key })
                    }
                  >
                    {tab.label}
                  </TabButton>
                ))}
              </div>
            </div>

            {/* ── Period + filters row ───────────────────────────────────────
                Desktop: all in one flex row.
                Mobile: period pills scroll horizontally; selects + export
                stack full-width below.                                        */}
            <div style={{ ...SOFT_GLASS, borderRadius: 12, padding: 14, marginTop: 2 }}>
              {/* Period pills */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <LabelCell>Period:</LabelCell>
                <div
                  style={
                    isMobile === true
                      ? { ...SCROLL_STRIP_BASE, flex: 1 }
                      : { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 }
                  }
                >
                  {["7d", "30d", "90d", "ytd", "custom"].map((value) => (
                    <FilterPill
                      key={value}
                      active={period === value}
                      onClick={() => onFilterChange?.({ range: value })}
                    >
                      {value.toUpperCase()}
                    </FilterPill>
                  ))}
                </div>
              </div>

              {/* Selects + Export — row on desktop, stacked full-width on mobile */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  justifyContent: isMobile === true ? "stretch" : "flex-end",
                  marginTop: 10,
                  ...(isMobile === true ? { flexDirection: "column" } : {}),
                }}
              >
                <select
                  value={filters?.jobId || "all"}
                  onChange={(e) => onFilterChange?.({ jobId: e.target.value })}
                  style={
                    isMobile === true
                      ? { ...SELECT_STYLE, width: "100%" }
                      : SELECT_STYLE
                  }
                >
                  <option value="all">All Jobs</option>
                  <option value="engineering">Engineering</option>
                  <option value="sales">Sales</option>
                  <option value="operations">Operations</option>
                </select>

                <select
                  value={filters?.recruiterId || "all"}
                  onChange={(e) => onFilterChange?.({ recruiterId: e.target.value })}
                  style={
                    isMobile === true
                      ? { ...SELECT_STYLE, width: "100%" }
                      : SELECT_STYLE
                  }
                >
                  <option value="all">All Recruiters</option>
                  <option value="ajohnson">A. Johnson</option>
                  <option value="mchen">M. Chen</option>
                  <option value="slee">S. Lee</option>
                </select>

                <button
                  type="button"
                  style={
                    isMobile === true
                      ? { ...EXPORT_STYLE, width: "100%", textAlign: "center" }
                      : EXPORT_STYLE
                  }
                  onClick={() => {
                    const params = new URLSearchParams({
                      report: activeTab === "reports" ? activeReport : "overview",
                      range: filters?.range || "30d",
                      jobId: filters?.jobId || "all",
                      recruiterId: filters?.recruiterId || "all",
                      companyId: filters?.companyId || "all",
                      ...(filters?.from ? { from: filters.from } : {}),
                      ...(filters?.to ? { to: filters.to } : {}),
                    });
                    window.open(`/api/analytics/export?${params.toString()}`, "_blank");
                  }}
                >
                  Export CSV
                </button>
              </div>

              {/* Custom date range picker */}
              {period === "custom" ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    marginTop: 12,
                    ...(!(isMobile === true) ? { paddingLeft: 54 } : {}),
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>
                    From
                  </div>
                  <input
                    type="date"
                    value={filters?.from || ""}
                    onChange={(e) => onFilterChange?.({ from: e.target.value })}
                    style={
                      isMobile === true
                        ? { ...DATE_INPUT_STYLE, flex: 1, minWidth: 0 }
                        : DATE_INPUT_STYLE
                    }
                  />
                  <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>
                    To
                  </div>
                  <input
                    type="date"
                    value={filters?.to || ""}
                    onChange={(e) => onFilterChange?.({ to: e.target.value })}
                    style={
                      isMobile === true
                        ? { ...DATE_INPUT_STYLE, flex: 1, minWidth: 0 }
                        : DATE_INPUT_STYLE
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {children}
      </div>
    </RecruiterLayout>
  );
}