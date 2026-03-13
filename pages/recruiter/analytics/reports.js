// pages/recruiter/analytics/reports.js
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { PlanProvider } from "@/context/PlanContext";
import RecruiterAnalyticsLayout from "@/components/layouts/RecruiterAnalyticsLayout";
import ApplicationFunnel from "@/components/analytics/charts/ApplicationFunnel";
import SourceBreakdown from "@/components/analytics/charts/SourceBreakdown";

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

function NarrativeCard({ eyebrow, title, body, accent = "#FF7043" }) {
  return (
    <div
      style={{
        borderRadius: 16,
        borderLeft: `4px solid ${accent}`,
        background: "rgba(255,255,255,0.76)",
        borderTop: "1px solid rgba(255,255,255,0.36)",
        borderRight: "1px solid rgba(255,255,255,0.36)",
        borderBottom: "1px solid rgba(255,255,255,0.36)",
        boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

function Body() {
  const router = useRouter();
  const [filters, setFilters] = useState(getFiltersFromQuery(router.query));
  const { data, error } = useAnalytics(filters);

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

  const totalApplies = data?.kpis?.totalApplies ?? 0;
  const totalInterviews = data?.kpis?.totalInterviews ?? 0;
  const totalHires = data?.kpis?.totalHires ?? 0;
  const interviewRate = totalApplies ? ((totalInterviews / totalApplies) * 100).toFixed(1) : "0.0";
  const hireRate = totalApplies ? ((totalHires / totalApplies) * 100).toFixed(1) : "0.0";

  return (
    <RecruiterAnalyticsLayout
      title="Report Details — ForgeTomorrow"
      pageTitle="Report Details"
      pageSubtitle="Deep analysis and meeting-ready narrative context behind every metric on the analytics side."
      activeTab="reports"
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

      <section style={{ ...GLASS, borderRadius: 18, padding: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#334155" }}>Funnel narrative</div>
        <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginTop: 6 }}>
          This period your funnel processed {totalApplies} applications and converted{" "}
          {totalInterviews} into interviews and {totalHires} into hires. Interview rate is
          currently {interviewRate}% and apply-to-hire is {hireRate}%.
        </div>

        {/* ✅ inline 2-col — container-relative, not viewport */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
            marginTop: 16,
          }}
        >
          <div style={{ ...GLASS, borderRadius: 16, padding: 16 }}>
            <ApplicationFunnel data={data?.funnel || []} />
          </div>
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <NarrativeCard
              eyebrow="Key finding"
              title="Your screening-to-interview transition is the main leverage point"
              body="If application volume is healthy but interviews are lagging, the highest-value investigation is screening criteria, recruiter speed, and role-specific filtering friction."
            />
            <NarrativeCard
              eyebrow="Recommendation"
              title="Use report pages to isolate which roles are suppressing conversion"
              body="Engineering and specialist reqs often distort the combined funnel. Separate those reqs before making broad recruiting process changes."
              accent="#0F766E"
            />
          </div>
        </div>
      </section>

      <section style={{ ...GLASS, borderRadius: 18, padding: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#334155" }}>Source narrative</div>
        <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginTop: 6 }}>
          Source reporting should not stop at volume. The strongest recruiting teams compare which
          channels create interviews, hires, and strong downstream outcomes.
        </div>

        {/* ✅ inline 2-col */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
            marginTop: 16,
          }}
        >
          <div style={{ ...GLASS, borderRadius: 16, padding: 16 }}>
            <SourceBreakdown data={data?.sources || []} />
          </div>
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <NarrativeCard
              eyebrow="Source quality"
              title="High-volume sources are not always high-value sources"
              body="This report should eventually compare source volume, source-to-interview, and source-to-hire so leadership can invest in the channels that actually produce outcomes."
              accent="#7C3AED"
            />
            <NarrativeCard
              eyebrow="Meeting note"
              title="Use this page to explain not just what changed, but where to act"
              body="The purpose of Report Details is to prepare recruiters and leaders for discussion, not force them to interpret raw visuals alone."
              accent="#D97706"
            />
          </div>
        </div>
      </section>

      <section style={{ ...GLASS, borderRadius: 18, padding: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#334155" }}>
          Quality of Hire methodology
        </div>
        <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginTop: 6 }}>
          Quality of Hire belongs here first, not on the recruiter dashboard. It becomes meaningful
          once enough post-hire data exists to make the signal trustworthy.
        </div>

        {/* ✅ inline 3-col */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              background: "rgba(255,255,255,0.48)",
              border: "1px solid rgba(255,255,255,0.18)",
              padding: 16,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: "#FF7043", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Component 1 · 40%
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#334155", marginTop: 8 }}>
              90-Day Retention
            </div>
            <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginTop: 6 }}>
              Measures whether the hire stayed through the 90-day mark.
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              background: "rgba(255,255,255,0.48)",
              border: "1px solid rgba(255,255,255,0.18)",
              padding: 16,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: "#FF7043", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Component 2 · 35%
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#334155", marginTop: 8 }}>
              Manager Rating
            </div>
            <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginTop: 6 }}>
              Uses hiring manager scoring across early performance windows.
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              background: "rgba(255,255,255,0.48)",
              border: "1px solid rgba(255,255,255,0.18)",
              padding: 16,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: "#FF7043", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Component 3 · 25%
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#334155", marginTop: 8 }}>
              Ramp Time
            </div>
            <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginTop: 6 }}>
              Compares time-to-productivity against role-specific benchmarks.
            </div>
          </div>
        </div>
      </section>
    </RecruiterAnalyticsLayout>
  );
}

export default function RecruiterAnalyticsReportsPage() {
  return (
    <PlanProvider>
      <Body />
    </PlanProvider>
  );
}