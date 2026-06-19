// pages/profile-analytics.js
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import SeekerLayout from "@/components/layouts/SeekerLayout";
import CoachingLayout from "@/components/layouts/CoachingLayout";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";

import KPI from "@/components/analytics/KPI";
import ViewsChart from "@/components/analytics/ViewsChart";
import SearchAppearancesChart from "@/components/analytics/SearchAppearancesChart";
import ProfileCompletionCard from "@/components/analytics/ProfileCompletionCard";
import ConnectionsMiniChart from "@/components/analytics/ConnectionsMiniChart";
import RecentViewers from "@/components/analytics/RecentViewers";

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
const SLATE = "#334155";
const MUTED = "#64748B";

function safeArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "object" && Array.isArray(v.items)) return v.items.filter(Boolean);
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function skillNamesFromAny(skillsJson) {
  const arr = safeArray(skillsJson);
  return arr
    .map((x) => (typeof x === "string" ? x : x?.name || x?.label || ""))
    .map((s) => String(s || "").trim())
    .filter(Boolean);
}

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
    <div style={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      <div style={{ borderRadius: 18, overflow: "hidden", width: "100%" }}>
        <div
          ref={trackRef}
          style={{
            display: "flex",
            gap: 12,
            paddingLeft: 2,
            paddingRight: 2,
            width: "100%",
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
                scrollSnapAlign: "start",
                boxSizing: "border-box",
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

function SectionCard({ title, action, children, minHeight }) {
  return (
    <section
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 16,
        width: "100%",
        minWidth: 0,
        minHeight: minHeight || "auto",
      }}
    >
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
            fontWeight: 900,
          }}
        >
          {title}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function InsightTile({ label, title, body, tone = "live" }) {
  const config = {
    live: { bg: "rgba(255,112,67,0.12)", color: ORANGE, dot: ORANGE },
    strong: { bg: "rgba(22,163,74,0.10)", color: "#16A34A", dot: "#16A34A" },
    attention: { bg: "rgba(220,38,38,0.10)", color: "#DC2626", dot: "#DC2626" },
    building: { bg: "rgba(15,118,110,0.10)", color: "#0F766E", dot: "#0F766E" },
  }[tone] || { bg: "rgba(255,112,67,0.12)", color: ORANGE, dot: ORANGE };

  return (
    <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: config.dot,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            background: config.bg,
            color: config.color,
            borderRadius: 6,
            padding: "2px 7px",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 900, color: SLATE, lineHeight: 1.35 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65, marginTop: 6 }}>
        {body}
      </div>
    </div>
  );
}

function MiniMetric({ label, value, hint }) {
  return (
    <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 12 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: MUTED,
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 950, color: SLATE, lineHeight: 1 }}>
        {value}
      </div>
      {hint ? (
        <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.45, marginTop: 7 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      style={{
        height: 10,
        borderRadius: 999,
        background: "rgba(100,116,139,0.16)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 999,
          background: "linear-gradient(90deg,#FF7043,#FFB74D)",
        }}
      />
    </div>
  );
}

function ActionTile({ title, body, buttonLabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...GLASS_SOFT,
        borderRadius: 12,
        padding: 14,
        border: "1px solid rgba(255,255,255,0.22)",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        width: "100%",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 900, color: SLATE }}>{title}</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
      <div style={{ fontSize: 12, fontWeight: 900, color: ORANGE, marginTop: 10 }}>
        {buttonLabel}
      </div>
    </button>
  );
}

