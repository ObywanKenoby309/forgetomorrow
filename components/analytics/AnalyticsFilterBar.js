// components/analytics/AnalyticsFilterBar.js
//
// Self-contained filter bar for all recruiter analytics pages.
// Owns its own isMobile detection and layout logic entirely in JavaScript.
// No external CSS classes — no specificity battles.
//
// Desktop: View row | Report row | Period + selects on same line
// Mobile:  View strip | Report strip | Period strip | Selects 50/50 | Export full-width
//
// Active tab always scrolled into view on mobile via ScrollStrip.
//
// Props:
//   activeTab      — "command" | "reports" | "presentation"
//   activeReport   — active report key e.g. "funnel"
//   filters        — { range, jobId, recruiterId, companyId, from, to }
//   onFilterChange — (patch) => void
//   onNavigate     — (pathname, extraQuery?) => void

import React, { useEffect, useRef, useState } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const ORANGE = "#FF7043";
const SLATE  = "#334155";
const MUTED  = "#64748B";

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

// ─── ScrollStrip ──────────────────────────────────────────────────────────────
// Scrolls the active item into view when activeIndex changes.
function ScrollStrip({ children, activeIndex, isMobile }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isMobile || !ref.current) return;
    const active = ref.current.children[activeIndex];
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeIndex, isMobile]);

  return (
    <div
      ref={ref}
      style={{
        display:                 "flex",
        alignItems:              "center",
        gap:                     8,
        overflowX:               isMobile ? "auto" : "visible",
        flexWrap:                isMobile ? "nowrap" : "wrap",
        msOverflowStyle:         "none",
        scrollbarWidth:          "none",
        WebkitOverflowScrolling: "touch",
        minWidth:                0,
        flex:                    1,
      }}
    >
      {children}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TabButton({ active, onClick, children, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border:       active ? `1px solid ${ORANGE}` : "1px solid rgba(51,65,85,0.14)",
        background:   active ? ORANGE : "rgba(255,255,255,0.78)",
        color:        active ? "#fff" : SLATE,
        borderRadius: 999,
        padding:      small ? "6px 11px" : "8px 14px",
        fontSize:     small ? 11.5 : 12.5,
        fontWeight:   800,
        whiteSpace:   "nowrap",
        cursor:       "pointer",
        flexShrink:   0,
        boxShadow:    active ? "0 4px 12px rgba(255,112,67,0.22)" : "none",
        transition:   "all 120ms ease",
      }}
    >
      {children}
    </button>
  );
}

function FilterPill({ active, onClick, children, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border:       active ? `1px solid ${ORANGE}` : "1px solid rgba(51,65,85,0.14)",
        background:   active ? ORANGE : "rgba(255,255,255,0.84)",
        color:        active ? "#fff" : SLATE,
        borderRadius: 999,
        padding:      small ? "5px 10px" : "6px 12px",
        fontSize:     small ? 11 : 11.5,
        fontWeight:   800,
        whiteSpace:   "nowrap",
        cursor:       "pointer",
        flexShrink:   0,
        transition:   "all 120ms ease",
      }}
    >
      {children}
    </button>
  );
}

