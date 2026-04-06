// pages/seeker-dashboard.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import PinnedJobsPreview from '@/components/PinnedJobsPreview';
import RecommendedJobsPreview from '@/components/seeker/dashboard/RecommendedJobsPreview';
import ProfilePerformanceTeaser from '@/components/seeker/dashboard/ProfilePerformanceTeaser';
import KpiRow from '@/components/seeker/dashboard/KpiRow';
import ApplicationsOverTime from '@/components/seeker/dashboard/ApplicationsOverTime';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { colorFor } from '@/components/seeker/dashboard/seekerColors';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

// ─── ISO week helpers ─────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveScopeFromChrome(chrome) {
  const c = String(chrome || '').toLowerCase();
  if (c === 'coach') return 'COACH';
  if (c.startsWith('recruiter')) return 'RECRUITER';
  return 'SEEKER';
}
function safeText(v) { return typeof v === 'string' ? v : v == null ? '' : String(v); }
function pickSeekerBucket(n) {
  const title = safeText(n?.title).toLowerCase();
  const body = safeText(n?.body).toLowerCase();
  const meta = n?.metadata || {};
  const metaStr = safeText(meta?.type || meta?.event || meta?.kind || '').toLowerCase();
  const haystack = `${title} ${body} ${metaStr}`;
  if (haystack.includes('calendar') || haystack.includes('invite') || haystack.includes('schedule') || haystack.includes('resched') || haystack.includes('interview')) return 'calendar';
  if (haystack.includes('apply') || haystack.includes('application') || haystack.includes('submitted') || haystack.includes('status') || haystack.includes('pipeline') || haystack.includes('stage')) return 'applications';
  if (haystack.includes('job') || haystack.includes('posting') || haystack.includes('role') || haystack.includes('match') || haystack.includes('recommend')) return 'jobs';
  if (haystack.includes('message') || haystack.includes('inbox') || haystack.includes('dm') || haystack.includes('signal') || haystack.includes('chat')) return 'messages';
  return 'messages';
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
const KPI_GLASS = {
  ...GLASS,
  background: 'rgba(255,255,255,0.68)',
  boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
};
const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  boxSizing: 'border-box',
};
const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};
const GAP = 16;
const RIGHT_COL_WIDTH = 280;

