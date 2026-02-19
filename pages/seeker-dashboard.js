// pages/seeker-dashboard.js
// updated layout (matches: Left | Center | Right exactly like reference)
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

// ✅ Ads (DB-backed placements)
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

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

  if (
    haystack.includes('calendar') ||
    haystack.includes('invite') ||
    haystack.includes('schedule') ||
    haystack.includes('resched') ||
    haystack.includes('interview')
  ) {
    return 'calendar';
  }

  if (
    haystack.includes('apply') ||
    haystack.includes('application') ||
    haystack.includes('submitted') ||
    haystack.includes('status') ||
    haystack.includes('pipeline') ||
    haystack.includes('stage')
  ) {
    return 'applications';
  }

  if (
    haystack.includes('job') ||
    haystack.includes('posting') ||
    haystack.includes('role') ||
    haystack.includes('match') ||
    haystack.includes('recommend')
  ) {
    return 'jobs';
  }

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

function ActionTile({ title, emptyText, items, href, withChrome }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-lg border bg-white p-4 flex flex-col min-h-[170px]">
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold text-slate-900 text-sm leading-5 whitespace-normal break-words">
          {title}
        </div>
        <div className="shrink-0" />
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

      <div className="mt-4 flex justify-end">
        <Link
          href={withChrome(href)}
          className="rounded-md border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View More
        </Link>
      </div>
    </div>
  );
}

