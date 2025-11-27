// pages/recruiter/analytics/index.js
import React, { useEffect, useState, useMemo } from "react";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import FeatureLock from "@/components/recruiter/FeatureLock";

// Analytics components
import KPICard from "@/components/analytics/KPICard";
import Filters from "@/components/analytics/Filters";
import ApplicationFunnel from "@/components/analytics/charts/ApplicationFunnel";
import SourceBreakdown from "@/components/analytics/charts/SourceBreakdown";
import RecruiterActivity from "@/components/analytics/charts/RecruiterActivity";

// ---------- Data hook (SQL-backed)
function useAnalytics(state) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set("range", state.range);
    params.set("jobId", state.jobId);
    params.set("recruiterId", state.recruiterId);
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

        // Treat non-2xx as real errors so we can show honest messaging
        if (!res.ok) {
          let payload;
          try {
            payload = await res.json();
          } catch {
            payload = await res.text();
          }
          const msg =
            typeof payload === "string"
              ? payload
              : payload?.message ||
                `Failed to load recruiter analytics (HTTP ${res.status}).`;
          throw new Error(msg);
        }

        const json = await res.json();
        if (active) setData(json);
      } catch (e) {
        if (active) {
          console.error("[RecruiterAnalytics] fetch error:", e);
          setError(e);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [qs]);

  return { data, loading, error };
}

// ---------- Header (centered title + subtitle)
function HeaderBar() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-[#FF7043]">Recruiter Analytics</h1>
      <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
        Phase 2 — SQL-backed
      </p>
    </div>
  );
}

// ---------- Optional right column
function RightToolsCard() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Coming soon</div>
      <div className="text-sm text-slate-600">
        Reserved space for tasteful business promotions.
      </div>
    </div>
  );
}

// ---------- Page body
function Body() {
  const [filters, setFilters] = useState({
    range: "30d",
    jobId: "all",
    recruiterId: "all",
    from: "",
    to: "",
  });

  const { data, loading, error } = useAnalytics(filters);
  const { isEnterprise } = usePlan();
  const onChange = (patch) => setFilters((s) => ({ ...s, ...patch }));

  const ChartsBlock = (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ApplicationFunnel data={data?.funnel || []} />
      <SourceBreakdown data={data?.sources || []} />
      <div className="lg:col-span-2">
        <RecruiterActivity data={data?.recruiterActivity || []} />
      </div>
    </section>
  );

  return (
    <main className="space-y-6">
      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <Filters state={filters} onChange={onChange} />
      </div>

      {/* Errors — Sev 1–style transparency */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm">
          <p className="font-medium">
            We had trouble loading recruiter analytics.
          </p>
          <p className="mt-1">
            If this continues for more than 30 minutes, contact the Support
            Team so we can investigate.
          </p>
          {error?.message && (
            <p className="mt-2 text-xs text-red-500/80">
              Technical details: {error.message}
            </p>
          )}
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total job views"
          value={data?.kpis?.totalViews ?? (loading ? "…" : 0)}
        />
        <KPICard
          label="Total applies"
          value={data?.kpis?.totalApplies ?? (loading ? "…" : 0)}
        />
        <KPICard
          label="Avg. time-to-fill"
          value={
            data
              ? `${data.kpis.avgTimeToFillDays} days`
              : loading
              ? "…"
              : "0 days"
          }
        />
        <KPICard
          label="Conversion rate"
          value={
            data
              ? `${data.kpis.conversionRatePct}%`
              : loading
              ? "…"
              : "0%"
          }
        />
      </section>

      {/* Charts */}
      {isEnterprise ? (
        ChartsBlock
      ) : (
        <FeatureLock label="Full Analytics">{ChartsBlock}</FeatureLock>
      )}

      {/* Meta */}
      {data?.meta?.refreshedAt && (
        <div className="text-xs text-gray-400 text-right">
          Last updated:{" "}
          {new Date(data.meta.refreshedAt).toLocaleString()} · Source:{" "}
          {data.meta.source?.toUpperCase?.() || "SQL"}
        </div>
      )}
    </main>
  );
}

// ---------- Page
export default function RecruiterAnalyticsPage() {
  return (
    <PlanProvider>
      <RecruiterLayout
        title="Analytics — ForgeTomorrow"
        header={<HeaderBar />}
        right={<RightToolsCard />}
      >
        <Body />
      </RecruiterLayout>
    </PlanProvider>
  );
}
