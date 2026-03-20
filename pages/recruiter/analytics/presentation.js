// pages/recruiter/analytics/presentation.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { PlanProvider } from "@/context/PlanContext";
import RecruiterAnalyticsLayout from "@/components/layouts/RecruiterAnalyticsLayout";
import ApplicationFunnel from "@/components/analytics/charts/ApplicationFunnel";
import SourceBreakdown from "@/components/analytics/charts/SourceBreakdown";
import RecruiterActivity from "@/components/analytics/charts/RecruiterActivity";

// ─────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────
const ORANGE = "#FF7043";
const SLATE  = "#334155";
const MUTED  = "#64748B";
const FAINT  = "#94A3B8";

const GLASS = {
  border:               "1px solid rgba(255,255,255,0.22)",
  background:           "rgba(255,255,255,0.68)",
  boxShadow:            "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

// ─────────────────────────────────────────
// Preview geometry
// Adjust PREVIEW_SCALE to make thumbnails
// larger or smaller. Everything else adapts.
// ─────────────────────────────────────────
const PREVIEW_H     = 140; // visible height of the scaled preview area (px)
const PREVIEW_SCALE = 0.40; // 40% of the chart's natural size

// ─────────────────────────────────────────
// Data hook
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
    const load = async () => {
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
    load();
    const id = setInterval(load, 30000);
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
// PNG export
// ─────────────────────────────────────────
async function exportAsPNG(el, filename, resolution = "standard") {
  if (!el || typeof window === "undefined") return;
  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale:           resolution === "high" ? 3 : 2,
      useCORS:         true,
      logging:         false,
    });
    const a    = document.createElement("a");
    a.download = filename;
    a.href     = canvas.toDataURL("image/png");
    a.click();
  } catch (err) {
    console.error("PNG export failed:", err);
  }
}

