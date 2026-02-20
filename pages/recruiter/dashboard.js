// pages/recruiter/dashboard.js
// Layout strategy — mirrors Seeker dashboard blueprint exactly:
//   - RecruiterLayout receives NO header prop, NO right prop
//   - contentFullBleed passed to RecruiterLayout so content spans under sidebar naturally
//   - DashboardBody owns the full internal grid
//   - Right rail (Sponsored + Health Snapshot) lives INSIDE the internal grid
//   - Bottom 3 cards use gridColumn: '1 / -1' — no negative margin needed
//
// Visual structure:
// ┌─────────────────────────────┬──────────────┐
// │ Title Card       (row 1)    │  Sponsored   │
// ├─────────────────────────────│  (rows 1-3)  │
// │ KPI Row          (row 2)    │              │
// ├─────────────────────────────│  Health      │
// │ Action Center    (row 3)    │  Snapshot    │
// ├─────────────────────────────┴──────────────┤
// │ Top Candidates │ Pipeline Health │ Trends  │  ← full width incl. under sidebar
// └──────────────────────────────────────────────┘

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import FeatureLock from "@/components/recruiter/FeatureLock";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

/* -----------------------------
   Helpers
------------------------------ */
function safeText(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeRecruiterChrome(input) {
  const raw = String(input || "").toLowerCase().trim();
  if (!raw) return "";
  if (raw === "recruiter-ent" || raw === "ent" || raw === "enterprise") return "recruiter-ent";
  if (raw === "recruiter-smb" || raw === "smb" || raw === "recruiter") return "recruiter-smb";
  if (raw.startsWith("recruiter")) {
    if (raw.includes("ent") || raw.includes("enterprise")) return "recruiter-ent";
    return "recruiter-smb";
  }
  return "";
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

  return "messages";
}

function ActionTile({ title, emptyText, items, href, chromeQuery }) {
  const list = Array.isArray(items) ? items : [];
  const link = `${href}${chromeQuery ? `&chrome=${chromeQuery}` : ""}`;

  return (
    <div className="rounded-lg border bg-white p-4 flex flex-col min-h-[170px]">
      <div className="font-semibold text-slate-900 text-base leading-6 whitespace-normal break-words">
        {title}
      </div>

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

function RecruiterActionCenterSection({ chromeQuery }) {
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

        if (!res.ok) return;

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

  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-lg font-semibold text-[#FF7043]">Action Center</div>

        <div className="flex items-center gap-3">
          {refreshing ? <div className="text-xs text-slate-500">Updating…</div> : null}

          <a
            href={`/action-center?scope=RECRUITER${chromeQuery ? `&chrome=${chromeQuery}` : ""}`}
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

/* -----------------------------
   Dashboard Body
------------------------------ */
function DashboardBody() {
  const router = useRouter();
  const chromeQuery = normalizeRecruiterChrome(router?.query?.chrome) || "recruiter-smb";
  const { isEnterprise } = usePlan();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Matches Seeker blueprint exactly
  const RIGHT_COL_WIDTH = 280;
  const GAP = 16;

  const GLASS = {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.58)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  const WHITE_CARD = {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  };

  // ✅ Matches SeekerLayout rightDark style exactly
  const DARK_RAIL = {
    background: "#2a2a2a",
    border: "1px solid #3a3a3a",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    boxSizing: "border-box",
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/analytics/recruiter?range=30d&jobId=all&recruiterId=all");
        if (!res.ok) throw new Error(`Failed to load dashboard: ${res.status}`);
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
        if (isMounted) setIsLoading(false);
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
        { label: "Total Views", value: kpis.totalViews ?? 0, href: "/recruiter/analytics" },
        { label: "Total Applies", value: kpis.totalApplies ?? 0, href: "/recruiter/analytics" },
        {
          label: "Avg Time-to-Fill",
          value: typeof kpis.avgTimeToFillDays === "number" ? `${kpis.avgTimeToFillDays} days` : "—",
          href: "/recruiter/analytics",
        },
        {
          label: "Conversion (View→Apply)",
          value: typeof kpis.conversionRatePct === "number" ? `${kpis.conversionRatePct}%` : "—",
          href: "/recruiter/analytics",
        },
      ]
    : [
        { label: "Total Views", value: "—", href: "/recruiter/analytics" },
        { label: "Total Applies", value: "—", href: "/recruiter/analytics" },
        { label: "Avg Time-to-Fill", value: "—", href: "/recruiter/analytics" },
        { label: "Conversion (View→Apply)", value: "—", href: "/recruiter/analytics" },
      ];

  const topCandidates = Array.isArray(analyticsData?.topCandidates) ? analyticsData.topCandidates : [];

  const topApplySourceLabel = primarySource?.name || "Forge";
  const topApplySourcePercent =
    primarySource && kpis?.totalApplies
      ? Math.round((primarySource.value / Math.max(kpis.totalApplies, 1)) * 100)
      : 100;

  const analyticsSnapshot = kpis
    ? {
        timeToHireDays: kpis.avgTimeToFillDays ?? 0,
        topApplySourceLabel,
        topApplySourcePercent,
        conversionViewToApply: kpis.conversionRatePct ?? 0,
      }
    : null;

  return (
    <div style={{ width: "100%", padding: 0, margin: 0, paddingRight: 16, boxSizing: "border-box" }}>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 mb-4">
          {error}
        </div>
      )}

      {/*
        ✅ INTERNAL PAGE GRID — 2 columns: [center | right-rail]
        contentFullBleed on RecruiterLayout means gridColumn 1/-1 on row 4
        naturally spans under the sidebar — no negative margin, no z-index fighting.
      */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `minmax(0, 1fr) ${RIGHT_COL_WIDTH}px`,
          gridTemplateRows: "auto auto auto auto",
          gap: GAP,
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        {/* ROW 1, COL 1: Title card — stops at center column right edge */}
        <section
          style={{
            ...GLASS,
            padding: 16,
            textAlign: "center",
            gridColumn: "1 / 2",
            gridRow: "1",
            boxSizing: "border-box",
          }}
          aria-label="Recruiter dashboard overview"
        >
          <h1 style={{ margin: 0, color: "#FF7043", fontSize: 24, fontWeight: 800 }}>
            Recruiter Dashboard
          </h1>
          <p style={{ margin: "6px auto 0", color: "#607D8B", maxWidth: 740 }}>
            At-a-glance health for your roles, candidate flow, and where action is needed.
          </p>
        </section>

        {/* ROW 2, COL 1: KPI strip — all 4 stats visible */}
        <section style={{ ...WHITE_CARD, padding: 16, gridColumn: "1 / 2", gridRow: "2" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading && !analyticsData
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="rounded-lg border bg-white p-4 animate-pulse space-y-2">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-7 w-10 bg-slate-200 rounded" />
                  </div>
                ))
              : stats.map((t) => (
                  <Link
                    key={t.label}
                    href={t.href}
                    className="rounded-lg border bg-white p-4 hover:bg-slate-50 transition"
                    style={{ textDecoration: "none" }}
                    aria-label={`Open ${t.label} analytics`}
                  >
                    <div className="text-sm font-medium text-[#FF7043] truncate">{t.label}</div>
                    <div className="text-2xl font-semibold mt-1 text-slate-900">{t.value}</div>
                    <div className="text-[11px] text-slate-500 mt-1">View details</div>
                  </Link>
                ))}
          </div>
        </section>

        {/* ROW 3, COL 1: Action Center */}
        <div style={{ gridColumn: "1 / 2", gridRow: "3" }}>
          <RecruiterActionCenterSection chromeQuery={chromeQuery} />
        </div>

        {/*
          COL 2, ROWS 1–3: Right Rail dark panel
          Spans all three center rows — title, KPI, Action Center.
          Sponsored (tall, breathing) on top, Health Snapshot below.
        */}
        <aside
          style={{
            ...DARK_RAIL,
            gridColumn: "2 / 3",
            gridRow: "1 / 4",
            display: "flex",
            flexDirection: "column",
            gap: GAP,
            alignSelf: "stretch",
          }}
        >
          {/* Sponsored — top of rail, tall and breathing */}
          <div style={{ ...WHITE_CARD, padding: 16, flex: 2, minHeight: 180 }}>
            <div className="font-medium mb-2 text-slate-900">Sponsored</div>
            <div className="text-sm text-slate-500">Ad space</div>
          </div>

          {/* Health Snapshot — below sponsored */}
          <div style={{ ...WHITE_CARD, padding: 16, flex: 1 }}>
            <div className="font-medium mb-2 text-slate-900">Health Snapshot</div>

            {isEnterprise ? (
              analyticsSnapshot ? (
                <div className="text-sm grid gap-2 text-slate-700">
                  <div>Time-to-Hire: {analyticsSnapshot.timeToHireDays} days</div>
                  <div>
                    Top Apply Source: {analyticsSnapshot.topApplySourceLabel} (
                    {analyticsSnapshot.topApplySourcePercent}%)
                  </div>
                  <div>Conversion (View→Apply): {analyticsSnapshot.conversionViewToApply}%</div>
                  <div className="pt-1 text-[11px] text-slate-500">
                    Open Analytics for breakdowns by range, role, recruiter, and funnel stage.
                  </div>
                  <div className="pt-2">
                    <Link href="/recruiter/analytics" className="text-[#FF7043] font-semibold">
                      Open Analytics
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  Analytics will appear once your roles start receiving views and applications.
                </div>
              )
            ) : (
              <FeatureLock label="Analytics Snapshot">
                <div className="text-sm text-slate-500">
                  Upgrade to Enterprise to see detailed analytics for your roles.
                </div>
              </FeatureLock>
            )}
          </div>
        </aside>

        {/*
          ROW 4: Bottom 3 cards — gridColumn 1/-1 spans full width.
          contentFullBleed on RecruiterLayout makes the content area span
          under the sidebar naturally — clean, no negative margin needed.
          Top Candidates | Pipeline Health | Trends
        */}
        <div
          style={{
            gridColumn: "1 / -1",
            gridRow: "4",
            display: "grid",
            gridTemplateColumns: "minmax(0, 5fr) minmax(0, 5fr) minmax(0, 3fr)",
            gap: GAP,
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          {/* Card 1: Top Candidate Recommendations */}
          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#FF7043]">Top Candidate Recommendations</h2>
              <Link
                href="/recruiter/candidate-center"
                className="text-[#FF7043] font-medium hover:underline"
              >
                View all
              </Link>
            </div>

            {isLoading && !analyticsData ? (
              <ul className="text-sm grid gap-2 animate-pulse">
                <li className="h-3 bg-slate-200 rounded w-3/4" />
                <li className="h-3 bg-slate-200 rounded w-4/5" />
                <li className="h-3 bg-slate-200 rounded w-2/3" />
              </ul>
            ) : isEnterprise ? (
              topCandidates.length === 0 ? (
                <div className="text-sm text-slate-500">
                  AI recommendations will appear here once candidates start interacting with your jobs.
                </div>
              ) : (
                <ul className="text-sm grid gap-2 text-slate-700">
                  {topCandidates.slice(0, 5).map((c) => (
                    <li key={`${c.id || c.email || c.name}-${c.title}`}>
                      • {c.name} — {c.title} ({c.matchPercent}% match)
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <FeatureLock label="AI Candidate Recommendations">
                <div className="text-sm text-slate-500">
                  Upgrade to Enterprise to unlock AI-powered candidate matching in this panel.
                </div>
              </FeatureLock>
            )}
          </section>

          {/* Card 2: Pipeline Health */}
          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#FF7043]">Pipeline Health</h2>
              <Link
                href="/recruiter/candidate-center"
                className="text-[#FF7043] font-medium hover:underline"
              >
                Open pipeline
              </Link>
            </div>

            <div className="text-sm text-slate-700 grid gap-2">
              <div className="text-slate-500">This panel becomes your "where do I act today?" view.</div>
              <div>• New applicants needing review</div>
              <div>• Candidates stuck in stage (SLA watch)</div>
              <div>• Interviews scheduled this week</div>
              <div>• Offers pending response</div>
              <div className="pt-2 text-[11px] text-slate-500">
                Next wiring step: feed counts by stage + "stale" thresholds (e.g., 7/14/30 days).
              </div>
            </div>
          </section>

          {/* Card 3: Trends */}
          <section style={{ ...WHITE_CARD, padding: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[#FF7043]">Trends</h3>
              <Link href="/recruiter/analytics" className="text-[#FF7043] font-medium hover:underline">
                View charts
              </Link>
            </div>

            <div className="text-sm text-slate-700 grid gap-2">
              <div className="text-slate-500">Trendline / chart goes here.</div>
              <div>• Views vs Applies (last 7 / 30 / 90)</div>
              <div>• Time-to-fill trend</div>
              <div>• Funnel drop-off alerts</div>
              <div className="pt-2 text-[11px] text-slate-500">
                Next wiring step: add a small sparkline + "change vs last period".
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <PlanProvider>
      {/*
        ✅ contentFullBleed — makes the content area span under the sidebar on desktop.
        No header prop, no right prop — DashboardBody owns the full internal grid.
        No negative margins, no z-index fighting, no overflow clipping issues.
        Other recruiter pages are unaffected (contentFullBleed defaults to false).
      */}
      <RecruiterLayout
        title="ForgeTomorrow — Recruiter Dashboard"
        activeNav="dashboard"
        contentFullBleed
      >
        <DashboardBody />
      </RecruiterLayout>
    </PlanProvider>
  );
}