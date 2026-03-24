// hooks/useAnalyticsData.js
//
// Shared data hooks for all analytics pages.
// Import from: @/hooks/useAnalyticsData
//
// Usage:
//   const { data, loading, error } = useAnalytics(filters);
//   const { insights, loading: insightsLoading } = useInsights(filters);

import { useEffect, useMemo, useState } from "react";
import { buildQS } from "@/lib/analytics/analyticsUtils";

const BASE_DEMO_KPIS = {
  totalViews: 12458,
  totalApplies: 842,
  conversionRatePct: 6.8,
  avgTimeToFillDays: 24,
  totalInterviews: 126,
  totalHires: 18,
  offerAcceptanceRatePct: 81,
};

const BASE_DEMO_FUNNEL = [
  { stage: "Views", value: 12458 },
  { stage: "Clicks", value: 3120 },
  { stage: "Applies", value: 842 },
  { stage: "Interviews", value: 126 },
  { stage: "Offers", value: 22 },
  { stage: "Hires", value: 18 },
];

const BASE_DEMO_SOURCES = [
  { name: "ForgeTomorrow", value: 312 },
  { name: "Referrals", value: 188 },
  { name: "Direct Outreach", value: 142 },
  { name: "Company Careers", value: 96 },
  { name: "Talent Community", value: 58 },
  { name: "University Outreach", value: 28 },
  { name: "Staffing Partner", value: 12 },
  { name: "Other", value: 6 },
];

const BASE_DEMO_ACTIVITY = [
  { week: "W1", messages: 64, responses: 12 },
  { week: "W2", messages: 72, responses: 16 },
  { week: "W3", messages: 81, responses: 18 },
  { week: "W4", messages: 75, responses: 15 },
  { week: "W5", messages: 88, responses: 20 },
  { week: "W6", messages: 94, responses: 23 },
  { week: "W7", messages: 102, responses: 24 },
  { week: "W8", messages: 110, responses: 28 },
];

const DEMO_INSIGHTS = [
  {
    type: "live",
    title: "Owned channels are leading quality flow",
    body: "ForgeTomorrow, referrals, and direct outreach are driving the strongest recruiter-ready momentum in this demo window.",
  },
  {
    type: "live",
    title: "Interview flow is healthy",
    body: "The current reporting window shows steady conversion from applications into interviews, giving Ted a clean funnel story to walk recruiters through.",
  },
  {
    type: "live",
    title: "Time-to-fill is demo ready",
    body: "Average time-to-fill is holding near 24 days, which supports a clear discussion around speed, process health, and decision velocity.",
  },
  {
    type: "roadmap",
    title: "Quality of Hire remains visible",
    body: "Post-hire quality reporting stays present as a forward-looking report so recruiters can see where the analytics suite is headed next.",
  },
];

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashString(value) {
  const source = String(value || "all");
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 1000003;
  }
  return hash;
}

function getRangeMultiplier(range) {
  switch (String(range || "30d")) {
    case "7d":
      return 0.34;
    case "30d":
      return 1;
    case "90d":
      return 2.55;
    case "ytd":
      return 4.9;
    case "custom":
      return 0.82;
    default:
      return 1;
  }
}

function buildVariantMultiplier(state) {
  const jobHash = hashString(state?.jobId);
  const recruiterHash = hashString(state?.recruiterId);

  const jobOffset = ((jobHash % 7) - 3) * 0.03;
  const recruiterOffset = ((recruiterHash % 9) - 4) * 0.025;

  return clamp(1 + jobOffset + recruiterOffset, 0.72, 1.34);
}

function scaleNumber(value, multiplier, min = 0) {
  return Math.max(min, Math.round(toNumber(value) * multiplier));
}