// ─── Job Carousel (Recommended + Pinned) ─────────────────────────────────────
function JobCarousel({ withChrome }) {
  const SLIDES = ['recommended', 'pinned'];
  const LABELS = { recommended: 'New Matches', pinned: 'Your Next Yes' };
  const LINKS  = { recommended: withChrome('/seeker/jobs'), pinned: withChrome('/seeker/pinned-jobs') };

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % SLIDES.length);
    }, 5000);
  };

  useEffect(() => {
    if (!paused) startTimer();
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  // Touch swipe
  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; setPaused(true); };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) setIndex(i => diff > 0 ? (i + 1) % SLIDES.length : (i - 1 + SLIDES.length) % SLIDES.length);
    touchStart.current = null;
  };

  const active = SLIDES[index];

  return (
    <section style={{ ...GLASS, padding: 14 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FF7043' }}>{LABELS[active]}</span>
          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 4 }}>
            {SLIDES.map((s, i) => (
              <button key={s} onClick={() => { setIndex(i); setPaused(true); }}
                style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0,
                  background: i === index ? '#FF7043' : 'rgba(255,112,67,0.25)',
                  transition: 'all 200ms ease' }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setPaused(p => !p)}
            style={{ fontSize: 11, fontWeight: 700, color: '#90A4AE', background: 'none',
              border: '1px solid rgba(0,0,0,0.10)', borderRadius: 999, padding: '3px 8px', cursor: 'pointer' }}>
            {paused ? '▶ Play' : '⏸ Pause'}
          </button>
          <Link href={LINKS[active]}
            style={{ fontSize: 11, fontWeight: 700, color: '#FF7043', textDecoration: 'none' }}>
            All →
          </Link>
        </div>
      </div>

      {/* Slide content */}
      <div style={{ ...WHITE_CARD, padding: 12, minHeight: 120 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}>
        {active === 'recommended' ? <RecommendedJobsPreview /> : <PinnedJobsPreview />}
      </div>
    </section>
  );
}

// ─── Desktop Action Tile ──────────────────────────────────────────────────────
function ActionTile({ title, emptyText, items, href, withChrome, style }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="rounded-lg p-4 flex flex-col min-h-[170px]" style={style || {}}>
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold text-slate-900 text-sm leading-5 whitespace-normal break-words">{title}</div>
        <div className="shrink-0" />
      </div>
      <div className="mt-3 flex-1">
        {list.length === 0 ? (
          <div className="text-sm text-slate-500">{emptyText}</div>
        ) : (
          <div className="space-y-2">
            {list.slice(0, 1).map((n) => (
              <div key={n.id} className="text-sm text-slate-700">{n.title || 'Update'}</div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Link href={withChrome(href)} className="rounded-md border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          View More
        </Link>
      </div>
    </div>
  );
}

// ─── Mobile Action Tile ───────────────────────────────────────────────────────
function MobileActionTile({ title, items, emptyText, href, icon }) {
  const hasItems = items.length > 0;
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 12, textDecoration: 'none',
      background: hasItems ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
      border: hasItems ? '1px solid rgba(255,112,67,0.22)' : '1px solid rgba(0,0,0,0.06)',
      boxShadow: hasItems ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
      transition: 'all 150ms ease',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: hasItems ? 'rgba(255,112,67,0.10)' : 'rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: hasItems ? '#112033' : '#90A4AE' }}>{title}</div>
        <div style={{ fontSize: 12, marginTop: 2, color: hasItems ? '#546E7A' : '#B0BEC5',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hasItems ? (items[0].title || 'View item') : emptyText}
        </div>
      </div>
      {hasItems ? (
        <div style={{ minWidth: 28, height: 28, borderRadius: 999, flexShrink: 0,
          background: '#FF7043', color: 'white', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 13, fontWeight: 900,
          boxShadow: '0 4px 10px rgba(255,112,67,0.40)' }}>
          {items.length}
        </div>
      ) : (
        <div style={{ width: 24, height: 24, borderRadius: 999, flexShrink: 0,
          background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 14, color: '#B0BEC5' }}>
          ✓
        </div>
      )}
    </Link>
  );
}

// ─── Action Center ────────────────────────────────────────────────────────────
function SeekerActionCenterSection({ scope, withChrome, glassStyle, isMobile }) {
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
          { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) { console.error('Seeker Action Center load error:', e); }
      finally {
        if (!alive) return;
        if (isInitial) setInitialLoading(false);
        setRefreshing(false);
      }
    };
    load(true);
    const t = setInterval(() => load(false), 25000);
    return () => { alive = false; clearInterval(t); };
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

  const tiles = [
    { key: 'messages',     title: 'New Messages',        emptyText: 'No unread items.',        href: withChrome(`/action-center?scope=${scope}`), icon: '💬', items: buckets.messages     },
    { key: 'applications', title: 'Application Updates', emptyText: 'No application updates.', href: withChrome(`/action-center?scope=${scope}`), icon: '📋', items: buckets.applications },
    { key: 'calendar',     title: 'Interview Invites',   emptyText: 'No calendar updates.',    href: withChrome(`/action-center?scope=${scope}`), icon: '📅', items: buckets.calendar     },
    { key: 'jobs',         title: 'Job Matches',         emptyText: 'No new job updates.',     href: withChrome(`/action-center?scope=${scope}`), icon: '🎯', items: buckets.jobs         },
  ];

  const sortedTiles = [...tiles].sort((a, b) => (b.items.length > 0 ? 1 : 0) - (a.items.length > 0 ? 1 : 0));
  const totalActions = tiles.reduce((sum, t) => sum + t.items.length, 0);

  if (isMobile) {
    if (initialLoading) {
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 64, borderRadius: 12,
              background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.06)' }} />
          ))}
        </div>
      );
    }
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FF7043' }}>Action Center</div>
            <div style={{ fontSize: 12, marginTop: 2,
              fontWeight: totalActions > 0 ? 700 : 500,
              color: totalActions > 0 ? '#FF7043' : '#90A4AE' }}>
              {totalActions > 0
                ? `${totalActions} item${totalActions !== 1 ? 's' : ''} need your attention`
                : "You're all caught up"}
            </div>
          </div>
          <Link href={withChrome(`/action-center?scope=${scope}`)} style={{
            fontSize: 12, fontWeight: 700, color: '#FF7043', textDecoration: 'none',
            padding: '6px 12px', borderRadius: 999,
            border: '1px solid rgba(255,112,67,0.30)',
            background: 'rgba(255,112,67,0.08)',
          }}>
            View all
          </Link>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {sortedTiles.map(t => <MobileActionTile key={t.key} {...t} />)}
        </div>
      </div>
    );
  }

  // Desktop
    return (
    <section className="rounded-xl p-5" style={glassStyle || {}}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2
          style={{
            fontSize: 18,
            color: '#FF7043',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            margin: 0,
            ...ORANGE_HEADING_LIFT,
          }}
        >
          Action Center
        </h2>
        <div className="flex items-center gap-3">
          {refreshing ? <div className="text-xs text-gray-500">Updating…</div> : null}
          <Link
            href={withChrome(`/action-center?scope=${scope}`)}
            style={{
              color: '#FF7043',
              fontWeight: 800,
              fontSize: 13,
              lineHeight: 1.2,
              textDecoration: 'none',
              ...ORANGE_HEADING_LIFT,
            }}
          >
            View all
          </Link>
        </div>
      </div>
      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-lg p-4 min-h-[170px] animate-pulse"
              style={{ ...glassStyle, borderRadius: 14 }}>
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-56 bg-slate-200 rounded mt-4" />
              <div className="h-3 w-44 bg-slate-200 rounded mt-2" />
              <div className="h-10 w-28 bg-slate-200 rounded mt-6 ml-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionTile title="New Messages"        emptyText="No unread items."        items={buckets.messages}     href={`/action-center?scope=${scope}`} withChrome={withChrome} style={glassStyle} />
          <ActionTile title="Job Updates"         emptyText="No new job updates."     items={buckets.jobs}         href={`/action-center?scope=${scope}`} withChrome={withChrome} style={glassStyle} />
          <ActionTile title="Application Updates" emptyText="No application updates." items={buckets.applications} href={`/action-center?scope=${scope}`} withChrome={withChrome} style={glassStyle} />
          <ActionTile title="Calendar Updates"    emptyText="No calendar updates."    items={buckets.calendar}     href={`/action-center?scope=${scope}`} withChrome={withChrome} style={glassStyle} />
        </div>
      )}
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SeekerDashboard() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) => chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;
  const scope = 'SEEKER';
  const chromeKey = chrome || 'seeker';
  const seekerActiveNav = chromeKey === 'coach' || chromeKey.startsWith('recruiter') ? 'seeker-dashboard' : 'dashboard';

  const greeting = getTimeGreeting();

  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
        setKpi({
          pinned: data.pinned || 0,
          applied: data.applied ?? data.applications ?? 0,
          viewed: data.views || 0,
          interviewing: data.interviewing ?? 0,
          offers: data.offers || 0,
          closedOut: data.closedOut || 0,
          lastSent: data.lastApplication ? new Date(data.lastApplication).toLocaleDateString() : '—',
        });
        const today = new Date();
        const thisWeek = startOfISOWeek(today);
        const labels = Array.from({ length: 5 }, (_, i) => `W${5 - i}`);
        const buckets = labels.map(() => ({ applied: 0, interviews: 0 }));
        (data.allApplications || []).forEach((app) => {
          const d = new Date(app.appliedAt);
          const wStart = startOfISOWeek(d);
          const diff = weekDiff(thisWeek, wStart);
          if (diff >= 0 && diff < 5) buckets[5 - diff - 1].applied += 1;
        });
        setWeeks(labels.map((label, i) => ({ label, applied: buckets[i].applied, interviews: 0 })));
      } catch (err) {
        console.error('Dashboard load error:', err);
        if (!cancelled) setKpi({ pinned: 0, applied: 0, viewed: 0, interviewing: 0, offers: 0, closedOut: 0, lastSent: '—' });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  if (isLoading || isMobile === null) {
    return (
      <>
        <Head><title>Loading… | ForgeTomorrow</title></Head>
        <SeekerLayout title="Loading..." activeNav={seekerActiveNav}>
          <div className="flex items-center justify-center h-64 text-gray-500">
            Loading your progress...
          </div>
        </SeekerLayout>
      </>
    );
  }

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) {

    return (
      <>
        <Head><title>Seeker Dashboard | ForgeTomorrow</title></Head>
        <SeekerLayout
  title="Seeker Dashboard | ForgeTomorrow"
  activeNav={seekerActiveNav}
>
          <div style={{ display: 'grid', gap: GAP, width: '100%' }}>

            {/* 1. Title card */}
            <SeekerTitleCard
              greeting={greeting}
              title="Your Job Seeker Dashboard"
              subtitle="You're not alone. Track your momentum, see your wins, and keep moving forward."
              isMobile={true}
            />

            {/* 2. Action Center */}
            <section style={{ ...GLASS, padding: 16 }}>
              <SeekerActionCenterSection scope={scope} withChrome={withChrome}
                glassStyle={GLASS} isMobile={true} />
            </section>

            {/* 3. KPI strip — seekerColors, centered */}
            <section style={{ ...GLASS, padding: '12px 0 12px 12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingRight: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#112033' }}>Your Progress</span>
                <Link href={withChrome('/seeker/applications')}
                  style={{ fontSize: 12, fontWeight: 700, color: '#FF7043', textDecoration: 'none' }}>
                  Full history →
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingRight: 12,
                paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {kpi && [
                  { label: 'Pinned',       value: kpi.pinned,       href: withChrome('/seeker/pinned-jobs'),    colorKey: 'neutral'      },
                  { label: 'Applied',      value: kpi.applied,      href: withChrome('/seeker/applications'),   colorKey: 'applied'      },
                  { label: 'Interviewing', value: kpi.interviewing, href: withChrome('/seeker/applications'),   colorKey: 'interviewing' },
                  { label: 'Offers',       value: kpi.offers,       href: withChrome('/seeker/applications'),   colorKey: 'offers'       },
                  { label: 'Closed Out',   value: kpi.closedOut,    href: withChrome('/seeker/applications'),   colorKey: 'info'         },
                ].map(stat => {
                  const c = colorFor(stat.colorKey);
                  return (
                    <Link key={stat.label} href={stat.href} style={{
                      flexShrink: 0, width: 100,
                      background: c.bg, border: `1px solid ${c.solid}`,
                      borderRadius: 10, padding: '10px 12px',
                      textDecoration: 'none', display: 'block', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: c.text,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textAlign: 'center' }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: c.text,
                        lineHeight: 1.1, marginTop: 4, textAlign: 'center', width: '100%' }}>
                        {stat.value}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* 4. Activity — right after KPIs, motivational */}
            <section style={{ ...GLASS, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#112033' }}>Activity</span>
                <Link href={withChrome('/seeker/applications')}
                  style={{ fontSize: 11, fontWeight: 700, color: '#FF7043', textDecoration: 'none' }}>
                  History →
                </Link>
              </div>
              <div style={{ ...WHITE_CARD, padding: 10 }}>
                <ApplicationsOverTime weeks={weeks} withChrome={withChrome} />
              </div>
            </section>

            {/* 5. Carousel — Recommended Jobs ↔ Pinned Jobs */}
            <JobCarousel withChrome={withChrome} />

            {/* 6. Pipeline + Next Steps — recruiter-style small side-by-side cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: GAP }}>

              {/* Pipeline snapshot */}
              <section style={{ ...GLASS, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#112033' }}>Pipeline</span>
                  <Link href={withChrome('/seeker/applications')}
                    style={{ fontSize: 11, fontWeight: 700, color: '#FF7043', textDecoration: 'none' }}>
                    Open →
                  </Link>
                </div>
                <div style={{ display: 'grid', gap: 7 }}>
                  {[
                    { label: 'Applied',      value: kpi?.applied      ?? 0, colorKey: 'applied'      },
                    { label: 'Interviewing', value: kpi?.interviewing ?? 0, colorKey: 'interviewing' },
                    { label: 'Offers',       value: kpi?.offers       ?? 0, colorKey: 'offers'       },
                    { label: 'Closed Out',   value: kpi?.closedOut    ?? 0, colorKey: 'info'         },
                  ].map(row => {
                    const c = colorFor(row.colorKey);
                    return (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 999,
                            background: c.solid, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#37474F', lineHeight: 1.3 }}>{row.label}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: c.text,
                          background: c.bg, border: `1px solid ${c.solid}`,
                          borderRadius: 999, padding: '1px 7px', flexShrink: 0 }}>
                          {row.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Next Steps */}
              <section style={{ ...GLASS, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#112033' }}>Next Steps</span>
                  <Link href={withChrome('/seeker/jobs')}
                    style={{ fontSize: 11, fontWeight: 700, color: '#FF7043', textDecoration: 'none' }}>
                    Jobs →
                  </Link>
                </div>
                <div style={{ display: 'grid', gap: 7 }}>
                  {[
                    'Follow up on apps',
                    'Check new matches',
                    'Update your profile',
                    'Review interviews',
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 999,
                        background: '#FF7043', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#37474F', lineHeight: 1.3 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* 7. Profile Performance — health snapshot style */}
            <section style={{ ...GLASS, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#112033' }}>Profile Health</span>
                <Link href={withChrome('/seeker/profile')}
                  style={{ fontSize: 11, fontWeight: 700, color: '#FF7043', textDecoration: 'none' }}>
                  Full analytics →
                </Link>
              </div>
              <div style={{ ...WHITE_CARD, padding: 12 }}>
                <ProfilePerformanceTeaser />
              </div>
            </section>

            {/* 8. Ad — lowest priority */}
            <section style={{ ...GLASS, padding: 12 }}>
              <div style={{ ...WHITE_CARD, padding: 16, minHeight: 100 }}>
                <RightRailPlacementManager slot="right_rail_1" />
              </div>
            </section>

          </div>
        </SeekerLayout>
      </>
    );
  }

  // ── DESKTOP (original, untouched) ─────────────────────────────────────────
  return (
    <>
      <Head><title>Seeker Dashboard | ForgeTomorrow</title></Head>
      <SeekerLayout
  title="Seeker Dashboard | ForgeTomorrow"
  activeNav={seekerActiveNav}
  contentFullBleed
>
        <div style={{ padding: 0, margin: 0, width: '100%' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `minmax(0, 1fr) ${RIGHT_COL_WIDTH}px`,
            gridTemplateRows: 'auto auto auto auto',
            gap: GAP,
            width: '100%',
          }}>

            {/* ROW 1, COL 1: Title card */}
            <SeekerTitleCard
              greeting={greeting}
              title="Your Job Seeker Dashboard"
              subtitle="You're not alone. Track your momentum, see your wins, and keep moving forward."
              style={{ gridColumn: '1 / 2', gridRow: '1' }}
            />

            {/* ROW 2, COL 1: KPI strip */}
            <section style={{ ...GLASS, padding: '12px 16px 16px 16px', gridColumn: '1 / 2', gridRow: '2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2
                  style={{
                    fontSize: 18,
                    color: '#FF7043',
                    lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                    margin: 0,
                    ...ORANGE_HEADING_LIFT,
                  }}
                >
                  KPIs
                </h2>
                <Link
                  href={withChrome('/seeker/applications')}
                  style={{
                    color: '#FF7043',
                    fontWeight: 800,
                    fontSize: 13,
                    lineHeight: 1.2,
                    textDecoration: 'none',
                    ...ORANGE_HEADING_LIFT,
                  }}
                >
                  Full history →
                </Link>
              </div>
              {kpi && (
                <div style={{ minHeight: 108 }}>
                  <KpiRow
                    pinned={kpi.pinned || 0}
                    applied={kpi.applied || 0}
                    interviewing={kpi.interviewing || 0}
                    offers={kpi.offers || 0}
                    closedOut={kpi.closedOut || 0}
                  />
                </div>
              )}
            </section>

            {/* ROW 3, COL 1: Action Center */}
            <div style={{ gridColumn: '1 / 2', gridRow: '3' }}>
              <SeekerActionCenterSection
                scope={scope}
                withChrome={withChrome}
                glassStyle={GLASS}
                isMobile={false}
              />
            </div>

            {/* COL 2, ROWS 1–2: Sponsored — no glass backing */}
            <aside
              style={{
                gridColumn: '2 / 3',
                gridRow: '1 / 3',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                boxSizing: 'border-box',
                alignSelf: 'stretch',
              }}
            >
              <div style={{ flex: 1, minHeight: 160 }}>
                <RightRailPlacementManager slot="right_rail_1" />
              </div>
            </aside>

            {/* COL 2, ROW 3: Profile Health — beside Action Center only */}
            <aside
              style={{
                ...KPI_GLASS,
                gridColumn: '2 / 3',
                gridRow: '3',
                padding: 16,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  marginBottom: 10,
                  color: '#0F172A',
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                }}
              >
                Profile Health
              </div>
              <div style={{ ...WHITE_CARD, padding: 12 }}>
                <ProfilePerformanceTeaser />
              </div>
            </aside>

            {/* ROW 4: Bottom 3 cards — bleed left under sidebar via marginLeft + zIndex */}
            <div style={{
              gridColumn: '1 / -1', gridRow: '4',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 5fr) minmax(0, 3fr)',
              gap: GAP,
              marginLeft: -252,
              position: 'relative',
              zIndex: 11,
            }}>
              <section style={{ ...GLASS, padding: 16 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2
                    style={{
                      fontSize: 18,
                      color: '#FF7043',
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                      margin: 0,
                      ...ORANGE_HEADING_LIFT,
                    }}
                  >
                    New Matches
                  </h2>
                  <Link
                    href={withChrome('/seeker/jobs')}
                    style={{
                      color: '#FF7043',
                      fontWeight: 800,
                      fontSize: 13,
                      lineHeight: 1.2,
                      textDecoration: 'none',
                      ...ORANGE_HEADING_LIFT,
                    }}
                  >
                    View all
                  </Link>
                </div>
                <RecommendedJobsPreview />
              </section>
               <section style={{ ...GLASS, padding: 16 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2
                    style={{
                      fontSize: 18,
                      color: '#FF7043',
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                      margin: 0,
                      ...ORANGE_HEADING_LIFT,
                    }}
                  >
                    Your Next Yes
                  </h2>
                  <Link
                    href={withChrome('/seeker/pinned-jobs')}
                    style={{
                      color: '#FF7043',
                      fontWeight: 800,
                      fontSize: 13,
                      lineHeight: 1.2,
                      textDecoration: 'none',
                      ...ORANGE_HEADING_LIFT,
                    }}
                  >
                    View all
                  </Link>
                </div>
                <PinnedJobsPreview />
              </section>
               <section style={{ ...GLASS, padding: 16 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3
                    style={{
                      fontSize: 16,
                      color: '#FF7043',
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                      margin: 0,
                      ...ORANGE_HEADING_LIFT,
                    }}
                  >
                    Applications Over Time
                  </h3>
                  <Link
                    href={withChrome('/seeker/applications')}
                    style={{
                      color: '#FF7043',
                      fontWeight: 800,
                      fontSize: 13,
                      lineHeight: 1.2,
                      textDecoration: 'none',
                      ...ORANGE_HEADING_LIFT,
                    }}
                  >
                    View all
                  </Link>
                </div>
                <ApplicationsOverTime weeks={weeks} withChrome={withChrome} />
              </section>
            </div>

          </div>
        </div>
      </SeekerLayout>
    </>
  );
}