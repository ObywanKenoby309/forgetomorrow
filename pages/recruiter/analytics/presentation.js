// pages/recruiter/analytics/presentation.js
import React, { useEffect, useMemo, useState } from "react";
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

function PresentationCard({ title, period, children }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#334155" }}>{title}</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{period}</div>
        </div>

        <button
          type="button"
          disabled
          style={{
            borderRadius: 999,
            border: "1px solid rgba(255,112,67,0.20)",
            background: "rgba(255,112,67,0.10)",
            color: "#FF7043",
            fontSize: 12,
            fontWeight: 800,
            padding: "7px 12px",
            cursor: "not-allowed",
            opacity: 0.78,
          }}
          title="PNG export is being finalized"
        >
          Export PNG
        </button>
      </div>

      {children}
    </div>
  );
}

function Body() {
  const router = useRouter();
  const [filters, setFilters] = useState(getFiltersFromQuery(router.query));
  const { data, loading, error } = useAnalytics(filters);

  useEffect(() => {
    if (!router.isReady) return;
    setFilters(getFiltersFromQuery(router.query));
  }, [router.isReady, router.query]);

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

  return (
    <RecruiterAnalyticsLayout
      title="Recruiter Analytics — ForgeTomorrow"
      pageTitle="Presentation Visuals"
      pageSubtitle="Clean visual surfaces for screenshots, deck-building, and executive presentation prep."
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
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
              White-background cards for clean screenshots and slide-ready visuals.
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
              disabled
              style={{
                borderRadius: 999,
                border: "none",
                background: "#FF7043",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                padding: "8px 14px",
                cursor: "not-allowed",
                boxShadow: "0 8px 18px rgba(255,112,67,0.20)",
                opacity: 0.78,
              }}
              title="Bulk export is being finalized"
            >
              Download All
            </button>
          </div>
        </div>
      </section>

      <section
        className="grid grid-cols-1 xl:grid-cols-2 gap-5"
        style={{ alignItems: "start" }}
      >
        <PresentationCard title="Application Funnel" period={periodLabel}>
          <ApplicationFunnel data={data?.funnel || []} />
        </PresentationCard>

        <PresentationCard title="Source Performance" period={periodLabel}>
          <SourceBreakdown data={data?.sources || []} />
        </PresentationCard>

        <PresentationCard title="KPI Summary" period={periodLabel}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <KPICard label="Job views" value={data?.kpis?.totalViews ?? (loading ? "…" : 0)} />
            <KPICard
              label="Applications"
              value={data?.kpis?.totalApplies ?? (loading ? "…" : 0)}
            />
            <KPICard
              label="Conversion"
              value={data ? `${data.kpis.conversionRatePct}%` : loading ? "…" : "0%"}
            />
            <KPICard
              label="Time-to-fill"
              value={data ? `${data.kpis.avgTimeToFillDays} days` : loading ? "…" : "0 days"}
            />
            <KPICard
              label="Interviews"
              value={data?.kpis?.totalInterviews ?? (loading ? "…" : 0)}
            />
            <KPICard label="Hires" value={data?.kpis?.totalHires ?? (loading ? "…" : 0)} />
          </div>
        </PresentationCard>

        <PresentationCard title="Recruiter Activity Trend" period={periodLabel}>
          <RecruiterActivity data={data?.recruiterActivity || []} />
        </PresentationCard>
      </section>
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