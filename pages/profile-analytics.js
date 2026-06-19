// pages/profile-analytics.js
// Seeker profile analytics command center.
// Follows Sora's inlay pattern exactly:
//   - Layout owns: title card
//   - Page owns: tab nav card + inlay content
//   - isMobile === null gate prevents flash
//   - Bleed (edge-to-edge) only on Overview tab, matching recruiter Command Center
//   - Other tabs: full-width normal content

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import SeekerAnalyticsLayout, { SeekerAnalyticsNavBar } from "@/components/layouts/SeekerAnalyticsLayout";

import KPI from "@/components/analytics/KPI";
import ViewsChart from "@/components/analytics/ViewsChart";
import SearchAppearancesChart from "@/components/analytics/SearchAppearancesChart";
import ConnectionsMiniChart from "@/components/analytics/ConnectionsMiniChart";
import RecentViewers from "@/components/analytics/RecentViewers";

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
const SLATE  = "#1E293B";
const MUTED  = "#475569";
const GAP    = 12;

const ORANGE_HEADING_LIFT = {
  textShadow: "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
  fontWeight: 900,
};

// ─── Bleed constants — match Sora's recruiter CommandInlay exactly ────────────
const LEFT_BLEED         = -(240 + 12);   // sidebar 240 + gap 12
const RIGHT_BLEED        = -(240 + 12);   // right rail 240 + gap 12
const DESKTOP_BLEED_DROP = 32;            // same as DESKTOP_REPORT_DROP in recruiter

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
function skillNamesFromAny(s) {
  return safeArray(s).map((x) => (typeof x === "string" ? x : x?.name || x?.label || "")).map((v) => String(v || "").trim()).filter(Boolean);
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function SectionCard({ title, children, action }) {
  return (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16, width: "100%", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: "-0.01em", margin: 0, ...ORANGE_HEADING_LIFT }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
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
    <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", background: cfg.bg, color: cfg.color, borderRadius: 6, padding: "2px 7px" }}>{label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 900, color: SLATE, lineHeight: 1.35 }}>{title}</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65, marginTop: 6 }}>{body}</div>
    </div>
  );
}


function RotatingCard({ title, slides = [], intervalMs = 5200, minHeight = 210 }) {
  const validSlides = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (validSlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((idx) => (idx + 1) % validSlides.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [validSlides.length, intervalMs]);

  useEffect(() => {
    if (activeIndex >= validSlides.length) setActiveIndex(0);
  }, [activeIndex, validSlides.length]);

  return (
    <SectionCard title={title}>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ minHeight, display: "grid" }}>
          {validSlides[activeIndex] || null}
        </div>

        {validSlides.length > 1 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {validSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Show slide ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                style={{
                  width: idx === activeIndex ? 18 : 7,
                  height: 7,
                  borderRadius: 999,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  background: idx === activeIndex ? ORANGE : "rgba(100,116,139,0.32)",
                  transition: "all 160ms ease",
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function MiniMetric({ label, value, hint }) {
  return (
    <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: MUTED, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 950, color: SLATE, lineHeight: 1 }}>{value}</div>
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
    <button type="button" onClick={onClick} style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, border: "1px solid rgba(255,112,67,0.18)", textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: SLATE }}>{title}</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
      <div style={{ fontSize: 12, fontWeight: 900, color: ORANGE, marginTop: 10 }}>{buttonLabel}</div>
    </button>
  );
}


function SignalChip({ label, value, tone = "neutral" }) {
  const cfg = {
    good: { border: "rgba(22,163,74,0.24)", bg: "rgba(22,163,74,0.10)", color: "#166534" },
    warn: { border: "rgba(217,119,6,0.24)", bg: "rgba(217,119,6,0.10)", color: "#92400E" },
    risk: { border: "rgba(220,38,38,0.22)", bg: "rgba(220,38,38,0.10)", color: "#991B1B" },
    neutral: { border: "rgba(100,116,139,0.18)", bg: "rgba(248,250,252,0.82)", color: SLATE },
  }[tone] || { border: "rgba(100,116,139,0.18)", bg: "rgba(248,250,252,0.82)", color: SLATE };

  return (
    <div style={{ border: `1px solid ${cfg.border}`, background: cfg.bg, color: cfg.color, borderRadius: 12, padding: "10px 11px" }}>
      <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: "0.07em", textTransform: "uppercase", opacity: 0.78 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 950, lineHeight: 1.15, marginTop: 4 }}>{value || "—"}</div>
    </div>
  );
}

