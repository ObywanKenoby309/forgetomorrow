// components/layouts/RecruiterAnalyticsLayout.js
//
// All mobile/desktop layout decisions are handled by the <style> block below.
// No isMobile state — zero layout flicker on any device.
// RecruiterLayout.js is NOT modified.

import React from "react";
import { useRouter } from "next/router";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

// ─── Design system tokens ─────────────────────────────────────────────────────
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
const SLATE  = "#334155";
const MUTED  = "#64748B";
const GAP    = 12;

const MODE_TABS = [
  { key: "command",      label: "Command Center",       href: "/recruiter/analytics" },
  { key: "reports",      label: "Report Details",       href: "/recruiter/analytics/reports" },
  { key: "presentation", label: "Presentation Visuals", href: "/recruiter/analytics/presentation" },
];

const REPORT_LINKS = [
  { key: "funnel",        label: "Funnel" },
  { key: "sources",       label: "Sources" },
  { key: "recruiters",    label: "Recruiters" },
  { key: "timeToFill",    label: "Time-to-Fill" },
  { key: "qualityOfHire", label: "Quality of Hire" },
  { key: "talentIntel",   label: "Talent Intel" },
];

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border:       active ? `1px solid ${ORANGE}` : "1px solid rgba(51,65,85,0.14)",
        background:   active ? ORANGE : "rgba(255,255,255,0.78)",
        color:        active ? "#fff" : SLATE,
        borderRadius: 999,
        padding:      "8px 14px",
        fontSize:     12.5,
        fontWeight:   800,
        whiteSpace:   "nowrap",
        cursor:       "pointer",
        flexShrink:   0,
        boxShadow:    active ? "0 6px 16px rgba(255,112,67,0.24)" : "none",
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
        border:       active ? `1px solid ${ORANGE}` : "1px solid rgba(51,65,85,0.14)",
        background:   active ? ORANGE : "rgba(255,255,255,0.84)",
        color:        active ? "#fff" : SLATE,
        borderRadius: 999,
        padding:      "6px 12px",
        fontSize:     11.5,
        fontWeight:   800,
        whiteSpace:   "nowrap",
        cursor:       "pointer",
        flexShrink:   0,
      }}
    >
      {children}
    </button>
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

function DefaultRightRail() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ ...GLASS, borderRadius: 18, padding: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: ORANGE, marginBottom: 8 }}>
          Recruiter Intel
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: SLATE, marginBottom: 6 }}>Executive Snapshot</div>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          Use this area for recruiter-facing guidance, quick tips, and short contextual notes
          while the main page handles the analytics workflow.
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

function LabelCell({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, minWidth: 44, paddingTop: 2, whiteSpace: "nowrap", flexShrink: 0 }}>
      {children}
    </div>
  );
}

const SELECT_STYLE = {
  borderRadius: 999, border: "1px solid rgba(51,65,85,0.14)",
  background: "rgba(255,255,255,0.84)", color: SLATE,
  fontSize: 12, fontWeight: 700, padding: "7px 12px", outline: "none",
};

const EXPORT_STYLE = {
  borderRadius: 999, border: "1px solid rgba(51,65,85,0.14)",
  background: "rgba(255,255,255,0.92)", color: SLATE,
  fontSize: 12, fontWeight: 800, padding: "7px 14px",
  cursor: "pointer", whiteSpace: "nowrap",
};

const DATE_INPUT_STYLE = {
  borderRadius: 999, border: "1px solid rgba(51,65,85,0.14)",
  background: "rgba(255,255,255,0.84)", color: SLATE,
  fontSize: 12, fontWeight: 700, padding: "7px 12px", outline: "none",
};