function buildDemoAnalytics(state) {
  const rangeMultiplier = getRangeMultiplier(state?.range);
  const variantMultiplier = buildVariantMultiplier(state);
  const totalMultiplier = rangeMultiplier * variantMultiplier;

  const totalViews = scaleNumber(BASE_DEMO_KPIS.totalViews, totalMultiplier, 1);
  const totalApplies = scaleNumber(BASE_DEMO_KPIS.totalApplies, totalMultiplier, 1);
  const totalInterviews = scaleNumber(BASE_DEMO_KPIS.totalInterviews, totalMultiplier, 1);
  const totalHires = scaleNumber(BASE_DEMO_KPIS.totalHires, totalMultiplier, 1);

  const conversionRatePct = totalViews
    ? Number(((totalApplies / totalViews) * 100).toFixed(1))
    : BASE_DEMO_KPIS.conversionRatePct;

  const avgTimeToFillDays = Math.max(
    12,
    Math.round(BASE_DEMO_KPIS.avgTimeToFillDays + (variantMultiplier - 1) * 10)
  );

  const offerAcceptanceRatePct = Number(
    clamp(
      BASE_DEMO_KPIS.offerAcceptanceRatePct + (variantMultiplier - 1) * 12,
      62,
      96
    ).toFixed(1)
  );

  const funnel = [
    { stage: "Views", value: totalViews },
    { stage: "Clicks", value: Math.max(totalApplies, Math.round(totalViews * 0.25)) },
    { stage: "Applies", value: totalApplies },
    { stage: "Interviews", value: totalInterviews },
    { stage: "Offers", value: Math.max(totalHires + 4, Math.round(totalInterviews * 0.175)) },
    { stage: "Hires", value: totalHires },
  ];

  const sources = BASE_DEMO_SOURCES.map((item, index) => ({
    name: item.name,
    value: scaleNumber(item.value, variantMultiplier * (1 + index * 0.01), 1),
  }));

  const recruiterActivity = BASE_DEMO_ACTIVITY.map((item, index) => ({
    week: item.week,
    messages: scaleNumber(item.messages, variantMultiplier * (0.96 + index * 0.018), 1),
    responses: scaleNumber(item.responses, variantMultiplier * (0.98 + index * 0.012), 1),
  }));

  return {
    kpis: {
      totalViews,
      totalApplies,
      conversionRatePct,
      avgTimeToFillDays,
      totalInterviews,
      totalHires,
      offerAcceptanceRatePct,
    },
    funnel,
    sources,
    recruiterActivity,
    meta: {
      isDemoFallback: true,
      demoLabel: "SHRM demo dataset",
      refreshedAt: new Date().toISOString(),
    },
  };
}

function hasMeaningfulAnalyticsData(payload) {
  if (!payload || typeof payload !== "object") return false;

  const kpis = payload.kpis || {};
  const hasKpiSignal = [
    kpis.totalViews,
    kpis.totalApplies,
    kpis.conversionRatePct,
    kpis.avgTimeToFillDays,
    kpis.totalInterviews,
    kpis.totalHires,
    kpis.offerAcceptanceRatePct,
  ].some((value) => toNumber(value, 0) > 0);

  const hasArraySignal = [payload.funnel, payload.sources, payload.recruiterActivity].some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );

  return hasKpiSignal || hasArraySignal;
}

// ─── Main recruiter analytics data ───────────────────────────────────────────
// Polls every 30 seconds.
export function useAnalytics(state) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const qs = useMemo(() => buildQS(state), [state]);
  const demoData = useMemo(() => buildDemoAnalytics(state), [state]);

  useEffect(() => {
    let active = true;
    const fetch_ = async () => {
      try {
        setLoading(true); setError(null);
        const res  = await fetch(`/api/analytics/recruiter?${qs}`);
        const json = await res.json();
        if (!active) return;
        setData(hasMeaningfulAnalyticsData(json) ? json : demoData);
      } catch (e) {
        if (active) {
          setError(e);
          setData(demoData);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch_();
    const id = setInterval(fetch_, 30000);
    return () => { active = false; clearInterval(id); };
  }, [qs, demoData]);

  return { data, loading, error };
}

// ─── Forge Insights ───────────────────────────────────────────────────────────
// Polls every 60 seconds.
export function useInsights(state) {
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
        if (active && Array.isArray(json.insights) && json.insights.length) {
          setInsights(json.insights);
        } else if (active) {
          setInsights(DEMO_INSIGHTS);
        }
      } catch (_) {
        if (active) setInsights(DEMO_INSIGHTS);
      }
      finally { if (active) setLoading(false); }
    };
    fetch_();
    const id = setInterval(fetch_, 60000);
    return () => { active = false; clearInterval(id); };
  }, [qs]);

  return { insights, loading };
}