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
import ProfileStrengthKpiRow from '@/components/seeker/dashboard/ProfileStrengthKpiRow';
import ApplicationsOverTime from '@/components/seeker/dashboard/ApplicationsOverTime';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { colorFor } from '@/components/seeker/dashboard/seekerColors';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import ActionCenterTab from '@/components/dashboard/ActionCenterTab';

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
  const category = safeText(n?.category).toUpperCase();
  const entityType = safeText(n?.entityType).toUpperCase();
  const title = safeText(n?.title).toLowerCase();
  const body = safeText(n?.body).toLowerCase();
  const meta = n?.metadata || {};
  const metaStr = safeText(meta?.type || meta?.event || meta?.kind || '').toLowerCase();
  const haystack = `${title} ${body} ${metaStr}`;

  // Vault shares — own bucket so they're never mixed with messages
  if (category === 'VAULT' || entityType === 'VAULT_SHARE' ||
      haystack.includes('shared a document') || haystack.includes('shared with you')) return 'shared';

  if (haystack.includes('calendar') || haystack.includes('invite') || haystack.includes('schedule') || haystack.includes('resched') || haystack.includes('interview') || haystack.includes('foundry')) return 'calendar';
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
  const LINKS  = { recommended: withChrome('/jobs'), pinned: withChrome('/seeker/pinned-jobs') };

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
      <div
        style={{
          minHeight: 120,
          borderRadius: 12,
          overflow: 'hidden',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {active === 'recommended' ? (
          <RecommendedJobsPreview />
        ) : (
          <div style={{ ...WHITE_CARD, padding: 12 }}>
            <PinnedJobsPreview />
          </div>
        )}
      </div>
    </section>
  );
}

