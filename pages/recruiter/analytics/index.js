// pages/recruiter/analytics/index.js
//
// Both desktop and mobile layouts are always rendered.
// CSS classes ft-desktop-charts / ft-mobile-charts control which is visible.
// No isMobile JavaScript state — zero layout flicker on any device.

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import RecruiterAnalyticsLayout from "@/components/layouts/RecruiterAnalyticsLayout";
import FeatureLock from "@/components/recruiter/FeatureLock";

import KPICard from "@/components/analytics/KPICard";
import ApplicationFunnel from "@/components/analytics/charts/ApplicationFunnel";
import SourceBreakdown from "@/components/analytics/charts/SourceBreakdown";
import RecruiterActivity from "@/components/analytics/charts/RecruiterActivity";

// ─── Design system tokens ─────────────────────────────────────────────────────
const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const GLASS_SOFT = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 8px 22px rgba(15,23,42,0.10)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const ORANGE = "#FF7043";
const SLATE  = "#334155";
const MUTED  = "#64748B";

// Desktop bleed: negative margins span into sidebar + right rail columns
const BLEED = -(240 + 12); // LEFT_W/RIGHT_W(240) + GAP(12)

// ─── Insight type config ──────────────────────────────────────────────────────
const INSIGHT_CONFIG = {
  live:      { badge: "Live",      badgeBg: "rgba(255,112,67,0.12)",  badgeColor: ORANGE,    dot: ORANGE    },
  attention: { badge: "Attention", badgeBg: "rgba(220,38,38,0.10)",   badgeColor: "#DC2626", dot: "#DC2626" },
  roadmap:   { badge: "Building",  badgeBg: "rgba(15,118,110,0.10)",  badgeColor: "#0F766E", dot: "#0F766E" },
};

// ─── Data hooks ───────────────────────────────────────────────────────────────

function buildQS(state) {
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
}

function useAnalytics(state) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const qs = useMemo(() => buildQS(state), [state]);

  useEffect(() => {
    let active = true;
    const fetch_ = async () => {
      try {
        setLoading(true); setError(null);
        const res  = await fetch(`/api/analytics/recruiter?${qs}`);
        const json = await res.json();
        if (active) setData(json);
      } catch (e) {
        if (active) setError(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch_();
    const id = setInterval(fetch_, 30000);
    return () => { active = false; clearInterval(id); };
  }, [qs]);

  return { data, loading, error };
}

function useInsights(state) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading]   = useState(false);
  const qs = useMemo(() => buildQS(state), [state]);

  useEffect(() => {
    let active = true;
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res  = await fetch(`/api/analytics/insights?${qs}`);
        const json = await res.json();
        if (active && Array.isArray(json.insights)) setInsights(json.insights);
      } catch (_) { }
      finally { if (active) setLoading(false); }
    };
    fetch_();
    const id = setInterval(fetch_, 60000);
    return () => { active = false; clearInterval(id); };
  }, [qs]);

  return { insights, loading };
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

