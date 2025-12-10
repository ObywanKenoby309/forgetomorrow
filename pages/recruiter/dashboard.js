// pages/recruiter/dashboard.js
import { useEffect, useState } from "react";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import FeatureLock from "@/components/recruiter/FeatureLock";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";

function HeaderBar() {
  // Center title/subtitle while keeping actions aligned right
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3 min-w-0">
      <div className="hidden md:block" />
      <div className="text-center min-w-0">
        <h1 className="text-2xl font-bold text-[#FF7043]">Recruiter Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          Monitor open roles, candidate recommendations, and quick analytics at a glance.
        </p>
      </div>
      <div className="justify-self-center md:justify-self-end">
        <div className="flex flex-wrap items-center gap-2">
          <PrimaryButton href="/recruiter/job-postings">Post a Job</PrimaryButton>
          <SecondaryButton href="/recruiter/analytics">View Analytics</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

function RightToolsCard() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Quick Tools</div>
      <div className="space-y-2 text-sm">
        <div className="text-slate-600">Jump back into common tasks:</div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton href="/recruiter/candidates" size="sm">
            Browse Candidates
          </SecondaryButton>
          <SecondaryButton href="/recruiter/messaging" size="sm">
            Messaging
          </SecondaryButton>
          <SecondaryButton href="/recruiter/job-postings" size="sm">
            Manage Jobs
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

// Panel auto-equal heights via h-full + flex layout; children fill space
function Panel({ title, children }) {
  return (
    <section
      className="rounded-lg border bg-white p-4 relative h-full flex flex-col"
      aria-label={title}
    >
      <div className="font-medium mb-2">{title}</div>
      {/* Ensure uniform internal spacing in all panels */}
      <div className="flex-1 grid content-start gap-2 min-w-0">{children}</div>
    </section>
  );
}

function DashboardBody() {
  const { isEnterprise } = usePlan();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch aggregated recruiter analytics data (same engine as /recruiter/analytics)
  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        setIsLoading(true);
        // Default view: 30 days, all jobs, all recruiters
        const res = await fetch(
          "/api/analytics/recruiter?range=30d&jobId=all&recruiterId=all"
        );
        if (!res.ok) {
          throw new Error(`Failed to load dashboard: ${res.status}`);
        }
        const json = await res.json();
        if (isMounted) {
          setAnalyticsData(json);
          setError(null);
        }
      } catch (err) {
        console.error("[RecruiterDashboard] Error loading analytics:", err);
        if (isMounted) {
          // Soft message, but no fake fallback numbers
          setError(
            "We had trouble loading live analytics. This dashboard will update automatically when data is available."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Derive stats + snapshot from analyticsData (no fake fallbacks)
  // ──────────────────────────────────────────────────────────────
  const kpis = analyticsData?.kpis || null;
  const sourcesArray = Array.isArray(analyticsData?.sources)
    ? analyticsData.sources
    : [];
  const primarySource = sourcesArray[0] || null;

  const stats = kpis
    ? [
        { label: "Total Views", value: kpis.totalViews ?? 0 },
        { label: "Total Applies", value: kpis.totalApplies ?? 0 },
        {
          label: "Avg Time-to-Fill",
          value:
            typeof kpis.avgTimeToFillDays === "number"
              ? `${kpis.avgTimeToFillDays} days`
              : "—",
        },
        {
          label: "Conversion (View→Apply)",
          value:
            typeof kpis.conversionRatePct === "number"
              ? `${kpis.conversionRatePct}%`
              : "—",
        },
      ]
    : [
        // Neutral placeholders when analytics API is unavailable
        { label: "Total Views", value: "—" },
        { label: "Total Applies", value: "—" },
        { label: "Avg Time-to-Fill", value: "—" },
        { label: "Conversion (View→Apply)", value: "—" },
      ];

  const analyticsSnapshot = kpis
    ? {
        timeToHireDays: kpis.avgTimeToFillDays ?? 0,
        topSourceLabel: primarySource?.name || "Forge",
        topSourcePercent:
          primarySource && kpis.totalApplies
            ? Math.round(
                (primarySource.value / Math.max(kpis.totalApplies, 1)) * 100
              )
            : null,
        conversionViewToApply: kpis.conversionRatePct ?? 0,
      }
    : null;

  // Top candidates: no fake names, just wait for real data later
  const topCandidates = Array.isArray(analyticsData?.topCandidates)
    ? analyticsData.topCandidates
    : [];

  return (
    <div className="space-y-6 min-w-0">
      {/* Error banner (soft, non-blocking) */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Quick Stats (available to all plans) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading && !analyticsData
          ? // Loading skeletons
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-lg border bg-white p-4 animate-pulse space-y-2"
              >
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-7 w-10 bg-slate-200 rounded" />
              </div>
            ))
          : // Live or neutral stats
            stats.map((t) => (
              <div key={t.label} className="rounded-lg border bg-white p-4">
                <div className="text-sm font-medium text-[#FF7043] truncate">
                  {t.label}
                </div>
                <div className="text-2xl font-semibold mt-1">{t.value}</div>
              </div>
            ))}
      </section>

      {/* Panels — equal heights & consistent spacing */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Top Candidate Recommendations */}
        <Panel title="Top Candidate Recommendations">
          {isLoading && !analyticsData ? (
            <ul className="text-sm grid gap-2 animate-pulse">
              <li className="h-3 bg-slate-200 rounded w-3/4" />
              <li className="h-3 bg-slate-200 rounded w-4/5" />
              <li className="h-3 bg-slate-200 rounded w-2/3" />
            </ul>
          ) : isEnterprise ? (
            topCandidates.length === 0 ? (
              <div className="text-sm text-slate-500">
                AI recommendations will appear here once candidates start
                interacting with your jobs.
              </div>
            ) : (
              <ul className="text-sm grid gap-2">
                {topCandidates.map((c) => (
                  <li key={`${c.id || c.email || c.name}-${c.title}`}>
                    • {c.name} — {c.title} ({c.matchPercent}% match)
                  </li>
                ))}
              </ul>
            )
          ) : (
            <FeatureLock label="AI Candidate Recommendations">
              <div className="text-sm text-slate-500">
                Upgrade to Enterprise to unlock AI-powered candidate matching in
                this panel.
              </div>
            </FeatureLock>
          )}
        </Panel>

        {/* Quick Analytics Snapshot */}
        <Panel title="Quick Analytics Snapshot">
          {isLoading && !analyticsData ? (
            <div className="text-sm grid gap-2 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ) : isEnterprise ? (
            analyticsSnapshot ? (
              <div className="text-sm grid gap-2">
                <div>
                  Time-to-Hire: {analyticsSnapshot.timeToHireDays} days
                </div>
                <div>
                  Top Source: {analyticsSnapshot.topSourceLabel}
                  {typeof analyticsSnapshot.topSourcePercent === "number"
                    ? ` (${analyticsSnapshot.topSourcePercent}%)`
                    : ""}
                </div>
                <div>
                  Conversion (View→Apply):{" "}
                  {analyticsSnapshot.conversionViewToApply}%
                </div>
                <div className="pt-1 text-[11px] text-slate-500">
                  For deeper breakdowns, open full Analytics and adjust time
                  range, job, recruiter, or company filters.
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Analytics will appear here once your jobs start receiving views
                and applications.
              </div>
            )
          ) : (
            // Locked mode wrapped for identical padding/margins
            <FeatureLock label="Analytics Snapshot">
              <div className="text-sm text-slate-500">
                Upgrade to Enterprise to see detailed analytics for your roles.
              </div>
            </FeatureLock>
          )}
        </Panel>
      </section>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <PlanProvider>
      <RecruiterLayout
        title="ForgeTomorrow — Recruiter"
        header={<HeaderBar />}
        right={<RightToolsCard />}
      >
        <DashboardBody />
      </RecruiterLayout>
    </PlanProvider>
  );
}
