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

import { useAnalytics, useInsights } from "@/hooks/useAnalyticsData";
import { getFiltersFromQuery } from "@/lib/analytics/analyticsUtils";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GLASS = {
  border:               "1px solid rgba(255,255,255,0.22)",
  background:           "rgba(255,255,255,0.68)",
  boxShadow:            "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const GLASS_SOFT = {
  border:               "1px solid rgba(255,255,255,0.18)",
  background:           "rgba(255,255,255,0.58)",
  boxShadow:            "0 8px 22px rgba(15,23,42,0.10)",
  backdropFilter:       "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const ORANGE = "#FF7043";
const SLATE  = "#334155";
const MUTED  = "#64748B";

// Bleed spans into left sidebar (240px) + gap (12px) on each side.
// Only ever applied when isDesktop — never rendered on mobile.
const BLEED = -(240 + 12);

// ─── Insight config ───────────────────────────────────────────────────────────
const INSIGHT_CONFIG = {
  live:      { badge: "Live",      badgeBg: "rgba(255,112,67,0.12)",  badgeColor: ORANGE,    dot: ORANGE    },
  attention: { badge: "Attention", badgeBg: "rgba(220,38,38,0.10)",   badgeColor: "#DC2626", dot: "#DC2626" },
  roadmap:   { badge: "Building",  badgeBg: "rgba(15,118,110,0.10)",  badgeColor: "#0F766E", dot: "#0F766E" },
};

// ─── Mobile carousel ──────────────────────────────────────────────────────────
function MobileCarousel({ cards }) {
  const trackRef     = useRef(null);
  const programmatic = useRef(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const goTo = (index) => {
    setActiveIdx(index);
    const track = trackRef.current;
    if (!track) return;
    programmatic.current = true;
    track.scrollTo({ left: index * track.offsetWidth, behavior: "smooth" });
    setTimeout(() => { programmatic.current = false; }, 600);
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
    <div style={{ marginBottom: 12, width: "100%", boxSizing: "border-box" }}>
      <div style={{ borderRadius: 18, overflow: "hidden", width: "100%" }}>
        <div
          ref={trackRef}
          style={{
            display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
            msOverflowStyle: "none", scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
          }}
        >
          {cards.map((card, i) => (
            <div key={i} style={{
              flexShrink:     0,
              width:          "100%",
              scrollSnapAlign:"start",
              boxSizing:      "border-box",
              overflowY:      "auto",
              overflowX:      "hidden",
            }}>
              {card}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
        {cards.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Go to card ${i + 1}`}
            style={{
              width: i === activeIdx ? 24 : 8, height: 8, borderRadius: 999,
              background: i === activeIdx ? ORANGE : "rgba(255,112,67,0.25)",
              border: "none", padding: 0, cursor: "pointer",
              transition: "width 220ms ease, background 220ms ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Card sub-components ──────────────────────────────────────────────────────
function StatTile({ label, value, hint }) {
  return (
    <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11, color: MUTED }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: SLATE, marginTop: 5, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{hint}</div>
    </div>
  );
}

function InsightTile({ insight }) {
  const cfg = INSIGHT_CONFIG[insight.type] ?? INSIGHT_CONFIG.live;
  return (
    <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", background: cfg.badgeBg, color: cfg.badgeColor, borderRadius: 6, padding: "2px 7px" }}>
          {cfg.badge}
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: SLATE, flex: 1 }}>{insight.title}</span>
      </div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>{insight.body}</div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, height: 80, opacity: 0.5, background: "rgba(255,255,255,0.35)" }} />
      ))}
    </div>
  );
}

function ReportCard({ title, description, href, value }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, minHeight: 110, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: ORANGE, marginBottom: 6 }}>Full report</div>
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

// ─── Page body ────────────────────────────────────────────────────────────────
function Body() {
  const router = useRouter();
  const [filters, setFilters] = useState(getFiltersFromQuery(router.query));
  const { data, loading, error }               = useAnalytics(filters);
  const { insights, loading: insightsLoading } = useInsights(filters);
  const { isEnterprise } = usePlan();

  // null = unmeasured | true = mobile | false = desktop
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
      { pathname: router.pathname, query: { range: next.range, jobId: next.jobId, recruiterId: next.recruiterId, companyId: next.companyId, ...(next.from ? { from: next.from } : {}), ...(next.to ? { to: next.to } : {}) } },
      undefined, { shallow: true, scroll: false }
    );
  };

  const totalInterviews     = data?.kpis?.totalInterviews        ?? 0;
  const totalHires          = data?.kpis?.totalHires             ?? 0;
  const offerAcceptanceRate = data?.kpis?.offerAcceptanceRatePct ?? 0;

  const topSource = Array.isArray(data?.sources) && data.sources.length > 0
    ? data.sources.reduce((best, item) => Number(item?.value ?? 0) > Number(best?.value ?? 0) ? item : best)
    : null;

  const visibleInsights = Array.isArray(insights) ? insights.slice(0, 4) : [];

  const LAYOUT_TITLE    = "Analytics — ForgeTomorrow";
  const LAYOUT_SUBTITLE = "A recruiter command center for funnel health, source performance, recruiter output, and hiring intelligence.";

  // Shared card definitions — same JSX used in both mobile and desktop
  const execSnapshotCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Executive Snapshot</div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Source quality, interview flow, and close efficiency.</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Link href="/recruiter/analytics/reports" style={{ textDecoration: "none", borderRadius: 999, background: "rgba(255,112,67,0.12)", color: ORANGE, fontSize: 12, fontWeight: 800, padding: "7px 12px" }}>
          Report details
        </Link>
        <Link href="/recruiter/analytics/presentation" style={{ textDecoration: "none", borderRadius: 999, background: "rgba(51,65,85,0.08)", color: SLATE, fontSize: 12, fontWeight: 800, padding: "7px 12px" }}>
          Visuals
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <StatTile label="Top source"       value={loading ? "…" : topSource?.name || "N/A"}   hint="Best-performing inbound channel" />
        <StatTile label="Offer acceptance" value={loading ? "…" : `${offerAcceptanceRate}%`}  hint="High-trust close efficiency signal" />
        <StatTile label="Apply-to-hire"    value={loading ? "…" : data?.kpis?.totalApplies ? `${((totalHires / data.kpis.totalApplies) * 100).toFixed(1)}%` : "0%"} hint="Applications converting into hires" />
      </div>
    </div>
  );

  const recruiterActivityCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Recruiter Activity</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Applications and interviews this window.</div>
        </div>
        <Link href="/recruiter/analytics/recruiters" style={{ color: ORANGE, fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}>Full report →</Link>
      </div>
      <RecruiterActivity data={data?.recruiterActivity || []} />
    </div>
  );

  const forgeInsightsCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Forge Insights</div>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: ORANGE, boxShadow: "0 0 0 3px rgba(255,112,67,0.18)" }} />
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>What matters most right now.</div>
      </div>
      {insightsLoading && !insights ? <InsightsSkeleton /> : visibleInsights.length > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          {visibleInsights.map((insight, i) => <InsightTile key={i} insight={insight} />)}
        </div>
      ) : (
        <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>Insights will appear here as your pipeline data builds.</div>
        </div>
      )}
    </div>
  );

  const sourcePerformanceCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Source Performance</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Channels producing the strongest outcomes.</div>
        </div>
        <Link href="/recruiter/analytics/sources" style={{ color: ORANGE, fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}>Full report →</Link>
      </div>
      <SourceBreakdown data={data?.sources || []} />
    </div>
  );

  const applicationFunnelCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Application Funnel</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Movement from interest to hire.</div>
        </div>
        <Link href="/recruiter/analytics/funnel" style={{ color: ORANGE, fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}>Full report →</Link>
      </div>
      <ApplicationFunnel data={data?.funnel || []} />
    </div>
  );

  const reportGatewaysCard = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Report Gateways</div>
      <div style={{ fontSize: 13, color: MUTED, marginTop: 4, marginBottom: 12 }}>Drill into dedicated reports for the why.</div>
      <div style={{ display: "grid", gap: 10 }}>
        <ReportCard title="Time-to-Fill"        description="See which roles close fastest and where delays build."    href="/recruiter/analytics/time-to-fill"       value={loading ? "…" : `${data?.kpis?.avgTimeToFillDays ?? 0} days`} />
        <ReportCard title="Quality of Hire"     description="Track post-hire quality signals once enough data exists." href="/recruiter/analytics/quality-of-hire"    value="Building" />
        <ReportCard title="Talent Intelligence" description="Compare source quality, match reasons, and role signals." href="/recruiter/analytics/talent-intelligence" value={loading ? "…" : topSource?.name || "N/A"} />
      </div>
    </div>
  );

  // ── Empty shell — measuring ────────────────────────────────────────────────
  if (isMobile === null) {
    return (
      <RecruiterAnalyticsLayout
        title={LAYOUT_TITLE}
        pageSubtitle={LAYOUT_SUBTITLE}
        activeTab="command"
        filters={filters}
        onFilterChange={onFilterChange}
        mobileShell
      />
    );
  }

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <RecruiterAnalyticsLayout
        title={LAYOUT_TITLE}
        pageSubtitle={LAYOUT_SUBTITLE}
        activeTab="command"
        filters={filters}
        onFilterChange={onFilterChange}
        isMobile
      >
        {error && (
          <div style={{ borderRadius: 18, border: "1px solid rgba(239,68,68,0.20)", background: "rgba(254,242,242,0.86)", color: "#B91C1C", padding: 16 }}>
            {String(error)}
          </div>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <KPICard label="Total job views"   value={data?.kpis?.totalViews        ?? (loading ? "…" : 0)} />
          <KPICard label="Total applies"     value={data?.kpis?.totalApplies      ?? (loading ? "…" : 0)} />
          <KPICard label="Conversion rate"   value={data ? `${data.kpis.conversionRatePct}%` : loading ? "…" : "0%"} />
          <KPICard label="Avg. time-to-fill" value={data ? `${data.kpis.avgTimeToFillDays} days` : loading ? "…" : "0 days"} />
          <KPICard label="Interviews"        value={loading ? "…" : totalInterviews} />
          <KPICard label="Hires"             value={loading ? "…" : totalHires} />
        </section>

        {isEnterprise ? (
          <>
            <MobileCarousel cards={[execSnapshotCard, recruiterActivityCard, forgeInsightsCard]} />
            <MobileCarousel cards={[sourcePerformanceCard, applicationFunnelCard, reportGatewaysCard]} />
          </>
        ) : (
          <FeatureLock label="Full Analytics">
            <MobileCarousel cards={[execSnapshotCard, recruiterActivityCard, forgeInsightsCard]} />
            <MobileCarousel cards={[sourcePerformanceCard, applicationFunnelCard, reportGatewaysCard]} />
          </FeatureLock>
        )}
      </RecruiterAnalyticsLayout>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  const DesktopBlock = (
    <>
      <div style={{ marginLeft: BLEED, marginRight: BLEED, marginTop: 68, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)", gap: 12 }}>
        {execSnapshotCard}{recruiterActivityCard}{forgeInsightsCard}
      </div>
      <div style={{ marginLeft: BLEED, marginRight: BLEED, marginTop: 12, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)", gap: 12 }}>
        {sourcePerformanceCard}{applicationFunnelCard}{reportGatewaysCard}
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
        <div style={{ borderRadius: 18, border: "1px solid rgba(239,68,68,0.20)", background: "rgba(254,242,242,0.86)", color: "#B91C1C", padding: 16 }}>
          {String(error)}
        </div>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))", gap: 12 }}>
        <KPICard label="Total job views"   value={data?.kpis?.totalViews        ?? (loading ? "…" : 0)} />
        <KPICard label="Total applies"     value={data?.kpis?.totalApplies      ?? (loading ? "…" : 0)} />
        <KPICard label="Conversion rate"   value={data ? `${data.kpis.conversionRatePct}%` : loading ? "…" : "0%"} />
        <KPICard label="Avg. time-to-fill" value={data ? `${data.kpis.avgTimeToFillDays} days` : loading ? "…" : "0 days"} />
        <KPICard label="Interviews"        value={loading ? "…" : totalInterviews} />
        <KPICard label="Hires"             value={loading ? "…" : totalHires} />
      </section>

      {isEnterprise ? DesktopBlock : <FeatureLock label="Full Analytics">{DesktopBlock}</FeatureLock>}

      {data?.meta?.refreshedAt && (
        <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "right", marginRight: BLEED }}>
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