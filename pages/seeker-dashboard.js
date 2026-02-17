// pages/seeker-dashboard.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import PinnedJobsPreview from '@/components/PinnedJobsPreview';
import RecommendedJobsPreview from '@/components/seeker/dashboard/RecommendedJobsPreview';
import ProfilePerformanceTeaser from '@/components/seeker/dashboard/ProfilePerformanceTeaser';
import KpiRow from '@/components/seeker/dashboard/KpiRow';
import ApplicationsOverTime from '@/components/seeker/dashboard/ApplicationsOverTime';

// ISO WEEK HELPERS
const startOfISOWeek = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const weekDiff = (a, b) => {
  const MSWEEK = 7 * 24 * 3600 * 1000;
  return Math.floor((a.getTime() - b.getTime()) / MSWEEK);
};

function resolveScopeFromChrome(chrome) {
  const c = String(chrome || '').toLowerCase();
  if (c === 'coach') return 'COACH';
  if (c.startsWith('recruiter')) return 'RECRUITER';
  return 'SEEKER';
}

function safeText(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function pickSeekerBucket(n) {
  const title = safeText(n?.title).toLowerCase();
  const body = safeText(n?.body).toLowerCase();
  const meta = n?.metadata || {};
  const metaStr = safeText(meta?.type || meta?.event || meta?.kind || '').toLowerCase();
  const haystack = `${title} ${body} ${metaStr}`;

  // Calendar updates
  if (
    haystack.includes('calendar') ||
    haystack.includes('invite') ||
    haystack.includes('schedule') ||
    haystack.includes('resched') ||
    haystack.includes('interview')
  ) {
    return 'calendar';
  }

  // Job updates (matches, recommendations, pinned, saved, new jobs)
  if (
    haystack.includes('job') ||
    haystack.includes('match') ||
    haystack.includes('recommended') ||
    haystack.includes('recommendation') ||
    haystack.includes('pinned') ||
    haystack.includes('saved')
  ) {
    return 'jobs';
  }

  // Application updates (applied, stage moved, rejected, offer)
  if (
    haystack.includes('applied') ||
    haystack.includes('application') ||
    haystack.includes('pipeline') ||
    haystack.includes('stage') ||
    haystack.includes('interviewing') ||
    haystack.includes('offer') ||
    haystack.includes('rejected')
  ) {
    return 'applications';
  }

  // Messages
  if (
    haystack.includes('message') ||
    haystack.includes('inbox') ||
    haystack.includes('dm') ||
    haystack.includes('signal') ||
    haystack.includes('chat')
  ) {
    return 'messages';
  }

  return 'messages';
}

function ActionTile({ title, emptyText, items, href }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-lg border bg-white p-4 flex flex-col min-h-[150px]">
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold text-slate-900 text-sm leading-5 whitespace-normal break-words">
          {title}
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-md border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View More
        </Link>
      </div>

      <div className="mt-3 flex-1">
        {list.length === 0 ? (
          <div className="text-sm text-slate-500">{emptyText}</div>
        ) : (
          <div className="space-y-2">
            {list.slice(0, 1).map((n) => (
              <div key={n.id} className="text-sm text-slate-700">
                {n.title || 'Update'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SeekerActionCenterSection({ scope, actionCenterHref }) {
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
          `/api/notifications/list?scope=${encodeURIComponent(scope)}&limit=25&includeRead=0`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
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
      } catch (e) {
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
  }, [scope]);

  const buckets = useMemo(() => {
    const b = { messages: [], jobs: [], applications: [], calendar: [] };

    for (const n of Array.isArray(items) ? items : []) {
      const k = pickSeekerBucket(n);
      if (!b[k]) continue;
      b[k].push(n);
    }

    return {
      messages: b.messages.slice(0, 3),
      jobs: b.jobs.slice(0, 3),
      applications: b.applications.slice(0, 3),
      calendar: b.calendar.slice(0, 3),
    };
  }, [items]);

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-orange-600">Action Center</h2>

        <div className="flex items-center gap-3">
          {refreshing ? (
            <div className="text-xs text-slate-500">Updating…</div>
          ) : null}

          <Link
            href={actionCenterHref}
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View More
          </Link>
        </div>
      </div>

      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-lg border bg-white p-4 min-h-[150px] animate-pulse"
            >
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-56 bg-slate-200 rounded mt-4" />
              <div className="h-3 w-44 bg-slate-200 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionTile
            title="New Messages"
            emptyText="No unread messages."
            items={buckets.messages}
            href={actionCenterHref}
          />
          <ActionTile
            title="Job Updates"
            emptyText="No new job updates."
            items={buckets.jobs}
            href={actionCenterHref}
          />
          <ActionTile
            title="Application Updates"
            emptyText="No application updates."
            items={buckets.applications}
            href={actionCenterHref}
          />
          <ActionTile
            title="Calendar Updates"
            emptyText="No calendar updates."
            items={buckets.calendar}
            href={actionCenterHref}
          />
        </div>
      )}
    </section>
  );
}

export default function SeekerDashboard() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const scope = resolveScopeFromChrome(chrome);

  // Decide which sidebar item should be highlighted
  const chromeKey = chrome || 'seeker';
  const seekerActiveNav =
    chromeKey === 'coach' || chromeKey.startsWith('recruiter')
      ? 'seeker-dashboard'
      : 'dashboard';

  const [kpi, setKpi] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const res = await fetch('/api/seeker/dashboard-data');
        if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        const newKpi = {
          pinned: data.pinned || 0,
          applied: data.applied ?? data.applications ?? 0,
          viewed: data.views || 0,
          interviewing: data.interviewing ?? 0,
          offers: data.offers || 0,
          closedOut: data.closedOut || 0,
          lastSent: data.lastApplication ? new Date(data.lastApplication).toLocaleDateString() : '—',
        };

        setKpi(newKpi);

        // Applications over time - 5 weeks
        const today = new Date();
        const thisWeek = startOfISOWeek(today);
        const labels = Array.from({ length: 5 }, (_, i) => `W${5 - i}`);
        const buckets = labels.map(() => ({ applied: 0, interviews: 0 }));

        (data.allApplications || []).forEach((app) => {
          const d = new Date(app.appliedAt);
          const wStart = startOfISOWeek(d);
          const diff = weekDiff(thisWeek, wStart);
          if (diff >= 0 && diff < 5) {
            const idx = 5 - diff - 1;
            buckets[idx].applied += 1;
          }
        });

        setWeeks(
          labels.map((label, i) => ({
            label,
            applied: buckets[i].applied,
            interviews: 0,
          }))
        );
      } catch (err) {
        console.error('Dashboard load error:', err);
        if (!cancelled) {
          setKpi({
            pinned: 0,
            applied: 0,
            viewed: 0,
            interviewing: 0,
            offers: 0,
            closedOut: 0,
            lastSent: '—',
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const HeaderBox = (
    <section
      aria-label="Job seeker dashboard overview"
      className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm"
    >
      <h1 className="text-2xl md:text-3xl font-bold text-orange-600">
        Your Job Seeker Dashboard
      </h1>
      <p className="text-sm md:text-base text-gray-600 mt-2 max-w-3xl mx-auto">
        You're not alone. Track your momentum, see your wins, and keep moving forward.
      </p>
    </section>
  );

  // ✅ Right rail: ONLY a single Ad card (no shortcuts/no Action Center lite)
  const RightRail = (
    <div className="grid gap-4">
      <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Sponsored</h2>
        <p className="text-xs text-gray-600">
          Ad space
        </p>
      </section>
    </div>
  );

  const actionCenterHref = withChrome(`/action-center?scope=${scope}`);

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading… | ForgeTomorrow</title>
        </Head>
        <SeekerLayout
          title="Loading..."
          header={HeaderBox}
          right={RightRail}
          activeNav={seekerActiveNav}
        >
          <div className="flex items-center justify-center h-64 text-gray-500">
            Loading your progress...
          </div>
        </SeekerLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Seeker Dashboard | ForgeTomorrow</title>
      </Head>

      <SeekerLayout
        title="Seeker Dashboard | ForgeTomorrow"
        header={HeaderBox}
        right={RightRail}
        activeNav={seekerActiveNav}
      >
        <div className="grid gap-6">
          {/* ✅ CENTER: Action Center (your layout) */}
          <SeekerActionCenterSection scope={scope} actionCenterHref={actionCenterHref} />

          {/* KPI Row */}
          <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-orange-600 mb-3">
              Job Search Snapshot
            </h2>

            {kpi && (
              <KpiRow
                pinned={kpi.pinned || 0}
                applied={kpi.applied || 0}
                interviewing={kpi.interviewing || 0}
                offers={kpi.offers || 0}
                closedOut={kpi.closedOut || 0}
              />
            )}
          </section>

          {/* New Matches + Your Next Yes - side by side */}
          <div className="grid md:grid-cols-2 gap-6">
            <RecommendedJobsPreview />
            <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-orange-600">
                  Your Next Yes
                </h2>
                <Link
                  href={withChrome('/seeker/pinned-jobs')}
                  className="text-orange-600 font-medium hover:underline"
                >
                  View all
                </Link>
              </div>
              <PinnedJobsPreview />
            </section>
          </div>

          {/* Applications Over Time + Profile Performance Teaser - side by side */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Applications Over Time
              </h3>
              <ApplicationsOverTime weeks={weeks} withChrome={withChrome} />
            </section>
            <ProfilePerformanceTeaser />
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
