// pages/recruiter/analytics/index.js
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import RecruiterAnalyticsLayout from "@/components/layouts/RecruiterAnalyticsLayout";
import FeatureLock from "@/components/recruiter/FeatureLock";

import KPICard from "@/components/analytics/KPICard";
import ApplicationFunnel from "@/components/analytics/charts/ApplicationFunnel";
import SourceBreakdown from "@/components/analytics/charts/SourceBreakdown";
import RecruiterActivity from "@/components/analytics/charts/RecruiterActivity";

const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const SOFT_GLASS = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.46)",
  boxShadow: "0 8px 18px rgba(0,0,0,0.09)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";

// RIGHT_W(240) + GAP(12) from RecruiterLayout
const BLEED_LEFT  = -(240 + 12); // -252
const BLEED_RIGHT = -(240 + 12); // -252

// Right rail approximate height: Intel card (~160) + gap(12) + Sponsored card (~220) + padding = ~420px
// KPI row height: ~80px
// So Row A needs marginTop of ~340px to sit cleanly below both rails


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
    return () => { active = false; clearInterval(id); };
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

function StatTile({ label, value, hint }) {
  return (
    <div style={{ ...SOFT_GLASS, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 11, color: MUTED }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: SLATE, marginTop: 5, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{hint}</div>
    </div>
  );
}

function InsightTile({ title, value, detail, color = ORANGE }) {
  return (
    <div style={{ ...SOFT_GLASS, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: SLATE }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color, marginTop: 8, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>{detail}</div>
    </div>
  );
}

function ReportCard({ title, description, href, value }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          ...SOFT_GLASS,
          borderRadius: 14,
          padding: 14,
          minHeight: 122,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: ORANGE, marginBottom: 6 }}>
            Full report
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: SLATE }}>{title}</div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginTop: 6 }}>{description}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 12, gap: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>{value}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE }}>Open report →</div>
        </div>
      </div>
    </Link>
  );
}