function BulletList({ items = [] }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {(items || []).filter(Boolean).map((item, idx) => (
        <div key={`${item}-${idx}`} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ color: ORANGE, fontWeight: 950, lineHeight: 1.35, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function SmallPill({ children, tone = "neutral" }) {
  const cfg = {
    good: { border: "rgba(22,163,74,0.22)", bg: "rgba(22,163,74,0.09)", color: "#166534" },
    warn: { border: "rgba(217,119,6,0.24)", bg: "rgba(217,119,6,0.10)", color: "#92400E" },
    dark: { border: "rgba(15,23,42,0.88)", bg: "rgba(15,23,42,0.92)", color: "#FFFFFF" },
    neutral: { border: "rgba(100,116,139,0.20)", bg: "rgba(248,250,252,0.88)", color: MUTED },
  }[tone] || { border: "rgba(100,116,139,0.20)", bg: "rgba(248,250,252,0.88)", color: MUTED };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", border: `1px solid ${cfg.border}`, background: cfg.bg, color: cfg.color, borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 850, lineHeight: 1.1 }}>
      {children}
    </span>
  );
}

// ─── Tab copy ─────────────────────────────────────────────────────────────────
const TAB_COPY = {
  overview:   { title: "Profile Analytics — ForgeTomorrow", subtitle: "Understand how your profile performs, who's viewing it, and what actions will accelerate your visibility." },
  visibility: { title: "Profile Analytics — ForgeTomorrow", subtitle: "See how your profile is being discovered and who's been looking at your work." },
  strength:   { title: "Profile Analytics — ForgeTomorrow", subtitle: "See how recruiters are likely to interpret your profile, evidence, and positioning." },
  activity:   { title: "Profile Analytics — ForgeTomorrow", subtitle: "Track your content performance and community presence on ForgeTomorrow." },
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProfileAnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile]   = useState(null); // null = measuring, true/false = known

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Profile completion ───────────────────────────────────────────────────
  const [profileDetails, setProfileDetails] = useState(null);
  const [primaryResume, setPrimaryResume]   = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setProfileLoading(true);
      try {
        const [dRes, pRes] = await Promise.all([fetch("/api/profile/details"), fetch("/api/profile/primaries")]);
        const dJson = await dRes.json().catch(() => ({}));
        const pJson = await pRes.json().catch(() => ({}));
        if (!alive) return;
        setProfileDetails(dJson?.details || dJson || null);
        setPrimaryResume(pJson?.primaryResume || null);
      } catch { if (!alive) return; }
      finally { if (!alive) return; setProfileLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const completion = useMemo(() => {
    const headline  = String(profileDetails?.headline || "").trim();
    const aboutMe   = String(profileDetails?.aboutMe || "").trim();
    const skills    = skillNamesFromAny(profileDetails?.skillsJson);
    const languages = safeArray(profileDetails?.languagesJson);
    const checks = [headline.length >= 8, aboutMe.length >= 120, skills.length >= 8, safeArray(languages).length >= 1, Boolean(primaryResume?.id)];
    const completed = checks.filter(Boolean).length;
    return {
      progress:  Math.round((completed / 5) * 100),
      checklist: [
        { label: "Headline",        done: checks[0] },
        { label: "Summary",         done: checks[1] },
        { label: "Skills (8+)",     done: checks[2] },
        { label: "Languages (1+)",  done: checks[3] },
        { label: "Primary Resume",  done: checks[4] },
      ],
    };
  }, [profileDetails, primaryResume]);

  // ── Analytics data ───────────────────────────────────────────────────────
  const [analyticsState, setAnalyticsState]     = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setAnalyticsLoading(true);
      try {
        const res  = await fetch("/api/profile/analytics");
        const json = await res.json().catch(() => ({}));
        if (!alive) return;
        setAnalyticsState(res.ok ? (json || null) : null);
      } catch { if (!alive) return; }
      finally { if (!alive) return; setAnalyticsLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const analytics = useMemo(() => {
    const a   = analyticsState || {};
    const pct = Number(completion.progress) || (typeof a.profileCompletionPct === "number" ? a.profileCompletionPct : 0);
    const days = Array.isArray(a.daysLabels) && a.daysLabels.length === 7 ? a.daysLabels : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    return {
      totalViews:                 typeof a.totalViews === "number" ? a.totalViews : 0,
      postsCount:                 typeof a.postsCount === "number" ? a.postsCount : 0,
      commentsCount:              typeof a.commentsCount === "number" ? a.commentsCount : 0,
      connectionsGained7d:        typeof a.connectionsGained7d === "number" ? a.connectionsGained7d : 0,
      profileCompletionPct:       pct,
      daysLabels:                 days,
      viewsLast7Days:             Array.isArray(a.viewsLast7Days) ? a.viewsLast7Days : null,
      searchAppearancesLast7Days: Array.isArray(a.searchAppearancesLast7Days) ? a.searchAppearancesLast7Days : null,
      connectionsLast7Days:       Array.isArray(a.connectionsLast7Days) ? a.connectionsLast7Days : null,
      lastProfileViewer:          a.lastProfileViewer || { profileUrl: "/profile?tab=views" },
      recentViewers:              Array.isArray(a.recentViewers) ? a.recentViewers : [],
      profileChecklist:           Array.isArray(completion.checklist) ? completion.checklist : [],
      highestViewedPost:          a.highestViewedPost || null,
      highestViewedComment:       a.highestViewedComment || null,
    };
  }, [analyticsState, completion]);

  const kv = (v) => (v === null || v === undefined ? "—" : String(v));
  const allViewsHref  = analytics.lastProfileViewer?.profileUrl || "/profile?tab=views";
  const nextActions   = useMemo(() => analytics.profileChecklist.filter((x) => !x?.done).slice(0, 4), [analytics.profileChecklist]);
  const totalContent  = Number(analytics.postsCount || 0) + Number(analytics.commentsCount || 0);
  const weeklyViews   = useMemo(() => (analytics.viewsLast7Days || []).reduce((s, n) => s + Number(n || 0), 0), [analytics.viewsLast7Days]);
  const weeklySearch  = useMemo(() => (analytics.searchAppearancesLast7Days || []).reduce((s, n) => s + Number(n || 0), 0), [analytics.searchAppearancesLast7Days]);

  const momentumScore = useMemo(() => {
    const cp = Math.min(45, Math.round((analytics.profileCompletionPct || 0) * 0.45));
    const vp = Math.min(20, analytics.totalViews * 2);
    const np = Math.min(20, totalContent * 2);
    const cc = Math.min(15, analytics.connectionsGained7d * 5);
    return Math.max(0, Math.min(100, cp + vp + np + cc));
  }, [analytics.profileCompletionPct, analytics.totalViews, totalContent, analytics.connectionsGained7d]);

  const momentumLabel = momentumScore >= 80 ? "Strong momentum" : momentumScore >= 50 ? "Building momentum" : momentumScore >= 25 ? "Early momentum" : "Needs activity";

  const vis = useMemo(() => {
    const c = Number(analytics.profileCompletionPct) || 0;
    if (c >= 80) return { level: "Strong",        tone: "strong",    body: "Your profile has a strong foundation. Keep it current and connected to the roles you want." };
    if (c >= 40) return { level: "Building",       tone: "building",  body: "Your profile is moving in the right direction. A few key updates can improve visibility quickly." };
    return           { level: "Needs attention",  tone: "attention", body: "Important recruiter and community signals are missing. Strengthening your profile should be the next move." };
  }, [analytics.profileCompletionPct]);


  const strengthProfile = useMemo(() => {
    const headline = String(
      profileDetails?.headline ||
      profileDetails?.title ||
      profileDetails?.currentTitle ||
      ""
    ).trim();

    const summary = String(
      profileDetails?.aboutMe ||
      profileDetails?.summary ||
      profileDetails?.bio ||
      profileDetails?.profileSummary ||
      ""
    ).trim();

    const skills = Array.from(new Set([
      ...skillNamesFromAny(profileDetails?.skillsJson),
      ...skillNamesFromAny(profileDetails?.skills),
      ...skillNamesFromAny(profileDetails?.skillsProfile),
    ])).filter(Boolean).slice(0, 24);

    const languages = safeArray(profileDetails?.languagesJson || profileDetails?.languages).map((x) =>
      typeof x === "string" ? x : x?.name || x?.label || ""
    ).filter(Boolean);

    const projects = safeArray(
      profileDetails?.projectsJson ||
      profileDetails?.projects ||
      profileDetails?.portfolioProjects ||
      profileDetails?.projectHighlights
    );

    const certifications = safeArray(
      profileDetails?.certificationsJson ||
      profileDetails?.certifications ||
      profileDetails?.training
    );

    const education = safeArray(
      profileDetails?.educationJson ||
      profileDetails?.education ||
      profileDetails?.educationList
    );

    const hasResume = Boolean(primaryResume?.id);
    const hasStrongIdentity = headline.length >= 8 && summary.length >= 120;
    const hasProjectProof = projects.length > 0;
    const hasCapabilityProof = skills.length >= 8 || certifications.length > 0;

    const professionalSignal = hasResume && hasStrongIdentity && hasCapabilityProof ? "Strong" : hasStrongIdentity || hasResume ? "Building" : "Review";
    const executionVisibility = hasProjectProof ? "Strong" : totalContent > 0 || analytics.profileCompletionPct >= 80 ? "Building" : "Limited";
    const validationRisk = hasResume && hasCapabilityProof && analytics.profileCompletionPct >= 80 ? "Low" : hasResume || hasStrongIdentity ? "Moderate" : "Review";
    const portfolioDepth = hasProjectProof ? "Strong" : analytics.profileCompletionPct >= 80 ? "Strong" : analytics.profileCompletionPct >= 50 ? "Building" : "Emerging";
    const resumeAccess = hasResume ? "Available" : "Missing";

    const confidence = Math.max(
      35,
      Math.min(
        96,
        Math.round(
          (analytics.profileCompletionPct || 0) * 0.72 +
          (hasResume ? 9 : 0) +
          (hasProjectProof ? 8 : 0) +
          (skills.length >= 8 ? 5 : 0) +
          (totalContent > 0 ? 2 : 0)
        )
      )
    );

    const summaryPreview = summary
      ? (summary.length > 360 ? `${summary.slice(0, 357).trim()}...` : summary)
      : "Your profile has enough structure to start building a recruiter-facing readout, but the summary area needs clearer positioning before this signal feels complete.";

    const currentDirection = headline || "Career direction not clearly stated yet";
    const primaryEvidence = hasResume && hasProjectProof ? "Portfolio + Resume + Projects" : hasResume ? "Portfolio + Resume" : "Profile signals only";
    const recruiterAction = validationRisk === "Low" ? "Validate fit" : "Strengthen evidence";

    const evidenceLibrary = [
      headline ? `Headline present: ${headline}` : "Headline needs a clearer professional direction.",
      summary ? "Professional summary is present." : "Professional summary is missing or too light.",
      skills.length ? `${skills.length} skill signals detected.` : "Skill signals need to be added.",
      hasResume ? "Primary resume is available." : "Primary resume is not attached yet.",
      projects.length ? `${projects.length} structured project signal${projects.length === 1 ? "" : "s"} detected.` : "Structured project proof is not visible yet.",
      totalContent > 0 ? `${totalContent} content signal${totalContent === 1 ? "" : "s"} from posts/comments.` : "Content signals are not active yet.",
    ];

    const validationAreas = [];
    if (!projects.length) validationAreas.push("Add one concrete project, work sample, implementation example, or measurable outcome.");
    if (!hasResume) validationAreas.push("Attach a primary resume so recruiters can validate your experience quickly.");
    if (summary.length < 120) validationAreas.push("Strengthen your summary so your professional direction is clear in the first read.");
    if (skills.length < 8) validationAreas.push("Add at least eight strong skill signals tied to your target roles.");
    if (!certifications.length) validationAreas.push("Add certifications, training, or credentials if they support your direction.");
    if (!validationAreas.length) validationAreas.push("Keep evidence fresh by adding new projects, outcomes, and role-specific proof as your work evolves.");

    const clusterDefs = [
      { label: "Support Operations", match: /support|service|ticket|incident|help desk|troubleshoot|customer/i },
      { label: "Customer Operations", match: /client|customer|success|account|stakeholder|relationship|escalation/i },
      { label: "Service Delivery", match: /delivery|sla|process|workflow|service now|servicenow|itil|operations/i },
      { label: "Leadership", match: /lead|manager|supervisor|coach|mentor|team|training/i },
      { label: "Systems & Tools", match: /salesforce|azure|intune|jamf|remedy|bmc|crm|analytics|reporting/i },
    ];

    const capabilityClusters = clusterDefs.map((cluster) => ({
      label: cluster.label,
      items: skills.filter((skill) => cluster.match.test(skill)).slice(0, 5),
    })).filter((cluster) => cluster.items.length);

    const used = new Set(capabilityClusters.flatMap((cluster) => cluster.items.map((item) => item.toLowerCase())));
    const remaining = skills.filter((skill) => !used.has(skill.toLowerCase())).slice(0, 8);
    if (remaining.length) capabilityClusters.push({ label: "Additional Signals", items: remaining });

    return {
      headline,
      summary,
      summaryPreview,
      skills,
      languages,
      projects,
      certifications,
      education,
      hasResume,
      professionalSignal,
      executionVisibility,
      validationRisk,
      portfolioDepth,
      resumeAccess,
      confidence,
      currentDirection,
      primaryEvidence,
      recruiterAction,
      evidenceLibrary,
      validationAreas: validationAreas.slice(0, 5),
      capabilityClusters: capabilityClusters.slice(0, 5),
    };
  }, [profileDetails, primaryResume, analytics.profileCompletionPct, totalContent]);

  // ── Section cards ────────────────────────────────────────────────────────
  const visibilityCard = (
    <RotatingCard
      title="Visibility Intelligence"
      minHeight={132}
      slides={[
        <InsightTile
          key="visibility-completion"
          label={vis.level}
          tone={vis.tone}
          title={`${analytics.profileCompletionPct}% profile completion`}
          body={vis.body}
        />,
        <InsightTile
          key="visibility-interactions"
          label="Seen"
          tone="live"
          title={`${analytics.totalViews.toLocaleString()} profile interactions`}
          body="Your current visibility footprint across profile and engagement activity."
        />,
        <InsightTile
          key="visibility-connections"
          label="Network"
          tone="building"
          title={`${analytics.connectionsGained7d.toLocaleString()} new connections in 7 days`}
          body="Connection growth shows whether visibility is turning into real professional momentum."
        />,
      ]}
    />
  );

  const actionsCard = (
    <SectionCard title="Next Best Actions">
      <div style={{ display: "grid", gap: 10 }}>
        {profileLoading ? (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, color: MUTED }}>Loading profile actions…</div>
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
    <SectionCard title="Reach Trend">
      {Array.isArray(analytics.viewsLast7Days) && Array.isArray(analytics.searchAppearancesLast7Days) ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            alignItems: "stretch",
            gap: GAP,
          }}
        >
          <div
            style={{
              ...GLASS_SOFT,
              borderRadius: 16,
              padding: 14,
              minHeight: isMobile ? 300 : 430,
              overflow: "hidden",
              display: "grid",
              gridTemplateRows: "auto minmax(0, 1fr)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: ORANGE, marginBottom: 8 }}>Views (Last 7 Days)</div>
            <div style={{ minHeight: isMobile ? 240 : 360, overflow: "hidden" }}>
              <ViewsChart labels={analytics.daysLabels} data={analytics.viewsLast7Days} />
            </div>
          </div>

          <div
            style={{
              ...GLASS_SOFT,
              borderRadius: 16,
              padding: 14,
              minHeight: isMobile ? 300 : 430,
              overflow: "hidden",
              display: "grid",
              gridTemplateRows: "auto minmax(0, 1fr)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: ORANGE, marginBottom: 8 }}>Search Appearances (Last 7 Days)</div>
            <div style={{ minHeight: isMobile ? 240 : 360, overflow: "hidden" }}>
              <SearchAppearancesChart labels={analytics.daysLabels} data={analytics.searchAppearancesLast7Days} />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, color: MUTED, fontSize: 13 }}>{analyticsLoading ? "Loading charts…" : "No chart data available yet."}</div>
      )}
    </SectionCard>
  );

  const recentActivityCard = (
    <SectionCard title="Recent Activity">
      <div style={{ display: "grid", gap: GAP }}>
        {Array.isArray(analytics.connectionsLast7Days) ? (
          <ConnectionsMiniChart labels={analytics.daysLabels} data={analytics.connectionsLast7Days} />
        ) : (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, color: MUTED, fontSize: 13 }}>{analyticsLoading ? "Loading…" : "No connection trend data yet."}</div>
        )}
        <RecentViewers viewers={analytics.recentViewers} allViewsHref={allViewsHref} />
        <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Why this matters</div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>Views are not the finish line. The goal is to turn visibility into profile visits, conversations, applications, referrals, and real opportunities.</div>
        </div>
      </div>
    </SectionCard>
  );

  const strengthSignalCard = (
    <RotatingCard
      title="Professional Signal"
      minHeight={145}
      slides={[
        <div key="signal-core" style={{ display: "grid", gap: 10 }}>
          <SignalChip label="Professional Signal" value={strengthProfile.professionalSignal} tone={strengthProfile.professionalSignal === "Strong" ? "good" : strengthProfile.professionalSignal === "Building" ? "warn" : "risk"} />
          <SignalChip label="Execution Visibility" value={strengthProfile.executionVisibility} tone={strengthProfile.executionVisibility === "Strong" ? "good" : strengthProfile.executionVisibility === "Building" ? "warn" : "risk"} />
          <SignalChip label="Validation Risk" value={strengthProfile.validationRisk} tone={strengthProfile.validationRisk === "Low" ? "good" : "warn"} />
        </div>,
        <div key="signal-depth" style={{ display: "grid", gap: 10 }}>
          <SignalChip label="Portfolio Depth" value={strengthProfile.portfolioDepth} tone={strengthProfile.portfolioDepth === "Strong" ? "good" : strengthProfile.portfolioDepth === "Building" ? "warn" : "risk"} />
          <SignalChip label="Resume Access" value={strengthProfile.resumeAccess} tone={strengthProfile.resumeAccess === "Available" ? "good" : "risk"} />
          <SignalChip label="Signal Confidence" value={`${strengthProfile.confidence}%`} tone={strengthProfile.confidence >= 75 ? "good" : strengthProfile.confidence >= 55 ? "warn" : "risk"} />
        </div>,
        <div key="signal-readiness" style={{ display: "grid", gap: 10 }}>
          <SignalChip label="Current Direction" value={strengthProfile.headline ? "Defined" : "Needs clarity"} tone={strengthProfile.headline ? "good" : "warn"} />
          <SignalChip label="Capability Signals" value={strengthProfile.skills.length ? `${strengthProfile.skills.length} detected` : "Needs skills"} tone={strengthProfile.skills.length >= 8 ? "good" : "warn"} />
          <SignalChip label="Project Proof" value={strengthProfile.projects.length ? "Visible" : "Missing"} tone={strengthProfile.projects.length ? "good" : "risk"} />
        </div>,
      ]}
    />
  );

  const strengthRecruiterLensHeroCard = (
    <section
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 18,
        flex: "1 1 auto",
        minWidth: 0,
        alignSelf: "flex-end",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 950, color: ORANGE, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            Recruiter Lens
          </div>
          <div style={{ fontSize: 22, color: ORANGE, lineHeight: 1.15, letterSpacing: "-0.01em", ...ORANGE_HEADING_LIFT }}>
            How Recruiters Read Your Profile
          </div>
        </div>
        <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: "10px 12px", textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 30, fontWeight: 950, color: ORANGE, lineHeight: 1 }}>{strengthProfile.confidence}%</div>
          <div style={{ fontSize: 10, fontWeight: 900, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase" }}>Signal Confidence</div>
        </div>
      </div>

      <div style={{ ...GLASS_SOFT, background: "rgba(255,255,255,0.76)", borderRadius: 16, padding: 16, minHeight: 238 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
          Positioning & Recruiter Summary
        </div>
        <div style={{ fontSize: 13, color: SLATE, lineHeight: 1.75 }}>
          {strengthProfile.summaryPreview}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 14 }}>
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 9.5, fontWeight: 900, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase" }}>Current Direction</div>
            <div style={{ fontSize: 12.5, fontWeight: 950, color: SLATE, lineHeight: 1.35, marginTop: 5 }}>{strengthProfile.currentDirection}</div>
          </div>
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 9.5, fontWeight: 900, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase" }}>Primary Evidence</div>
            <div style={{ fontSize: 12.5, fontWeight: 950, color: SLATE, lineHeight: 1.35, marginTop: 5 }}>{strengthProfile.primaryEvidence}</div>
          </div>
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 9.5, fontWeight: 900, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase" }}>Recruiter Action</div>
            <div style={{ fontSize: 12.5, fontWeight: 950, color: SLATE, lineHeight: 1.35, marginTop: 5 }}>{strengthProfile.recruiterAction}</div>
          </div>
        </div>
      </div>
    </section>
  );

  const strengthActionsCard = (
    <RotatingCard
      title="Strengthen Position"
      minHeight={145}
      slides={[
        <div key="validation" style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase" }}>Validation Areas</div>
          <BulletList items={strengthProfile.validationAreas.slice(0, 3)} />
        </div>,
        <div key="next-actions" style={{ display: "grid", gap: 10 }}>
          <ActionTile title="Update your Anvil profile" body="Tighten the signals recruiters use to understand your professional direction." buttonLabel="Open The Anvil →" onClick={() => router.push("/anvil?module=profile")} />
          <ActionTile title="Add execution proof" body="Projects, work samples, outcomes, and implementation examples improve recruiter confidence." buttonLabel="Open profile →" onClick={() => router.push("/profile")} />
        </div>,
        <div key="readout" style={{ display: "grid", gap: 10 }}>
          <InsightTile label="Mirror" tone="live" title="This is your recruiter-facing read" body="The goal is not another score. The goal is to show what your profile currently proves, what it implies, and what still needs validation." />
        </div>,
      ]}
    />
  );

  const strengthDetailGrid = (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: GAP, marginTop: GAP }}>
      <SectionCard title="Capability Clusters">
        {strengthProfile.capabilityClusters.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {strengthProfile.capabilityClusters.map((cluster) => (
              <div key={cluster.label} style={{ ...GLASS_SOFT, borderRadius: 14, padding: 13 }}>
                <div style={{ fontSize: 10, fontWeight: 950, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{cluster.label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {cluster.items.map((item) => <SmallPill key={`${cluster.label}-${item}`} tone="neutral">{item}</SmallPill>)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <InsightTile label="Building" tone="building" title="No capability clusters available yet" body="Add skills, certifications, projects, or resume evidence to create clearer professional clusters." />
        )}
      </SectionCard>

      <SectionCard title="Evidence Library">
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 950, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Detected Evidence</div>
            <BulletList items={strengthProfile.evidenceLibrary.slice(0, 6)} />
          </div>
          <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 950, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Execution Proof</div>
            {strengthProfile.projects.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {strengthProfile.projects.slice(0, 3).map((project, idx) => {
                  const title = typeof project === "string" ? project : project?.title || project?.name || project?.projectName || `Project ${idx + 1}`;
                  const desc = typeof project === "string" ? "" : project?.description || project?.summary || project?.details || "";
                  return (
                    <div key={`${title}-${idx}`} style={{ borderRadius: 12, border: "1px solid rgba(100,116,139,0.14)", background: "rgba(255,255,255,0.76)", padding: 11 }}>
                      <div style={{ fontSize: 13, fontWeight: 950, color: SLATE }}>{title}</div>
                      {desc ? <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, marginTop: 5 }}>{desc.length > 150 ? `${desc.slice(0, 147).trim()}...` : desc}</div> : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6, border: "1px solid rgba(217,119,6,0.22)", background: "rgba(217,119,6,0.10)", borderRadius: 12, padding: 12 }}>
                No structured project entries are visible yet. Resume history and profile activity can carry some proof, but project ownership and measurable outcomes will make this readout stronger.
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const topContentCard = (
    <SectionCard title="Top Content">
      <div style={{ display: "grid", gap: GAP }}>
        {analytics.highestViewedPost ? (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 800, textTransform: "uppercase" }}>Top Post</div>
            <a href={analytics.highestViewedPost.url} style={{ display: "block", color: ORANGE, fontWeight: 900, marginTop: 6, textDecoration: "none" }}>{analytics.highestViewedPost.title}</a>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{analytics.highestViewedPost.views.toLocaleString()} interactions</div>
          </div>
        ) : (
          <InsightTile label="Building" tone="building" title="Top post performance will appear here" body="Once feed interaction tracking is expanded, your strongest post will surface here." />
        )}
        {analytics.highestViewedComment ? (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 800, textTransform: "uppercase" }}>Highest Liked Comment</div>
            <div style={{ color: SLATE, fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>"{analytics.highestViewedComment.snippet}"</div>
            <a href={analytics.highestViewedComment.url} style={{ display: "inline-block", color: ORANGE, fontWeight: 900, marginTop: 8, textDecoration: "none" }}>View comment →</a>
          </div>
        ) : (
          <InsightTile label="Community" tone="live" title="Helpful comments become visibility signals" body="As comment-level tracking grows, this area will show which community contributions helped people notice you." />
        )}
        <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
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


  const profileCommandCard = (
    <section
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 12,
        width: 240,
        flex: "0 0 240px",
        alignSelf: "flex-end",
      }}
    >
      <div style={{ fontSize: 17, color: ORANGE, lineHeight: 1.15, letterSpacing: "-0.01em", marginBottom: 8, ...ORANGE_HEADING_LIFT }}>
        Profile Command
      </div>

      <div style={{ display: "grid", gap: 7 }}>
        <div
          style={{
            ...GLASS_SOFT,
            borderRadius: 14,
            padding: 8,
            display: "grid",
            gridTemplateColumns: "64px minmax(0,1fr)",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              border: "5px solid rgba(255,112,67,0.92)",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.62)",
              boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 950, color: SLATE, lineHeight: 1 }}>{analytics.profileCompletionPct}%</div>
              <div style={{ fontSize: 8, fontWeight: 900, color: MUTED, marginTop: 1 }}>Complete</div>
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
              Completion
            </div>
            <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.35 }}>
              Profile is ready to be seen.
            </div>
          </div>
        </div>

        <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            Views
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 950, color: SLATE, lineHeight: 1 }}>{analytics.totalViews.toLocaleString()}</div>
            <div style={{ fontSize: 10.5, color: MUTED, lineHeight: 1.25, textAlign: "right" }}>Profile interactions</div>
          </div>
        </div>

        <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            Momentum
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto minmax(64px,1fr)", alignItems: "center", gap: 9 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 950, color: SLATE, lineHeight: 1 }}>{momentumScore}</div>
              <div style={{ fontSize: 10.5, fontWeight: 900, color: ORANGE, marginTop: 2 }}>{momentumLabel}</div>
            </div>
            <ProgressBar value={momentumScore} />
          </div>
        </div>
      </div>
    </section>
  );

  const visibilityHeroCard = (
    <section
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 18,
        flex: "1 1 auto",
        minWidth: 0,
        alignSelf: "flex-end",
      }}
    >
      <div style={{ fontSize: 22, color: ORANGE, lineHeight: 1.15, letterSpacing: "-0.01em", marginBottom: 12, ...ORANGE_HEADING_LIFT }}>
        Visibility Trend
      </div>

      <div style={{ ...GLASS_SOFT, background: "rgba(255,255,255,0.74)", borderRadius: 16, padding: 14, overflow: "hidden" }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: ORANGE, marginBottom: 8 }}>Profile Views</div>
        <div style={{ minHeight: 220, maxHeight: 285, overflow: "hidden" }}>
          <ViewsChart labels={analytics.daysLabels} data={analytics.viewsLast7Days || [0, 0, 0, 0, 0, 0, 0]} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
        <MiniMetric label="7d views" value={weeklyViews} hint="Profile reach" />
        <MiniMetric label="Search hits" value={weeklySearch} hint="Discovery" />
        <MiniMetric label="Connections" value={analytics.connectionsGained7d} hint="7 day growth" />
      </div>
    </section>
  );

  const nextActionsRailCard = (
    <section
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 12,
        width: 240,
        flex: "0 0 240px",
        alignSelf: "flex-end",
      }}
    >
      <div style={{ fontSize: 17, color: ORANGE, lineHeight: 1.2, letterSpacing: "-0.01em", marginBottom: 8, ...ORANGE_HEADING_LIFT }}>
        Next Best Actions
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {profileLoading ? (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 8, color: MUTED }}>Loading profile actions…</div>
        ) : nextActions.length ? (
          nextActions.slice(0, 3).map((item) => (
            <ActionTile key={item.label} title={item.label} body="Strengthen this profile signal in The Anvil to improve visibility." buttonLabel="Open in The Anvil →" onClick={() => router.push("/anvil?module=profile")} />
          ))
        ) : (
          <InsightTile label="Complete" tone="strong" title="Your profile checklist is complete" body="Keep your profile fresh as your goals, projects, and experience evolve." />
        )}
        <ActionTile title="Review your public profile" body="See what recruiters, coaches, and contacts see when they land on your profile." buttonLabel="Open profile →" onClick={() => router.push("/profile")} />
        <ActionTile title="Build visibility through the Hearth" body="Turn helpful community activity into professional visibility." buttonLabel="Open The Hearth →" onClick={() => router.push("/hearth/spotlights")} />
      </div>
    </section>
  );

  const recentViewersCompactCard = (
    <SectionCard title="Recent Viewers">
      <RecentViewers viewers={analytics.recentViewers} allViewsHref={allViewsHref} />
    </SectionCard>
  );

  const topContentCompactCard = (
    <SectionCard title="Top Content">
      <div style={{ display: "grid", gap: 10 }}>
        {analytics.highestViewedPost ? (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em" }}>Top Post</div>
            <a href={analytics.highestViewedPost.url} style={{ display: "block", color: ORANGE, fontWeight: 900, marginTop: 6, textDecoration: "none", lineHeight: 1.35 }}>
              {analytics.highestViewedPost.title}
            </a>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 5 }}>{analytics.highestViewedPost.views.toLocaleString()} interactions</div>
          </div>
        ) : (
          <InsightTile label="Building" tone="building" title="Top post performance will appear here" body="Once feed interaction tracking is expanded, your strongest post will surface here." />
        )}
        {analytics.highestViewedComment ? (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em" }}>Highest Liked Comment</div>
            <div style={{ color: SLATE, fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>"{analytics.highestViewedComment.snippet}"</div>
            <a href={analytics.highestViewedComment.url} style={{ display: "inline-block", color: ORANGE, fontWeight: 900, marginTop: 8, textDecoration: "none" }}>View comment →</a>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );

  const connectionGrowthCompactCard = (
    <SectionCard title="Connection Growth">
      <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: 14, minHeight: 210, overflow: "hidden" }}>
        <ConnectionsMiniChart labels={analytics.daysLabels} data={analytics.connectionsLast7Days || [0, 0, 0, 0, 0, 0, 0]} />
      </div>
    </SectionCard>
  );

  const activityIntelligenceCard = (
    <RotatingCard
      title="Activity Intelligence"
      slides={[
        <InsightTile
          key="activity-community"
          label="Community"
          tone="building"
          title={`${totalContent.toLocaleString()} content signals`}
          body="Posts and comments help turn your profile from a static page into an active professional signal."
        />,
        <InsightTile
          key="activity-network"
          label="Network"
          tone="live"
          title={`${analytics.connectionsGained7d.toLocaleString()} new connections in 7 days`}
          body="Connection movement shows whether activity is translating into real professional reach."
        />,
        <InsightTile
          key="activity-next"
          label="Next move"
          tone="strong"
          title="Turn activity into useful visibility"
          body="Use one helpful post, one thoughtful comment, and one Hearth reply to keep your professional signal active without adding noise."
        />,
      ]}
    />
  );

  const connectionGrowthHeroCard = (
    <section
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 18,
        flex: "1 1 auto",
        minWidth: 0,
        alignSelf: "flex-end",
      }}
    >
      <div style={{ fontSize: 22, color: ORANGE, lineHeight: 1.15, letterSpacing: "-0.01em", marginBottom: 12, ...ORANGE_HEADING_LIFT }}>
        Connection Growth
      </div>

      <div style={{ ...GLASS_SOFT, background: "rgba(255,255,255,0.74)", borderRadius: 16, padding: 14, overflow: "hidden" }}>
        <ConnectionsMiniChart labels={analytics.daysLabels} data={analytics.connectionsLast7Days || [0, 0, 0, 0, 0, 0, 0]} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
        <MiniMetric label="New connections" value={analytics.connectionsGained7d} hint="7 day growth" />
        <MiniMetric label="Posts" value={analytics.postsCount} hint="Shared content" />
        <MiniMetric label="Comments" value={analytics.commentsCount} hint="Community activity" />
      </div>
    </section>
  );

  const activitySupportCard = (
    <RotatingCard
      title="Content Spotlight"
      slides={[
        analytics.highestViewedPost ? (
          <div key="top-post" style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em" }}>Top Post</div>
            <a href={analytics.highestViewedPost.url} style={{ display: "block", color: ORANGE, fontWeight: 900, marginTop: 6, textDecoration: "none", lineHeight: 1.35 }}>
              {analytics.highestViewedPost.title}
            </a>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 5 }}>{analytics.highestViewedPost.views.toLocaleString()} interactions</div>
          </div>
        ) : (
          <InsightTile key="top-post-empty" label="Building" tone="building" title="Top post performance will appear here" body="Once feed interaction tracking is expanded, your strongest post will surface here." />
        ),
        analytics.highestViewedComment ? (
          <div key="top-comment" style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em" }}>Top Comment</div>
            <div style={{ color: SLATE, fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>"{analytics.highestViewedComment.snippet}"</div>
            <a href={analytics.highestViewedComment.url} style={{ display: "inline-block", color: ORANGE, fontWeight: 900, marginTop: 8, textDecoration: "none" }}>View comment →</a>
          </div>
        ) : (
          <InsightTile key="top-comment-empty" label="Community" tone="live" title="Helpful comments become visibility signals" body="As comment-level tracking grows, this area will show which community contributions helped people notice you." />
        ),
        <div key="content-playbook" style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Content playbook</div>
          <div style={{ display: "grid", gap: 8 }}>
            {["Share a quick career win or lesson learned.", "Answer one Hearth discussion with useful detail.", "Comment where you can add practical experience."].map((item) => (
              <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: ORANGE, fontWeight: 900, lineHeight: 1.35, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>,
      ]}
    />
  );

  // ── KPI strip ────────────────────────────────────────────────────────────
  const kpiStrip = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(5, minmax(120px,1fr))", gap: GAP }}>
        <KPI label="Profile Interactions" value={kv(analytics.totalViews)} />
        <KPI label="Posts"                value={kv(analytics.postsCount)} />
        <KPI label="Comments"             value={kv(analytics.commentsCount)} />
        <KPI label="Connections (7d)"     value={kv(analytics.connectionsGained7d)} />
        <KPI label="Profile Completion"   value={`${analytics.profileCompletionPct}%`} />
      </section>
    </div>
  );

  const visibilityKpiStrip = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(5, minmax(120px,1fr))", gap: GAP }}>
        <KPI label="7D Views" value={kv(weeklyViews)} />
        <KPI label="Search Hits" value={kv(weeklySearch)} />
        <KPI label="Connections" value={kv(analytics.connectionsGained7d)} />
        <KPI label="Content" value={kv(totalContent)} />
        <KPI label="Viewers" value={kv(analytics.recentViewers.length)} />
      </section>
    </div>
  );

  const strengthKpiStrip = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(5, minmax(120px,1fr))", gap: GAP }}>
        <KPI label="Professional Signal" value={strengthProfile.professionalSignal} />
        <KPI label="Execution Visibility" value={strengthProfile.executionVisibility} />
        <KPI label="Validation Risk" value={strengthProfile.validationRisk} />
        <KPI label="Portfolio Depth" value={strengthProfile.portfolioDepth} />
        <KPI label="Resume Access" value={strengthProfile.resumeAccess} />
      </section>
    </div>
  );

  const activityKpiStrip = (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(4, minmax(120px,1fr))", gap: GAP }}>
        <KPI label="Posts"            value={kv(analytics.postsCount)} />
        <KPI label="Comments"         value={kv(analytics.commentsCount)} />
        <KPI label="Content Signals"  value={kv(totalContent)} />
        <KPI label="Connections (7d)" value={kv(analytics.connectionsGained7d)} />
      </section>
    </div>
  );

  const bleedCommandRow = (left, center, right, marginTop = DESKTOP_BLEED_DROP) => (
    <div
      style={{
        marginLeft: LEFT_BLEED,
        marginRight: RIGHT_BLEED,
        marginTop,
        display: "flex",
        alignItems: "flex-end",
        gap: GAP,
        width: `calc(100% + ${Math.abs(LEFT_BLEED)}px + ${Math.abs(RIGHT_BLEED)}px)`,
        maxWidth: `calc(100% + ${Math.abs(LEFT_BLEED)}px + ${Math.abs(RIGHT_BLEED)}px)`,
        minWidth: 0,
        position: "relative",
        zIndex: 2,
      }}
    >
      {left}
      {center}
      {right}
    </div>
  );

  // ── Inlay content per tab ────────────────────────────────────────────────
  const inlay = (() => {
    if (isMobile) {
      // Mobile: each tab owns its own focused group.
      if (activeTab === "overview")    return <div style={{ display: "grid", gap: GAP }}>{kpiStrip}{visibilityCard}</div>;
      if (activeTab === "visibility")  return <div style={{ display: "grid", gap: GAP }}>{visibilityKpiStrip}{reachCard}{visibilityCard}{recentViewersCompactCard}</div>;
      if (activeTab === "strength")    return <div style={{ display: "grid", gap: GAP }}>{strengthKpiStrip}{strengthRecruiterLensHeroCard}{strengthSignalCard}{strengthActionsCard}{strengthDetailGrid}</div>;
      if (activeTab === "activity")    return <div style={{ display: "grid", gap: GAP }}>{activityKpiStrip}{activityIntelligenceCard}{connectionGrowthHeroCard}{activitySupportCard}</div>;
      return null;
    }

    // Desktop — Overview is LAW. Do not change this row.
    if (activeTab === "overview") {
      return (
        <>
          {kpiStrip}

          <div
            style={{
              marginLeft: LEFT_BLEED,
              marginRight: RIGHT_BLEED,
              marginTop: 8,
              display: "flex",
              alignItems: "flex-end",
              gap: GAP,
              width: `calc(100% + ${Math.abs(LEFT_BLEED)}px + ${Math.abs(RIGHT_BLEED)}px)`,
              maxWidth: `calc(100% + ${Math.abs(LEFT_BLEED)}px + ${Math.abs(RIGHT_BLEED)}px)`,
              minWidth: 0,
              position: "relative",
              zIndex: 2,
            }}
          >
            {profileCommandCard}
            {visibilityHeroCard}
            {nextActionsRailCard}
          </div>
        </>
      );
    }

    if (activeTab === "visibility") {
      return (
        <>
          {visibilityKpiStrip}
          {bleedCommandRow(
            <section style={{ width: 240, flex: "0 0 240px", alignSelf: "flex-end", minWidth: 0 }}>{visibilityCard}</section>,
            <section style={{ flex: "1 1 auto", minWidth: 0, alignSelf: "flex-end" }}>{reachCard}</section>,
            <section style={{ width: 240, flex: "0 0 240px", alignSelf: "flex-end", minWidth: 0 }}>{recentViewersCompactCard}</section>,
            8
          )}
        </>
      );
    }

    if (activeTab === "strength") {
      return (
        <>
          {strengthKpiStrip}
          {bleedCommandRow(
            <section style={{ width: 240, flex: "0 0 240px", alignSelf: "flex-end", minWidth: 0 }}>{strengthSignalCard}</section>,
            strengthRecruiterLensHeroCard,
            <section style={{ width: 240, flex: "0 0 240px", alignSelf: "flex-end", minWidth: 0 }}>{strengthActionsCard}</section>,
            8
          )}
          {strengthDetailGrid}
        </>
      );
    }

    if (activeTab === "activity") {
      return (
        <>
          {activityKpiStrip}
          {bleedCommandRow(
            <section style={{ width: 240, flex: "0 0 240px", alignSelf: "flex-end", minWidth: 0 }}>{activityIntelligenceCard}</section>,
            connectionGrowthHeroCard,
            <section style={{ width: 240, flex: "0 0 240px", alignSelf: "flex-end", minWidth: 0 }}>{activitySupportCard}</section>
          )}
        </>
      );
    }

    return null;
  })();

  const activeCopy = TAB_COPY[activeTab] || TAB_COPY.overview;

  return (
    <SeekerAnalyticsLayout
      title={activeCopy.title}
      pageSubtitle={activeCopy.subtitle}
      activeTab={activeTab}
    >
      {/* isMobile === null = still measuring — render nothing to prevent flash */}
      {isMobile === null ? null : (
        <div style={{ display: "grid", gap: GAP }}>
          <SeekerAnalyticsNavBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMobile={isMobile === true}
          />
          {inlay}
        </div>
      )}
    </SeekerAnalyticsLayout>
  );
}