function SeekerActionCenterSection({ scope, withChrome }) {
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

        if (!res.ok) return;

        const data = await res.json();
        if (!alive) return;

        const next = Array.isArray(data?.items) ? data.items : [];
        setItems(next);
      } catch (e) {
        console.error('Seeker Action Center load error:', e);
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
          {refreshing ? <div className="text-xs text-gray-500">Updating…</div> : null}

          <Link
            href={withChrome(`/action-center?scope=${scope}`)}
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View More
          </Link>
        </div>
      </div>

      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border bg-white p-4 min-h-[170px] animate-pulse">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-56 bg-slate-200 rounded mt-4" />
              <div className="h-3 w-44 bg-slate-200 rounded mt-2" />
              <div className="h-10 w-28 bg-slate-200 rounded mt-6 ml-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionTile
            title="New Messages"
            emptyText="No unread items."
            items={buckets.messages}
            href={`/action-center?scope=${scope}`}
            withChrome={withChrome}
          />
          <ActionTile
            title="Job Updates"
            emptyText="No new job updates."
            items={buckets.jobs}
            href={`/action-center?scope=${scope}`}
            withChrome={withChrome}
          />
          <ActionTile
            title="Application Updates"
            emptyText="No application updates."
            items={buckets.applications}
            href={`/action-center?scope=${scope}`}
            withChrome={withChrome}
          />
          <ActionTile
            title="Calendar Updates"
            emptyText="No calendar updates."
            items={buckets.calendar}
            href={`/action-center?scope=${scope}`}
            withChrome={withChrome}
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

  const chromeKey = chrome || 'seeker';
  const seekerActiveNav =
    chromeKey === 'coach' || chromeKey.startsWith('recruiter')
      ? 'seeker-dashboard'
      : 'dashboard';

  const [kpi, setKpi] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Right rail width
  const RIGHT_COL_WIDTH = 280;
  const GAP = 16;

  // ✅ Glass + cards (same approach as Applications page)
  const GLASS = {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.58)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  const WHITE_CARD = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  };

  // ✅ Matches SeekerLayout's rightDark style
  const DARK_RAIL = {
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    boxSizing: 'border-box',
  };

  const PAGE_GLASS_WRAP = {
    padding: 0,
    margin: 0,
    width: '100%',
  };

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

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading… | ForgeTomorrow</title>
        </Head>
        <SeekerLayout title="Loading..." activeNav={seekerActiveNav}>
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

      {/*
        ✅ No `right` prop, no `header` prop passed to SeekerLayout.
        Content area spans full width from sidebar edge to page edge.
        Everything — including the title card — lives inside our internal grid.

        Visual structure:
        ┌─────────────────────────────┬──────────────┐
        │ Title Card       (row 1)    │  Ad Slot     │
        ├─────────────────────────────│  (rows 1-3)  │
        │ KPI Row          (row 2)    │              │
        ├─────────────────────────────│  Profile     │
        │ Action Center    (row 3)    │  Performance │
        ├─────────────────────────────┴──────────────┤
        │ New Matches │ Your Next Yes │ Apps Over Time│  ← full width incl. under sidebar
        └──────────────────────────────────────────────┘
      */}
      <SeekerLayout title="Seeker Dashboard | ForgeTomorrow" activeNav={seekerActiveNav}>
        <div style={PAGE_GLASS_WRAP}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `minmax(0, 1fr) ${RIGHT_COL_WIDTH}px`,
              gridTemplateRows: 'auto auto auto auto',
              gap: GAP,
              width: '100%',
            }}
          >
            {/* ROW 1, COL 1: Title card — stops at center column right edge, ad space stays tall */}
            <section
              style={{
                ...GLASS,
                padding: 16,
                textAlign: 'center',
                gridColumn: '1 / 2',
                gridRow: '1',
              }}
              aria-label="Job seeker dashboard overview"
            >
              <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
                Your Job Seeker Dashboard
              </h1>
              <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
                You're not alone. Track your momentum, see your wins, and keep moving forward.
              </p>
            </section>

            {/* ROW 2, COL 1: KPI strip */}
            <section style={{ ...WHITE_CARD, padding: 16, gridColumn: '1 / 2', gridRow: '2' }}>
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

            {/* ROW 3, COL 1: Action Center */}
            <div style={{ gridColumn: '1 / 2', gridRow: '3' }}>
              <SeekerActionCenterSection scope={scope} withChrome={withChrome} />
            </div>

            {/*
              COL 2, ROWS 1–3: Right Rail dark panel
              Spans all three center rows — title, KPI, Action Center.
              Ad slot on top (tall, breathing), Profile Performance below.
            */}
            <aside
              style={{
                ...DARK_RAIL,
                gridColumn: '2 / 3',
                gridRow: '1 / 4',
                display: 'flex',
                flexDirection: 'column',
                gap: GAP,
                alignSelf: 'stretch',
              }}
            >
              {/* Ad slot — top of rail, tall and breathing */}
              <div style={{ flex: 2, minHeight: 160 }}>
                <RightRailPlacementManager slot="right_rail_1" />
              </div>

              {/* Profile Performance — below ad */}
              <div style={{ ...WHITE_CARD, padding: 16, flex: 1 }}>
                <ProfilePerformanceTeaser />
              </div>
            </aside>

            {/*
              ROW 4: Bottom 3 cards — extend left under the sidebar using negative margin,
              while still spanning right to the page edge.
              New Matches | Your Next Yes | Applications Over Time
              ✅ PinnedJobsPreview owns its own empty + populated messaging — no logic needed here
            */}
            <div
              style={{
                gridColumn: '1 / -1',
                gridRow: '4',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 5fr) minmax(0, 3fr)',
                gap: GAP,
                marginLeft: -252,
              }}
            >
              <section style={{ ...WHITE_CARD, padding: 16 }}>
                <RecommendedJobsPreview />
              </section>

              <section style={{ ...WHITE_CARD, padding: 16 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-orange-600">Your Next Yes</h2>
                  <Link
                    href={withChrome('/seeker/pinned-jobs')}
                    className="text-orange-600 font-medium hover:underline"
                  >
                    View all
                  </Link>
                </div>
                {/* ✅ Component handles both empty state and populated messaging internally */}
                <PinnedJobsPreview />
              </section>

              <section style={{ ...WHITE_CARD, padding: 16 }}>
                <h3 className="text-base font-semibold text-orange-600 mb-3">
                  Applications Over Time
                </h3>
                <ApplicationsOverTime weeks={weeks} withChrome={withChrome} />
              </section>
            </div>

          </div>
        </div>
      </SeekerLayout>
    </>
  );
}