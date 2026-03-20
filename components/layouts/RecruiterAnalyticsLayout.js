// components/layouts/RecruiterAnalyticsLayout.js
//
// Strategy: always pass contentFullBleed so desktop bleed rows can escape <main>.
// A hard overflowX:hidden wrapper directly inside this layout catches anything
// that would otherwise escape on mobile. The CSS (injected via <style>) hides
// the desktop bleed block and shows the carousel on mobile — no JS involved.
//
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

// ─── Analytics-scoped CSS — injected as <style> tag, scoped to ft-* classes ──
// These classes are only used on analytics pages so there is no bleed to other
// pages. RecruiterLayout is not touched.
const ANALYTICS_CSS = `
  /* Desktop charts — shown on desktop, hidden on mobile */
  .ft-desktop-charts { display: block; }
  @media (max-width: 1023px) {
    .ft-desktop-charts {
      display: none !important;
      height: 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
    }
  }

  /* Mobile carousel — hidden on desktop, shown on mobile */
  .ft-mobile-charts { display: none; }
  @media (max-width: 1023px) {
    .ft-mobile-charts { display: block !important; }
  }

  /* KPI row — 2-col on mobile */
  @media (max-width: 1023px) {
    .ft-kpi-row {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }

  /* Stat tiles inside Executive Snapshot card — 1-col on mobile */
  @media (max-width: 1023px) {
    .ft-stat-tiles {
      grid-template-columns: 1fr !important;
    }
  }

  /* Timestamp — remove bleed margin on mobile */
  @media (max-width: 1023px) {
    .ft-bleed-ts {
      margin-right: 0 !important;
      text-align: left !important;
    }
  }

  /* Filter strip — horizontal scroll on mobile, wrap on desktop */
  .ft-filter-strip {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
  }
  @media (max-width: 1023px) {
    .ft-filter-strip {
      flex-wrap: nowrap !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: none !important;
    }
    .ft-filter-strip::-webkit-scrollbar { display: none; }
  }

  /* Filter row — stack on mobile */
  @media (max-width: 1023px) {
    .ft-filter-row {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
  }

  /* Selects + export — full width stack on mobile */
  @media (max-width: 1023px) {
    .ft-filter-stack {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .ft-filter-full {
      width: 100% !important;
      box-sizing: border-box !important;
    }
  }

  /* Refresh label — swap desktop/mobile versions */
  .ft-refresh-desktop { display: block; }
  .ft-refresh-mobile  { display: none;  }
  @media (max-width: 1023px) {
    .ft-refresh-desktop { display: none  !important; }
    .ft-refresh-mobile  { display: block !important; }
  }
`;

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
    <RecruiterLayout
      title={title}
      activeNav="analytics"
      right={rightRail}
      contentFullBleed
    >
      {/* Analytics-scoped CSS — jsx global required for Next.js to apply media queries */}
      <style jsx global>{ANALYTICS_CSS}</style>

      {/*
        Hard clip wrapper — catches any overflow that escapes RecruiterLayout's
        <main> (which has overflowX removed by contentFullBleed on desktop).
        On mobile the CSS hides ft-desktop-charts entirely so the -252px bleed
        margins never affect layout, and the carousel sits cleanly inside this clip.
      */}
      <div style={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "grid", gap: GAP, width: "100%", minWidth: 0 }}>

          {/* Page title card */}
          <section style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
            <AnalyticsHeader suiteTitle={suiteTitle} subtitle={pageSubtitle} activeTab={activeTab} />
          </section>

          {/* Filter bar */}
          <section style={{ ...GLASS, borderRadius: 18, padding: 14 }}>
            <div style={{ display: "grid", gap: 10 }}>

              {/* View tabs row */}
              <div className="ft-filter-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
                  <LabelCell>View:</LabelCell>
                  <div className="ft-filter-strip">
                    {MODE_TABS.map((tab) => (
                      <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => pushWithFilters(tab.href)}>
                        {tab.label}
                      </TabButton>
                    ))}
                  </div>
                  <div className="ft-refresh-desktop" style={{ flexShrink: 0, marginLeft: 6, textAlign: "left" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>Refresh</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: SLATE }}>30s live</div>
                  </div>
                </div>
                <div className="ft-refresh-mobile" style={{ fontSize: 11, color: "#94A3B8", paddingLeft: 2 }}>
                  Auto-refresh · <span style={{ fontWeight: 800, color: SLATE }}>30s live</span>
                </div>
              </div>

              {/* Report tabs row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <LabelCell>Report:</LabelCell>
                <div className="ft-filter-strip">
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

              {/* Period + selects */}
              <div style={{ ...SOFT_GLASS, borderRadius: 12, padding: 14, marginTop: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <LabelCell>Period:</LabelCell>
                  <div className="ft-filter-strip">
                    {["7d", "30d", "90d", "ytd", "custom"].map((value) => (
                      <FilterPill key={value} active={period === value} onClick={() => onFilterChange?.({ range: value })}>
                        {value.toUpperCase()}
                      </FilterPill>
                    ))}
                  </div>
                </div>

                <div className="ft-filter-stack" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", marginTop: 10 }}>
                  <select className="ft-filter-full" value={filters?.jobId || "all"} onChange={(e) => onFilterChange?.({ jobId: e.target.value })} style={SELECT_STYLE}>
                    <option value="all">All Jobs</option>
                    <option value="engineering">Engineering</option>
                    <option value="sales">Sales</option>
                    <option value="operations">Operations</option>
                  </select>

                  <select className="ft-filter-full" value={filters?.recruiterId || "all"} onChange={(e) => onFilterChange?.({ recruiterId: e.target.value })} style={SELECT_STYLE}>
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