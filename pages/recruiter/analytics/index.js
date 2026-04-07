// pages/recruiter/analytics/index.js
//
// Three-path render pattern:
//   null  — measuring screen, render empty shell
//   true  — mobile confirmed, render carousel layout
//   false — desktop confirmed, render bleed grid layout
//
// Data hooks: @/hooks/useAnalyticsData
// Utilities:  @/lib/analytics/analyticsUtils

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import RecruiterAnalyticsLayout from "@/components/layouts/RecruiterAnalyticsLayout";
import FeatureLock from "@/components/recruiter/FeatureLock";
import KPICard from "@/components/analytics/KPICard";
import ApplicationFunnel from "@/components/analytics/charts/ApplicationFunnel";
import SourceBreakdown from "@/components/analytics/charts/SourceBreakdown";
import RecruiterActivity from "@/components/analytics/charts/RecruiterActivity";
import ExecutiveSnapshotCard from "@/components/analytics/ExecutiveSnapshotCard";

import { useAnalytics, useInsights } from "@/hooks/useAnalyticsData";
import { getFiltersFromQuery } from "@/lib/analytics/analyticsUtils";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GLASS = {
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.78)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const GLASS_SOFT = {
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.88)",
  boxShadow: "0 8px 22px rgba(15,23,42,0.10)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const ORANGE = "#FF7043";
const SLATE = "#1E293B";
const MUTED = "#475569";

const ORANGE_HEADING_LIFT = {
  textShadow: "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
  fontWeight: 900,
};

// desktop bleed settings
const LEFT_BLEED = -(240 + 12);
const RIGHT_BLEED = -(240 + 12);
const DESKTOP_REPORT_DROP = 32;

// ─── Insight config ───────────────────────────────────────────────────────────
const INSIGHT_CONFIG = {
  live: { badge: "Live", badgeBg: "rgba(255,112,67,0.12)", badgeColor: ORANGE, dot: ORANGE },
  attention: { badge: "Attention", badgeBg: "rgba(220,38,38,0.10)", badgeColor: "#DC2626", dot: "#DC2626" },
  roadmap: { badge: "Building", badgeBg: "rgba(15,118,110,0.10)", badgeColor: "#0F766E", dot: "#0F766E" },
};

