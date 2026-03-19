// pages/recruiter/analytics/presentation.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { PlanProvider } from "@/context/PlanContext";
import RecruiterAnalyticsLayout from "@/components/layouts/RecruiterAnalyticsLayout";
import ApplicationFunnel from "@/components/analytics/charts/ApplicationFunnel";
import SourceBreakdown from "@/components/analytics/charts/SourceBreakdown";
import RecruiterActivity from "@/components/analytics/charts/RecruiterActivity";
import KPICard from "@/components/analytics/KPICard";

const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const WHITE_CARD = {
  background: "#FFFFFF",
  borderRadius: 18,
  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
};

function useAnalytics(state) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("range", state.range);
    params.set("jobId", state.jobId);
    params.set("recruiterId", state.recruiterId);
    params.set("companyId", state.companyId);
    if (state.range === "custom") {
      if (state.from) params.set("from", state.from);
      if (state.to) params.set("to", state.to);
    }
    return params.toString();
  }, [state]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/analytics/recruiter?${qs}`);
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

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [qs]);

  return { data, loading, error };
}

function getFiltersFromQuery(query) {
  return {
    range: typeof query.range === "string" ? query.range : "30d",
    jobId: typeof query.jobId === "string" ? query.jobId : "all",
    recruiterId: typeof query.recruiterId === "string" ? query.recruiterId : "all",
    companyId: typeof query.companyId === "string" ? query.companyId : "all",
    from: typeof query.from === "string" ? query.from : "",
    to: typeof query.to === "string" ? query.to : "",
  };
}

function PresentationCard({ title, subtitle, period, children, compact = false }) {
  return (
    <div
      style={{
        ...WHITE_CARD,
        padding: compact ? 16 : 24,
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: compact ? 10 : 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: compact ? 15 : 20,
              fontWeight: 900,
              letterSpacing: "-0.2px",
              color: "#334155",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: compact ? 11 : 12, color: "#94A3B8", marginTop: 4 }}>
            {period}
          </div>
        </div>

        {!compact ? (
          <button
            type="button"
            style={{
              borderRadius: 999,
              border: "1px solid rgba(255,112,67,0.20)",
              background: "rgba(255,112,67,0.10)",
              color: "#FF7043",
              fontSize: 12,
              fontWeight: 800,
              padding: "7px 12px",
              cursor: "pointer",
              opacity: 1,
            }}
            title="Export this visual"
          >
            Export PNG
          </button>
        ) : null}
      </div>

      {subtitle ? (
        <div
          style={{
            fontSize: compact ? 11 : 12,
            color: "#64748B",
            marginBottom: compact ? 10 : 12,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </div>
      ) : null}

      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

function EmphasisMetric({ label, value, hint }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(226,232,240,0.9)",
        background: "#F8FAFC",
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#64748B",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: "#334155",
          marginTop: 8,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#64748B", marginTop: 8, lineHeight: 1.6 }}>
        {hint}
      </div>
    </div>
  );
}

function MiniPreviewCard({ title, active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...WHITE_CARD,
        border: active ? "2px solid #FF7043" : "1px solid rgba(226,232,240,0.9)",
        padding: 12,
        textAlign: "left",
        cursor: "pointer",
        opacity: active ? 1 : 0.82,
        transform: active ? "translateY(-1px)" : "none",
        transition: "all 160ms ease",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: active ? "#FF7043" : "#334155",
          marginBottom: 8,
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          background: "#FFFFFF",
          minHeight: 130,
        }}
      >
        {children}
      </div>
    </button>
  );
}

function MobileCarouselCard({ active, children }) {
  return (
    <div
      style={{
        width: "84vw",
        minWidth: "84vw",
        scrollSnapAlign: "center",
        opacity: active ? 1 : 0.58,
        transform: active ? "scale(1)" : "scale(0.94)",
        transition: "transform 160ms ease, opacity 160ms ease",
      }}
    >
      {children}
    </div>
  );
}

function Body() {
  const router = useRouter();
  const [filters, setFilters] = useState(getFiltersFromQuery(router.query));
  const { data, loading, error } = useAnalytics(filters);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const mobileRefs = useRef([]);

  useEffect(() => {
    if (!router.isReady) return;
    setFilters(getFiltersFromQuery(router.query));
  }, [router.isReady, router.query]);

  useEffect(() => {
    const onResize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 1024);
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onFilterChange = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);

    router.replace(
      {
        pathname: router.pathname,
        query: {
          range: next.range,
          jobId: next.jobId,
          recruiterId: next.recruiterId,
          companyId: next.companyId,
          ...(next.from ? { from: next.from } : {}),
          ...(next.to ? { to: next.to } : {}),
        },
      },
      undefined,
      { shallow: true, scroll: false }
    );
  };

  const periodLabel =
    filters.range === "custom" && (filters.from || filters.to)
      ? `${filters.from || "Start"} → ${filters.to || "End"}`
      : `Last ${String(filters.range || "30d").toUpperCase()}`;

  const conversionValue = data ? `${data.kpis.conversionRatePct}%` : loading ? "…" : "0%";
  const timeToFillValue = data
    ? `${data.kpis.avgTimeToFillDays} days`
    : loading
    ? "…"
    : "0 days";

  const visualItems = [
    {
      key: "kpi",
      title: "KPI Summary",
      subtitle: "Core hiring performance metrics for the selected reporting window.",
      render: () => (
        <PresentationCard
          title="KPI Summary"
          subtitle="Core hiring performance metrics for the selected reporting window."
          period={periodLabel}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <EmphasisMetric
              label="Conversion Rate"
              value={conversionValue}
              hint="Overall movement from view to application in the selected period."
            />
            <EmphasisMetric
              label="Avg. Time-to-Fill"
              value={timeToFillValue}
              hint="Average close speed for filled roles in the selected period."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard label="Job views" value={data?.kpis?.totalViews ?? (loading ? "…" : 0)} />
            <KPICard
              label="Applications"
              value={data?.kpis?.totalApplies ?? (loading ? "…" : 0)}
            />
            <KPICard
              label="Interviews"
              value={data?.kpis?.totalInterviews ?? (loading ? "…" : 0)}
            />
            <KPICard label="Hires" value={data?.kpis?.totalHires ?? (loading ? "…" : 0)} />
          </div>
        </PresentationCard>
      ),
      mini: () => (
        <PresentationCard title="KPI Summary" period={periodLabel} compact>
          <div className="grid grid-cols-2 gap-2" style={{ marginBottom: 8 }}>
            <div
              style={{
                borderRadius: 12,
                border: "1px solid rgba(226,232,240,0.9)",
                background: "#F8FAFC",
                padding: 10,
              }}
            >
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4 }}>Conversion</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#334155" }}>{conversionValue}</div>
            </div>
            <div
              style={{
                borderRadius: 12,
                border: "1px solid rgba(226,232,240,0.9)",
                background: "#F8FAFC",
                padding: 10,
              }}
            >
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4 }}>Time-to-Fill</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#334155" }}>{timeToFillValue}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <KPICard label="Views" value={data?.kpis?.totalViews ?? (loading ? "…" : 0)} />
            <KPICard label="Hires" value={data?.kpis?.totalHires ?? (loading ? "…" : 0)} />
          </div>
        </PresentationCard>
      ),
    },
    {
      key: "funnel",
      title: "Application Funnel",
      subtitle: "Conversion flow from initial interest through downstream hiring stages.",
      render: () => (
        <PresentationCard
          title="Application Funnel"
          subtitle="Conversion flow from initial interest through downstream hiring stages."
          period={periodLabel}
        >
          <ApplicationFunnel data={data?.funnel || []} />
        </PresentationCard>
      ),
      mini: () => (
        <PresentationCard title="Application Funnel" period={periodLabel} compact>
          <ApplicationFunnel data={data?.funnel || []} />
        </PresentationCard>
      ),
    },
    {
      key: "sources",
      title: "Source Performance",
      subtitle: "Where candidate flow is originating for the selected reporting window.",
      render: () => (
        <PresentationCard
          title="Source Performance"
          subtitle="Where candidate flow is originating for the selected reporting window."
          period={periodLabel}
        >
          <SourceBreakdown data={data?.sources || []} />
        </PresentationCard>
      ),
      mini: () => (
        <PresentationCard title="Source Performance" period={periodLabel} compact>
          <SourceBreakdown data={data?.sources || []} />
        </PresentationCard>
      ),
    },
    {
      key: "activity",
      title: "Recruiter Activity Trend",
      subtitle: "Recruiter engagement and activity patterns over time.",
      render: () => (
        <PresentationCard
          title="Recruiter Activity Trend"
          subtitle="Recruiter engagement and activity patterns over time."
          period={periodLabel}
        >
          <RecruiterActivity data={data?.recruiterActivity || []} />
        </PresentationCard>
      ),
      mini: () => (
        <PresentationCard title="Recruiter Activity Trend" period={periodLabel} compact>
          <RecruiterActivity data={data?.recruiterActivity || []} />
        </PresentationCard>
      ),
    },
  ];

  const selectedVisual = visualItems[selectedIndex] || visualItems[0];

  const goToIndex = (nextIndex) => {
    const bounded = Math.max(0, Math.min(nextIndex, visualItems.length - 1));
    setSelectedIndex(bounded);
    const node = mobileRefs.current[bounded];
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  };

  return (
    <RecruiterAnalyticsLayout
      title="Recruiter Analytics — ForgeTomorrow"
      pageTitle="Presentation Visuals"
      pageSubtitle="Preview clean export-ready visuals for decks, recruiter reviews, and stakeholder reporting."
      activeTab="presentation"
      filters={filters}
      onFilterChange={onFilterChange}
    >
      {error ? (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(239,68,68,0.20)",
            background: "rgba(254,242,242,0.86)",
            color: "#B91C1C",
            padding: 16,
          }}
        >
          {String(error)}
        </div>
      ) : null}

      <section style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#334155" }}>
              Presentation export bar
            </div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, fontWeight: 600 }}>
              Browse visuals, preview the selected asset, and export a clean PNG for slides.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              style={{
                borderRadius: 999,
                border: "1px solid rgba(51,65,85,0.14)",
                background: "rgba(255,255,255,0.92)",
                color: "#334155",
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 12px",
                outline: "none",
              }}
              defaultValue="png"
            >
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
            </select>

            <select
              style={{
                borderRadius: 999,
                border: "1px solid rgba(51,65,85,0.14)",
                background: "rgba(255,255,255,0.92)",
                color: "#334155",
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 12px",
                outline: "none",
              }}
              defaultValue="standard"
            >
              <option value="standard">Standard</option>
              <option value="high">High-res</option>
            </select>

            <button
              type="button"
              style={{
                borderRadius: 999,
                border: "none",
                background: "#FF7043",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                padding: "8px 14px",
                cursor: "pointer",
                boxShadow: "0 8px 18px rgba(255,112,67,0.20)",
                opacity: 1,
              }}
              title="Export selected visual"
            >
              Export Selected
            </button>
          </div>
        </div>
      </section>

      {!isMobile ? (
        <section style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
            {selectedVisual.render()}
          </div>

          <section style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: "#334155",
                marginBottom: 12,
              }}
            >
              Visual Browser
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {visualItems.map((item, index) => (
                <MiniPreviewCard
                  key={item.key}
                  title={item.title}
                  active={selectedIndex === index}
                  onClick={() => setSelectedIndex(index)}
                >
                  {item.mini()}
                </MiniPreviewCard>
              ))}
            </div>
          </section>
        </section>
      ) : (
        <section style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={() => goToIndex(selectedIndex - 1)}
              disabled={selectedIndex === 0}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(51,65,85,0.14)",
                background: "rgba(255,255,255,0.92)",
                color: "#334155",
                fontSize: 12,
                fontWeight: 800,
                padding: "8px 12px",
                cursor: selectedIndex === 0 ? "default" : "pointer",
                opacity: selectedIndex === 0 ? 0.5 : 1,
              }}
            >
              ← Previous
            </button>

            <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>
              {selectedIndex + 1} / {visualItems.length}
            </div>

            <button
              type="button"
              onClick={() => goToIndex(selectedIndex + 1)}
              disabled={selectedIndex === visualItems.length - 1}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(51,65,85,0.14)",
                background: "rgba(255,255,255,0.92)",
                color: "#334155",
                fontSize: 12,
                fontWeight: 800,
                padding: "8px 12px",
                cursor: selectedIndex === visualItems.length - 1 ? "default" : "pointer",
                opacity: selectedIndex === visualItems.length - 1 ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              padding: "4px 8vw 8px",
              marginInline: "-8vw",
              scrollbarWidth: "none",
            }}
          >
            {visualItems.map((item, index) => (
              <div
                key={item.key}
                ref={(node) => {
                  mobileRefs.current[index] = node;
                }}
                onClick={() => goToIndex(index)}
              >
                <MobileCarouselCard active={selectedIndex === index}>
                  {item.mini()}
                </MobileCarouselCard>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              alignItems: "center",
            }}
          >
            {visualItems.map((item, index) => (
              <button
                key={item.key}
                type="button"
                onClick={() => goToIndex(index)}
                aria-label={`Go to ${item.title}`}
                style={{
                  width: index === selectedIndex ? 18 : 8,
                  height: 8,
                  borderRadius: 999,
                  border: "none",
                  background: index === selectedIndex ? "#334155" : "rgba(148,163,184,0.55)",
                  cursor: "pointer",
                  transition: "all 160ms ease",
                }}
              />
            ))}
          </div>
        </section>
      )}
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