// components/analytics/AnalyticsFilterBar.js
//
// Self-contained filter bar for all recruiter analytics pages.
// Owns its own isMobile detection, CSS, and layout logic.
// No external CSS classes needed — all styles are inline or scoped here.
//
// Props:
//   activeTab      — "command" | "reports" | "presentation"
//   filters        — { range, jobId, recruiterId, companyId, from, to }
//   onFilterChange — (patch) => void
//   onNavigate     — (pathname, extraQuery?) => void

import React, { useEffect, useState } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const ORANGE    = "#FF7043";
const SLATE     = "#334155";
const MUTED     = "#64748B";

const GLASS = {
  border:               "1px solid rgba(255,255,255,0.22)",
  background:           "rgba(255,255,255,0.68)",
  boxShadow:            "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const SOFT_GLASS = {
  border:               "1px solid rgba(255,255,255,0.18)",
  background:           "rgba(255,255,255,0.58)",
  boxShadow:            "0 8px 22px rgba(15,23,42,0.10)",
  backdropFilter:       "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

// ─── Navigation config ────────────────────────────────────────────────────────
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

const PERIOD_OPTIONS = ["7d", "30d", "90d", "ytd", "custom"];

// ─── Sub-components ───────────────────────────────────────────────────────────
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

// Scrollable pill strip — horizontal scroll on mobile, wraps on desktop
function PillStrip({ children, isMobile }) {
  return (
    <div style={{
      display:          "flex",
      alignItems:       "center",
      gap:              8,
      overflowX:        isMobile ? "auto" : "visible",
      flexWrap:         isMobile ? "nowrap" : "wrap",
      msOverflowStyle:  "none",
      scrollbarWidth:   "none",
      minWidth:         0,
      flex:             1,
    }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontSize:    11,
      fontWeight:  700,
      color:       MUTED,
      minWidth:    44,
      paddingTop:  2,
      whiteSpace:  "nowrap",
      flexShrink:  0,
    }}>
      {children}
    </div>
  );
}

const SELECT_STYLE = {
  borderRadius: 999,
  border:       "1px solid rgba(51,65,85,0.14)",
  background:   "rgba(255,255,255,0.84)",
  color:        SLATE,
  fontSize:     12,
  fontWeight:   700,
  padding:      "7px 12px",
  outline:      "none",
};

const EXPORT_BTN_STYLE = {
  borderRadius: 999,
  border:       "1px solid rgba(51,65,85,0.14)",
  background:   "rgba(255,255,255,0.92)",
  color:        SLATE,
  fontSize:     12,
  fontWeight:   800,
  padding:      "7px 14px",
  cursor:       "pointer",
  whiteSpace:   "nowrap",
};

const DATE_INPUT_STYLE = {
  borderRadius: 999,
  border:       "1px solid rgba(51,65,85,0.14)",
  background:   "rgba(255,255,255,0.84)",
  color:        SLATE,
  fontSize:     12,
  fontWeight:   700,
  padding:      "7px 12px",
  outline:      "none",
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function AnalyticsFilterBar({
  activeTab      = "command",
  activeReport   = "funnel",
  filters        = {},
  onFilterChange,
  onNavigate,
}) {
  // Own isMobile detection — not inherited from parent
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const period = filters?.range || "30d";

  function handleExport() {
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
  }

  return (
    <section style={{ ...GLASS, borderRadius: 18, padding: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        {/* ── Row 1: View tabs + refresh ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
          <Label>View:</Label>
          <PillStrip isMobile={isMobile}>
            {MODE_TABS.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === tab.key}
                onClick={() => onNavigate?.(tab.href)}
              >
                {tab.label}
              </TabButton>
            ))}
          </PillStrip>
          {!isMobile && (
            <div style={{ flexShrink: 0, marginLeft: 6, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Refresh</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: SLATE }}>30s live</div>
            </div>
          )}
          {isMobile && (
            <div style={{ fontSize: 11, color: "#94A3B8", flexShrink: 0 }}>
              Auto · <span style={{ fontWeight: 800, color: SLATE }}>30s</span>
            </div>
          )}
        </div>

        {/* ── Row 2: Report tabs ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
          <Label>Report:</Label>
          <PillStrip isMobile={isMobile}>
            {REPORT_LINKS.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === "reports" && activeReport === tab.key}
                onClick={() => onNavigate?.("/recruiter/analytics/reports", { report: tab.key })}
              >
                {tab.label}
              </TabButton>
            ))}
          </PillStrip>
        </div>

        {/* ── Row 3: Period + selects ── */}
        <div style={{ ...SOFT_GLASS, borderRadius: 12, padding: 14 }}>

          {/* Period pills + selects on same row (desktop) / stacked (mobile) */}
          <div style={{
            display:    "flex",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap:        10,
            flexWrap:   "wrap",
          }}>
            {/* Period pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
              <Label>Period:</Label>
              <PillStrip isMobile={isMobile}>
                {PERIOD_OPTIONS.map((value) => (
                  <FilterPill
                    key={value}
                    active={period === value}
                    onClick={() => onFilterChange?.({ range: value })}
                  >
                    {value.toUpperCase()}
                  </FilterPill>
                ))}
              </PillStrip>
            </div>

            {/* Selects + Export */}
            <div style={{
              display:    "flex",
              alignItems: "center",
              gap:        10,
              flexWrap:   "wrap",
              marginLeft: isMobile ? 0 : "auto",
              width:      isMobile ? "100%" : "auto",
            }}>
              <select
                value={filters?.jobId || "all"}
                onChange={(e) => onFilterChange?.({ jobId: e.target.value })}
                style={{ ...SELECT_STYLE, width: isMobile ? "100%" : "auto" }}
              >
                <option value="all">All Jobs</option>
                <option value="engineering">Engineering</option>
                <option value="sales">Sales</option>
                <option value="operations">Operations</option>
              </select>

              <select
                value={filters?.recruiterId || "all"}
                onChange={(e) => onFilterChange?.({ recruiterId: e.target.value })}
                style={{ ...SELECT_STYLE, width: isMobile ? "100%" : "auto" }}
              >
                <option value="all">All Recruiters</option>
                <option value="ajohnson">A. Johnson</option>
                <option value="mchen">M. Chen</option>
                <option value="slee">S. Lee</option>
              </select>

              <button
                type="button"
                style={{ ...EXPORT_BTN_STYLE, width: isMobile ? "100%" : "auto" }}
                onClick={handleExport}
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Custom date range */}
          {period === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>From</div>
              <input
                type="date"
                value={filters?.from || ""}
                onChange={(e) => onFilterChange?.({ from: e.target.value })}
                style={DATE_INPUT_STYLE}
              />
              <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>To</div>
              <input
                type="date"
                value={filters?.to || ""}
                onChange={(e) => onFilterChange?.({ to: e.target.value })}
                style={DATE_INPUT_STYLE}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}