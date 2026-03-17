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
      <div style={{ fontSize: 16, fontWeight: 900, color: "#334155", marginTop: 8 }}>{title}</div>
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
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 16,
          marginTop: 16,
        }}
      >
        <div style={{ ...GLASS, borderRadius: 16, padding: 16 }}>{visual}</div>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>{insights}</div>
      </div>
    </section>
  );
}

function PlaceholderVisual({ title, lines = [] }) {
  return (
    <div
      style={{
        minHeight: 320,
        borderRadius: 14,
        background: "rgba(255,255,255,0.58)",
        border: "1px solid rgba(255,255,255,0.24)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#334155" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginTop: 8 }}>
          Layout placeholder for this report. This panel is ready for chart or structured report content.
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
        {lines.map((line) => (
          <div
            key={line}
            style={{
              height: 14,
              width: line,
              borderRadius: 999,
              background: "rgba(148,163,184,0.22)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Body() {
  const router = useRouter();
  const [filters, setFilters] = useState(getFiltersFromQuery(router.query));
  const [activeReport, setActiveReport] = useState("funnel");
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
                title="Your screening-to-interview transition is the main leverage point"
                body="If application volume is healthy but interviews are lagging, the highest-value investigation is screening criteria, recruiter speed, and role-specific filtering friction."
              />
              <NarrativeCard
                eyebrow="Recommendation"
                title="Use report pages to isolate which roles are suppressing conversion"
                body="Engineering and specialist reqs often distort the combined funnel. Separate those reqs before making broad recruiting process changes."
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
          subtitle="Source reporting should not stop at volume. The strongest recruiting teams compare which channels create interviews, hires, and strong downstream outcomes."
          visual={<SourceBreakdown data={data?.sources || []} />}
          insights={
            <>
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
            </>
          }
        />
      );
    }

    if (activeReport === "recruiters") {
      return (
        <ReportShell
          title="Recruiter activity narrative"
          subtitle="Use this report to isolate how recruiter effort, response speed, and workflow consistency are affecting pipeline movement."
          visual={
            <PlaceholderVisual
              title="Recruiter Activity"
              lines={["88%", "74%", "92%", "68%"]}
            />
          }
          insights={
            <>
              <NarrativeCard
                eyebrow="Key finding"
                title="Recruiter-level variation is often hidden inside top-line funnel numbers"
                body="A healthy combined funnel can still mask uneven recruiter throughput, inconsistent follow-up cadence, or response bottlenecks."
              />
              <NarrativeCard
                eyebrow="Recommendation"
                title="Use recruiter comparison to separate process issues from individual execution issues"
                body="When one recruiter converts at a stronger rate with similar req mix, the team should inspect workflow timing, outreach habits, and qualification handling."
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
          subtitle={`Current average time-to-fill is ${avgTimeToFill} days. This report should help recruiters identify where delay is building and which roles need operational attention first.`}
          visual={
            <PlaceholderVisual
              title="Time-to-Fill"
              lines={["82%", "66%", "54%", "72%"]}
            />
          }
          insights={
            <>
              <NarrativeCard
                eyebrow="Key finding"
                title="Time-to-fill should be explained by stage delay, not just final duration"
                body="A single average hides whether the slowdown is happening at sourcing, screening, interview coordination, or offer close."
              />
              <NarrativeCard
                eyebrow="Recommendation"
                title="Break time-to-fill by role family and funnel stage"
                body="This lets leadership see whether the issue is structural market difficulty, approval drag, or recruiter execution."
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
          subtitle="Quality of Hire belongs in report detail and methodology context, not in the recruiter dashboard alone. It becomes meaningful once enough post-hire data exists to make the signal trustworthy."
          visual={
            <PlaceholderVisual
              title="Quality of Hire"
              lines={["76%", "64%", "58%"]}
            />
          }
          insights={
            <>
              <NarrativeCard
                eyebrow="Method note"
                title="Quality of Hire should be grounded in transparent components"
                body="Retention, manager scoring, and time-to-productivity should all contribute to the final signal so the model is explainable and defensible."
              />
              <NarrativeCard
                eyebrow="Recommendation"
                title="Treat quality scoring as a cross-functional metric"
                body="This report should eventually connect recruiting performance with hiring manager behavior and post-hire outcomes."
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
          <PlaceholderVisual
            title="Talent Intelligence"
            lines={["84%", "72%", "61%", "78%"]}
          />
        }
        insights={
          <>
            <NarrativeCard
              eyebrow="Key finding"
              title="The strongest recruiting intelligence connects source, fit, and conversion quality"
              body="Recruiters need to understand not just where candidates came from, but why certain channels and profiles convert more efficiently for specific roles."
            />
            <NarrativeCard
              eyebrow="Recommendation"
              title="Use this report to compare channel quality and role-specific match strength"
              body="The long-term goal is to help teams invest in the sources and candidate patterns that produce the strongest hiring outcomes."
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
          Quality of Hire belongs here first, not on the recruiter dashboard. It becomes meaningful
          once enough post-hire data exists to make the signal trustworthy.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
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
          Choose one report at a time to review the visual, the key finding, and the recruiter-facing explanation.
        </div>

        <ReportSelector activeReport={activeReport} onChange={setActiveReport} />

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