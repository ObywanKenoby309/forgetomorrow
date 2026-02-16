// pages/recruiter/dashboard.js
import { useEffect, useMemo, useState } from "react";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import FeatureLock from "@/components/recruiter/FeatureLock";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";

function HeaderBar() {
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

function safeText(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function pickRecruiterActionBucket(n) {
  const title = safeText(n?.title).toLowerCase();
  const body = safeText(n?.body).toLowerCase();
  const meta = n?.metadata || {};
  const metaStr = safeText(meta?.type || meta?.event || meta?.kind || meta?.entityType || "").toLowerCase();
  const haystack = `${title} ${body} ${metaStr}`;

  // Heuristics only - no schema assumptions
  if (haystack.includes("message") || haystack.includes("inbox") || haystack.includes("dm") || haystack.includes("signal")) {
    return "messages";
  }
  if (
    haystack.includes("apply") ||
    haystack.includes("application") ||
    haystack.includes("candidate") ||
    haystack.includes("interview") ||
    haystack.includes("offer") ||
    haystack.includes("hire")
  ) {
    return "candidates";
  }
  if (
    haystack.includes("job") ||
    haystack.includes("posting") ||
    haystack.includes("role") ||
    haystack.includes("requisition") ||
    haystack.includes("listing")
  ) {
    return "jobs";
  }

  // Default so nothing disappears
  return "messages";
}

function ActionLiteCard({ title, items, emptyText, href, updating = false }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-lg border bg-white p-4 min-h-[160px] flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="font-medium min-w-0 truncate">{title}</div>
        <div className="flex items-center gap-2">
          {updating ? (
            <span className="text-[11px] text-slate-500">Updating…</span>
          ) : null}
          <SecondaryButton href={href} size="sm">
            View all
          </SecondaryButton>
        </div>
      </div>

      <div className="flex-1">
        {list.length === 0 ? (
          <div className="text-xs text-slate-500">{emptyText}</div>
        ) : (
          <div className="grid gap-2">
            {list.map((n) => (
              <a
                key={n.id}
                href={href}
                className="block rounded-md border px-3 py-2 hover:bg-orange-50"
              >
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {n.title || "Update"}
                </div>
                {n.body ? (
                  <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                    {n.body}
                  </div>
                ) : null}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RightToolsCard() {
  return (
    <div className="space-y-4">
      {/* Ads live here now (no quick links/tools) */}
      <div className="rounded-lg border bg-white p-4">
        <div className="font-medium mb-2">Sponsored</div>
        <div className="text-xs text-slate-500">Ad space</div>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section
      className="rounded-lg border bg-white p-4 relative h-full min-h-[220px] flex flex-col"
      aria-label={title}
    >
      <div className="font-medium mb-2">{title}</div>
      <div className="flex-1 grid content-start gap-2 min-w-0">{children}</div>
    </section>
  );
}

function DashboardBody() {
  const { isEnterprise } = usePlan();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Action Center (smooth refresh, no layout jump)
  const [actionFirstLoad, setActionFirstLoad] = useState(true);
  const [actionUpdating, setActionUpdating] = useState(false);
  const [actionItems, setActionItems] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        setIsLoading(true);
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
          setError(
            "We had trouble loading live analytics. This dashboard will update automatically when data is available."
          );
        }
      } finally {
        if (isMounted) {
          isMounted && setIsLoading(false);
        }
      }
    }

    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ Action Center loader (initial load shows Loading; after that we keep content + show Updating…)
  useEffect(() => {
    let alive = true;
    let first = true;

    const load = async () => {
      if (first) {
        setActionFirstLoad(true);
      } else {
        setActionUpdating(true);
      }

      try {
        const res = await fetch(
          "/api/notifications/list?scope=RECRUITER&limit=12&includeRead=0",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!res.ok) {
          // no wipe - keep previous items
          return;
        }

        const data = await res.json();
        if (!alive) return;

        const next = Array.isArray(data?.items) ? data.items : [];
        setActionItems(next);
      } catch (e) {
        // no wipe - keep previous items
        console.error("[RecruiterDashboard] Action Center refresh error:", e);
      } finally {
        if (!alive) return;
        if (first) {
          setActionFirstLoad(false);
          first = false;
        } else {
          setActionUpdating(false);
        }
      }
    };

    load();
    const t = setInterval(load, 25000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const actionBuckets = useMemo(() => {
    const buckets = { messages: [], candidates: [], jobs: [] };

    for (const n of Array.isArray(actionItems) ? actionItems : []) {
      const bucket = pickRecruiterActionBucket(n);
      if (!buckets[bucket]) buckets[bucket] = [];
      buckets[bucket].push(n);
    }

    return {
      messages: buckets.messages.slice(0, 3),
      candidates: buckets.candidates.slice(0, 3),
      jobs: buckets.jobs.slice(0, 3),
    };
  }, [actionItems]);

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

  const topCandidates = Array.isArray(analyticsData?.topCandidates)
    ? analyticsData.topCandidates
    : [];

  return (
    <div className="space-y-6 min-w-0">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading && !analyticsData
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-lg border bg-white p-4 animate-pulse space-y-2"
              >
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-7 w-10 bg-slate-200 rounded" />
              </div>
            ))
          : stats.map((t) => (
              <div key={t.label} className="rounded-lg border bg-white p-4">
                <div className="text-sm font-medium text-[#FF7043] truncate">
                  {t.label}
                </div>
                <div className="text-2xl font-semibold mt-1">{t.value}</div>
              </div>
            ))}
      </section>

      {/* ✅ ACTION CENTER (center section, no right-rail box) */}
      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="font-medium">Action Center</div>
          <SecondaryButton href="/action-center?scope=RECRUITER&chrome=recruiter-smb" size="sm">
            View all
          </SecondaryButton>
        </div>

        {actionFirstLoad ? (
          <div className="text-xs text-slate-500">Loading updates…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ActionLiteCard
              title="New Messages"
              items={actionBuckets.messages}
              emptyText="No unread recruiter inbox items."
              href="/action-center?scope=RECRUITER&chrome=recruiter-smb"
              updating={actionUpdating}
            />
            <ActionLiteCard
              title="Candidate Activity"
              items={actionBuckets.candidates}
              emptyText="No new candidate activity."
              href="/action-center?scope=RECRUITER&chrome=recruiter-smb"
              updating={actionUpdating}
            />
            <ActionLiteCard
              title="Job Updates"
              items={actionBuckets.jobs}
              emptyText="No job updates."
              href="/action-center?scope=RECRUITER&chrome=recruiter-smb"
              updating={actionUpdating}
            />
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
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