// ─── Mobile carousel ──────────────────────────────────────────────────────────
// Same pattern as candidate-center.js — overflow:hidden on wrapper, 100% width cards.

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
    <div style={{ marginBottom: 12 }}>
      {/* overflow:hidden clips the carousel — track inside retains overflowX:auto */}
      <div style={{ ...GLASS, borderRadius: 18, overflow: "hidden", width: "100%" }}>
        <div
          ref={trackRef}
          style={{
            display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
            msOverflowStyle: "none", scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
          }}
        >
          {cards.map((card, i) => (
            <div key={i} style={{ flexShrink: 0, width: "100%", scrollSnapAlign: "start", boxSizing: "border-box" }}>
              {card}
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
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

// ─── UI components ────────────────────────────────────────────────────────────

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
  const { data, loading, error }            = useAnalytics(filters);
  const { insights, loading: insightsLoading } = useInsights(filters);
  const { isEnterprise } = usePlan();

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

  const totalInterviews     = data?.kpis?.totalInterviews      ?? 0;
  const totalHires          = data?.kpis?.totalHires           ?? 0;
  const offerAcceptanceRate = data?.kpis?.offerAcceptanceRatePct ?? 0;

  const topSource = Array.isArray(data?.sources) && data.sources.length > 0
    ? data.sources.reduce((best, item) => Number(item?.value ?? 0) > Number(best?.value ?? 0) ? item : best)
    : null;

  const visibleInsights = Array.isArray(insights) ? insights.slice(0, 4) : [];

  // ── Shared card definitions ───────────────────────────────────────────────
  // Each card is used in BOTH the desktop bleed grid and the mobile carousel.
  // CSS classes on the wrapper divs (ft-stat-tiles) handle internal layout changes.

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
      {/* ft-stat-tiles: 3-col on desktop, 1-col on mobile via CSS */}
      <div className="ft-stat-tiles" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
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
        <ReportCard title="Time-to-Fill"       description="See which roles close fastest and where delays build."         href="/recruiter/analytics/time-to-fill"        value={loading ? "…" : `${data?.kpis?.avgTimeToFillDays ?? 0} days`} />
        <ReportCard title="Quality of Hire"    description="Track post-hire quality signals once enough data exists."      href="/recruiter/analytics/quality-of-hire"     value="Building" />
        <ReportCard title="Talent Intelligence" description="Compare source quality, match reasons, and role signals."     href="/recruiter/analytics/talent-intelligence"  value={loading ? "…" : topSource?.name || "N/A"} />
      </div>
    </div>
  );

  // ── Desktop bleed grid ────────────────────────────────────────────────────
  const bleed = { marginLeft: BLEED, marginRight: BLEED, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)", gap: 12 };

  const DesktopBlock = (
    <>
      <div style={{ ...bleed, marginTop: 68 }}>{execSnapshotCard}{recruiterActivityCard}{forgeInsightsCard}</div>
      <div style={{ ...bleed, marginTop: 12 }}>{sourcePerformanceCard}{applicationFunnelCard}{reportGatewaysCard}</div>
    </>
  );

  // ── Mobile carousel ───────────────────────────────────────────────────────
  const MobileBlock = (
    <>
      <MobileCarousel cards={[execSnapshotCard, recruiterActivityCard, forgeInsightsCard]} />
      <MobileCarousel cards={[sourcePerformanceCard, applicationFunnelCard, reportGatewaysCard]} />
    </>
  );

  const ChartsContent = (
    <>
      {/* ft-desktop-charts: visible on desktop, display:none on mobile via CSS */}
      <div className="ft-desktop-charts">{DesktopBlock}</div>
      {/* ft-mobile-charts: visible on mobile, display:none on desktop via CSS */}
      <div className="ft-mobile-charts">{MobileBlock}</div>
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
        <div style={{ borderRadius: 18, border: "1px solid rgba(239,68,68,0.20)", background: "rgba(254,242,242,0.86)", color: "#B91C1C", padding: 16 }}>
          {String(error)}
        </div>
      ) : null}

      {/* KPI row — ft-kpi-row: 6-col on desktop, 2-col on mobile via CSS */}
      <section
        className="ft-kpi-row"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))", gap: 12 }}
      >
        <KPICard label="Total job views"   value={data?.kpis?.totalViews        ?? (loading ? "…" : 0)} />
        <KPICard label="Total applies"     value={data?.kpis?.totalApplies      ?? (loading ? "…" : 0)} />
        <KPICard label="Conversion rate"   value={data ? `${data.kpis.conversionRatePct}%`           : loading ? "…" : "0%"} />
        <KPICard label="Avg. time-to-fill" value={data ? `${data.kpis.avgTimeToFillDays} days`       : loading ? "…" : "0 days"} />
        <KPICard label="Interviews"        value={loading ? "…" : totalInterviews} />
        <KPICard label="Hires"             value={loading ? "…" : totalHires} />
      </section>

      {isEnterprise ? ChartsContent : <FeatureLock label="Full Analytics">{ChartsContent}</FeatureLock>}

      {data?.meta?.refreshedAt ? (
        <div className="ft-bleed-ts" style={{ fontSize: 12, color: "#94A3B8", textAlign: "right", marginRight: BLEED }}>
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