// ─── CSS injected here — scoped to analytics pages only ──────────────────────
// Defines all ft-* classes used by index.js, reports.js, presentation.js.
// RecruiterLayout.js is NOT touched.
const ANALYTICS_CSS = `
  /* ── KPI row ── */
  .ft-kpi-row {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 120px), 1fr));
  }
  @media (max-width: 640px) {
    .ft-kpi-row {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }

  /* ── Stat tiles inside cards ── */
  @media (max-width: 640px) {
    .ft-stat-tiles {
      grid-template-columns: 1fr !important;
    }
  }

  /* ── Desktop charts: visible desktop, FULLY removed on mobile ── */
  .ft-desktop-charts { display: block; }
  @media (max-width: 767px) {
    .ft-desktop-charts {
      display: none !important;
      visibility: hidden !important;
      position: absolute !important;
      pointer-events: none !important;
      height: 0 !important;
      overflow: hidden !important;
    }
  }

  /* ── Mobile carousel: hidden desktop, visible mobile ── */
  .ft-mobile-charts { display: none; }
  @media (max-width: 767px) {
    .ft-mobile-charts { display: block !important; }
  }

  /* ── Analytics root: clips overflow on mobile ── */
  .ft-analytics-root {
    width: 100%;
    min-width: 0;
  }
  @media (max-width: 767px) {
    .ft-analytics-root {
      overflow-x: hidden;
      max-width: 100vw;
    }
  }

  /* ── Timestamp ── */
  @media (max-width: 767px) {
    .ft-bleed-ts {
      margin-right: 0 !important;
      text-align: left !important;
    }
  }

  /* ── Filter strip: horizontal scroll on mobile ── */
  .ft-filter-strip {
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    flex-wrap: nowrap !important;
  }
  .ft-filter-strip::-webkit-scrollbar { display: none; }
  @media (min-width: 768px) {
    .ft-filter-strip {
      overflow-x: visible;
      flex-wrap: wrap !important;
    }
  }

  /* ── Filter row: stack on mobile ── */
  @media (max-width: 767px) {
    .ft-filter-row {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
  }

  /* ── Filter selects + export: full width on mobile ── */
  @media (max-width: 767px) {
    .ft-filter-stack {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .ft-filter-full {
      width: 100% !important;
    }
  }

  /* ── Refresh label ── */
  .ft-refresh-desktop { display: block; }
  .ft-refresh-mobile  { display: none;  }
  @media (max-width: 767px) {
    .ft-refresh-desktop { display: none  !important; }
    .ft-refresh-mobile  { display: block !important; }
  }
`;