// ─── Mobile carousel ──────────────────────────────────────────────────────────
function MobileCarousel({ cards }) {
  const trackRef = useRef(null);
  const programmatic = useRef(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const goTo = (index) => {
    setActiveIdx(index);
    const track = trackRef.current;
    if (!track) return;
    programmatic.current = true;
    track.scrollTo({ left: index * track.offsetWidth, behavior: "smooth" });
    setTimeout(() => {
      programmatic.current = false;
    }, 600);
  };

  const handleScroll = () => {
    if (programmatic.current) return;
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.offsetWidth);
    if (index >= 0 && index < cards.length) setActiveIdx(index);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [cards.length]);

  return (
    <div
      style={{
        marginBottom: 12,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          borderRadius: 18,
          overflow: "hidden",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            gap: 12,
            paddingLeft: 2,
            paddingRight: 2,
            width: "100%",
            maxWidth: "100%",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              style={{
                flex: "0 0 calc(100% - 6px)",
                width: "calc(100% - 6px)",
                minWidth: "calc(100% - 6px)",
                maxWidth: "calc(100% - 6px)",
                scrollSnapAlign: "start",
                boxSizing: "border-box",
                height: 360,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {card}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to card ${i + 1}`}
            style={{
              width: i === activeIdx ? 24 : 8,
              height: 8,
              borderRadius: 999,
              background: i === activeIdx ? ORANGE : "rgba(255,112,67,0.25)",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "width 220ms ease, background 220ms ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Card sub-components ──────────────────────────────────────────────────────
function InsightTile({ insight }) {
  const cfg = INSIGHT_CONFIG[insight.type] ?? INSIGHT_CONFIG.live;

  return (
    <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: cfg.dot,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            background: cfg.badgeBg,
            color: cfg.badgeColor,
            borderRadius: 6,
            padding: "2px 7px",
          }}
        >
          {cfg.badge}
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: SLATE, flex: 1 }}>
          {insight.title}
        </span>
      </div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>{insight.body}</div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            ...GLASS_SOFT,
            borderRadius: 12,
            padding: 14,
            height: 80,
            opacity: 0.5,
            background: "rgba(255,255,255,0.50)",
          }}
        />
      ))}
    </div>
  );
}

function ReportCard({ title, description, href, value }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          ...GLASS_SOFT,
          borderRadius: 12,
          padding: 14,
          minHeight: 110,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: ORANGE,
              marginBottom: 6,
            }}
          >
            Full report
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: "#0F172A",
              letterSpacing: "-0.01em",
              lineHeight: 1.25,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.55,
              marginTop: 6,
            }}
          >
            {description}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 12,
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#0F172A",
              lineHeight: 1.15,
            }}
          >
            {value}
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE }}>
            Open report →
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Page body ────────────────────────────────────────────────────────────────
function Body() {
  const router = useRouter();
  const [filters, setFilters] = useState(getFiltersFromQuery(router.query));
  const { data, loading, error } = useAnalytics(filters);
  const { insights, loading: insightsLoading } = useInsights(filters);
  const { isEnterprise } = usePlan();

  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
  const totalApplies = data?.kpis?.totalApplies ?? 0;
  const offerAcceptanceRate = data?.kpis?.offerAcceptanceRatePct ?? 0;

  const topSource =
    Array.isArray(data?.sources) && data.sources.length > 0
      ? data.sources.reduce((best, item) =>
          Number(item?.value ?? 0) > Number(best?.value ?? 0) ? item : best
        )
      : null;

  const visibleInsights = Array.isArray(insights) ? insights.slice(0, 4) : [];

  const LAYOUT_TITLE = "Analytics — ForgeTomorrow";
  const LAYOUT_SUBTITLE =
    "A recruiter command center for funnel health, source performance, recruiter output, and hiring intelligence.";

  const compactStatColumns = isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))";

  const execSnapshotCard = (
    <ExecutiveSnapshotCard
      loading={loading}
      topSource={topSource}
      offerAcceptanceRate={offerAcceptanceRate}
      totalHires={totalHires}
      totalApplies={totalApplies}
      compactStatColumns={compactStatColumns}
    />
  );

  const recruiterActivityCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16, width: "100%", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: ORANGE,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            margin: 0,
            ...ORANGE_HEADING_LIFT,
          }}
        >
          Recruiter Activity
        </div>
        <Link
          href="/recruiter/analytics/reports?report=recruiters"
          style={{
            color: ORANGE,
            fontWeight: 800,
            fontSize: 13,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            flexShrink: 0,
            textDecoration: "none",
            ...ORANGE_HEADING_LIFT,
          }}
        >
          Full report →
        </Link>
      </div>
      <RecruiterActivity data={data?.recruiterActivity || []} />
    </div>
  );

  const forgeInsightsCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16, width: "100%", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div
            style={{
              fontSize: 18,
              color: ORANGE,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              margin: 0,
              ...ORANGE_HEADING_LIFT,
            }}
          >
            Forge Insights
          </div>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: ORANGE,
              boxShadow: "0 0 0 3px rgba(255,112,67,0.18)",
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {insightsLoading && !insights ? (
        <InsightsSkeleton />
      ) : visibleInsights.length > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          {visibleInsights.map((insight, i) => (
            <InsightTile key={i} insight={insight} />
          ))}
        </div>
      ) : (
        <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>
            Insights will appear here as your pipeline data builds.
          </div>
        </div>
      )}
    </div>
  );

  const sourcePerformanceCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16, width: "100%", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: ORANGE,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            margin: 0,
            ...ORANGE_HEADING_LIFT,
          }}
        >
          Source Performance
        </div>
        <Link
          href="/recruiter/analytics/reports?report=sources"
          style={{
            color: ORANGE,
            fontWeight: 800,
            fontSize: 13,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            flexShrink: 0,
            textDecoration: "none",
            ...ORANGE_HEADING_LIFT,
          }}
        >
          Full report →
        </Link>
      </div>
      <SourceBreakdown data={data?.sources || []} />
    </div>
  );

  const applicationFunnelCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16, width: "100%", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: ORANGE,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            margin: 0,
            ...ORANGE_HEADING_LIFT,
          }}
        >
          Application Funnel
        </div>
        <Link
          href="/recruiter/analytics/reports?report=funnel"
          style={{
            color: ORANGE,
            fontWeight: 800,
            fontSize: 13,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            flexShrink: 0,
            textDecoration: "none",
            ...ORANGE_HEADING_LIFT,
          }}
        >
          Full report →
        </Link>
      </div>
      <ApplicationFunnel data={data?.funnel || []} />
    </div>
  );

  const reportGatewaysCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16, width: "100%", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: ORANGE,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            margin: 0,
            ...ORANGE_HEADING_LIFT,
          }}
        >
          Report Gateways
        </div>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <ReportCard
          title="Time-to-Fill"
          description="See which roles close fastest and where delays build."
          href="/recruiter/analytics/reports?report=timeToFill"
          value={loading ? "…" : `${data?.kpis?.avgTimeToFillDays ?? 0} days`}
        />
        <ReportCard
          title="Quality of Hire"
          description="Track post-hire quality signals once enough data exists."
          href="/recruiter/analytics/reports?report=qualityOfHire"
          value="Building"
        />
        <ReportCard
          title="Talent Intelligence"
          description="Compare source quality, match reasons, and role signals."
          href="/recruiter/analytics/reports?report=talentIntel"
          value={loading ? "…" : topSource?.name || "N/A"}
        />
      </div>
    </div>
  );

  // ── Measuring shell — render nothing until we know screen size
  if (isMobile === null) {
    return (
      <RecruiterAnalyticsLayout
        title={LAYOUT_TITLE}
        pageSubtitle={LAYOUT_SUBTITLE}
        activeTab="command"
        filters={filters}
        onFilterChange={onFilterChange}
        hideDesktopRightRail
        mobileShell
      />
    );
  }

  // ── Mobile layout
  if (isMobile) {
    return (
      <RecruiterAnalyticsLayout
        title={LAYOUT_TITLE}
        pageSubtitle={LAYOUT_SUBTITLE}
        activeTab="command"
        filters={filters}
        onFilterChange={onFilterChange}
        hideDesktopRightRail
        isMobile
      >
        <div style={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
          {error && (
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(239,68,68,0.20)",
                background: "rgba(254,242,242,0.92)",
                color: "#991B1B",
                padding: 16,
              }}
            >
              {String(error)}
            </div>
          )}

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            <KPICard label="Total job views" value={data?.kpis?.totalViews ?? (loading ? "…" : 0)} />
            <KPICard label="Total applies" value={data?.kpis?.totalApplies ?? (loading ? "…" : 0)} />
            <KPICard
              label="Conversion rate"
              value={data ? `${data.kpis.conversionRatePct}%` : loading ? "…" : "0%"}
            />
            <KPICard
              label="Avg. time-to-fill"
              value={data ? `${data.kpis.avgTimeToFillDays} days` : loading ? "…" : "0 days"}
            />
            <KPICard label="Interviews" value={loading ? "…" : totalInterviews} />
            <KPICard label="Hires" value={loading ? "…" : totalHires} />
          </section>

          {isEnterprise ? (
            <>
              <div style={{ marginTop: 12 }}>
                <MobileCarousel cards={[execSnapshotCard, recruiterActivityCard, forgeInsightsCard]} />
              </div>
              <MobileCarousel cards={[sourcePerformanceCard, applicationFunnelCard, reportGatewaysCard]} />
            </>
          ) : (
            <FeatureLock label="Full Analytics">
              <div style={{ marginTop: 12 }}>
                <MobileCarousel cards={[execSnapshotCard, recruiterActivityCard, forgeInsightsCard]} />
              </div>
              <MobileCarousel cards={[sourcePerformanceCard, applicationFunnelCard, reportGatewaysCard]} />
            </FeatureLock>
          )}
        </div>
      </RecruiterAnalyticsLayout>
    );
  }

  // ── Desktop layout — right rail present, grid does the constraining
  const DesktopBlock = (
    <>
      <div
        style={{
          marginLeft: LEFT_BLEED,
          marginRight: RIGHT_BLEED,
          marginTop: DESKTOP_REPORT_DROP,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)",
          gap: 12,
        }}
      >
        {execSnapshotCard}
        {recruiterActivityCard}
        {forgeInsightsCard}
      </div>

      <div
        style={{
          marginLeft: LEFT_BLEED,
          marginRight: RIGHT_BLEED,
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)",
          gap: 12,
        }}
      >
        {sourcePerformanceCard}
        {applicationFunnelCard}
        {reportGatewaysCard}
      </div>
    </>
  );

  return (
    <RecruiterAnalyticsLayout
      title={LAYOUT_TITLE}
      pageSubtitle={LAYOUT_SUBTITLE}
      activeTab="command"
      filters={filters}
      onFilterChange={onFilterChange}
      isDesktop
    >
      {error && (
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(239,68,68,0.20)",
            background: "rgba(254,242,242,0.92)",
            color: "#991B1B",
            padding: 16,
          }}
        >
          {String(error)}
        </div>
      )}

      <div
  style={{
    ...GLASS,
    borderRadius: 18,
    padding: 16,
  }}
>
  <section
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, minmax(120px, 1fr))",
      gap: 12,
    }}
  >
        <KPICard label="Total job views" value={data?.kpis?.totalViews ?? (loading ? "…" : 0)} />
        <KPICard label="Total applies" value={data?.kpis?.totalApplies ?? (loading ? "…" : 0)} />
        <KPICard
          label="Conversion rate"
          value={data ? `${data.kpis.conversionRatePct}%` : loading ? "…" : "0%"}
        />
        <KPICard
          label="Avg. time-to-fill"
          value={data ? `${data.kpis.avgTimeToFillDays} days` : loading ? "…" : "0 days"}
        />
        <KPICard label="Interviews" value={loading ? "…" : totalInterviews} />
        <KPICard label="Hires" value={loading ? "…" : totalHires} />
       </section>
</div>

      {isEnterprise ? <>{DesktopBlock}</> : <FeatureLock label="Full Analytics">{DesktopBlock}</FeatureLock>}

      {data?.meta?.refreshedAt && (
        <div
          style={{
            fontSize: 12,
            color: "#64748B",
            textAlign: "right",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          Last updated: {new Date(data.meta.refreshedAt).toLocaleString()}
        </div>
      )}
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