// pages/recruiter/analytics/presentation.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { PlanProvider } from "@/context/PlanContext";
import RecruiterAnalyticsLayout from "@/components/layouts/RecruiterAnalyticsLayout";
import ApplicationFunnel from "@/components/analytics/charts/ApplicationFunnel";
import SourceBreakdown from "@/components/analytics/charts/SourceBreakdown";
import RecruiterActivity from "@/components/analytics/charts/RecruiterActivity";
import KPICard from "@/components/analytics/KPICard";

// ─────────────────────────────────────────
// Style tokens — unified with platform
// ─────────────────────────────────────────
const ORANGE = "#FF7043";
const SLATE  = "#334155";
const MUTED  = "#64748B";
const FAINT  = "#94A3B8";

const GLASS = {
  border: "1px solid rgba(255,255,255,0.24)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 8px 28px rgba(15,23,42,0.10)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

const GLASS_SOFT = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.52)",
  boxShadow: "0 4px 16px rgba(15,23,42,0.07)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

// Clean white — used for export targets only
const EXPORT_CARD = {
  background: "#FFFFFF",
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(15,23,42,0.08)",
};

// ─────────────────────────────────────────
// Data hook — unchanged from original
// ─────────────────────────────────────────
function useAnalytics(state) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("range",       state.range);
    p.set("jobId",       state.jobId);
    p.set("recruiterId", state.recruiterId);
    p.set("companyId",   state.companyId);
    if (state.range === "custom") {
      if (state.from) p.set("from", state.from);
      if (state.to)   p.set("to",   state.to);
    }
    return p.toString();
  }, [state]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res  = await fetch(`/api/analytics/recruiter?${qs}`);
        const json = await res.json();
        if (active) setData(json);
      } catch (e) {
        if (active) setError(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => { active = false; clearInterval(id); };
  }, [qs]);

  return { data, loading, error };
}

function getFiltersFromQuery(query) {
  return {
    range:       typeof query.range       === "string" ? query.range       : "30d",
    jobId:       typeof query.jobId       === "string" ? query.jobId       : "all",
    recruiterId: typeof query.recruiterId === "string" ? query.recruiterId : "all",
    companyId:   typeof query.companyId   === "string" ? query.companyId   : "all",
    from:        typeof query.from        === "string" ? query.from        : "",
    to:          typeof query.to          === "string" ? query.to          : "",
  };
}

// ─────────────────────────────────────────
// Export helpers
// ─────────────────────────────────────────
async function exportCardAsPNG(ref, filename, resolution = "standard") {
  if (!ref || typeof window === "undefined") return;
  try {
    const { default: html2canvas } = await import("html2canvas");
    const scale = resolution === "high" ? 3 : 2;
    const canvas = await html2canvas(ref, {
      backgroundColor: "#ffffff",
      scale,
      useCORS: true,
      logging: false,
    });
    const link = document.createElement("a");
    link.download = filename;
    link.href     = canvas.toDataURL("image/png");
    link.click();
  } catch (err) {
    console.error("PNG export failed:", err);
  }
}

// ─────────────────────────────────────────
// Chip — small pill button
// ─────────────────────────────────────────
function Chip({ children, active, onClick, style = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 13px",
        borderRadius: 999,
        border: active
          ? "1px solid transparent"
          : "1px solid rgba(51,65,85,0.14)",
        background: active ? ORANGE : "rgba(255,255,255,0.82)",
        color:      active ? "#fff"  : MUTED,
        fontSize:   12,
        fontWeight: 700,
        cursor:     "pointer",
        transition: "all 130ms ease",
        boxShadow:  active ? "0 4px 10px rgba(255,112,67,0.26)" : "none",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────
// Export button — consistent across cards
// ─────────────────────────────────────────
function ExportBtn({ onClick, loading: exporting }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={exporting}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            5,
        padding:        "6px 12px",
        borderRadius:   999,
        border:         "1px solid rgba(255,112,67,0.22)",
        background:     "rgba(255,112,67,0.09)",
        color:          ORANGE,
        fontSize:       11.5,
        fontWeight:     800,
        cursor:         exporting ? "default" : "pointer",
        opacity:        exporting ? 0.55 : 1,
        transition:     "all 130ms ease",
        whiteSpace:     "nowrap",
        fontFamily:     "inherit",
        flexShrink:     0,
      }}
    >
      {exporting ? "Exporting…" : "⬇ PNG"}
    </button>
  );
}