export default function RecruiterAnalyticsLayout({
  title        = "Recruiter Analytics — ForgeTomorrow",
  suiteTitle   = "Recruiter Analytics",
  pageSubtitle = "A recruiter analytics command center built for quick reads, deeper report details, and presentation-ready visuals.",
  activeTab    = "command",
  filters,
  onFilterChange,
  children,
  right,
}) {
  const router = useRouter();

  const period       = filters?.range || "30d";
  const activeReport = typeof router.query?.report === "string" ? router.query.report : "funnel";

  const pushWithFilters = (pathname, extraQuery = {}) => {
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
  };

  const rightRail = right || <DefaultRightRail />;

  return (
    <RecruiterLayout title={title} activeNav="analytics" right={rightRail} contentFullBleed>

      {/* Inject analytics-scoped CSS — does not affect any other recruiter page */}
      <style>{ANALYTICS_CSS}</style>

      {/* ft-analytics-root clips horizontal overflow on mobile,
          preventing bleed rows from escaping the viewport */}
      <div className="ft-analytics-root">
        <div style={{ display: "grid", gap: GAP, width: "100%", minWidth: 0 }}>

          {/* ── Page title card ── */}
          <section style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
            <AnalyticsHeader suiteTitle={suiteTitle} subtitle={pageSubtitle} activeTab={activeTab} />
          </section>

          {/* ── Filter bar ── */}
          <section style={{ ...GLASS, borderRadius: 18, padding: 14 }}>
            <div style={{ display: "grid", gap: 10 }}>

              {/* View tabs row */}
              <div className="ft-filter-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
                  <LabelCell>View:</LabelCell>
                  <div className="ft-filter-strip" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                    {MODE_TABS.map((tab) => (
                      <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => pushWithFilters(tab.href)}>
                        {tab.label}
                      </TabButton>
                    ))}
                  </div>
                  {/* Refresh — desktop only */}
                  <div className="ft-refresh-desktop" style={{ flexShrink: 0, marginLeft: 6, textAlign: "left" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>Refresh</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: SLATE }}>30s live</div>
                  </div>
                </div>
                {/* Refresh — mobile only */}
                <div className="ft-refresh-mobile" style={{ fontSize: 11, color: "#94A3B8", paddingLeft: 2 }}>
                  Auto-refresh · <span style={{ fontWeight: 800, color: SLATE }}>30s live</span>
                </div>
              </div>

              {/* Report tabs row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <LabelCell>Report:</LabelCell>
                <div className="ft-filter-strip" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                  {REPORT_LINKS.map((tab) => (
                    <TabButton
                      key={tab.key}
                      active={activeTab === "reports" && activeReport === tab.key}
                      onClick={() => pushWithFilters("/recruiter/analytics/reports", { report: tab.key })}
                    >
                      {tab.label}
                    </TabButton>
                  ))}
                </div>
              </div>

              {/* Period + filters */}
              <div style={{ ...SOFT_GLASS, borderRadius: 12, padding: 14, marginTop: 2 }}>
                {/* Period pills */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <LabelCell>Period:</LabelCell>
                  <div className="ft-filter-strip" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                    {["7d", "30d", "90d", "ytd", "custom"].map((value) => (
                      <FilterPill key={value} active={period === value} onClick={() => onFilterChange?.({ range: value })}>
                        {value.toUpperCase()}
                      </FilterPill>
                    ))}
                  </div>
                </div>

                {/* Selects + Export */}
                <div className="ft-filter-stack" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", marginTop: 10 }}>
                  <select
                    className="ft-filter-full"
                    value={filters?.jobId || "all"}
                    onChange={(e) => onFilterChange?.({ jobId: e.target.value })}
                    style={SELECT_STYLE}
                  >
                    <option value="all">All Jobs</option>
                    <option value="engineering">Engineering</option>
                    <option value="sales">Sales</option>
                    <option value="operations">Operations</option>
                  </select>

                  <select
                    className="ft-filter-full"
                    value={filters?.recruiterId || "all"}
                    onChange={(e) => onFilterChange?.({ recruiterId: e.target.value })}
                    style={SELECT_STYLE}
                  >
                    <option value="all">All Recruiters</option>
                    <option value="ajohnson">A. Johnson</option>
                    <option value="mchen">M. Chen</option>
                    <option value="slee">S. Lee</option>
                  </select>

                  <button
                    type="button"
                    className="ft-filter-full"
                    style={EXPORT_STYLE}
                    onClick={() => {
                      const params = new URLSearchParams({
                        report:      activeTab === "reports" ? activeReport : "overview",
                        range:       filters?.range       || "30d",
                        jobId:       filters?.jobId       || "all",
                        recruiterId: filters?.recruiterId || "all",
                        companyId:   filters?.companyId   || "all",
                        ...(filters?.from ? { from: filters.from } : {}),
                        ...(filters?.to   ? { to:   filters.to }   : {}),
                      });
                      window.open(`/api/analytics/export?${params.toString()}`, "_blank");
                    }}
                  >
                    Export CSV
                  </button>
                </div>

                {/* Custom date range */}
                {period === "custom" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>From</div>
                    <input type="date" value={filters?.from || ""} onChange={(e) => onFilterChange?.({ from: e.target.value })} style={DATE_INPUT_STYLE} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>To</div>
                    <input type="date" value={filters?.to || ""}   onChange={(e) => onFilterChange?.({ to:   e.target.value })} style={DATE_INPUT_STYLE} />
                  </div>
                )}
              </div>
            </div>
          </section>

          {children}
        </div>
      </div>

    </RecruiterLayout>
  );
}