// ─────────────────────────────────────────
// ScaledPreview
// Renders children at full natural size
// inside a hidden overflow box, then shrinks
// visually with CSS transform — so the chart
// looks like a miniature but renders cleanly.
// ─────────────────────────────────────────
function ScaledPreview({ children }) {
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(300);

  // Measure the actual card width after mount
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width || 300);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const innerW = Math.round(containerW / PREVIEW_SCALE);
  const innerH = Math.round(PREVIEW_H  / PREVIEW_SCALE);

  return (
    <div
      ref={containerRef}
      style={{
        width:        "100%",
        height:       PREVIEW_H,
        overflow:     "hidden",
        borderRadius: 12,
        background:   "#fff",
        position:     "relative",
        flexShrink:   0,
      }}
    >
      <div
        style={{
          width:           innerW,
          height:          innerH,
          transform:       `scale(${PREVIEW_SCALE})`,
          transformOrigin: "top left",
          pointerEvents:   "none",
          userSelect:      "none",
          position:        "absolute",
          top:             0,
          left:            0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// KPI grid — shared between preview + export
// ─────────────────────────────────────────
function KPIGrid({ data, loading }) {
  const metrics = [
    { label: "Job Views",     value: data?.kpis?.totalViews      ?? (loading ? "…" : 0) },
    { label: "Applications",  value: data?.kpis?.totalApplies    ?? (loading ? "…" : 0) },
    { label: "Conversion",    value: data ? `${data.kpis.conversionRatePct}%`  : loading ? "…" : "0%" },
    { label: "Time-to-Fill",  value: data ? `${data.kpis.avgTimeToFillDays}d` : loading ? "…" : "0d" },
    { label: "Interviews",    value: data?.kpis?.totalInterviews ?? (loading ? "…" : 0) },
    { label: "Hires",         value: data?.kpis?.totalHires      ?? (loading ? "…" : 0) },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            background:   "#F8FAFC",
            borderRadius: 12,
            padding:      "18px 14px",
            textAlign:    "center",
            border:       "1px solid rgba(226,232,240,0.8)",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED, marginBottom: 8 }}>
            {m.label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: SLATE, lineHeight: 1 }}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Gallery card — thumbnail size
// ─────────────────────────────────────────
function GalleryCard({ item, periodLabel, resolution, onFocus, exportRef }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (e) => {
    e.stopPropagation();
    setExporting(true);
    await exportAsPNG(
      exportRef.current,
      `ForgeTomorrow_${item.title.replace(/\s+/g, "_")}_${periodLabel}.png`,
      resolution
    );
    setExporting(false);
  };

  return (
    <div
      onClick={onFocus}
      className="gallery-card"
      style={{
        background:    "#fff",
        borderRadius:  18,
        boxShadow:     "0 3px 14px rgba(15,23,42,0.07)",
        border:        "1px solid rgba(226,232,240,0.7)",
        overflow:      "hidden",
        cursor:        "pointer",
        transition:    "transform 150ms ease, box-shadow 150ms ease",
        display:       "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding:        "10px 12px 8px",
          borderBottom:   "1px solid rgba(226,232,240,0.5)",
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          gap:            8,
          flexShrink:     0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {item.tag && (
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: ORANGE, marginBottom: 3 }}>
              {item.tag}
            </div>
          )}
          <div style={{ fontSize: 12, fontWeight: 800, color: SLATE, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.title}
          </div>
          <div style={{ fontSize: 9.5, color: FAINT, marginTop: 2 }}>{periodLabel}</div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          style={{
            display:      "inline-flex",
            alignItems:   "center",
            gap:          3,
            padding:      "3px 8px",
            borderRadius: 999,
            border:       "1px solid rgba(255,112,67,0.22)",
            background:   "rgba(255,112,67,0.09)",
            color:        ORANGE,
            fontSize:     10,
            fontWeight:   800,
            cursor:       exporting ? "default" : "pointer",
            opacity:      exporting ? 0.5 : 1,
            whiteSpace:   "nowrap",
            flexShrink:   0,
            fontFamily:   "inherit",
          }}
        >
          {exporting ? "…" : "⬇ PNG"}
        </button>
      </div>

      {/* Scaled thumbnail preview */}
      <div style={{ padding: "8px 10px 6px", flexGrow: 1 }}>
        <ScaledPreview>
          {item.renderPreview()}
        </ScaledPreview>
      </div>

      {/* Footer */}
      <div style={{ padding: "5px 12px", borderTop: "1px solid rgba(226,232,240,0.4)", fontSize: 9.5, color: FAINT, fontWeight: 600, flexShrink: 0 }}>
        Click to preview &amp; export
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Focus modal
// ─────────────────────────────────────────
function FocusModal({ item, periodLabel, resolution, onClose, exportRef }) {
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleExport = async () => {
    setExporting(true);
    await exportAsPNG(
      exportRef.current,
      `ForgeTomorrow_${item.title.replace(/\s+/g, "_")}_${periodLabel}.png`,
      resolution
    );
    setExporting(false);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.50)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 22, boxShadow: "0 24px 64px rgba(15,23,42,0.22)", width: "100%", maxWidth: 760, maxHeight: "88vh", overflow: "auto", display: "flex", flexDirection: "column" }}
      >
        {/* Modal header */}
        <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(226,232,240,0.7)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: SLATE }}>{item.title}</div>
            <div style={{ fontSize: 11, color: FAINT, marginTop: 3 }}>{periodLabel}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, border: "none", background: ORANGE, color: "#fff", fontSize: 13, fontWeight: 800, cursor: exporting ? "default" : "pointer", opacity: exporting ? 0.6 : 1, boxShadow: "0 6px 16px rgba(255,112,67,0.26)", fontFamily: "inherit" }}
            >
              {exporting ? "Exporting…" : "⬇ Export PNG"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 999, border: "1px solid rgba(51,65,85,0.14)", background: "rgba(255,255,255,0.9)", color: MUTED, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Export target */}
        <div ref={exportRef} style={{ padding: "24px 28px 28px", background: "#ffffff", flexGrow: 1 }}>
          {item.renderFull()}
        </div>

        <div style={{ padding: "10px 22px", borderTop: "1px solid rgba(226,232,240,0.6)", fontSize: 10.5, color: FAINT, flexShrink: 0 }}>
          White background · No watermarks · Resize freely in PowerPoint, Google Slides, or Keynote
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Page body
// ─────────────────────────────────────────
function Body() {
  const router = useRouter();

  const [filters, setFilters]       = useState(getFiltersFromQuery(router.query));
  const { data, loading, error }    = useAnalytics(filters);
  const [resolution, setResolution] = useState("standard");
  const [focusedIndex, setFocused]  = useState(null);

  const exportRefs = useRef({});
  const getExportRef = (key) => {
    if (!exportRefs.current[key]) exportRefs.current[key] = React.createRef();
    return exportRefs.current[key];
  };

  useEffect(() => {
    if (!router.isReady) return;
    setFilters(getFiltersFromQuery(router.query));
  }, [router.isReady, router.query]);

  const onFilterChange = useCallback((patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    router.replace(
      { pathname: router.pathname, query: { range: next.range, jobId: next.jobId, recruiterId: next.recruiterId, companyId: next.companyId, ...(next.from ? { from: next.from } : {}), ...(next.to ? { to: next.to } : {}) } },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [filters, router]);

  const periodLabel =
    filters.range === "custom" && (filters.from || filters.to)
      ? `${filters.from || "Start"} → ${filters.to || "End"}`
      : `Last ${String(filters.range || "30d").toUpperCase()}`;

  // ─────────────────────────────────────────
  // Visual registry
  // To add a new chart: push one object here.
  // The gallery grid handles the rest.
  // ─────────────────────────────────────────
  const visualItems = [
    {
      key:           "kpi",
      title:         "KPI Summary",
      tag:           "Performance",
      renderPreview: () => <KPIGrid data={data} loading={loading} />,
      renderFull:    () => (
        <>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 18, lineHeight: 1.6 }}>Core hiring performance metrics · {periodLabel}</div>
          <KPIGrid data={data} loading={loading} />
        </>
      ),
    },
    {
      key:           "funnel",
      title:         "Application Funnel",
      tag:           "Conversion",
      renderPreview: () => <ApplicationFunnel data={data?.funnel || []} />,
      renderFull:    () => (
        <>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 18, lineHeight: 1.6 }}>Conversion flow from initial interest through downstream hiring stages · {periodLabel}</div>
          <ApplicationFunnel data={data?.funnel || []} />
        </>
      ),
    },
    {
      key:           "sources",
      title:         "Source Performance",
      tag:           "Sourcing",
      renderPreview: () => <SourceBreakdown data={data?.sources || []} />,
      renderFull:    () => (
        <>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 18, lineHeight: 1.6 }}>Where candidate flow is originating · {periodLabel}</div>
          <SourceBreakdown data={data?.sources || []} />
        </>
      ),
    },
    {
      key:           "activity",
      title:         "Recruiter Activity Trend",
      tag:           "Productivity",
      renderPreview: () => <RecruiterActivity data={data?.recruiterActivity || []} />,
      renderFull:    () => (
        <>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 18, lineHeight: 1.6 }}>Recruiter engagement and activity patterns · {periodLabel}</div>
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
      pageSubtitle="Export-ready charts for QBRs and stakeholder reporting. Clean PNG downloads — white background, no watermarks, resize freely in your deck."
      activeTab="presentation"
      filters={filters}
      onFilterChange={onFilterChange}
    >
      {error && (
        <div style={{ borderRadius: 12, border: "1px solid rgba(239,68,68,0.20)", background: "rgba(254,242,242,0.86)", color: "#B91C1C", padding: "11px 14px", marginBottom: 16, fontSize: 13 }}>
          {String(error)}
        </div>
      )}

      {/* ── Control bar ── */}
      <div style={{ ...GLASS, borderRadius: 18, padding: "13px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: SLATE }}>Presentation Studio</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
            {visualItems.length} visuals ready · click any card to preview · export individually or all at once
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 3, padding: "3px", borderRadius: 999, background: "rgba(51,65,85,0.07)" }}>
            {["standard", "high"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setResolution(r)}
                style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: resolution === r ? "#fff" : "transparent", color: resolution === r ? SLATE : FAINT, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: resolution === r ? "0 2px 6px rgba(15,23,42,0.08)" : "none", transition: "all 120ms ease", fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                {r === "standard" ? "Standard" : "High-res"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={async () => {
              for (const item of visualItems) {
                const ref = exportRefs.current[item.key];
                if (ref?.current) {
                  await exportAsPNG(ref.current, `ForgeTomorrow_${item.title.replace(/\s+/g, "_")}_${periodLabel}.png`, resolution);
                }
              }
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, border: "none", background: ORANGE, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 16px rgba(255,112,67,0.26)", fontFamily: "inherit", whiteSpace: "nowrap" }}
          >
            ⬇ Download All ({visualItems.length})
          </button>
        </div>
      </div>

      {/* ── Gallery grid ── */}
      <div className="pres-gallery">
        {visualItems.map((item, index) => (
          <GalleryCard
            key={item.key}
            item={item}
            periodLabel={periodLabel}
            resolution={resolution}
            onFocus={() => setFocused(index)}
            exportRef={getExportRef(item.key)}
          />
        ))}
      </div>

      {/* ── Off-screen full-size export targets ── */}
      <div aria-hidden="true" style={{ position: "absolute", left: -9999, top: 0, width: 700, visibility: "hidden", pointerEvents: "none" }}>
        {visualItems.map((item) => (
          <div
            key={item.key}
            ref={getExportRef(item.key)}
            style={{ padding: "28px 32px", background: "#ffffff", width: 700 }}
          >
            {item.tag && (
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: ORANGE, marginBottom: 6 }}>
                {item.tag}
              </div>
            )}
            <div style={{ fontSize: 20, fontWeight: 900, color: SLATE, marginBottom: 4, lineHeight: 1.2 }}>{item.title}</div>
            <div style={{ fontSize: 11, color: FAINT, marginBottom: 22 }}>{periodLabel}</div>
            {item.renderFull()}
          </div>
        ))}
      </div>

      {/* ── Focus modal ── */}
      {focusedItem && (
        <FocusModal
          item={focusedItem}
          periodLabel={periodLabel}
          resolution={resolution}
          onClose={() => setFocused(null)}
          exportRef={getExportRef(focusedItem.key)}
        />
      )}

      <div style={{ marginTop: 18, fontSize: 11, color: FAINT, textAlign: "right" }}>
        PNG exports · white background · no watermarks · resize freely in your deck
      </div>

      <style>{`
        .pres-gallery {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .gallery-card:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 26px rgba(15,23,42,0.11) !important;
        }
        @media (max-width: 1100px) { .pres-gallery { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 780px)  { .pres-gallery { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px)  { .pres-gallery { grid-template-columns: 1fr !important; } }
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