function ConnectedJobsPanel({ withChrome, isMobile = false, style = {} }) {
  return (
    <section style={{ ...GLASS, padding: isMobile ? 12 : 16, ...style }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: isMobile ? 10 : 14,
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            minWidth: 0,
            paddingRight: isMobile ? 0 : 14,
            borderRight: isMobile ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.26)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: isMobile ? 12 : 16, fontWeight: 900, color: '#FF7043', lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>
              Recommended
            </span>
            <Link
              href={withChrome('/jobs')}
              style={{ fontSize: isMobile ? 10 : 12, fontWeight: 800, color: '#FF7043', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Jobs →
            </Link>
          </div>
          <RecommendedJobsPreview compact autoRotateMobile={isMobile} />
        </div>

        <div style={{ minWidth: 0, paddingLeft: isMobile ? 0 : 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: isMobile ? 12 : 16, fontWeight: 900, color: '#FF7043', lineHeight: 1.25, ...ORANGE_HEADING_LIFT }}>
              Pinned
            </span>
            <Link
              href={withChrome('/seeker/pinned-jobs')}
              style={{ fontSize: isMobile ? 10 : 12, fontWeight: 800, color: '#FF7043', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Saved →
            </Link>
          </div>
          <PinnedJobsPreview compact autoRotateMobile={isMobile} />
        </div>
      </div>
    </section>
  );
}


// ─── Desktop Action Tile ──────────────────────────────────────────────────────
function ActionTile({ title, emptyText, items, href, withChrome, style }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <Link href={withChrome(href)} style={{ textDecoration: 'none' }}>
      <div className="rounded-lg p-3 flex flex-col" style={{ ...style, minHeight: 80, cursor: 'pointer' }}>
        <div className="font-semibold text-slate-900 text-sm leading-5 whitespace-normal break-words">{title}</div>
        <div className="mt-2 flex-1">
          {list.length === 0 ? (
            <div className="text-xs text-slate-500 leading-5">{emptyText}</div>
          ) : (
            <div className="space-y-1">
              {list.slice(0, 1).map((n) => (
                <div key={n.id} className="text-xs text-slate-700 leading-5">{n.title || 'Update'}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Mobile Action Tile ───────────────────────────────────────────────────────
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
    const b = { messages: [], jobs: [], applications: [], calendar: [], shared: [] };
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
      shared: b.shared.slice(0, 3),
    };
  }, [items]);

  const tiles = [
    { key: 'messages',     title: 'New Messages',        emptyText: 'No unread items.',        href: withChrome(`/action-center?scope=${scope}&tab=SOCIAL`),       icon: '💬', items: buckets.messages     },
    { key: 'applications', title: 'Application Updates', emptyText: 'No application updates.', href: withChrome(`/action-center?scope=${scope}&tab=APPLICATIONS`),  icon: '📋', items: buckets.applications },
    { key: 'calendar',     title: 'Interview Invites',   emptyText: 'No calendar updates.',    href: withChrome(`/action-center?scope=${scope}&tab=CALENDAR`),     icon: '📅', items: buckets.calendar     },
    { key: 'jobs',         title: 'Job Matches',         emptyText: 'No new job updates.',     href: withChrome(`/action-center?scope=${scope}&tab=JOBS`),         icon: '🎯', items: buckets.jobs         },
    { key: 'shared',       title: 'Shared With Me',      emptyText: 'No shared documents.',    href: withChrome(`/action-center?scope=${scope}&tab=SHARED`),       icon: '📬', items: buckets.shared       },
  ];

  // Desktop only — mobile uses the standalone ActionCenterTab edge drawer instead.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="rounded-lg p-3 min-h-[80px] animate-pulse"
              style={{ ...glassStyle, borderRadius: 14 }}>
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-32 bg-slate-200 rounded mt-3" />
              <div className="h-3 w-24 bg-slate-200 rounded mt-2" />
              <div className="h-8 w-24 bg-slate-200 rounded mt-4 ml-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <ActionTile title="New Messages"    emptyText="No new updates."        items={buckets.messages}     href={`/action-center?scope=${scope}&tab=SOCIAL`}       withChrome={withChrome} style={glassStyle} />
          <ActionTile title="Job Updates"     emptyText="No new updates."     items={buckets.jobs}         href={`/action-center?scope=${scope}&tab=JOBS`}         withChrome={withChrome} style={glassStyle} />
          <ActionTile title="Applications"    emptyText="No new updates." items={buckets.applications} href={`/action-center?scope=${scope}&tab=APPLICATIONS`}  withChrome={withChrome} style={glassStyle} />
          <ActionTile title="Calendar"        emptyText="No new updates."    items={buckets.calendar}     href={`/action-center?scope=${scope}&tab=CALENDAR`}     withChrome={withChrome} style={glassStyle} />
          <ActionTile title="Shared With Me"  emptyText="No new updates."    items={buckets.shared}       href={`/action-center?scope=${scope}&tab=SHARED`}       withChrome={withChrome} style={glassStyle} />
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

            {/* 2. Action Center — edge tab + drawer (mobile only), no page footprint */}
            <ActionCenterTab
              scope={scope}
              withChrome={withChrome}
              pickBucket={pickSeekerBucket}
              tileDefs={[
                { key: 'messages',     bucket: 'messages',     title: 'New Messages',        emptyText: 'No unread items.',        href: withChrome(`/action-center?scope=${scope}&tab=SOCIAL`),       icon: '💬' },
                { key: 'applications', bucket: 'applications', title: 'Application Updates', emptyText: 'No application updates.', href: withChrome(`/action-center?scope=${scope}&tab=APPLICATIONS`), icon: '📋' },
                { key: 'calendar',     bucket: 'calendar',     title: 'Interview Invites',   emptyText: 'No calendar updates.',    href: withChrome(`/action-center?scope=${scope}&tab=CALENDAR`),     icon: '📅' },
                { key: 'jobs',         bucket: 'jobs',         title: 'Job Matches',         emptyText: 'No new job updates.',     href: withChrome(`/action-center?scope=${scope}&tab=JOBS`),         icon: '🎯' },
                { key: 'shared',       bucket: 'shared',       title: 'Shared With Me',      emptyText: 'No shared documents.',    href: withChrome(`/action-center?scope=${scope}&tab=SHARED`),       icon: '📬' },
              ]}
            />

            {/* 3. Pipeline + Next Steps — primary mobile actions */}
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
                  <Link href={withChrome('/jobs')}
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

            {/* 3b. Profile Strength — recruiter signal row */}
            <section
              onClick={() => router.push(withChrome('/profile-strength'))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') router.push(withChrome('/profile-strength'));
              }}
              style={{ ...GLASS, padding: '10px 12px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#112033' }}>Profile Strength</span>
                <Link
                  href={withChrome('/profile-strength')}
                  style={{ fontSize: 11, fontWeight: 700, color: '#FF7043', textDecoration: 'none' }}
                >
                  Full read →
                </Link>
              </div>
              <ProfileStrengthKpiRow isMobile={true} />
            </section>

            {/* 4. Connected jobs panel — Recommended + Pinned */}
            <ConnectedJobsPanel withChrome={withChrome} isMobile />

            {/* 5. Activity + Engagement — tracker with health snapshot */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) minmax(110px, 0.82fr)',
                gap: GAP,
                alignItems: 'stretch',
              }}
            >
              <section style={{ ...GLASS, padding: 14, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#112033' }}>Activity</span>
                  <Link href={withChrome('/seeker/applications')}
                    style={{ fontSize: 11, fontWeight: 700, color: '#FF7043', textDecoration: 'none' }}>
                    History →
                  </Link>
                </div>

                <ApplicationsOverTime weeks={weeks} withChrome={withChrome} />
              </section>

              <section style={{ ...GLASS, padding: 12, minWidth: 0 }}>
                <div
  style={{
    display: 'flex',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  }}
>
  <span
  style={{
    fontSize: 12,
    fontWeight: 900,
    color: '#FF7043',
    lineHeight: 1.15,
    ...ORANGE_HEADING_LIFT,
  }}
>
    Engagement
  </span>
</div>

                <ProfilePerformanceTeaser layout="vertical" compact />
              </section>
            </div>
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
            <section style={{ ...GLASS, padding: '12px 16px 14px 16px', gridColumn: '1 / 2', gridRow: '2' }}>
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
                <div>
                  <KpiRow
                    pinned={kpi.pinned || 0}
                    applied={kpi.applied || 0}
                    interviewing={kpi.interviewing || 0}
                    offers={kpi.offers || 0}
                    closedOut={kpi.closedOut || 0}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 }}>
                <h2
                  style={{
                    fontSize: 16,
                    color: '#FF7043',
                    lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                    margin: 0,
                    ...ORANGE_HEADING_LIFT,
                  }}
                >
                  Profile Strength
                </h2>
                <Link
                  href={withChrome('/profile-strength')}
                  style={{
                    color: '#FF7043',
                    fontWeight: 800,
                    fontSize: 13,
                    lineHeight: 1.2,
                    textDecoration: 'none',
                    ...ORANGE_HEADING_LIFT,
                  }}
                >
                  Full read →
                </Link>
              </div>
              <div
                onClick={() => router.push(withChrome('/profile-strength'))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') router.push(withChrome('/profile-strength'));
                }}
                style={{ cursor: 'pointer' }}
              >
                <ProfileStrengthKpiRow isMobile={false} />
              </div>
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

            {/* COL 2, ROW 3: Engagement — beside Action Center only */}
            <aside
              style={{
                ...KPI_GLASS,
                gridColumn: '2 / 3',
                gridRow: '3',
                padding: 10,
                boxSizing: 'border-box',
                alignSelf: 'start',
                height: 150,
                maxHeight: 150,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
  style={{
    fontSize: 15,
    fontWeight: 900,
    marginBottom: 8,
    color: '#FF7043',
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    flexShrink: 0,
    ...ORANGE_HEADING_LIFT,
  }}
>
  Engagement
</div>
              <div
                style={{
                  ...WHITE_CARD,
                  padding: 8,
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <ProfilePerformanceTeaser compact />
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
                    href={withChrome('/jobs')}
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