function Label({ children, small }) {
  return (
    <div style={{
      fontSize:      small ? 10 : 11,
      fontWeight:    700,
      color:         MUTED,
      minWidth:      small ? 36 : 44,
      paddingTop:    2,
      whiteSpace:    "nowrap",
      flexShrink:    0,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
    }}>
      {children}
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────
const SELECT_DESKTOP = {
  borderRadius: 999, border: "1px solid rgba(51,65,85,0.14)",
  background: "rgba(255,255,255,0.84)", color: SLATE,
  fontSize: 12, fontWeight: 700, padding: "7px 12px", outline: "none",
};

const SELECT_MOBILE = {
  borderRadius: 10, border: "1px solid rgba(51,65,85,0.14)",
  background: "rgba(255,255,255,0.84)", color: SLATE,
  fontSize: 12, fontWeight: 700, padding: "8px 10px",
  outline: "none", width: "100%",
};

const EXPORT_DESKTOP = {
  borderRadius: 999, border: "1px solid rgba(51,65,85,0.14)",
  background: "rgba(255,255,255,0.92)", color: SLATE,
  fontSize: 12, fontWeight: 800, padding: "7px 14px",
  cursor: "pointer", whiteSpace: "nowrap",
};

const EXPORT_MOBILE = {
  borderRadius: 10, border: "none",
  background: ORANGE, color: "#fff",
  fontSize: 13, fontWeight: 800, padding: "10px 0",
  cursor: "pointer", width: "100%",
  boxShadow: "0 4px 12px rgba(255,112,67,0.28)",
};

const DATE_INPUT = {
  borderRadius: 999, border: "1px solid rgba(51,65,85,0.14)",
  background: "rgba(255,255,255,0.84)", color: SLATE,
  fontSize: 12, fontWeight: 700, padding: "7px 12px", outline: "none",
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function AnalyticsFilterBar({
  activeTab    = "command",
  activeReport = "funnel",
  filters      = {},
  onFilterChange,
  onNavigate,
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const period = filters?.range || "30d";

  const activeModeIdx   = MODE_TABS.findIndex((t) => t.key === activeTab);
  const activeReportIdx = REPORT_LINKS.findIndex((t) => t.key === activeReport);
  const activePeriodIdx = PERIOD_OPTIONS.indexOf(period);

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

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <section style={{ ...GLASS, borderRadius: 18, padding: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* View strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <Label small>View</Label>
            <ScrollStrip activeIndex={activeModeIdx} isMobile>
              {MODE_TABS.map((tab) => (
                <TabButton
                  key={tab.key}
                  active={activeTab === tab.key}
                  onClick={() => onNavigate?.(tab.href)}
                  small
                >
                  {tab.label}
                </TabButton>
              ))}
            </ScrollStrip>
          </div>

          {/* Report strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <Label small>Report</Label>
            <ScrollStrip activeIndex={activeReportIdx} isMobile>
              {REPORT_LINKS.map((tab) => (
                <TabButton
                  key={tab.key}
                  active={activeTab === "reports" && activeReport === tab.key}
                  onClick={() => onNavigate?.("/recruiter/analytics/reports", { report: tab.key })}
                  small
                >
                  {tab.label}
                </TabButton>
              ))}
            </ScrollStrip>
          </div>

          {/* Period strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <Label small>Period</Label>
            <ScrollStrip activeIndex={activePeriodIdx} isMobile>
              {PERIOD_OPTIONS.map((value) => (
                <FilterPill
                  key={value}
                  active={period === value}
                  onClick={() => onFilterChange?.({ range: value })}
                  small
                >
                  {value.toUpperCase()}
                </FilterPill>
              ))}
            </ScrollStrip>
          </div>

          {/* Custom date inputs */}
          {period === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>From</div>
              <input
                type="date"
                value={filters?.from || ""}
                onChange={(e) => onFilterChange?.({ from: e.target.value })}
                style={{ ...DATE_INPUT, flex: 1, minWidth: 120 }}
              />
              <div style={{ fontSize: 11, fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>To</div>
              <input
                type="date"
                value={filters?.to || ""}
                onChange={(e) => onFilterChange?.({ to: e.target.value })}
                style={{ ...DATE_INPUT, flex: 1, minWidth: 120 }}
              />
            </div>
          )}

          {/* Selects — 50/50 grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select
              value={filters?.jobId || "all"}
              onChange={(e) => onFilterChange?.({ jobId: e.target.value })}
              style={SELECT_MOBILE}
            >
              <option value="all">All Jobs</option>
              <option value="engineering">Engineering</option>
              <option value="sales">Sales</option>
              <option value="operations">Operations</option>
            </select>

            <select
              value={filters?.recruiterId || "all"}
              onChange={(e) => onFilterChange?.({ recruiterId: e.target.value })}
              style={SELECT_MOBILE}
            >
              <option value="all">All Recruiters</option>
              <option value="ajohnson">A. Johnson</option>
              <option value="mchen">M. Chen</option>
              <option value="slee">S. Lee</option>
            </select>
          </div>

          {/* Export — full width, orange on mobile */}
          <button type="button" style={EXPORT_MOBILE} onClick={handleExport}>
            ↓ Export CSV
          </button>

        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DESKTOP LAYOUT
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section style={{ ...GLASS, borderRadius: 18, padding: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Row 1: View tabs + refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Label>View:</Label>
          <ScrollStrip activeIndex={activeModeIdx} isMobile={false}>
            {MODE_TABS.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === tab.key}
                onClick={() => onNavigate?.(tab.href)}
              >
                {tab.label}
              </TabButton>
            ))}
          </ScrollStrip>
          <div style={{ flexShrink: 0, marginLeft: 6, textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>Refresh</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: SLATE }}>30s live</div>
          </div>
        </div>

        {/* Row 2: Report tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Label>Report:</Label>
          <ScrollStrip activeIndex={activeReportIdx} isMobile={false}>
            {REPORT_LINKS.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === "reports" && activeReport === tab.key}
                onClick={() => onNavigate?.("/recruiter/analytics/reports", { report: tab.key })}
              >
                {tab.label}
              </TabButton>
            ))}
          </ScrollStrip>
        </div>

        {/* Row 3: Period pills + selects on same line */}
        <div style={{ ...SOFT_GLASS, borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Label>Period:</Label>
              <ScrollStrip activeIndex={activePeriodIdx} isMobile={false}>
                {PERIOD_OPTIONS.map((value) => (
                  <FilterPill
                    key={value}
                    active={period === value}
                    onClick={() => onFilterChange?.({ range: value })}
                  >
                    {value.toUpperCase()}
                  </FilterPill>
                ))}
              </ScrollStrip>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexWrap: "wrap" }}>
              <select
                value={filters?.jobId || "all"}
                onChange={(e) => onFilterChange?.({ jobId: e.target.value })}
                style={SELECT_DESKTOP}
              >
                <option value="all">All Jobs</option>
                <option value="engineering">Engineering</option>
                <option value="sales">Sales</option>
                <option value="operations">Operations</option>
              </select>

              <select
                value={filters?.recruiterId || "all"}
                onChange={(e) => onFilterChange?.({ recruiterId: e.target.value })}
                style={SELECT_DESKTOP}
              >
                <option value="all">All Recruiters</option>
                <option value="ajohnson">A. Johnson</option>
                <option value="mchen">M. Chen</option>
                <option value="slee">S. Lee</option>
              </select>

              <button type="button" style={EXPORT_DESKTOP} onClick={handleExport}>
                Export CSV
              </button>
            </div>
          </div>

          {/* Custom date range */}
          {period === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>From</div>
              <input type="date" value={filters?.from || ""} onChange={(e) => onFilterChange?.({ from: e.target.value })} style={DATE_INPUT} />
              <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>To</div>
              <input type="date" value={filters?.to || ""}   onChange={(e) => onFilterChange?.({ to: e.target.value })}   style={DATE_INPUT} />
            </div>
          )}
        </div>

      </div>
    </section>
  );
}