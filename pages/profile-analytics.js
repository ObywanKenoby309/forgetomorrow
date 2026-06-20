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
import { inferCandidateOperationalProfile } from "@/lib/intelligence/operationalInference";
import { classifySignals, overallVerdict, signalScoreToPercent } from "@/lib/intelligence/profileSignalShared";

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
const COMMAND_RAIL_HEIGHT = 390;
const LEFT_COMMAND_CARD_HEIGHT = 285;
const COMMAND_CENTER_CHART_HEIGHT = 360;

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
function SectionCard({ title, children, action, style = {} }) {
  return (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16, width: "100%", minWidth: 0, ...style }}>
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


function RotatingCard({ title, slides = [], intervalMs = 5200, minHeight = 210, cardStyle = {}, contentStyle = {} }) {
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
    <SectionCard title={title} style={cardStyle}>
      <div style={{ display: "grid", gap: 10, height: "100%", minHeight: 0 }}>
        <div style={{ minHeight, display: "grid", ...contentStyle }}>
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

function InlineSignalCarousel({ groups = [], intervalMs = 5200 }) {
  const validGroups = Array.isArray(groups) ? groups.filter((group) => Array.isArray(group?.items) && group.items.length) : [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (validGroups.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((idx) => (idx + 1) % validGroups.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [validGroups.length, intervalMs]);

  useEffect(() => {
    if (activeIndex >= validGroups.length) setActiveIndex(0);
  }, [activeIndex, validGroups.length]);

  const activeGroup = validGroups[activeIndex];

  if (!activeGroup) return null;

  return (
    <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: 11, display: "grid", gap: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 950, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {activeGroup.title}
      </div>

      <div style={{ display: "grid", gap: 7 }}>
        {activeGroup.items.map((sig) => {
          const tone = sig.status === "direct" ? "good" : sig.status === "adjacent" ? "warn" : "risk";
          return (
            <div
              key={sig.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                fontSize: 11,
              }}
            >
              <span style={{ color: SLATE, fontWeight: 850 }}>{sig.label}</span>
              <SmallPill tone={tone}>
                {sig.status === "direct" ? "Proven" : sig.status === "adjacent" ? "Partial" : "Missing"}
              </SmallPill>
            </div>
          );
        })}
      </div>

      {validGroups.length > 1 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 2 }}>
          {validGroups.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Show signal group ${idx + 1}`}
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
  );
}

function SimpleAutoCarousel({ slides = [], intervalMs = 5200 }) {
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

  if (!validSlides.length) return null;

  return validSlides[activeIndex];
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


function cleanRecruiterLanguage(text = "") {
  return String(text || "")
    .replace(/Recruiter should read this as/gi, "This profile reads as")
    .replace(/Recruiter should/gi, "Recruiters will likely")
    .replace(/recruiter should/gi, "recruiters will likely")
    .replace(/Validate /g, "Validate ")
    .trim();
}

function sentenceCase(text = "") {
  const s = String(text || "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function simpleCapabilityLabel(label = "") {
  return String(label || "")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/It/g, "IT")
    .trim();
}

function capabilityExplanation(label = "") {
  const l = String(label || "").toLowerCase();
  if (/service delivery|customer operations|customer success|account/.test(l)) return "Recruiters see customer-facing operations, delivery ownership, escalation handling, and business relationship signals.";
  if (/process|operations|improvement|workflow/.test(l)) return "Recruiters see evidence of improving systems, workflows, standards, and operational execution.";
  if (/leadership|people|executive|founder|strategy/.test(l)) return "Recruiters see leadership scope, ownership, decision-making, and accountability indicators.";
  if (/it service|incident|technical support|desktop|endpoint|identity|access|systems|cloud/.test(l)) return "Recruiters see technical operations, support delivery, troubleshooting, systems, and structured service-process evidence.";
  if (/training|enablement|documentation|knowledge/.test(l)) return "Recruiters see knowledge transfer, documentation ownership, training, and repeatable-process discipline.";
  if (/sales|business development|revenue/.test(l)) return "Recruiters see commercial exposure, customer communication, conversion, and business-growth context.";
  if (/project|program|portfolio|product/.test(l)) return "Recruiters see delivery, stakeholder coordination, scope management, and implementation ownership signals.";
  if (/safety|security|public|military|government/.test(l)) return "Recruiters see discipline, judgment, risk awareness, protocol, and high-responsibility environment experience.";
  return "Recruiters see this as a visible capability signal, but they may still validate scope, ownership, and outcomes.";
}

function roleRecommendationsFromSignals(signals = [], headline = "") {
  const text = `${safeArray(signals).join(" ")} ${headline}`.toLowerCase();
  const roles = [];
  const add = (title, reason) => {
    if (!roles.some((r) => r.title === title)) roles.push({ title, reason });
  };

  if (/customer success|service delivery|customer operations|account/.test(text)) {
    add("Director of Customer Success Operations", "Strong customer operations, service delivery, escalation, and support-leadership alignment.");
    add("Service Delivery Director", "Visible delivery ownership, SLA/process discipline, and client-facing operations signals.");
    add("Customer Success Leader", "Customer relationship, adoption, retention, and operational support signals are present.");
  }
  if (/operations|process|workflow|kpi|improvement/.test(text)) {
    add("Operations Director", "Operational execution, process improvement, and cross-functional delivery signals are visible.");
    add("Business Operations Lead", "Process, reporting, workflow, and execution evidence supports business-operations review.");
  }
  if (/project|program|portfolio|product|roadmap/.test(text)) {
    add("Program / Portfolio Manager", "Project delivery, requirements translation, stakeholder coordination, and roadmap signals are present.");
    add("Product Operations Lead", "Product ownership, execution, user insight, and operating-model signals are visible.");
  }
  if (/technical support|it service|incident|endpoint|systems|cloud|identity/.test(text)) {
    add("Technical Support Operations Manager", "Technical support, service process, escalation, and systems-adjacent signals are visible.");
    add("IT Service Delivery Manager", "ITSM, incident/process ownership, support delivery, and service execution signals are present.");
  }
  if (/leadership|people|executive|founder|strategy/.test(text)) {
    add("Founder / Operator", "Ownership, strategy, execution, and cross-functional leadership signals are visible.");
    add("Operations Executive", "Leadership, systems thinking, execution, and business-building signals support executive review.");
  }

  if (!roles.length) {
    add("Operations / Delivery Role", "The current profile shows early operational signals, but more target-role evidence would sharpen fit.");
    add("Customer-Facing Operations Role", "Visible profile evidence suggests service, communication, or support-adjacent capability.");
  }

  return roles.slice(0, 6);
}

function cleanValidationArea(text = "") {
  const s = String(text || "").trim();
  if (!s) return null;
  if (/project|work example|scope|stakeholder|timeline|outcome/i.test(s)) {
    return {
      title: "Project ownership and outcomes",
      body: "Recruiters will want one or two concrete examples showing scope, your ownership, stakeholders, risk, and measurable results.",
      fix: "Add project entries with problem, action, tools, stakeholders, and outcome.",
    };
  }
  if (/resume|source evidence/i.test(s)) {
    return {
      title: "Resume-backed proof",
      body: "Recruiters will want the profile narrative backed by a current primary resume and visible evidence.",
      fix: "Attach or refresh the primary resume and make sure it supports the same story as the profile.",
    };
  }
  if (/budget|forecast|financial/i.test(s)) {
    return {
      title: "Budget or planning ownership",
      body: "Recruiters may look for clearer evidence of budget, forecasting, staffing, or resource-planning responsibility.",
      fix: "Add budget, staffing, cost, or planning details where accurate.",
    };
  }
  if (/team|leadership|performance|authority/i.test(s)) {
    return {
      title: "Leadership scope",
      body: "Recruiters will likely confirm team size, authority level, performance ownership, and leadership outcomes.",
      fix: "Add team size, reporting structure, coaching responsibilities, and measurable team outcomes.",
    };
  }
  if (/process|repeatable|execution|workflow|quality/i.test(s)) {
    return {
      title: "Repeatable execution proof",
      body: "Recruiters will likely validate whether the profile shows one-time activity or repeatable operating discipline.",
      fix: "Add SOPs, playbooks, KPIs, before/after metrics, or workflow examples.",
    };
  }
  return {
    title: sentenceCase(s.replace(/^Ask for\s+/i, "").replace(/^Validate\s+/i, "")),
    body: cleanRecruiterLanguage(s),
    fix: "Add clearer proof, context, and measurable outcomes tied to the roles you want.",
  };
}

function extractHighValueEvidence({ headline = "", summary = "", experience = [], projects = [], certifications = [], education = [], skills = [], profileSignals = [], hasResume = false } = {}) {
  const rawText = [headline, summary, JSON.stringify(experience || []), JSON.stringify(projects || []), JSON.stringify(certifications || []), JSON.stringify(education || [])].join(" ");
  const evidence = [];
  const add = (item) => {
    const clean = String(item || "").trim();
    if (!clean) return;
    if (/headline present|location present|listed skill|summary contains|summary includes|summary communicates|language:/i.test(clean)) return;
    if (!evidence.some((x) => x.toLowerCase() === clean.toLowerCase())) evidence.push(clean);
  };

  const quantified = rawText.match(/(?:\$?\d[\d,.]*\+?\s*(?:years|yrs|people|users|clients|accounts|teams|projects|tickets|cases|direct reports|interactions|pages|%|percent|million|billion|k|m)|\$\d[\d,.]*\+?)/gi) || [];
  quantified.slice(0, 6).forEach((item) => add(item));

  safeArray(projects).slice(0, 4).forEach((project, idx) => {
    const title = typeof project === "string" ? project : project?.title || project?.name || project?.projectName || `Project ${idx + 1}`;
    if (title) add(`Project evidence: ${title}`);
  });

  safeArray(certifications).slice(0, 4).forEach((cert) => {
    const label = typeof cert === "string" ? cert : cert?.name || cert?.title || cert?.label || cert?.certification;
    if (label) add(`Credential/training: ${label}`);
  });

  (profileSignals || []).flatMap((sig) => sig.evidenceDetected || []).forEach(add);
  if (hasResume) add("Primary resume evidence is available");
  if (skills.length) add(`${skills.length} role-relevant skills listed`);

  return evidence.slice(0, 8);
}

function generateRecruiterQuestions(sp) {
  const questions = [];
  const seen = new Set();
  const add = (question, context, type = "general") => {
    const key = question.toLowerCase().slice(0, 40);
    if (seen.has(key)) return;
    seen.add(key);
    questions.push({ question, context, type });
  };

  // 1. Project-specific questions — strongest signal, highest priority
  safeArray(sp.projects).slice(0, 2).forEach((project) => {
    const title = typeof project === "string" ? project : project?.title || project?.name || "this project";
    add(
      `Walk me through ${title} — what was your direct ownership and what was the measurable outcome?`,
      "Recruiters use project stories to separate participation from real ownership. Scope, decisions made, and outcomes are what they're listening for.",
      "project"
    );
  });

  // 2. Validation-gap questions — from the WHY engine's existing analysis
  if (sp.validationFocus?.length) {
    const raw = sp.validationFocus[0];
    const cleaned = String(raw || "").replace(/^Ask for\s+/i, "").replace(/^Validate\s+/i, "").trim();
    if (cleaned) {
      add(
        `Can you give me a concrete example that demonstrates ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}?`,
        "This is the area the profile currently signals but hasn't fully proven. A specific story with ownership and outcome would close the gap.",
        "validation"
      );
    }
  }

  // 3. Strength-specific questions — probe the strongest visible signals
  if (sp.strengthNarratives.length) {
    const top = sp.strengthNarratives[0];
    add(
      `How have you applied ${top.label.toLowerCase()} in a high-stakes or complex situation — and what was the result?`,
      top.body,
      "strength"
    );
  }

  // 4. Scope question — universal but essential
  add(
    "What's the largest scope you've directly owned — team size, budget, or system — not just been involved in?",
    "Recruiters distinguish involvement from ownership. This surfaces the real level of accountability behind the profile signals.",
    "scope"
  );

  // 5. Proof-gap question if score is lower
  if (sp.score < 75) {
    add(
      "What's the clearest, most concrete result you drove in the last two years that you can point to right now?",
      "Recruiters use outcome stories to gauge whether profile signals represent real execution or just familiarity.",
      "proof"
    );
  }

  // 6. Direction question — always relevant
  add(
    "Where do you want to be in the next role, and how does your recent experience point toward that direction?",
    "Recruiters are evaluating trajectory and fit alignment, not just past performance. A clear answer accelerates the conversation.",
    "direction"
  );

  // 7. Credentials if any exist
  if (safeArray(sp.certifications).length) {
    const cert = safeArray(sp.certifications)[0];
    const certName = typeof cert === "string" ? cert : cert?.name || cert?.label || "your certification";
    add(
      `How have you applied ${certName} in your actual day-to-day work?`,
      "Recruiters want to know credentials are lived, not just listed. A brief real example ties the credential to execution.",
      "credential"
    );
  }

  return questions.slice(0, 6);
}

// ─── Tab copy ─────────────────────────────────────────────────────────────────
const TAB_COPY = {
  overview:   { title: "Profile Analytics — ForgeTomorrow", subtitle: "Understand how your profile performs, who's viewing it, and what actions will accelerate your visibility." },
  visibility: { title: "Profile Analytics — ForgeTomorrow", subtitle: "See how your profile is being discovered and who's been looking at your work." },
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
    ])).filter(Boolean).slice(0, 40);

    const languages = safeArray(profileDetails?.languagesJson || profileDetails?.languages).map((x) =>
      typeof x === "string" ? x : x?.name || x?.label || ""
    ).filter(Boolean);

    const experience = safeArray(
      profileDetails?.experienceJson ||
      profileDetails?.experience ||
      profileDetails?.workExperience ||
      profileDetails?.workHistory ||
      profileDetails?.employmentHistory
    );

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

    const workPreferences = profileDetails?.workPreferences || profileDetails?.workPreferencesJson || {};
    const hasResume = Boolean(primaryResume?.id);

    const signalProfileData = {
      headline,
      aboutMe: summary,
      skills,
      languages,
      education,
      certifications,
      projects,
      workPreferences,
      profileVisibility: profileDetails?.profileVisibility || profileDetails?.visibility || "PUBLIC",
      location: profileDetails?.location || profileDetails?.city || "",
      primaryResume: primaryResume || null,
      hasResume,
    };

    const profileSignals = classifySignals(signalProfileData, null);
    const verdict = overallVerdict(profileSignals);
    const score = signalScoreToPercent(verdict) ?? 0;

    const operationalInference = inferCandidateOperationalProfile({
      experience,
      skills,
      projects,
      hasResume,
    });

    const proven = profileSignals.filter((sig) => sig.status === "direct");
    const partial = profileSignals.filter((sig) => sig.status === "adjacent");
    const missing = profileSignals.filter((sig) => sig.status === "missing");
    const needsWork = [...missing, ...partial];

    const identitySignal = profileSignals.find((sig) => sig.key === "identity");
    const portfolioSignal = profileSignals.find((sig) => sig.key === "portfolio");
    const proofSignal = profileSignals.find((sig) => sig.key === "proof");
    const credentialsSignal = profileSignals.find((sig) => sig.key === "credentials");
    const visibilitySignal = profileSignals.find((sig) => sig.key === "visibility");

    const professionalSignal = score >= 75 ? "Strong" : score >= 50 ? "Competitive" : score >= 25 ? "Developing" : "Needs Work";
    const executionVisibility = projects.length || operationalInference.signals?.length >= 5 ? "Strong" : operationalInference.signals?.length ? "Building" : "Limited";
    const validationRisk = missing.length >= 3 ? "High" : missing.length || partial.length >= 3 ? "Moderate" : "Low";
    const portfolioDepth = portfolioSignal?.status === "direct" ? "Strong" : portfolioSignal?.status === "adjacent" ? "Partial" : "Missing";
    const resumeAccess = hasResume ? "Available" : "Missing";

    const currentDirection = headline || operationalInference.progressionCapabilities?.[0] || "Career direction not clearly stated yet";
    const primaryEvidence = hasResume && projects.length ? "Resume + projects + profile evidence" : hasResume ? "Resume + profile evidence" : projects.length ? "Projects + profile evidence" : "Profile evidence only";
    const recruiterAction = validationRisk === "Low" ? "Validate fit" : "Request stronger proof";

    const conclusion = operationalInference.overallConclusion || "Recruiter interpretation is limited until more experience, skills, projects, or resume evidence is available.";
    const recruiterMeaning = operationalInference.recruiterMeaning || "Recruiters will use the visible profile evidence as a starting point and validate scope, ownership, and outcomes.";

    const rawValidationFocus = Array.from(new Set([
      ...(operationalInference.validationFocus || []),
      ...needsWork.flatMap((sig) => sig.missingValidation || []).slice(0, 6),
    ].filter(Boolean))).slice(0, 6);

    const validationCards = rawValidationFocus.map(cleanValidationArea).filter(Boolean).slice(0, 4);
    const validationFocus = validationCards.length
      ? validationCards.map((item) => item.body)
      : ["Recruiters will mostly validate fit, scope, and role alignment because the core profile signals are already strong."];

    const topStrengths = Array.from(new Set([
      ...(operationalInference.signals || []),
      ...proven.map((sig) => sig.label.replace(" Signal", "")),
    ].filter(Boolean))).slice(0, 8);

    const strengthNarratives = topStrengths.slice(0, 5).map((label) => ({
      label: simpleCapabilityLabel(label),
      body: capabilityExplanation(label),
    }));

    const careerSignals = Array.from(new Set([
      ...(operationalInference.progressionCapabilities || []),
      ...(operationalInference.relatedCapabilities || []),
    ].filter(Boolean))).slice(0, 8);

    const careerRecommendations = roleRecommendationsFromSignals([
      ...topStrengths,
      ...careerSignals,
      ...(operationalInference.signals || []),
    ], headline);

    const strongestEvidence = extractHighValueEvidence({
      headline,
      summary,
      experience,
      projects,
      certifications,
      education,
      skills,
      profileSignals,
      hasResume,
    });

    const recruiterJudgment = (() => {
      const strengthLine = strengthNarratives.length
        ? `The strongest visible story is ${strengthNarratives.slice(0, 3).map((item) => item.label).join(", ")}.`
        : "The strongest story is still forming because the profile needs more visible evidence.";
      const validationLine = validationCards.length
        ? `The main things I would still validate are ${validationCards.slice(0, 3).map((item) => item.title.toLowerCase()).join(", ")}.`
        : "I would mostly validate fit, role scope, and current goals rather than basic credibility.";
      const fitLine = score >= 75
        ? "I would be comfortable moving this profile into a serious fit conversation if the role matches the direction shown here."
        : score >= 50
        ? "I would keep this profile in consideration, but I would want sharper proof before treating it as a strong match."
        : "I would need more evidence before confidently advancing this profile.";

      return `${cleanRecruiterLanguage(conclusion)} ${strengthLine} ${fitLine} ${validationLine}`;
    })();

    const seekerBottomLine = score >= 75
      ? "You are not just completing a profile — you are presenting a credible professional case. The next move is sharpening proof, not adding more noise."
      : score >= 50
      ? "You have enough signal to be evaluated, but the profile needs stronger proof before recruiters can confidently place you."
      : "The profile needs clearer evidence before recruiters can quickly understand and trust the professional story.";

    const scorecard = profileSignals.map((sig) => ({
      key: sig.key,
      label: String(sig.label || "Signal").replace(" Signal", ""),
      status: sig.status,
      recruiterInterpretation: sig.recruiterInterpretation,
      seekerCoaching: sig.seekerCoaching,
      signalImpact: sig.signalImpact,
      evidenceDetected: sig.evidenceDetected || [],
      missingValidation: sig.missingValidation || [],
      confidenceLevel: sig.confidenceLevel,
      recruiterRisk: sig.recruiterRisk,
    }));

    return {
      headline,
      summary,
      skills,
      languages,
      experience,
      projects,
      certifications,
      education,
      hasResume,
      profileSignals,
      verdict,
      score,
      provenCount: proven.length,
      partialCount: partial.length,
      missingCount: missing.length,
      professionalSignal,
      executionVisibility,
      validationRisk,
      portfolioDepth,
      resumeAccess,
      confidence: score,
      currentDirection,
      primaryEvidence,
      recruiterAction,
      conclusion,
      recruiterMeaning: cleanRecruiterLanguage(recruiterMeaning),
      recruiterJudgment,
      seekerBottomLine,
      validationFocus,
      validationCards,
      topStrengths,
      strengthNarratives,
      careerSignals,
      careerRecommendations,
      strongestEvidence,
      scorecard,
      prioritySignal: verdict?.priority || needsWork[0] || null,
      identitySignal,
      portfolioSignal,
      proofSignal,
      credentialsSignal,
      visibilitySignal,
    };
  }, [profileDetails, primaryResume]);

  // ── Section cards ────────────────────────────────────────────────────────
  const visibilityCard = (
    <RotatingCard
      title="Visibility Intelligence"
      minHeight={isMobile ? 132 : 179}
      cardStyle={isMobile ? {} : { height: LEFT_COMMAND_CARD_HEIGHT, overflow: "hidden" }}
      contentStyle={isMobile ? {} : { alignContent: "stretch" }}
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
              minHeight: isMobile ? 280 : COMMAND_CENTER_CHART_HEIGHT,
              overflow: "hidden",
              display: "grid",
              alignItems: "stretch",
            }}
          >
            <ViewsChart labels={analytics.daysLabels} data={analytics.viewsLast7Days} />
          </div>

          <div
            style={{
              ...GLASS_SOFT,
              borderRadius: 16,
              padding: 14,
              minHeight: isMobile ? 280 : COMMAND_CENTER_CHART_HEIGHT,
              overflow: "hidden",
              display: "grid",
              alignItems: "stretch",
            }}
          >
            <SearchAppearancesChart labels={analytics.daysLabels} data={analytics.searchAppearancesLast7Days} />
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
    <SectionCard title="Recruiter Readiness">
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ ...GLASS_SOFT, borderRadius: 16, padding: 14, background: "rgba(15,23,42,0.94)", color: "white", textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 950, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Profile Read</div>
          <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1 }}>{strengthProfile.confidence}%</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.88)", marginTop: 3 }}>{strengthProfile.professionalSignal}</div>
        </div>

        <div style={{ minHeight: 70 }}>
        <SimpleAutoCarousel
  slides={[
    <SignalChip
      key="recruiter-takeaway"
      label="Recruiter takeaway"
      value={strengthProfile.professionalSignal === "Strong" ? "Advance-worthy" : strengthProfile.professionalSignal}
      tone={strengthProfile.professionalSignal === "Strong" ? "good" : "warn"}
    />,
    <SignalChip
      key="top-validation"
      label="Top validation"
      value={strengthProfile.validationCards?.[0]?.title || "Fit and role scope"}
      tone={strengthProfile.validationRisk === "Low" ? "good" : "warn"}
    />,
  ]}
/>
        </div>

        <InlineSignalCarousel
          groups={[
            {
              title: "Core Signals",
              items: strengthProfile.scorecard.filter((sig) => ["identity", "narrative", "proof", "portfolio"].includes(sig.key)),
            },
            {
              title: "Trust + Access",
              items: strengthProfile.scorecard.filter((sig) => ["credentials", "availability", "language", "visibility"].includes(sig.key)),
            },
          ]}
        />
      </div>
    </SectionCard>
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
        minHeight: COMMAND_RAIL_HEIGHT,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 950, color: ORANGE, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            Recruiter Lens
          </div>
          <div style={{ fontSize: 22, color: ORANGE, lineHeight: 1.15, letterSpacing: "-0.01em", ...ORANGE_HEADING_LIFT }}>
            If We Were Recruiting You
          </div>
        </div>
        <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: "10px 12px", textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 30, fontWeight: 950, color: ORANGE, lineHeight: 1 }}>{strengthProfile.provenCount}</div>
          <div style={{ fontSize: 10, fontWeight: 900, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase" }}>Proven Signals</div>
        </div>
      </div>

      <div style={{ ...GLASS_SOFT, background: "rgba(255,255,255,0.76)", borderRadius: 16, padding: 16, minHeight: 360 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
          Recruiter Assessment
        </div>
        <div style={{ fontSize: 16, fontWeight: 850, color: SLATE, lineHeight: 1.75 }}>
          {strengthProfile.recruiterJudgment}
        </div>

        <div style={{ ...GLASS_SOFT, borderRadius: 14, padding: 13, marginTop: 14, border: "1px solid rgba(255,112,67,0.20)" }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Strongest Evidence Found
          </div>
          {strengthProfile.strongestEvidence.length ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {strengthProfile.strongestEvidence.slice(0, 8).map((item) => (
                <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: SLATE, lineHeight: 1.45, fontWeight: 750 }}>
                  <span style={{ color: ORANGE, fontWeight: 950, flexShrink: 0 }}>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>Add measurable outcomes, projects, certifications, or clear resume proof to strengthen this area.</div>
          )}
        </div>
      </div>
    </section>
  );

  const executionProofCard = (
    <SectionCard title="Execution Proof">
      <div style={{ display: "grid", gap: 8 }}>
        {strengthProfile.projects.length ? (
          <div style={{ maxHeight: 320, overflowY: "auto", display: "grid", gap: 7, paddingRight: 2 }}>
            {strengthProfile.projects.map((project, idx) => {
              const title = typeof project === "string" ? project : project?.title || project?.name || project?.projectName || `Project ${idx + 1}`;
              return (
                <div key={`${title}-${idx}`} style={{ ...GLASS_SOFT, borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: SLATE, lineHeight: 1.3 }}>{title}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14, fontSize: 12, color: MUTED, lineHeight: 1.65 }}>
            No Projects Listed. Update your portfolio with any relevant projects.
          </div>
        )}
        <ActionTile
          title="Add projects to The Anvil"
          body="Project entries are the strongest recruiter proof signal. Add scope, tools, stakeholders, and measurable outcomes."
          buttonLabel="Open The Anvil →"
          onClick={() => router.push("/anvil?module=profile")}
        />
      </div>
    </SectionCard>
  );

  const strengthDetailGrid = (
    <div
      style={{
        marginLeft: isMobile ? 0 : LEFT_BLEED,
        marginRight: isMobile ? 0 : RIGHT_BLEED,
        marginTop: GAP,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
        alignItems: "stretch",
        gap: GAP,
        width: isMobile ? "100%" : `calc(100% + ${Math.abs(LEFT_BLEED)}px + ${Math.abs(RIGHT_BLEED)}px)`,
        maxWidth: isMobile ? "100%" : `calc(100% + ${Math.abs(LEFT_BLEED)}px + ${Math.abs(RIGHT_BLEED)}px)`,
        minWidth: 0,
        position: "relative",
        zIndex: 2,
      }}
    >
      <SectionCard title="Your Strongest Recruiting Signals">
        <div style={{ minHeight: isMobile ? "auto" : 420, display: "grid" }}>
          {strengthProfile.strengthNarratives.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {strengthProfile.strengthNarratives.slice(0, 5).map((item) => (
                <div key={item.label} style={{ ...GLASS_SOFT, borderRadius: 13, padding: 13 }}>
                  <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <span style={{ color: "#16A34A", fontWeight: 950, lineHeight: 1.35 }}>✓</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 950, color: SLATE }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginTop: 5 }}>{item.body}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <InsightTile label="Building" tone="building" title="More evidence needed" body="Add resume evidence, skills, experience, and project outcomes to generate stronger recruiter-facing strengths." />
          )}
        </div>
      </SectionCard>

      <SectionCard title="Where Recruiters Are Most Likely To Place You">
        <div style={{ minHeight: isMobile ? "auto" : 420, display: "grid" }}>
          {strengthProfile.careerRecommendations.length ? (
            <div style={{ display: "grid", gap: 9 }}>
              {strengthProfile.careerRecommendations.slice(0, 6).map((item, idx) => {
                const match = Math.max(78, 94 - idx * 3);
                return (
                  <div key={item.title} style={{ ...GLASS_SOFT, borderRadius: 12, padding: "11px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 950, color: SLATE }}>{item.title}</div>
                      <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 950, color: ORANGE }}>{match}%</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.45, marginTop: 5 }}>{item.reason}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <InsightTile label="Direction" tone="building" title="Career path signals need more data" body="Add target roles, projects, and outcome evidence so ForgeTomorrow can infer stronger progression paths." />
          )}
        </div>
      </SectionCard>

      <SectionCard title="What Recruiters May Ask">
        <div style={{ minHeight: isMobile ? "auto" : 420, display: "grid", alignContent: "start" }}>
          {(() => {
            const questions = generateRecruiterQuestions(strengthProfile);
            return questions.length ? (
              <div style={{ display: "grid", gap: 9 }}>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 4 }}>
                  Based on your portfolio, these are the questions a recruiter is most likely to ask. Use these to prepare before any conversation.
                </div>
                {questions.map((item, idx) => (
                  <div key={`rq-${idx}`} style={{ borderRadius: 12, border: "1px solid rgba(100,116,139,0.14)", background: "rgba(255,255,255,0.76)", padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 950, color: SLATE, lineHeight: 1.35 }}>
                      {item.question}
                    </div>
                    <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.55, marginTop: 7 }}>
                      {item.context}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6, border: "1px solid rgba(217,119,6,0.22)", background: "rgba(217,119,6,0.10)", borderRadius: 12, padding: 12 }}>
                Add projects, experience, and skills to your profile so ForgeTomorrow can generate recruiter preparation questions specific to your background.
              </div>
            );
          })()}
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
        height: LEFT_COMMAND_CARD_HEIGHT,
        overflow: "hidden",
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
        Visibility Trend <span style={{ fontSize: 15, color: MUTED, textShadow: "none", fontWeight: 850 }}>(Last 7 Days)</span>
      </div>

      <div style={{ ...GLASS_SOFT, background: "rgba(255,255,255,0.74)", borderRadius: 16, padding: 14, overflow: "hidden" }}>
        <div style={{ minHeight: 260, maxHeight: 325, overflow: "hidden" }}>
          <ViewsChart labels={analytics.daysLabels} data={analytics.viewsLast7Days || [0, 0, 0, 0, 0, 0, 0]} />
        </div>
      </div>
    </section>
  );

  const nextActionsRailCard = (
    <section
      style={{
        width: 240,
        flex: "0 0 240px",
        alignSelf: "flex-end",
        minWidth: 0,
        minHeight: COMMAND_RAIL_HEIGHT,
      }}
    >
      <RotatingCard
        title="Next Best Actions"
        minHeight={284}
        cardStyle={{ height: COMMAND_RAIL_HEIGHT, overflow: "hidden" }}
        contentStyle={{ alignContent: "stretch" }}
        slides={[
          ...(profileLoading
            ? [<div key="loading-actions" style={{ ...GLASS_SOFT, borderRadius: 12, padding: 12, color: MUTED }}>Loading profile actions…</div>]
            : nextActions.length
              ? nextActions.slice(0, 3).map((item) => (
                  <ActionTile
                    key={item.label}
                    title={item.label}
                    body="Strengthen this profile signal in The Anvil to improve visibility."
                    buttonLabel="Open in The Anvil →"
                    onClick={() => router.push("/anvil?module=profile")}
                  />
                ))
              : [
                  <InsightTile
                    key="complete-profile"
                    label="Complete"
                    tone="strong"
                    title="Your profile checklist is complete"
                    body="Keep your profile fresh as your goals, projects, and experience evolve."
                  />,
                ]),
          <ActionTile
            key="review-profile"
            title="Review your public profile"
            body="See what recruiters, coaches, and contacts see when they land on your profile."
            buttonLabel="Open profile →"
            onClick={() => router.push("/profile")}
          />,
          <ActionTile
            key="hearth-visibility"
            title="Build visibility through the Hearth"
            body="Turn helpful community activity into professional visibility."
            buttonLabel="Open The Hearth →"
            onClick={() => router.push("/hearth/spotlights")}
          />,
        ]}
      />
    </section>
  );

  const recentViewersCompactCard = (
    <SectionCard title="Recent Viewers" style={isMobile ? {} : { height: COMMAND_RAIL_HEIGHT, overflow: "hidden" }}>
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
      minHeight={isMobile ? 154 : 179}
      cardStyle={isMobile ? {} : { height: LEFT_COMMAND_CARD_HEIGHT, overflow: "hidden" }}
      contentStyle={isMobile ? {} : { alignContent: "stretch" }}
      slides={[
        <InsightTile
          key="activity-community"
          label="Community"
          tone="building"
          title={`${totalContent.toLocaleString()} content signals`}
          body="Posts and comments turn your profile into an active professional signal."
        />,
        <InsightTile
          key="activity-network"
          label="Network"
          tone="live"
          title={`${analytics.connectionsGained7d.toLocaleString()} new connections in 7 days`}
          body="Connection movement shows whether activity is creating real reach."
        />,
        <InsightTile
          key="activity-next"
          label="Next move"
          tone="strong"
          title="Turn activity into visibility"
          body="One post. One comment. One Hearth reply."
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

      <div
        style={{
          ...GLASS_SOFT,
          background: "rgba(255,255,255,0.74)",
          borderRadius: 16,
          padding: 14,
          minHeight: COMMAND_CENTER_CHART_HEIGHT,
          overflow: "hidden",
          display: "grid",
          alignItems: "stretch",
        }}
      >
        <ConnectionsMiniChart labels={analytics.daysLabels} data={analytics.connectionsLast7Days || [0, 0, 0, 0, 0, 0, 0]} />
      </div>
    </section>
  );

  const activitySupportCard = (
    <RotatingCard
      title="Content Spotlight"
      minHeight={isMobile ? 390 : 284}
      cardStyle={isMobile ? {} : { height: COMMAND_RAIL_HEIGHT, overflow: "hidden" }}
      contentStyle={isMobile ? {} : { alignContent: "stretch" }}
      slides={[
        <div key="top-content" style={{ display: "grid", gap: 12 }}>
          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, color: ORANGE, fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Top Post
            </div>
            {analytics.highestViewedPost ? (
              <>
                <a href={analytics.highestViewedPost.url} style={{ display: "block", color: SLATE, fontWeight: 950, marginTop: 4, textDecoration: "none", lineHeight: 1.35 }}>
                  {analytics.highestViewedPost.title}
                </a>
                <div style={{ fontSize: 12, color: ORANGE, fontWeight: 900, marginTop: 8 }}>
                  {analytics.highestViewedPost.views.toLocaleString()} interactions
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: SLATE, fontWeight: 950, lineHeight: 1.35 }}>Top post performance will appear here</div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginTop: 6 }}>Share useful content to build activity signals.</div>
              </>
            )}
          </div>

          <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, color: ORANGE, fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Top Comment
            </div>
            {analytics.highestViewedComment ? (
              <>
                <div style={{ color: SLATE, fontSize: 13, fontWeight: 850, lineHeight: 1.5 }}>"{analytics.highestViewedComment.snippet}"</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: ORANGE, fontWeight: 900 }}>
                    {(analytics.highestViewedComment.views || analytics.highestViewedComment.likes || 0).toLocaleString()} interactions
                  </span>
                  <a href={analytics.highestViewedComment.url} style={{ color: ORANGE, fontSize: 12, fontWeight: 900, textDecoration: "none" }}>View →</a>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: SLATE, fontWeight: 950, lineHeight: 1.35 }}>Helpful comments become visibility signals</div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginTop: 6 }}>Comment where you can add practical experience.</div>
              </>
            )}
          </div>
        </div>,

        <div key="daily-playbook" style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 950, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            Today's Playbook
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {["Answer one Hearth discussion.", "Comment on one professional post.", "Share one useful career lesson."].map((item) => (
              <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: ORANGE, fontWeight: 950, lineHeight: 1.35, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>,

        <div key="weekly-playbook" style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 950, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            This Week's Playbook
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {["Publish one original post.", "Make three meaningful comments.", "Add one project or result to your profile.", "Connect with three professionals."].map((item) => (
              <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: ORANGE, fontWeight: 950, lineHeight: 1.35, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>{item}</span>
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


    if (activeTab === "activity") {
      return (
        <>
          {activityKpiStrip}
          {bleedCommandRow(
            <section style={{ width: 240, flex: "0 0 240px", alignSelf: "flex-end", minWidth: 0 }}>{activityIntelligenceCard}</section>,
            connectionGrowthHeroCard,
            <section style={{ width: 240, flex: "0 0 240px", alignSelf: "flex-end", minWidth: 0 }}>{activitySupportCard}</section>,
            8
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