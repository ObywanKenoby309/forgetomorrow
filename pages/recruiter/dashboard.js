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

function pickRecruiterBucket(n) {
  const title = safeText(n?.title).toLowerCase();
  const body = safeText(n?.body).toLowerCase();
  const meta = n?.metadata || {};
  const metaStr = safeText(meta?.type || meta?.event || meta?.kind || "").toLowerCase();
  const haystack = `${title} ${body} ${metaStr}`;

  if (
    haystack.includes("calendar") ||
    haystack.includes("invite") ||
    haystack.includes("schedule") ||
    haystack.includes("resched") ||
    haystack.includes("interview")
  ) {
    return "calendar";
  }

  if (
    haystack.includes("job") ||
    haystack.includes("posting") ||
    haystack.includes("role") ||
    haystack.includes("approval") ||
    haystack.includes("published") ||
    haystack.includes("closed")
  ) {
    return "jobs";
  }

  if (
    haystack.includes("candidate") ||
    haystack.includes("applied") ||
    haystack.includes("application") ||
    haystack.includes("pipeline") ||
    haystack.includes("stage") ||
    haystack.includes("shortlist")
  ) {
    return "candidates";
  }

  if (
    haystack.includes("message") ||
    haystack.includes("inbox") ||
    haystack.includes("dm") ||
    haystack.includes("signal") ||
    haystack.includes("chat")
  ) {
    return "messages";
  }

  // default: don't lose anything
  return "messages";
}

/**
 * ✅ Matches your mock:
 * - Title fully readable (wrap)
 * - Body text left
 * - "View More" bottom-right inside each tile
 * - All tiles same height (no jumping)
 */
function ActionTile({ title, emptyText, items, href, chromeQuery }) {
  const list = Array.isArray(items) ? items : [];
  const link = `${href}${chromeQuery ? `&chrome=${chromeQuery}` : ""}`;

  return (
    <div className="rounded-lg border bg-white p-4 flex flex-col min-h-[170px]">
      {/* Title */}
      <div className="font-semibold text-slate-900 text-base leading-6 whitespace-normal break-words">
        {title}
      </div>

      {/* Body */}
      <div className="mt-6 flex-1">
        {list.length === 0 ? (
          <div className="text-sm text-slate-500">{emptyText}</div>
        ) : (
          <div className="space-y-2">
            {list.slice(0, 1).map((n) => (
              <div key={n.id} className="text-sm text-slate-700">
                {n.title || "Update"}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer button (bottom-right) */}
      <div className="mt-auto pt-4 flex justify-end">
        <a
          href={link}
          className="shrink-0 rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View More
        </a>
      </div>
    </div>
  );
}

/**
 * ✅ Center Action Center section:
 * - "View all" top-right
 * - 4 tiles even height
 * - smooth refresh (keeps previous items if fetch fails)
 */
function RecruiterActionCenterSection() {
  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async (isInitial = false) => {
      if (isInitial) setInitialLoading(true);
      else setRefreshing(true);

      try {
        const res = await fetch(
          "/api/notifications/list?scope=RECRUITER&limit=25&includeRead=0",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!res.ok) {
          // keep previous items to avoid UI jump
          return;
        }

        const data = await res.json();
        if (!alive) return;

        const next = Array.isArray(data?.items) ? data.items : [];
        setItems(next);
      } catch {
        // keep previous items to avoid UI jump
      } finally {
        if (!alive) return;
        if (isInitial) setInitialLoading(false);
        setRefreshing(false);
      }
    };

    load(true);
    const t = setInterval(() => load(false), 25000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const buckets = useMemo(() => {
    const b = { messages: [], candidates: [], jobs: [], calendar: [] };

    for (const n of Array.isArray(items) ? items : []) {
      const k = pickRecruiterBucket(n);
      if (!b[k]) continue;
      b[k].push(n);
    }

    return {
      messages: b.messages.slice(0, 3),
      candidates: b.candidates.slice(0, 3),
      jobs: b.jobs.slice(0, 3),
      calendar: b.calendar.slice(0, 3),
    };
  }, [items]);

  const chromeQuery = "recruiter-smb";

  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-lg font-semibold text-slate-900">Action Center</div>

        <div className="flex items-center gap-3">
          {refreshing ? <div className="text-xs text-slate-500">Updating…</div> : null}

          <a
            href={`/action-center?scope=RECRUITER&chrome=${chromeQuery}`}
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View all
          </a>
        </div>
      </div>

      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-lg border bg-white p-4 min-h-[170px] animate-pulse flex flex-col"
            >
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-56 bg-slate-200 rounded mt-8" />
              <div className="h-3 w-44 bg-slate-200 rounded mt-2" />
              <div className="mt-auto pt-4 flex justify-end">
                <div className="h-9 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionTile
            title="New Messages"
            emptyText="No unread recruiter inbox items."
            items={buckets.messages}
            href="/action-center?scope=RECRUITER"
            chromeQuery={chromeQuery}
          />
          <ActionTile
            title="Candidate Activity"
            emptyText="No new candidate activity."
            items={buckets.candidates}
            href="/action-center?scope=RECRUITER"
            chromeQuery={chromeQuery}
          />
          <ActionTile
            title="Job Updates"
            emptyText="No job updates."
            items={buckets.jobs}
            href="/action-center?scope=RECRUITER"
            chromeQuery={chromeQuery}
          />
          <ActionTile
            title="Calendar Updates"
            emptyText="No calendar updates."
            items={buckets.calendar}
            href="/action-center?scope=RECRUITER"
            chromeQuery={chromeQuery}
          />
        </div>
      )}
    </section>
  );
}

/**
 * ✅ Right rail: single Ads card only.
 * - Removes ActionCenterLiteCard + Quick Tools noise.
 * - Keeps the layout’s right rail area intact (just one card from this page).
 */
function RightToolsCard() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="font-medium mb-2">Sponsored</div>
        <div className="text-sm text-slate-500">Ad space</div>
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

  const kpis = analyticsData?.kpis || null;
  const sourcesArray = Array.isArray(analyticsData?.sources) ? analyticsData.sources : [];
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
            ? Math.round((primarySource.value / Math.max(kpis.totalApplies, 1)) * 100)
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

      <RecruiterActionCenterSection />

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
                <div>Time-to-Hire: {analyticsSnapshot.timeToHireDays} days</div>
                <div>
                  Top Source: {analyticsSnapshot.topSourceLabel}
                  {typeof analyticsSnapshot.topSourcePercent === "number"
                    ? ` (${analyticsSnapshot.topSourcePercent}%)`
                    : ""}
                </div>
                <div>
                  Conversion (View→Apply): {analyticsSnapshot.conversionViewToApply}%
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
