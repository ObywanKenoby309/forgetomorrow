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

// ─── Main recruiter analytics data ───────────────────────────────────────────
// Polls every 30 seconds.
export function useAnalytics(state) {
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