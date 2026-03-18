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

const REPORT_OPTIONS = [
  { key: "funnel", label: "Funnel" },
  { key: "sources", label: "Sources" },
  { key: "recruiters", label: "Recruiters" },
  { key: "timeToFill", label: "Time-to-Fill" },
  { key: "qualityOfHire", label: "Quality of Hire" },
  { key: "talentIntel", label: "Talent Intel" },
];

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

function getReportFromQuery(query) {
  const raw = typeof query.report === "string" ? query.report : "funnel";
  const valid = REPORT_OPTIONS.some((option) => option.key === raw);
  return valid ? raw : "funnel";
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
      <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

function MethodCard({ eyebrow, title, body }) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: "rgba(255,255,255,0.48)",
        border: "1px solid rgba(255,255,255,0.18)",
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "#FF7043",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {eyebrow}
      </div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#334155", marginTop: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginTop: 6 }}>{body}</div>
    </div>
  );
}

function ReportSelector({ activeReport, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
      {REPORT_OPTIONS.map((option) => {
        const isActive = activeReport === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            style={{
              border: "1px solid rgba(255,255,255,0.28)",
              background: isActive ? "rgba(255,112,67,0.16)" : "rgba(255,255,255,0.62)",
              color: isActive ? "#FF7043" : "#334155",
              borderRadius: 999,
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: isActive ? "0 4px 10px rgba(255,112,67,0.14)" : "none",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ReportShell({ title, subtitle, visual, insights }) {
  return (
    <section style={{ ...GLASS, borderRadius: 18, padding: 18 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#334155" }}>{title}</div>
      <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginTop: 6 }}>{subtitle}</div>

      <div
        className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        style={{ marginTop: 16, alignItems: "start" }}
      >
        <div style={{ ...GLASS, borderRadius: 16, padding: 16 }}>{visual}</div>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>{insights}</div>
      </div>
    </section>
  );
}

function BuildingVisual({ title, body }) {
  return (
    <div
      style={{
        minHeight: 320,
        borderRadius: 14,
        background: "rgba(255,255,255,0.58)",
        border: "1px solid rgba(255,255,255,0.24)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#334155" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginTop: 10 }}>
          {body}
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          borderRadius: 14,
          padding: 14,
          background: "rgba(255,255,255,0.72)",
          border: "1px solid rgba(255,255,255,0.32)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#94A3B8",
            marginBottom: 6,
          }}
        >
          Status
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#334155" }}>Building</div>
        <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, marginTop: 6 }}>
          This report is being wired to live analytics and will expand as the related endpoint and
          aggregation logic come online.
        </div>
      </div>
    </div>
  );
}

function Body() {
  const router = useRouter();
  const [filters, setFilters] = useState(getFiltersFromQuery(router.query));
  const [activeReport, setActiveReport] = useState(getReportFromQuery(router.query));
  const { data, error } = useAnalytics(filters);
  const [leaderboardData, setLeaderboardData] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    setFilters(getFiltersFromQuery(router.query));
    setActiveReport(getReportFromQuery(router.query));
  }, [router.isReady, router.query]);

  useEffect(() => {
    let active = true;

    const loadLeaderboard = async () => {
      try {
        const params = new URLSearchParams();
        params.set("range", filters.range);
        params.set("jobId", filters.jobId);
        params.set("recruiterId", filters.recruiterId);
        params.set("companyId", filters.companyId);

        if (filters.range === "custom") {
          if (filters.from) params.set("from", filters.from);
          if (filters.to) params.set("to", filters.to);
        }

        const res = await fetch(
          `/api/analytics/recruiter/leaderboard?${params.toString()}`
        );
        const json = await res.json();

        if (active) {
          setLeaderboardData(json);
        }
      } catch {
        if (active) {
          setLeaderboardData({ recruiters: [] });
        }
      }
    };

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [filters]);

  const onFilterChange = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);

    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
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

  const onReportChange = (reportKey) => {
    setActiveReport(reportKey);

    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          report: reportKey,
          range: filters.range,
          jobId: filters.jobId,
          recruiterId: filters.recruiterId,
          companyId: filters.companyId,
          ...(filters.from ? { from: filters.from } : {}),
          ...(filters.to ? { to: filters.to } : {}),
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
  const avgTimeToFill = data?.kpis?.avgTimeToFillDays ?? 0;

  const renderActiveReport = () => {
    if (activeReport === "funnel") {
      return (
        <ReportShell
          title="Funnel narrative"
          subtitle={`This period your funnel processed ${totalApplies} applications and converted ${totalInterviews} into interviews and ${totalHires} into hires. Interview rate is currently ${interviewRate}% and apply-to-hire is ${hireRate}%.`}
          visual={<ApplicationFunnel data={data?.funnel || []} />}
          insights={
            <>
              <NarrativeCard
                eyebrow="Key finding"
                title="Funnel drop-off should be diagnosed stage by stage"
                body="A healthy top-of-funnel does not guarantee strong hiring efficiency. This report should help the team see where candidates are slowing, disappearing, or being filtered out too aggressively."
              />
              <NarrativeCard
                eyebrow="Recommendation"
                title="Use this report to separate process drag from market difficulty"
                body="If conversion weakness is concentrated at one stage, the team should inspect screening criteria, interview coordination, response timing, and role-specific qualification patterns before changing the broader recruiting strategy."
                accent="#0F766E"
              />
            </>
          }
        />
      );
    }

    if (activeReport === "sources") {
      return (
        <ReportShell
          title="Source narrative"
          subtitle="Source reporting should not stop at volume. Recruiters need to understand which channels produce interviews, hires, and stronger downstream outcomes."
          visual={<SourceBreakdown data={data?.sources || []} />}
          insights={
            <>
              <NarrativeCard
                eyebrow="Source quality"
                title="High-volume sources are not always high-value sources"
                body="This report should be used to compare source volume with downstream quality so the team can invest in channels that produce meaningful pipeline movement rather than surface-level traffic."
                accent="#7C3AED"
              />
              <NarrativeCard
                eyebrow="Meeting note"
                title="Use this page to explain both performance and investment decisions"
                body="The purpose of this report is not just to show what happened, but to support decisions about sourcing mix, recruiter effort, and where future recruiting energy should go."
                accent="#D97706"
              />
            </>
          }
        />
      );
    }

        if (activeReport === "recruiters") {
      return (
        <ReportShell
          title="Recruiter activity narrative"
          subtitle="Recruiter performance below is ranked from live recruiter-owned jobs and their downstream pipeline outcomes for the selected filter window."
          visual={
            <div style={{ display: "grid", gap: 10 }}>
              {(leaderboardData?.recruiters || []).length === 0 ? (
                <BuildingVisual
                  title="Recruiter activity report"
                  body="No recruiter-attributed analytics are available for the selected period yet."
                />
              ) : (
                leaderboardData.recruiters.map((recruiter, index) => (
                  <div
                    key={recruiter.recruiterId}
                    style={{
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.72)",
                      border: "1px solid rgba(255,255,255,0.30)",
                      padding: 14,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#334155" }}>
                        #{index + 1} {recruiter.recruiterName}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#FF7043" }}>
                        {recruiter.totalHires} hires
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>Applications</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginTop: 4 }}>
                          {recruiter.totalApplications}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>Interviews</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginTop: 4 }}>
                          {recruiter.totalInterviews}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>Offers</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginTop: 4 }}>
                          {recruiter.totalOffers}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>Apply-to-hire</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginTop: 4 }}>
                          {recruiter.conversionRatePct}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>Avg. time-to-fill</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginTop: 4 }}>
                          {recruiter.avgTimeToFillDays} days
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>Pipeline velocity</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginTop: 4 }}>
                          {recruiter.pipelineVelocity}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          }
          insights={
            <>
              <NarrativeCard
                eyebrow="Key finding"
                title="Recruiter comparison should be grounded in owned-job outcomes"
                body="This report ranks recruiter performance using recruiter-owned jobs and their downstream application, interview, offer, and hire results for the selected period."
              />
              <NarrativeCard
                eyebrow="Recommendation"
                title="Use recruiter comparisons to separate process issues from ownership patterns"
                body="When recruiter outcomes diverge under similar req mix, this view helps leadership identify whether the issue is execution, req complexity, or process drag."
                accent="#0F766E"
              />
            </>
          }
        />
      );
    }

    if (activeReport === "timeToFill") {
      return (
        <ReportShell
          title="Time-to-Fill narrative"
          subtitle={`Current average time-to-fill is ${avgTimeToFill} days. This report should explain where delay is building and which roles need operational attention first.`}
          visual={
            <BuildingVisual
              title="Time-to-Fill report"
              body="The page currently has the overall time-to-fill metric, but the deeper role-level and stage-level breakdown is still being wired. This report should expand into a true delay analysis surface."
            />
          }
          insights={
            <>
              <NarrativeCard
                eyebrow="Key finding"
                title="A single average is not enough"
                body="Average time-to-fill is useful for the headline, but the real value comes from seeing whether delay is concentrated by role family, by recruiter, or by a specific funnel stage."
              />
              <NarrativeCard
                eyebrow="Recommendation"
                title="Build this report around where delay actually happens"
                body="The finished report should explain whether the issue is sourcing difficulty, approval drag, scheduling slowdown, or offer-stage friction so the team knows where to intervene."
                accent="#0F766E"
              />
            </>
          }
        />
      );
    }

    if (activeReport === "qualityOfHire") {
      return (
        <ReportShell
          title="Quality of Hire narrative"
          subtitle="Quality of Hire belongs in report detail and methodology context. It activates once sufficient post-hire performance data exists for reliable scoring."
          visual={
            <BuildingVisual
              title="Quality of Hire report"
              body="Quality of Hire is intentionally held in a Building state until the platform has enough post-hire data to produce a defensible composite score."
            />
          }
          insights={
            <>
              <NarrativeCard
                eyebrow="Method note"
                title="Quality of Hire should be grounded in transparent components"
                body="Retention, manager scoring, and time-to-productivity should all contribute to the final score so the metric is explainable, defensible, and useful in enterprise discussion."
              />
              <NarrativeCard
                eyebrow="Recommendation"
                title="Treat this as a cross-functional metric"
                body="The long-term value of Quality of Hire comes from connecting recruiting performance with hiring manager behavior and post-hire outcomes, not from a black-box score alone."
                accent="#0F766E"
              />
            </>
          }
        />
      );
    }

    return (
      <ReportShell
        title="Talent Intelligence narrative"
        subtitle="Talent Intelligence should combine source quality, match reasoning, and role-specific signals so recruiters can explain not just outcomes, but the drivers behind them."
        visual={
          <BuildingVisual
            title="Talent Intelligence report"
            body="This report is being wired toward deeper recruiting intelligence such as match reasons, skills patterns, and role-specific signal comparison."
          />
        }
        insights={
          <>
            <NarrativeCard
              eyebrow="Key finding"
              title="The strongest recruiting intelligence connects source, fit, and conversion quality"
              body="Recruiters need to understand not just where candidates came from, but why certain channels, profiles, and role patterns convert more efficiently than others."
            />
            <NarrativeCard
              eyebrow="Recommendation"
              title="Use this report to connect pattern recognition with action"
              body="The finished version should help the team see which sources, candidate traits, and match signals repeatedly lead to stronger hiring outcomes for specific roles."
              accent="#0F766E"
            />
          </>
        }
      />
    );
  };

  return (
    <RecruiterAnalyticsLayout
      title="Recruiter Analytics — ForgeTomorrow"
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
        <div style={{ fontSize: 22, fontWeight: 900, color: "#334155" }}>
          Quality of Hire methodology
        </div>
        <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginTop: 6 }}>
          Quality of Hire belongs here first, not on the recruiter dashboard. It activates once
          sufficient post-hire performance data exists for reliable scoring.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <MethodCard
            eyebrow="Component 1 · 40%"
            title="90-Day Retention"
            body="Measures whether the hire stayed through the 90-day mark."
          />
          <MethodCard
            eyebrow="Component 2 · 35%"
            title="Manager Rating"
            body="Uses hiring manager scoring across early performance windows."
          />
          <MethodCard
            eyebrow="Component 3 · 25%"
            title="Ramp Time"
            body="Compares time-to-productivity against role-specific benchmarks."
          />
        </div>
      </section>

      <section style={{ ...GLASS, borderRadius: 18, padding: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#334155" }}>Report explorer</div>
        <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginTop: 6 }}>
          Choose one report at a time to review the visual, the key finding, and the recruiter-facing
          explanation.
        </div>

        <ReportSelector activeReport={activeReport} onChange={onReportChange} />

        <div style={{ marginTop: 18 }}>{renderActiveReport()}</div>
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