// pages/profile-analytics.js
// Seeker profile analytics command center.
// Matches RecruiterAnalyticsLayout bleed grid pattern on desktop.
// Mobile: single-column stacked cards per tab.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import SeekerAnalyticsLayout from "@/components/layouts/SeekerAnalyticsLayout";

import KPI from "@/components/analytics/KPI";
import ViewsChart from "@/components/analytics/ViewsChart";
import SearchAppearancesChart from "@/components/analytics/SearchAppearancesChart";
import ProfileCompletionCard from "@/components/analytics/ProfileCompletionCard";
import ConnectionsMiniChart from "@/components/analytics/ConnectionsMiniChart";
import RecentViewers from "@/components/analytics/RecentViewers";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const CARD = {
  border: "1px solid rgba(0,0,0,0.07)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
  borderRadius: 12,
};

const ORANGE = "#FF7043";
const SLATE  = "#334155";
const MUTED  = "#64748B";
const GAP    = 12;

// ─── Bleed constants — match recruiter analytics exactly ──────────────────────
// Layout sidebar: 240px, gap: 12 → LEFT_BLEED = -(240+12)
// Layout right rail: 260px, gap: 12 → RIGHT_BLEED = -(260+12)
const LEFT_BLEED         = -(240 + 12);
const RIGHT_BLEED        = -(260 + 12);
const DESKTOP_BLEED_DROP = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "object" && Array.isArray(v.items)) return v.items.filter(Boolean);
  if (typeof v === "string") {
    try { return JSON.parse(v).filter(Boolean); } catch { return []; }
  }
  return [];
}
function skillNamesFromAny(skillsJson) {
  return safeArray(skillsJson)
    .map((x) => (typeof x === "string" ? x : x?.name || x?.label || ""))
    .map((s) => String(s || "").trim())
    .filter(Boolean);
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function SectionCard({ title, children, minHeight }) {
  return (
    <section style={{ ...GLASS, borderRadius: 18, padding: 16, width: "100%", minWidth: 0, boxSizing: "border-box", minHeight: minHeight || "auto" }}>
      <div style={{ fontSize: 17, color: ORANGE, lineHeight: 1.25, letterSpacing: "-0.01em", fontWeight: 900, marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </section>
  );
}

function InsightTile({ label, title, body, tone = "live" }) {
  const cfg = {
    live:      { bg: "rgba(255,112,67,0.12)",  color: ORANGE,    dot: ORANGE },
    strong:    { bg: "rgba(22,163,74,0.10)",   color: "#16A34A", dot: "#16A34A" },
    attention: { bg: "rgba(220,38,38,0.10)",   color: "#DC2626", dot: "#DC2626" },
    building:  { bg: "rgba(15,118,110,0.10)",  color: "#0F766E", dot: "#0F766E" },
  }[tone] || { bg: "rgba(255,112,67,0.12)", color: ORANGE, dot: ORANGE };

  return (
    <div style={{ ...CARD, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", background: cfg.bg, color: cfg.color, borderRadius: 6, padding: "2px 7px" }}>{label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 900, color: SLATE, lineHeight: 1.35 }}>{title}</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65, marginTop: 6 }}>{body}</div>
    </div>
  );
}

function MiniMetric({ label, value, hint }) {
  return (
    <div style={{ ...CARD, padding: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: MUTED, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 950, color: SLATE, lineHeight: 1 }}>{value}</div>
      {hint ? <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.45, marginTop: 7 }}>{hint}</div> : null}
    </div>
  );
}

function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div style={{ height: 10, borderRadius: 999, background: "rgba(100,116,139,0.16)", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#FF7043,#FFB74D)" }} />
    </div>
  );
}

function ActionTile({ title, body, buttonLabel, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ ...CARD, padding: 14, textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%", border: "1px solid rgba(255,112,67,0.18)" }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: SLATE }}>{title}</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
      <div style={{ fontSize: 12, fontWeight: 900, color: ORANGE, marginTop: 10 }}>{buttonLabel}</div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProfileAnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Profile completion ───────────────────────────────────────────────────
  const [profileDetails, setProfileDetails]   = useState(null);
  const [primaryResume, setPrimaryResume]     = useState(null);
  const [profileLoading, setProfileLoading]   = useState(true);

  useEffect(() => {
    let alive = true;
    async function fetchCompletion() {
      setProfileLoading(true);
      try {
        const [dRes, pRes] = await Promise.all([fetch("/api/profile/details"), fetch("/api/profile/primaries")]);
        const dJson = await dRes.json().catch(() => ({}));
        const pJson = await pRes.json().catch(() => ({}));
        if (!alive) return;
        setProfileDetails(dJson?.details || dJson || null);
        setPrimaryResume(pJson?.primaryResume || null);
      } catch { if (!alive) return; setProfileDetails(null); setPrimaryResume(null); }
      finally { if (!alive) return; setProfileLoading(false); }
    }
    fetchCompletion();
    return () => { alive = false; };
  }, []);

  const completion = useMemo(() => {
    const headline       = String(profileDetails?.headline || "").trim();
    const aboutMe        = String(profileDetails?.aboutMe || "").trim();
    const skills         = skillNamesFromAny(profileDetails?.skillsJson);
    const languages      = safeArray(profileDetails?.languagesJson);
    const hasHeadline    = headline.length >= 8;
    const hasSummary     = aboutMe.length >= 120;
    const hasSkills      = skills.length >= 8;
    const hasLanguages   = safeArray(languages).length >= 1;
    const hasPrimaryResume = Boolean(primaryResume?.id);
    const total     = 5;
    const completed = [hasHeadline, hasSummary, hasSkills, hasLanguages, hasPrimaryResume].filter(Boolean).length;
    const progress  = Math.round((completed / total) * 100);
    const checklist = [
      { label: "Headline",        done: hasHeadline },
      { label: "Summary",         done: hasSummary },
      { label: "Skills (8+)",     done: hasSkills },
      { label: "Languages (1+)",  done: hasLanguages },
      { label: "Primary Resume",  done: hasPrimaryResume },
    ];
    return { progress, completed, total, checklist };
  }, [profileDetails, primaryResume]);

  // ── Analytics data ───────────────────────────────────────────────────────
  const [analyticsState, setAnalyticsState]     = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function fetchAnalytics() {
      setAnalyticsLoading(true);
      try {
        const res  = await fetch("/api/profile/analytics");
        const json = await res.json().catch(() => ({}));
        if (!alive) return;
        setAnalyticsState(res.ok ? (json || null) : null);
      } catch { if (!alive) return; setAnalyticsState(null); }
      finally { if (!alive) return; setAnalyticsLoading(false); }
    }
    fetchAnalytics();
    return () => { alive = false; };
  }, []);

  const analytics = useMemo(() => {
    const a = analyticsState || {};
    const profileCompletionPct = Number(completion.progress) || (typeof a.profileCompletionPct === "number" ? a.profileCompletionPct : 0);
    const daysLabels = Array.isArray(a.daysLabels) && a.daysLabels.length === 7 ? a.daysLabels : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    return {
      totalViews:                 typeof a.totalViews === "number" ? a.totalViews : 0,
      postsCount:                 typeof a.postsCount === "number" ? a.postsCount : 0,
      commentsCount:              typeof a.commentsCount === "number" ? a.commentsCount : 0,
      connectionsGained7d:        typeof a.connectionsGained7d === "number" ? a.connectionsGained7d : 0,
      profileCompletionPct,
      daysLabels,
      viewsLast7Days:             Array.isArray(a.viewsLast7Days) ? a.viewsLast7Days : null,
      searchAppearancesLast7Days: Array.isArray(a.searchAppearancesLast7Days) ? a.searchAppearancesLast7Days : null,
      connectionsLast7Days:       Array.isArray(a.connectionsLast7Days) ? a.connectionsLast7Days : null,
      lastProfileViewer:          a.lastProfileViewer || { name: null, profileUrl: "/profile?tab=views" },
      recentViewers:              Array.isArray(a.recentViewers) ? a.recentViewers : [],
      profileChecklist:           Array.isArray(completion.checklist) ? completion.checklist : [],
      highestViewedPost:          a.highestViewedPost || null,
      highestViewedComment:       a.highestViewedComment || null,
    };
  }, [analyticsState, completion.progress, completion.checklist]);

  const kpiValue = (v) => (v === null || v === undefined ? "—" : String(v));
  const allViewsHref     = analytics.lastProfileViewer?.profileUrl || "/profile?tab=views";
  const nextActions      = useMemo(() => analytics.profileChecklist.filter((x) => !x?.done).slice(0, 4), [analytics.profileChecklist]);
  const totalContent     = Number(analytics.postsCount || 0) + Number(analytics.commentsCount || 0);
  const weeklyViews      = useMemo(() => (Array.isArray(analytics.viewsLast7Days) ? analytics.viewsLast7Days.reduce((s, n) => s + Number(n || 0), 0) : 0), [analytics.viewsLast7Days]);
  const weeklySearch     = useMemo(() => (Array.isArray(analytics.searchAppearancesLast7Days) ? analytics.searchAppearancesLast7Days.reduce((s, n) => s + Number(n || 0), 0) : 0), [analytics.searchAppearancesLast7Days]);

  const momentumScore = useMemo(() => {
    const cp  = Math.min(45, Math.round((analytics.profileCompletionPct || 0) * 0.45));
    const vp  = Math.min(20, analytics.totalViews * 2);
    const cnp = Math.min(20, totalContent * 2);
    const ncp = Math.min(15, analytics.connectionsGained7d * 5);
    return Math.max(0, Math.min(100, cp + vp + cnp + ncp));
  }, [analytics.profileCompletionPct, analytics.totalViews, totalContent, analytics.connectionsGained7d]);

  const momentumLabel = momentumScore >= 80 ? "Strong momentum" : momentumScore >= 50 ? "Building momentum" : momentumScore >= 25 ? "Early momentum" : "Needs activity";

  const visibility = useMemo(() => {
    const c = Number(analytics.profileCompletionPct) || 0;
    if (c >= 80) return { level: "Strong",        tone: "strong",    body: "Your profile has a strong foundation. Keep it current and connected to the roles you want." };
    if (c >= 40) return { level: "Building",       tone: "building",  body: "Your profile is moving in the right direction. A few key updates can improve visibility quickly." };
    return           { level: "Needs attention",  tone: "attention", body: "Important recruiter and community signals are missing. Strengthening your profile should be the next move." };
  }, [analytics.profileCompletionPct]);

  // ── Section cards ────────────────────────────────────────────────────────
  const visibilityCard = (
    <SectionCard title="Visibility Intelligence" minHeight={390}>
      <div style={{ display: "grid", gap: GAP }}>
        <InsightTile label={visibility.level} tone={visibility.tone} title={`${analytics.profileCompletionPct}% profile completion`} body={visibility.body} />
        <InsightTile label="Seen" tone="live" title={`${analytics.totalViews.toLocaleString()} profile interactions`} body="Your current visibility footprint across profile and engagement activity." />
        <InsightTile label="Network" tone="building" title={`${analytics.connectionsGained7d.toLocaleString()} new connections in 7 days`} body="Connection growth shows whether visibility is turning into real professional momentum." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <MiniMetric label="7d views"    value={weeklyViews}                     hint="Profile reach" />
          <MiniMetric label="Search hits" value={weeklySearch}                    hint="Discovery" />
          <MiniMetric label="Content"     value={totalContent}                    hint="Posts + comments" />
          <MiniMetric label="Viewers"     value={analytics.recentViewers.length}  hint="Recent list" />
        </div>
      </div>
    </SectionCard>
  );

  const actionsCard = (
    <SectionCard title="Next Best Actions" minHeight={390}>
      <div style={{ display: "grid", gap: 10 }}>
        {profileLoading ? (
          <div style={{ ...CARD, padding: 14, color: MUTED, fontSize: 13 }}>Loading profile actions…</div>
        ) : nextActions.length ? (
          nextActions.map((item) => (
            <ActionTile key={item.label} title={item.label} body="Strengthen this profile signal in The Anvil to improve your visibility." buttonLabel="Open in The Anvil →" onClick={() => router.push("/anvil?module=profile")} />
          ))
        ) : (
          <InsightTile label="Complete" tone="strong" title="Your profile checklist is complete" body="Keep your profile fresh as your goals, projects, and experience evolve." />
        )}
        <ActionTile title="Review your public profile" body="See what recruiters, coaches, and contacts see when they land on your profile." buttonLabel="Open profile →" onClick={() => router.push("/profile")} />
        <ActionTile title="Build visibility through the Hearth" body="Helpful community activity can become professional visibility without noisy social posting." buttonLabel="Open The Hearth →" onClick={() => router.push("/hearth/spotlights")} />
      </div>
    </SectionCard>
  );

  const reachCard = (
    <SectionCard title="Reach Trend" minHeight={390}>
      {Array.isArray(analytics.viewsLast7Days) && Array.isArray(analytics.searchAppearancesLast7Days) ? (
        <div style={{ display: "grid", gap: GAP }}>
          <ViewsChart labels={analytics.daysLabels} data={analytics.viewsLast7Days} />
          <SearchAppearancesChart labels={analytics.daysLabels} data={analytics.searchAppearancesLast7Days} />
        </div>
      ) : (
        <div style={{ ...CARD, padding: 14, color: MUTED, fontSize: 13 }}>{analyticsLoading ? "Loading charts…" : "No 7-day chart data available yet."}</div>
      )}
      <div style={{ ...CARD, padding: 14, marginTop: GAP }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Reading the trend</div>
        <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>Spikes show moments when people noticed you. Connect those moments to posts, comments, profile updates, applications, or recruiter searches.</div>
      </div>
    </SectionCard>
  );

  const recentActivityCard = (
    <SectionCard title="Recent Activity" minHeight={390}>
      <div style={{ display: "grid", gap: GAP }}>
        {Array.isArray(analytics.connectionsLast7Days) ? (
          <ConnectionsMiniChart labels={analytics.daysLabels} data={analytics.connectionsLast7Days} />
        ) : (
          <div style={{ ...CARD, padding: 14, color: MUTED, fontSize: 13 }}>{analyticsLoading ? "Loading connection trend…" : "No connection trend data yet."}</div>
        )}
        <RecentViewers viewers={analytics.recentViewers} allViewsHref={allViewsHref} />
        <div style={{ ...CARD, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Why this matters</div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>Views are not the finish line. The goal is to turn visibility into profile visits, conversations, applications, referrals, and real opportunities.</div>
        </div>
      </div>
    </SectionCard>
  );

  const strengthCard = (
    <SectionCard title="Profile Strength" minHeight={390}>
      <div style={{ display: "grid", gap: GAP }}>
        <ProfileCompletionCard completionPct={analytics.profileCompletionPct} checklist={analytics.profileChecklist} />
        <div style={{ ...CARD, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Momentum score</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 950, color: SLATE, lineHeight: 1 }}>{momentumScore}</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: ORANGE, marginTop: 4 }}>{momentumLabel}</div>
            </div>
            <div style={{ flex: 1, minWidth: 90 }}>
              <ProgressBar value={momentumScore} />
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.45, marginTop: 7 }}>Based on completion, profile interactions, content activity, and connection growth.</div>
            </div>
          </div>
        </div>
        <InsightTile label="Signal" tone={analytics.profileCompletionPct >= 80 ? "strong" : "building"} title="Complete profiles are easier to trust" body="Recruiters and contacts need quick proof of direction, capability, and credibility." />
      </div>
    </SectionCard>
  );

  const topContentCard = (
    <SectionCard title="Top Content" minHeight={390}>
      <div style={{ display: "grid", gap: GAP }}>
        {analytics.highestViewedPost ? (
          <div style={{ ...CARD, padding: 14 }}>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 800, textTransform: "uppercase" }}>Top Post</div>
            <a href={analytics.highestViewedPost.url} style={{ display: "block", color: ORANGE, fontWeight: 900, marginTop: 6, textDecoration: "none" }}>{analytics.highestViewedPost.title}</a>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{analytics.highestViewedPost.views.toLocaleString()} interactions</div>
          </div>
        ) : (
          <InsightTile label="Building" tone="building" title="Top post performance will appear here" body="Once feed interaction tracking is expanded, your strongest post will surface here." />
        )}
        {analytics.highestViewedComment ? (
          <div style={{ ...CARD, padding: 14 }}>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 800, textTransform: "uppercase" }}>Highest Liked Comment</div>
            <div style={{ color: SLATE, fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>"{analytics.highestViewedComment.snippet}"</div>
            <a href={analytics.highestViewedComment.url} style={{ display: "inline-block", color: ORANGE, fontWeight: 900, marginTop: 8, textDecoration: "none" }}>View comment →</a>
          </div>
        ) : (
          <InsightTile label="Community" tone="live" title="Helpful comments become visibility signals" body="As comment-level tracking grows, this area will show which community contributions helped people notice you." />
        )}
        <div style={{ ...CARD, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Content playbook</div>
          <div style={{ display: "grid", gap: 8 }}>
            {["Share a quick career win or lesson learned.", "Answer one Hearth discussion with useful detail.", "Comment where you can add practical experience."].map((item) => (
              <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: ORANGE, fontWeight: 900, lineHeight: 1.35, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );

  // ── KPI strip ────────────────────────────────────────────────────────────
  const kpiStrip = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: GAP }}>
        <KPI label="Profile Interactions" value={kpiValue(analytics.totalViews)} />
        <KPI label="Posts"                value={kpiValue(analytics.postsCount)} />
        <KPI label="Comments"             value={kpiValue(analytics.commentsCount)} />
        <KPI label="Connections (7d)"     value={kpiValue(analytics.connectionsGained7d)} />
        <KPI label="Profile Completion"   value={`${analytics.profileCompletionPct}%`} />
      </section>
    </div>
  );

  // ── Tab content ──────────────────────────────────────────────────────────
  const renderTabContent = () => {
    // Mobile: single-column stacked, no bleed
    if (isMobile) {
      if (activeTab === "overview")    return <div style={{ display: "grid", gap: GAP }}>{kpiStrip}{visibilityCard}{actionsCard}</div>;
      if (activeTab === "visibility")  return <div style={{ display: "grid", gap: GAP }}>{reachCard}{recentActivityCard}</div>;
      if (activeTab === "strength")    return <div style={{ display: "grid", gap: GAP }}>{strengthCard}{actionsCard}</div>;
      if (activeTab === "activity")    return <div style={{ display: "grid", gap: GAP }}>{topContentCard}{recentActivityCard}</div>;
      return null;
    }

    // Desktop: bleed grid matching recruiter analytics pattern
    // Row 1: 1fr | 2fr | 1fr (same proportions as recruiter)
    // Row 2: 1fr | 2fr | 1fr
    if (activeTab === "overview") {
      return (
        <>
          {kpiStrip}
          <div style={{ marginLeft: LEFT_BLEED, marginRight: RIGHT_BLEED, marginTop: DESKTOP_BLEED_DROP, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr) minmax(0,1fr)", gap: GAP }}>
            {visibilityCard}
            {reachCard}
            {actionsCard}
          </div>
          <div style={{ marginLeft: LEFT_BLEED, marginRight: RIGHT_BLEED, marginTop: GAP, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr) minmax(0,1fr)", gap: GAP }}>
            {strengthCard}
            {recentActivityCard}
            {topContentCard}
          </div>
        </>
      );
    }

    if (activeTab === "visibility") {
      return (
        <div style={{ marginLeft: LEFT_BLEED, marginRight: RIGHT_BLEED, marginTop: DESKTOP_BLEED_DROP, display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: GAP }}>
          {reachCard}
          {recentActivityCard}
        </div>
      );
    }

    if (activeTab === "strength") {
      return (
        <div style={{ marginLeft: LEFT_BLEED, marginRight: RIGHT_BLEED, marginTop: DESKTOP_BLEED_DROP, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: GAP }}>
          {strengthCard}
          {actionsCard}
        </div>
      );
    }

    if (activeTab === "activity") {
      return (
        <div style={{ marginLeft: LEFT_BLEED, marginRight: RIGHT_BLEED, marginTop: DESKTOP_BLEED_DROP, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)", gap: GAP }}>
          {topContentCard}
          {recentActivityCard}
        </div>
      );
    }

    return null;
  };

  return (
    <SeekerAnalyticsLayout
      title="Profile Analytics | ForgeTomorrow"
      suiteTitle="Profile Analytics"
      pageSubtitle="Understand how your profile performs, who's viewing it, and what actions will accelerate your visibility."
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div style={{ width: "100%", maxWidth: "100%", minWidth: 0, display: "grid", gap: GAP }}>
        {renderTabContent()}
      </div>
    </SeekerAnalyticsLayout>
  );
}