function Body() {
  const router = useRouter();
  const [filters, setFilters] = useState(getFiltersFromQuery(router.query));
  const { data, loading, error } = useAnalytics(filters);
  const { isEnterprise } = usePlan();

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

  const totalInterviews = data?.kpis?.totalInterviews ?? 0;
  const totalHires = data?.kpis?.totalHires ?? 0;
  const offerAcceptanceRate = data?.kpis?.offerAcceptanceRatePct ?? 0;

  const topSource =
    Array.isArray(data?.sources) && data.sources.length > 0
      ? data.sources.reduce((best, item) =>
          Number(item?.value ?? 0) > Number(best?.value ?? 0) ? item : best
        )
      : null;

  const bleedRowStyle = {
    marginLeft: BLEED_LEFT,
    marginRight: BLEED_RIGHT,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)",
    gap: 12,
  };

  const ChartsBlock = (
    <>
      {/* Row A: Executive Snapshot | Recruiter Activity | Intelligence Panel
          marginTop pushes this row below both right rail cards so it bleeds full width */}
      <div style={{ ...bleedRowStyle, marginTop: 48 }}>
        <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Executive Snapshot</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                Quick reads for source quality, interview flow, and close efficiency.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link
                href="/recruiter/analytics/reports"
                style={{ textDecoration: "none", borderRadius: 999, background: "rgba(255,112,67,0.12)", color: ORANGE, fontSize: 12, fontWeight: 800, padding: "8px 12px" }}
              >
                Open report details
              </Link>
              <Link
                href="/recruiter/analytics/presentation"
                style={{ textDecoration: "none", borderRadius: 999, background: "rgba(51,65,85,0.08)", color: SLATE, fontSize: 12, fontWeight: 800, padding: "8px 12px" }}
              >
                Open visuals
              </Link>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 16 }}>
            <StatTile
              label="Top source"
              value={loading ? "…" : topSource?.name || "N/A"}
              hint="Best-performing inbound channel right now"
            />
            <StatTile
              label="Offer acceptance"
              value={loading ? "…" : `${offerAcceptanceRate}%`}
              hint="High-trust signal for close efficiency"
            />
            <StatTile
              label="Apply-to-hire"
              value={loading ? "…" : data?.kpis?.totalApplies ? `${((totalHires / data.kpis.totalApplies) * 100).toFixed(1)}%` : "0%"}
              hint="Applications converting into hires"
            />
          </div>
        </div>

        <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Recruiter Activity</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                Outreach, screens, and hires across your current window.
              </div>
            </div>
            <Link href="/recruiter/analytics/recruiters" style={{ color: ORANGE, fontWeight: 800, fontSize: 12 }}>
              Full report →
            </Link>
          </div>
          <RecruiterActivity data={data?.recruiterActivity || []} />
        </div>

        <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Intelligence Panel</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4, marginBottom: 12 }}>What matters most right now.</div>
          <div style={{ display: "grid", gap: 10 }}>
            <InsightTile
              title="Quality of Hire"
              value="Building"
              detail="Quality of Hire activates once sufficient post-hire performance data exists."
            />
            <InsightTile
              title="Recruiter leaderboard"
              value="Building"
              detail="Leaderboard rankings will appear once recruiter performance data is available for the selected period."
              color="#0F766E"
            />
            <InsightTile
              title="Apply-to-hire"
              value={loading ? "…" : data?.kpis?.totalApplies ? `${((totalHires / data.kpis.totalApplies) * 100).toFixed(1)}%` : "0%"}
              detail="An executive signal for how efficiently your current hiring motion is converting."
              color="#7C3AED"
            />
          </div>
        </div>
      </div>

      {/* Row B: Source Performance | Application Funnel | Report Gateways */}
      <div style={{ ...bleedRowStyle, marginTop: 12 }}>
        <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Source Performance</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                See which channels produce the strongest recruiting outcomes.
              </div>
            </div>
            <Link href="/recruiter/analytics/sources" style={{ color: ORANGE, fontWeight: 800, fontSize: 12 }}>
              Full report →
            </Link>
          </div>
          <SourceBreakdown data={data?.sources || []} />
        </div>

        <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Application Funnel</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                Track movement from interest to hire and spot where candidates drop.
              </div>
            </div>
            <Link href="/recruiter/analytics/funnel" style={{ color: ORANGE, fontWeight: 800, fontSize: 12 }}>
              Full report →
            </Link>
          </div>
          <ApplicationFunnel data={data?.funnel || []} />
        </div>

        <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Report Gateways</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4, marginBottom: 12 }}>
            Snapshot here, drill into dedicated reports for the why.
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <ReportCard
              title="Time-to-Fill"
              description="See which roles close fastest and where delays are building."
              href="/recruiter/analytics/time-to-fill"
              value={loading ? "…" : `${data?.kpis?.avgTimeToFillDays ?? 0} days`}
            />
            <ReportCard
              title="Quality of Hire"
              description="Track post-hire quality signals once enough historical data exists."
              href="/recruiter/analytics/quality-of-hire"
              value="Building"
            />
            <ReportCard
              title="Talent Intelligence"
              description="Compare source quality, match reasons, and role-specific signals."
              href="/recruiter/analytics/talent-intelligence"
              value={loading ? "…" : topSource?.name || "N/A"}
            />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <RecruiterAnalyticsLayout
      title="Analytics — ForgeTomorrow"
      pageTitle="Recruiter Analytics"
      pageSubtitle="A recruiter command center for funnel health, source performance, recruiter output, and hiring intelligence."
      activeTab="command"
      filters={filters}
      onFilterChange={onFilterChange}
    >
      {error ? (
        <div style={{ borderRadius: 16, border: "1px solid rgba(239,68,68,0.20)", background: "rgba(254,242,242,0.86)", color: "#B91C1C", padding: 16 }}>
          {String(error)}
        </div>
      ) : null}

      {/* KPI row — sits alongside right rail */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))",
          gap: 12,
        }}
      >
        <KPICard label="Total job views" value={data?.kpis?.totalViews ?? (loading ? "…" : 0)} />
        <KPICard label="Total applies" value={data?.kpis?.totalApplies ?? (loading ? "…" : 0)} />
        <KPICard label="Conversion rate" value={data ? `${data.kpis.conversionRatePct}%` : loading ? "…" : "0%"} />
        <KPICard label="Avg. time-to-fill" value={data ? `${data.kpis.avgTimeToFillDays} days` : loading ? "…" : "0 days"} />
        <KPICard label="Interviews" value={loading ? "…" : totalInterviews} />
        <KPICard label="Hires" value={loading ? "…" : totalHires} />
      </section>

      {/* Bleed rows — drop below rails, span full width */}
      {isEnterprise ? ChartsBlock : <FeatureLock label="Full Analytics">{ChartsBlock}</FeatureLock>}

      {data?.meta?.refreshedAt ? (
        <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "right", marginRight: BLEED_RIGHT }}>
          Last updated: {new Date(data.meta.refreshedAt).toLocaleString()}
        </div>
      ) : null}
    </RecruiterAnalyticsLayout>
  );
}

export default function RecruiterAnalyticsPage() {
  return (
    <PlanProvider>
      <Body />
    </PlanProvider>
  );
}