export default function ProfileAnalyticsPage() {
  const router = useRouter();
  const isCoachChrome = (router.query.chrome || "").toString() === "coach";
  const Layout = isCoachChrome ? CoachingLayout : SeekerLayout;

  const withChrome = useCallback(
    (href) => {
      const s = String(href || "");
      if (!isCoachChrome) return s;
      return s.includes("?") ? `${s}&chrome=coach` : `${s}?chrome=coach`;
    },
    [isCoachChrome]
  );

  const [profileDetails, setProfileDetails] = useState(null);
  const [primaryResume, setPrimaryResume] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function fetchProfileCompletionInputs() {
      setProfileLoading(true);
      try {
        const [dRes, pRes] = await Promise.all([
          fetch("/api/profile/details"),
          fetch("/api/profile/primaries"),
        ]);

        const dJson = await dRes.json().catch(() => ({}));
        const pJson = await pRes.json().catch(() => ({}));

        const merged = dJson?.details || dJson || null;

        if (!alive) return;
        setProfileDetails(merged || null);
        setPrimaryResume(pJson?.primaryResume || null);
      } catch (e) {
        console.error("[ProfileAnalytics] completion fetch error", e);
        if (!alive) return;
        setProfileDetails(null);
        setPrimaryResume(null);
      } finally {
        if (!alive) return;
        setProfileLoading(false);
      }
    }

    fetchProfileCompletionInputs();
    return () => {
      alive = false;
    };
  }, []);

  const completion = useMemo(() => {
    const headline = String(profileDetails?.headline || "").trim();
    const aboutMe = String(profileDetails?.aboutMe || "").trim();
    const skills = skillNamesFromAny(profileDetails?.skillsJson);
    const languages = safeArray(profileDetails?.languagesJson);

    const hasHeadline = headline.length >= 8;
    const hasSummary = aboutMe.length >= 120;
    const hasSkills = skills.length >= 8;
    const hasLanguages = safeArray(languages).length >= 1;
    const hasPrimaryResume = Boolean(primaryResume?.id);

    const total = 5;
    const completed =
      (hasHeadline ? 1 : 0) +
      (hasSummary ? 1 : 0) +
      (hasSkills ? 1 : 0) +
      (hasLanguages ? 1 : 0) +
      (hasPrimaryResume ? 1 : 0);

    const progress = Math.round((completed / total) * 100);

    const checklist = [
      { label: "Headline", done: hasHeadline },
      { label: "Summary", done: hasSummary },
      { label: "Skills (8+)", done: hasSkills },
      { label: "Languages (1+)", done: hasLanguages },
      { label: "Primary Resume", done: hasPrimaryResume },
    ];

    return {
      progress,
      completed,
      total,
      checklist,
    };
  }, [profileDetails, primaryResume]);

  const [analyticsState, setAnalyticsState] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function fetchAnalytics() {
      setAnalyticsLoading(true);
      try {
        const res = await fetch("/api/profile/analytics");
        const json = await res.json().catch(() => ({}));

        if (!alive) return;

        if (!res.ok) {
          console.error("[ProfileAnalytics] analytics fetch failed", json);
          setAnalyticsState(null);
          return;
        }

        setAnalyticsState(json || null);
      } catch (e) {
        console.error("[ProfileAnalytics] analytics fetch error", e);
        if (!alive) return;
        setAnalyticsState(null);
      } finally {
        if (!alive) return;
        setAnalyticsLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      alive = false;
    };
  }, []);

  const analytics = useMemo(() => {
    const a = analyticsState || {};

    const profileCompletionPct =
      Number(completion.progress) ||
      (typeof a.profileCompletionPct === "number" ? a.profileCompletionPct : 0);

    const daysLabels =
      Array.isArray(a.daysLabels) && a.daysLabels.length === 7
        ? a.daysLabels
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return {
      totalViews: typeof a.totalViews === "number" ? a.totalViews : 0,
      postsCount: typeof a.postsCount === "number" ? a.postsCount : 0,
      commentsCount: typeof a.commentsCount === "number" ? a.commentsCount : 0,
      connectionsGained7d:
        typeof a.connectionsGained7d === "number" ? a.connectionsGained7d : 0,

      profileCompletionPct,

      daysLabels,
      viewsLast7Days: Array.isArray(a.viewsLast7Days) ? a.viewsLast7Days : null,
      searchAppearancesLast7Days: Array.isArray(a.searchAppearancesLast7Days)
        ? a.searchAppearancesLast7Days
        : null,
      connectionsLast7Days: Array.isArray(a.connectionsLast7Days)
        ? a.connectionsLast7Days
        : null,

      lastProfileViewer: a.lastProfileViewer || {
        name: null,
        profileUrl: "/profile?tab=views",
      },

      recentViewers: Array.isArray(a.recentViewers) ? a.recentViewers : [],
      profileChecklist: Array.isArray(completion.checklist) ? completion.checklist : [],

      highestViewedPost: a.highestViewedPost || null,
      highestViewedComment: a.highestViewedComment || null,
    };
  }, [analyticsState, completion.progress, completion.checklist]);

  const allViewsHref = withChrome(analytics.lastProfileViewer?.profileUrl || "/profile?tab=views");

  const kpiValue = (v) => (v === null || typeof v === "undefined" ? "—" : String(v));

  const detailedAnalyticsAvailable =
    Array.isArray(analytics.viewsLast7Days) &&
    Array.isArray(analytics.searchAppearancesLast7Days) &&
    Array.isArray(analytics.connectionsLast7Days);

  const nextActions = useMemo(() => {
    const list = Array.isArray(analytics.profileChecklist) ? analytics.profileChecklist : [];
    return list.filter((x) => !x?.done).slice(0, 4);
  }, [analytics.profileChecklist]);

  const totalContentActivity = Number(analytics.postsCount || 0) + Number(analytics.commentsCount || 0);

  const weeklyViewsTotal = useMemo(() => {
    if (!Array.isArray(analytics.viewsLast7Days)) return 0;
    return analytics.viewsLast7Days.reduce((sum, n) => sum + Number(n || 0), 0);
  }, [analytics.viewsLast7Days]);

  const weeklySearchTotal = useMemo(() => {
    if (!Array.isArray(analytics.searchAppearancesLast7Days)) return 0;
    return analytics.searchAppearancesLast7Days.reduce((sum, n) => sum + Number(n || 0), 0);
  }, [analytics.searchAppearancesLast7Days]);

  const momentumScore = useMemo(() => {
    const completionPoints = Math.min(45, Math.round((analytics.profileCompletionPct || 0) * 0.45));
    const viewPoints = Math.min(20, analytics.totalViews * 2);
    const contentPoints = Math.min(20, totalContentActivity * 2);
    const connectionPoints = Math.min(15, analytics.connectionsGained7d * 5);
    return Math.max(0, Math.min(100, completionPoints + viewPoints + contentPoints + connectionPoints));
  }, [
    analytics.profileCompletionPct,
    analytics.totalViews,
    totalContentActivity,
    analytics.connectionsGained7d,
  ]);

  const momentumLabel = useMemo(() => {
    if (momentumScore >= 80) return "Strong momentum";
    if (momentumScore >= 50) return "Building momentum";
    if (momentumScore >= 25) return "Early momentum";
    return "Needs activity";
  }, [momentumScore]);

  const visibility = useMemo(() => {
    const c = Number(analytics.profileCompletionPct) || 0;

    if (c >= 80) {
      return {
        level: "Strong",
        tone: "strong",
        body: "Your profile has a strong foundation. Keep it current and connected to the roles you want.",
      };
    }

    if (c >= 40) {
      return {
        level: "Building",
        tone: "building",
        body: "Your profile is moving in the right direction. A few key updates can improve visibility quickly.",
      };
    }

    return {
      level: "Needs attention",
      tone: "attention",
      body: "Important recruiter and community signals are missing. Strengthening your profile should be the next move.",
    };
  }, [analytics.profileCompletionPct]);

  const topContentCard = (
    <SectionCard title="Top Content" minHeight={390}>
      <div style={{ display: "grid", gap: 12 }}>
        {analytics.highestViewedPost ? (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 800, textTransform: "uppercase" }}>
              Top Post
            </div>
            <a
              href={withChrome(analytics.highestViewedPost.url)}
              style={{
                display: "block",
                color: ORANGE,
                fontWeight: 900,
                marginTop: 6,
                textDecoration: "none",
              }}
            >
              {analytics.highestViewedPost.title}
            </a>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
              {analytics.highestViewedPost.views.toLocaleString()} interactions
            </div>
          </div>
        ) : (
          <InsightTile
            label="Building"
            tone="building"
            title="Post performance will appear here"
            body="Once feed interaction tracking is expanded, your strongest post will surface here with meaningful engagement context."
          />
        )}

        {analytics.highestViewedComment ? (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 800, textTransform: "uppercase" }}>
              Highest Liked Comment
            </div>
            <div style={{ color: SLATE, fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>
              “{analytics.highestViewedComment.snippet}”
            </div>
            <a
              href={withChrome(analytics.highestViewedComment.url)}
              style={{
                display: "inline-block",
                color: ORANGE,
                fontWeight: 900,
                marginTop: 8,
                textDecoration: "none",
              }}
            >
              View comment →
            </a>
          </div>
        ) : (
          <InsightTile
            label="Community"
            tone="live"
            title="Helpful comments become visibility signals"
            body="As comment-level tracking grows, this area can show which community contributions helped people notice you."
          />
        )}

        <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: ORANGE,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Content playbook
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              "Share a quick career win or lesson learned.",
              "Answer one Hearth discussion with useful detail.",
              "Comment where you can add practical experience.",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: ORANGE, fontWeight: 900, lineHeight: 1.35 }}>•</span>
                <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const actionsCard = (
    <SectionCard title="Next Best Actions" minHeight={390}>
      <div style={{ display: "grid", gap: 10 }}>
        {profileLoading ? (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, color: MUTED }}>
            Loading profile actions…
          </div>
        ) : nextActions.length ? (
          nextActions.map((item) => (
            <ActionTile
              key={item.label}
              title={item.label}
              body="Strengthen this profile signal in The Anvil to improve your visibility."
              buttonLabel="Open in The Anvil →"
              onClick={() => router.push(withChrome("/anvil?module=profile"))}
            />
          ))
        ) : (
          <InsightTile
            label="Complete"
            tone="strong"
            title="Your profile checklist is complete"
            body="Keep your profile fresh as your goals, projects, and experience evolve."
          />
        )}

        <ActionTile
          title="Review your public profile"
          body="See what recruiters, coaches, and professional contacts see when they land on your profile."
          buttonLabel="Open profile →"
          onClick={() => router.push(withChrome("/profile"))}
        />

        <ActionTile
          title="Build visibility through the Hearth"
          body="Helpful community activity can become professional visibility without turning into noisy social posting."
          buttonLabel="Open The Hearth →"
          onClick={() => router.push(withChrome("/hearth/spotlights"))}
        />
      </div>
    </SectionCard>
  );

  const visibilityCard = (
    <SectionCard title="Visibility Intelligence" minHeight={390}>
      <div style={{ display: "grid", gap: 10 }}>
        <InsightTile
          label={visibility.level}
          tone={visibility.tone}
          title={`${analytics.profileCompletionPct}% profile completion`}
          body={visibility.body}
        />
        <InsightTile
          label="Seen"
          tone="live"
          title={`${analytics.totalViews.toLocaleString()} profile interactions`}
          body="This is your current visibility footprint across profile and engagement activity."
        />
        <InsightTile
          label="Network"
          tone="building"
          title={`${analytics.connectionsGained7d.toLocaleString()} new connections in 7 days`}
          body="Connection growth helps show whether visibility is turning into real professional momentum."
        />

        <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: ORANGE,
              marginBottom: 10,
            }}
          >
            Visibility breakdown
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <MiniMetric label="7d views" value={weeklyViewsTotal} hint="Profile reach" />
            <MiniMetric label="Search hits" value={weeklySearchTotal} hint="Discovery" />
            <MiniMetric label="Content" value={totalContentActivity} hint="Posts + comments" />
            <MiniMetric label="Viewers" value={analytics.recentViewers.length} hint="Recent list" />
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const reachCard = (
    <SectionCard title="Reach Trend" minHeight={390}>
      {Array.isArray(analytics.viewsLast7Days) && Array.isArray(analytics.searchAppearancesLast7Days) ? (
        <div style={{ display: "grid", gap: 12 }}>
          <ViewsChart labels={analytics.daysLabels} data={analytics.viewsLast7Days} />
          <SearchAppearancesChart
            labels={analytics.daysLabels}
            data={analytics.searchAppearancesLast7Days}
          />
        </div>
      ) : (
        <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, color: MUTED, fontSize: 13 }}>
          {analyticsLoading ? "Loading charts…" : "No 7-day view/search chart data available yet."}
        </div>
      )}

      <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, marginTop: 12 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: ORANGE,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Reading the trend
        </div>
        <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>
          Spikes show moments when people noticed you. The next step is connecting those moments to
          posts, comments, profile updates, applications, or recruiter searches.
        </div>
      </div>
    </SectionCard>
  );

  const recentActivityCard = (
    <SectionCard title="Recent Activity" minHeight={390}>
      <div style={{ display: "grid", gap: 12 }}>
        {Array.isArray(analytics.connectionsLast7Days) ? (
          <ConnectionsMiniChart labels={analytics.daysLabels} data={analytics.connectionsLast7Days} />
        ) : (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, color: MUTED, fontSize: 13 }}>
            {analyticsLoading ? "Loading connection trend…" : "No connection trend data available yet."}
          </div>
        )}

        <RecentViewers viewers={analytics.recentViewers} allViewsHref={allViewsHref} />

        <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: ORANGE,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Why this matters
          </div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>
            Views are not the finish line. The goal is to turn visibility into profile visits,
            conversations, applications, referrals, and real opportunities.
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const completionCard = (
    <SectionCard title="Profile Strength" minHeight={390}>
      <div style={{ display: "grid", gap: 12 }}>
        <ProfileCompletionCard
          completionPct={analytics.profileCompletionPct}
          checklist={analytics.profileChecklist}
        />

        <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: ORANGE,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Momentum score
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 950, color: SLATE, lineHeight: 1 }}>
                {momentumScore}
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: ORANGE, marginTop: 4 }}>
                {momentumLabel}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 90 }}>
              <ProgressBar value={momentumScore} />
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.45, marginTop: 7 }}>
                Based on completion, profile interactions, content activity, and connection growth.
              </div>
            </div>
          </div>
        </div>

        <InsightTile
          label="Signal"
          tone={analytics.profileCompletionPct >= 80 ? "strong" : "building"}
          title="Complete profiles are easier to trust"
          body="Recruiters and contacts need quick proof of direction, capability, and credibility. This card keeps those gaps visible."
        />
      </div>
    </SectionCard>
  );

  const HeaderBox = (
    <section
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 16,
        textAlign: "center",
      }}
      aria-label="Profile analytics overview"
    >
      <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE }}>Profile Analytics</div>
      <div
        style={{
          marginTop: 6,
          fontSize: 14,
          color: MUTED,
          maxWidth: 720,
          marginInline: "auto",
          lineHeight: 1.5,
        }}
      >
        See how your profile, content, and community activity are helping you get noticed.
      </div>
    </section>
  );

  return (
    <>
      <Head>
        <title>Profile Analytics | ForgeTomorrow</title>
      </Head>

      <Layout
        title="Profile Analytics | ForgeTomorrow"
        header={HeaderBox}
        headerCard={false}
        right={<RightRailPlacementManager surfaceId="profile" />}
        activeNav="profile"
        sidebarInitialOpen={{ coaching: false, seeker: false }}
      >
        <div style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
          <div
            style={{
              ...GLASS,
              borderRadius: 18,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(120px, 1fr))",
                gap: 12,
              }}
              className="profileAnalyticsKpiGrid"
            >
              <KPI label="Profile Interactions" value={kpiValue(analytics.totalViews)} />
              <KPI label="Posts" value={kpiValue(analytics.postsCount)} />
              <KPI label="Comments" value={kpiValue(analytics.commentsCount)} />
              <KPI label="Connections (7d)" value={kpiValue(analytics.connectionsGained7d)} />
              <KPI label="Profile Completion" value={`${analytics.profileCompletionPct}%`} />
            </section>
          </div>

          <div className="profileAnalyticsMobile">
            <MobileCarousel cards={[visibilityCard, completionCard, actionsCard]} />
            <div style={{ marginTop: 12 }}>
              <MobileCarousel cards={[reachCard, recentActivityCard, topContentCard]} />
            </div>
          </div>

          <div className="profileAnalyticsDesktop">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)",
                gap: 12,
                marginTop: 12,
                alignItems: "stretch",
              }}
            >
              {visibilityCard}
              {reachCard}
              {completionCard}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)",
                gap: 12,
                marginTop: 12,
                alignItems: "stretch",
              }}
            >
              {actionsCard}
              {recentActivityCard}
              {topContentCard}
            </div>
          </div>

          {!detailedAnalyticsAvailable && !analyticsLoading ? (
            <div
              style={{
                fontSize: 12,
                color: MUTED,
                textAlign: "right",
                fontWeight: 600,
                lineHeight: 1.4,
                marginTop: 10,
              }}
            >
              Some charts will populate as profile and visibility events build.
            </div>
          ) : null}
        </div>

        <style jsx>{`
          .profileAnalyticsMobile {
            display: none;
          }

          @media (max-width: 1023px) {
            .profileAnalyticsKpiGrid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .profileAnalyticsDesktop {
              display: none;
            }

            .profileAnalyticsMobile {
              display: block;
            }
          }

          @media (max-width: 520px) {
            .profileAnalyticsKpiGrid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}