// ─────────────────────────────────────────
// Gallery card wrapper
// Each card:
//   • Shows a compact preview (scaled-down chart)
//   • Has its own Export PNG button
//   • Clicking the preview opens a focus modal
// ─────────────────────────────────────────
function GalleryCard({ title, period, tag, children, exportRef, filename, resolution, onFocus }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (e) => {
    e.stopPropagation();
    setExporting(true);
    await exportCardAsPNG(exportRef.current, filename, resolution);
    setExporting(false);
  };

  return (
    <div
      style={{
        ...EXPORT_CARD,
        display:        "flex",
        flexDirection:  "column",
        gap:            0,
        cursor:         "pointer",
        transition:     "transform 150ms ease, box-shadow 150ms ease",
        overflow:       "hidden",
      }}
      className="gallery-card"
      onClick={onFocus}
    >
      {/* Card header */}
      <div
        style={{
          padding:        "14px 16px 12px",
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          gap:            10,
          borderBottom:   "1px solid rgba(226,232,240,0.6)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          {tag && (
            <div
              style={{
                fontSize:       9.5,
                fontWeight:     800,
                letterSpacing:  "0.09em",
                textTransform:  "uppercase",
                color:          ORANGE,
                marginBottom:   4,
              }}
            >
              {tag}
            </div>
          )}
          <div
            style={{
              fontSize:   14,
              fontWeight: 800,
              color:      SLATE,
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 11, color: FAINT, marginTop: 3 }}>{period}</div>
        </div>
        <ExportBtn onClick={handleExport} loading={exporting} />
      </div>

      {/* Preview area — scaled chart */}
      <div
        ref={exportRef}
        style={{
          padding:    "16px 14px 14px",
          background: "#ffffff",
          flexGrow:   1,
        }}
      >
        {children}
      </div>

      {/* Focus hint */}
      <div
        style={{
          padding:    "8px 16px",
          borderTop:  "1px solid rgba(226,232,240,0.5)",
          fontSize:   11,
          color:      FAINT,
          fontWeight: 600,
          display:    "flex",
          alignItems: "center",
          gap:        5,
        }}
      >
        <span style={{ opacity: 0.6 }}>🔍</span> Click to preview full size
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Focus modal — full-size preview
// ─────────────────────────────────────────
function FocusModal({ item, periodLabel, resolution, onClose }) {
  const exportRef  = useRef(null);
  const [exporting, setExporting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleExport = async () => {
    setExporting(true);
    await exportCardAsPNG(
      exportRef.current,
      `ForgeTomorrow_${item.title.replace(/\s+/g, "_")}_${periodLabel}.png`,
      resolution
    );
    setExporting(false);
  };

  return (
    <div
      style={{
        position:        "fixed",
        inset:           0,
        zIndex:          500,
        background:      "rgba(15,23,42,0.55)",
        backdropFilter:  "blur(6px)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:   "#fff",
          borderRadius: 20,
          boxShadow:    "0 24px 64px rgba(15,23,42,0.22)",
          width:        "100%",
          maxWidth:     820,
          maxHeight:    "90vh",
          overflow:     "auto",
          display:      "flex",
          flexDirection:"column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{
            padding:        "18px 22px",
            borderBottom:   "1px solid rgba(226,232,240,0.7)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            gap:            12,
            flexShrink:     0,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>{item.title}</div>
            <div style={{ fontSize: 12, color: FAINT, marginTop: 3 }}>{periodLabel}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              style={{
                display:    "inline-flex",
                alignItems: "center",
                gap:        6,
                padding:    "8px 16px",
                borderRadius: 999,
                border:     "none",
                background: ORANGE,
                color:      "#fff",
                fontSize:   13,
                fontWeight: 800,
                cursor:     exporting ? "default" : "pointer",
                opacity:    exporting ? 0.6 : 1,
                boxShadow:  "0 6px 16px rgba(255,112,67,0.26)",
                transition: "all 140ms ease",
                fontFamily: "inherit",
              }}
            >
              {exporting ? "Exporting…" : "⬇ Export PNG"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width:      34,
                height:     34,
                borderRadius: 999,
                border:     "1px solid rgba(51,65,85,0.14)",
                background: "rgba(255,255,255,0.9)",
                color:      MUTED,
                fontSize:   16,
                fontWeight: 700,
                cursor:     "pointer",
                display:    "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal body — the export target */}
        <div
          ref={exportRef}
          style={{
            padding:    "24px 28px 28px",
            background: "#ffffff",
            flexGrow:   1,
          }}
        >
          {item.renderFull()}
        </div>

        <div
          style={{
            padding:    "12px 22px",
            borderTop:  "1px solid rgba(226,232,240,0.6)",
            fontSize:   11,
            color:      FAINT,
            flexShrink: 0,
          }}
        >
          Export is clean PNG — white background, no watermarks. Resize freely in your deck.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// KPI summary — presentation-clean version
// ─────────────────────────────────────────
function KPISummaryExport({ data, loading }) {
  const metrics = [
    { label: "Job Views",       value: data?.kpis?.totalViews       ?? (loading ? "…" : 0) },
    { label: "Applications",    value: data?.kpis?.totalApplies     ?? (loading ? "…" : 0) },
    { label: "Conversion",      value: data ? `${data.kpis.conversionRatePct}%`    : loading ? "…" : "0%" },
    { label: "Avg. Time-to-Fill", value: data ? `${data.kpis.avgTimeToFillDays}d`  : loading ? "…" : "0d" },
    { label: "Interviews",      value: data?.kpis?.totalInterviews  ?? (loading ? "…" : 0) },
    { label: "Hires",           value: data?.kpis?.totalHires       ?? (loading ? "…" : 0) },
  ];

  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap:                 14,
      }}
    >
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            background:   "#F8FAFC",
            borderRadius: 12,
            padding:      "16px 14px",
            textAlign:    "center",
            border:       "1px solid rgba(226,232,240,0.8)",
          }}
        >
          <div
            style={{
              fontSize:       10,
              fontWeight:     700,
              textTransform:  "uppercase",
              letterSpacing:  "0.07em",
              color:          MUTED,
              marginBottom:   8,
            }}
          >
            {m.label}
          </div>
          <div
            style={{
              fontSize:   28,
              fontWeight: 900,
              color:      SLATE,
              lineHeight: 1,
            }}
          >
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Mini KPI summary — compact gallery version
// ─────────────────────────────────────────
function KPISummaryMini({ data, loading }) {
  const metrics = [
    { label: "Views",        value: data?.kpis?.totalViews    ?? (loading ? "…" : 0) },
    { label: "Applications", value: data?.kpis?.totalApplies  ?? (loading ? "…" : 0) },
    { label: "Conversion",   value: data ? `${data.kpis.conversionRatePct}%` : loading ? "…" : "0%" },
    { label: "Hires",        value: data?.kpis?.totalHires    ?? (loading ? "…" : 0) },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            background:   "#F8FAFC",
            borderRadius: 10,
            padding:      "10px 10px",
            border:       "1px solid rgba(226,232,240,0.8)",
          }}
        >
          <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED, marginBottom: 5 }}>
            {m.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: SLATE, lineHeight: 1 }}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Page body
// ─────────────────────────────────────────
function Body() {
  const router = useRouter();

  const [filters, setFilters] = useState(getFiltersFromQuery(router.query));
  const { data, loading, error } = useAnalytics(filters);

  const [resolution, setResolution] = useState("standard");
  const [focusedIndex, setFocusedIndex] = useState(null);

  // Per-card export refs
  const cardRefs = useRef({});
  const getRef = (key) => {
    if (!cardRefs.current[key]) cardRefs.current[key] = React.createRef();
    return cardRefs.current[key];
  };

  useEffect(() => {
    if (!router.isReady) return;
    setFilters(getFiltersFromQuery(router.query));
  }, [router.isReady, router.query]);

  const onFilterChange = useCallback((patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    router.replace(
      {
        pathname: router.pathname,
        query: {
          range:       next.range,
          jobId:       next.jobId,
          recruiterId: next.recruiterId,
          companyId:   next.companyId,
          ...(next.from ? { from: next.from } : {}),
          ...(next.to   ? { to:   next.to   } : {}),
        },
      },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [filters, router]);

  const periodLabel =
    filters.range === "custom" && (filters.from || filters.to)
      ? `${filters.from || "Start"} → ${filters.to || "End"}`
      : `Last ${String(filters.range || "30d").toUpperCase()}`;

  // ── Visual items ──
  // Each item has:
  //   key         — unique identifier
  //   title       — card title
  //   tag         — optional eyebrow
  //   renderMini  — compact version shown in gallery card
  //   renderFull  — full version shown in focus modal + exported
  const visualItems = [
    {
      key:   "kpi",
      title: "KPI Summary",
      tag:   "Performance",
      renderMini: () => <KPISummaryMini data={data} loading={loading} />,
      renderFull: () => <KPISummaryExport data={data} loading={loading} />,
    },
    {
      key:   "funnel",
      title: "Application Funnel",
      tag:   "Conversion",
      renderMini: () => <ApplicationFunnel data={data?.funnel || []} />,
      renderFull: () => (
        <>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
            Conversion flow from initial interest through downstream hiring stages.
          </div>
          <ApplicationFunnel data={data?.funnel || []} />
        </>
      ),
    },
    {
      key:   "sources",
      title: "Source Performance",
      tag:   "Sourcing",
      renderMini: () => <SourceBreakdown data={data?.sources || []} />,
      renderFull: () => (
        <>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
            Where candidate flow is originating for the selected reporting window.
          </div>
          <SourceBreakdown data={data?.sources || []} />
        </>
      ),
    },
    {
      key:   "activity",
      title: "Recruiter Activity Trend",
      tag:   "Productivity",
      renderMini: () => <RecruiterActivity data={data?.recruiterActivity || []} />,
      renderFull: () => (
        <>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
            Recruiter engagement and activity patterns over the selected period.
          </div>
          <RecruiterActivity data={data?.recruiterActivity || []} />
        </>
      ),
    },
  ];

  const focusedItem = focusedIndex !== null ? visualItems[focusedIndex] : null;

  return (
    <RecruiterAnalyticsLayout
      title="Recruiter Analytics — ForgeTomorrow"
      pageTitle="Presentation Visuals"
      pageSubtitle="Export-ready charts for decks, QBRs, and stakeholder reporting. Each visual downloads as a clean PNG — white background, no watermarks."
      activeTab="presentation"
      filters={filters}
      onFilterChange={onFilterChange}
    >
      {/* ── Error ── */}
      {error && (
        <div
          style={{
            borderRadius: 14,
            border:       "1px solid rgba(239,68,68,0.22)",
            background:   "rgba(254,242,242,0.86)",
            color:        "#B91C1C",
            padding:      "12px 16px",
            marginBottom: 16,
            fontSize:     13,
          }}
        >
          {String(error)}
        </div>
      )}

      {/* ── Export control bar ── */}
      <div
        style={{
          ...GLASS,
          borderRadius: 18,
          padding:      "14px 18px",
          display:      "flex",
          alignItems:   "center",
          gap:          12,
          flexWrap:     "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: SLATE, lineHeight: 1.2 }}>
            Presentation Studio
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
            Browse the chart gallery below. Export any visual individually, or download all at once.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
          {/* Resolution toggle */}
          <div
            style={{
              display:      "flex",
              gap:          4,
              padding:      "4px",
              borderRadius: 999,
              background:   "rgba(51,65,85,0.07)",
            }}
          >
            <Chip active={resolution === "standard"} onClick={() => setResolution("standard")}>
              Standard
            </Chip>
            <Chip active={resolution === "high"} onClick={() => setResolution("high")}>
              High-res
            </Chip>
          </div>

          {/* Download all */}
          <button
            type="button"
            onClick={async () => {
              for (const item of visualItems) {
                const ref = cardRefs.current[item.key];
                if (ref?.current) {
                  await exportCardAsPNG(
                    ref.current,
                    `ForgeTomorrow_${item.title.replace(/\s+/g, "_")}_${periodLabel}.png`,
                    resolution
                  );
                }
              }
            }}
            style={{
              display:    "inline-flex",
              alignItems: "center",
              gap:        6,
              padding:    "8px 16px",
              borderRadius: 999,
              border:     "none",
              background: ORANGE,
              color:      "#fff",
              fontSize:   13,
              fontWeight: 800,
              cursor:     "pointer",
              boxShadow:  "0 6px 16px rgba(255,112,67,0.26)",
              transition: "all 140ms ease",
              fontFamily: "inherit",
            }}
          >
            ⬇ Download All
          </button>
        </div>
      </div>

      {/* ── Chart gallery ── */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap:                 18,
        }}
        className="presentation-gallery"
      >
        {visualItems.map((item, index) => (
          <GalleryCard
            key={item.key}
            title={item.title}
            period={periodLabel}
            tag={item.tag}
            exportRef={getRef(item.key)}
            filename={`ForgeTomorrow_${item.title.replace(/\s+/g, "_")}_${periodLabel}.png`}
            resolution={resolution}
            onFocus={() => setFocusedIndex(index)}
          >
            {item.renderMini()}
          </GalleryCard>
        ))}
      </div>

      {/* ── Focus modal ── */}
      {focusedItem && (
        <FocusModal
          item={focusedItem}
          periodLabel={periodLabel}
          resolution={resolution}
          onClose={() => setFocusedIndex(null)}
        />
      )}

      {/* ── Footer note ── */}
      <div
        style={{
          marginTop:  20,
          fontSize:   11.5,
          color:      FAINT,
          textAlign:  "right",
          lineHeight: 1.6,
        }}
      >
        PNG exports are white-background and branding-free. Resize freely in PowerPoint, Google Slides, or Keynote.
      </div>

      {/* ── Responsive gallery styles ── */}
      <style>{`
        .presentation-gallery {
          grid-template-columns: repeat(2, 1fr);
        }
        .gallery-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(15,23,42,0.12) !important;
        }
        @media (max-width: 900px) {
          .presentation-gallery {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 580px) {
          .presentation-gallery {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }
      `}</style>
    </RecruiterAnalyticsLayout>
  );
}

export default function RecruiterAnalyticsPresentationPage() {
  return (
    <PlanProvider>
      <Body />
    </PlanProvider>
  );
}