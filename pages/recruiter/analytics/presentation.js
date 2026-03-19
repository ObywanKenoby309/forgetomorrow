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

function PresentationCard({ title, subtitle, period, children, fullWidth = false }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
        padding: 24,
        gridColumn: fullWidth ? "1 / -1" : "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "-0.2px",
              color: "#334155",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{period}</div>
        </div>

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
      </div>

      {subtitle ? (
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, lineHeight: 1.6 }}>
          {subtitle}
        </div>
      ) : null}

      <div style={{ marginTop: 8 }}>{children}</div>
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
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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

  const conversionValue = data ? `${data.kpis.conversionRatePct}%` : loading ? "…" : "0%";
  const timeToFillValue = data
    ? `${data.kpis.avgTimeToFillDays} days`
    : loading
    ? "…"
    : "0 days";

  return (
    <RecruiterAnalyticsLayout
      title="Recruiter Analytics — ForgeTomorrow"
      pageTitle="Presentation Visuals"
      pageSubtitle="Clean visual surfaces designed for executive decks, recruiter reviews, and stakeholder reporting."
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
              Download clean visuals for executive decks and stakeholder reporting.
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
              title="Export all visuals"
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
        <PresentationCard
          title="KPI Summary"
          subtitle="Core hiring performance metrics for the selected reporting window."
          period={periodLabel}
          fullWidth
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

        <PresentationCard
          title="Application Funnel"
          subtitle="Conversion flow from initial interest through downstream hiring stages."
          period={periodLabel}
        >
          <ApplicationFunnel data={data?.funnel || []} />
        </PresentationCard>

        <PresentationCard
          title="Source Performance"
          subtitle="Where candidate flow is originating for the selected reporting window."
          period={periodLabel}
        >
          <SourceBreakdown data={data?.sources || []} />
        </PresentationCard>

        <PresentationCard
          title="Recruiter Activity Trend"
          subtitle="Recruiter engagement and activity patterns over time."
          period={periodLabel}
          fullWidth
        >
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