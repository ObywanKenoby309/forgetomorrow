// pages/profile-analytics.js
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';

import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

// Componentized pieces
import KPI from '@/components/analytics/KPI';
import ViewsChart from '@/components/analytics/ViewsChart';
import SearchAppearancesChart from '@/components/analytics/SearchAppearancesChart';
import ProfileCompletionCard from '@/components/analytics/ProfileCompletionCard';
import ConnectionsMiniChart from '@/components/analytics/ConnectionsMiniChart';
import RecentViewers from '@/components/analytics/RecentViewers';

// ---- Shared logic (copied verbatim from Anvil ProfileDevelopment rules) ----
function safeArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'object' && Array.isArray(v.items)) return v.items.filter(Boolean);
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function skillNamesFromAny(skillsJson) {
  const arr = safeArray(skillsJson);
  return arr
    .map((x) => (typeof x === 'string' ? x : x?.name || x?.label || ''))
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

export default function ProfileAnalyticsPage() {
  const router = useRouter();
  const isCoachChrome = (router.query.chrome || '').toString() === 'coach';
  const Layout = isCoachChrome ? CoachingLayout : SeekerLayout;

  const withChrome = useCallback(
    (href) => {
      const s = String(href || '');
      if (!isCoachChrome) return s;
      return s.includes('?') ? `${s}&chrome=coach` : `${s}?chrome=coach`;
    },
    [isCoachChrome]
  );

  // ---------------------------
  // LIVE: fetch profile fields used by Anvil completion checker
  // ---------------------------
  const [profileDetails, setProfileDetails] = useState(null);
  const [primaryResume, setPrimaryResume] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function fetchProfileCompletionInputs() {
      setProfileLoading(true);
      try {
        const [dRes, pRes] = await Promise.all([
          fetch('/api/profile/details'),
          fetch('/api/profile/primaries'),
        ]);

        const dJson = await dRes.json().catch(() => ({}));
        const pJson = await pRes.json().catch(() => ({}));

        const merged = dJson?.details || dJson || null;

        if (!alive) return;
        setProfileDetails(merged || null);
        setPrimaryResume(pJson?.primaryResume || null);
      } catch (e) {
        console.error('[ProfileAnalytics] completion fetch error', e);
        if (!alive) return;
        setProfileDetails(null);
        setPrimaryResume(null);
      } finally {
        if (!alive) return;
        setProfileLoading(false);
      }
    }

    fetchProfileCompletionInputs();
    return () => {
      alive = false;
    };
  }, []);

  // ---------------------------
  // Completion computation (same thresholds as Anvil)
  // ---------------------------
  const completion = useMemo(() => {
    const headline = String(profileDetails?.headline || '').trim();
    const aboutMe = String(profileDetails?.aboutMe || '').trim();
    const skills = skillNamesFromAny(profileDetails?.skillsJson);
    const languages = safeArray(profileDetails?.languagesJson);

    const hasHeadline = headline.length >= 8;
    const hasSummary = aboutMe.length >= 120;
    const hasSkills = skills.length >= 8;
    const hasLanguages = safeArray(languages).length >= 1;
    const hasPrimaryResume = Boolean(primaryResume?.id);

    const total = 5;
    const completed =
      (hasHeadline ? 1 : 0) +
      (hasSummary ? 1 : 0) +
      (hasSkills ? 1 : 0) +
      (hasLanguages ? 1 : 0) +
      (hasPrimaryResume ? 1 : 0);

    const progress = Math.round((completed / total) * 100);

    const checklist = [
      { label: 'Headline', done: hasHeadline },
      { label: 'Summary', done: hasSummary },
      { label: 'Skills (8+)', done: hasSkills },
      { label: 'Languages (1+)', done: hasLanguages },
      { label: 'Primary Resume', done: hasPrimaryResume },
    ];

    return {
      progress,
      completed,
      total,
      checklist,
    };
  }, [profileDetails, primaryResume]);

  // ---------------------------
  // LIVE: fetch analytics (ProfileView / Contact / FeedPost)
  // ---------------------------
  const [analyticsState, setAnalyticsState] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function fetchAnalytics() {
      setAnalyticsLoading(true);
      try {
        const res = await fetch('/api/profile/analytics');
        const json = await res.json().catch(() => ({}));

        if (!alive) return;

        if (!res.ok) {
          console.error('[ProfileAnalytics] analytics fetch failed', json);
          setAnalyticsState(null);
          return;
        }

        setAnalyticsState(json || null);
      } catch (e) {
        console.error('[ProfileAnalytics] analytics fetch error', e);
        if (!alive) return;
        setAnalyticsState(null);
      } finally {
        if (!alive) return;
        setAnalyticsLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      alive = false;
    };
  }, []);

  // ---------------------------
  // Analytics object for UI (no placeholders, no "wired" language)
  // ---------------------------
  const analytics = useMemo(() => {
    const a = analyticsState || {};

    // prefer live completion from your computed logic (matches Anvil UI)
    const profileCompletionPct =
      Number(completion.progress) ||
      (typeof a.profileCompletionPct === 'number' ? a.profileCompletionPct : 0);

    const daysLabels = Array.isArray(a.daysLabels) && a.daysLabels.length === 7
      ? a.daysLabels
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const viewsLast7Days = Array.isArray(a.viewsLast7Days) ? a.viewsLast7Days : null;
    const searchAppearancesLast7Days = Array.isArray(a.searchAppearancesLast7Days)
      ? a.searchAppearancesLast7Days
      : null;
    const connectionsLast7Days = Array.isArray(a.connectionsLast7Days) ? a.connectionsLast7Days : null;

    return {
      totalViews: typeof a.totalViews === 'number' ? a.totalViews : 0,
      postsCount: typeof a.postsCount === 'number' ? a.postsCount : 0,
      commentsCount: typeof a.commentsCount === 'number' ? a.commentsCount : 0,
      connectionsGained7d: typeof a.connectionsGained7d === 'number' ? a.connectionsGained7d : 0,

      profileCompletionPct,

      daysLabels,
      viewsLast7Days,
      searchAppearancesLast7Days,
      connectionsLast7Days,

      lastProfileViewer: a.lastProfileViewer || {
        name: null,
        profileUrl: '/profile?tab=views',
      },

      recentViewers: Array.isArray(a.recentViewers) ? a.recentViewers : [],
      profileChecklist: Array.isArray(completion.checklist) ? completion.checklist : [],

      highestViewedPost: a.highestViewedPost || null,
      highestViewedComment: a.highestViewedComment || null,
    };
  }, [analyticsState, completion.progress, completion.checklist]);

  const allViewsHref =
    (analytics.lastProfileViewer?.profileUrl || '/profile?tab=views') +
    (isCoachChrome ? '&chrome=coach' : '');

  const hasTopPost = !!analytics.highestViewedPost;
  const hasTopComment = !!analytics.highestViewedComment;

  // ---------------------------
  // Mobile: swipe-dot panels + details modal
  // ---------------------------
  const [mobilePanelIndex, setMobilePanelIndex] = useState(0);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const touchStartX = useRef(null);

  const panelTitles = ['Actions', 'Reach', 'Activity'];

  const nextActions = useMemo(() => {
    const list = Array.isArray(analytics.profileChecklist) ? analytics.profileChecklist : [];
    return list.filter((x) => !x?.done).slice(0, 4);
  }, [analytics.profileChecklist]);

  const visibility = useMemo(() => {
    const c = Number(analytics.profileCompletionPct) || 0;

    if (c >= 80) {
      return {
        level: 'STRONG',
        tone: 'text-emerald-700',
        blurb: 'Strong foundation. Keep it fresh and recruiter-relevant.',
      };
    }
    if (c >= 40) {
      return {
        level: 'BUILDING',
        tone: 'text-amber-700',
        blurb: 'You are close. A few upgrades will increase visibility fast.',
      };
    }
    return {
      level: 'LOW',
      tone: 'text-red-700',
      blurb: 'Key recruiter signals are missing. Let’s strengthen this now.',
    };
  }, [analytics.profileCompletionPct]);

  function onTouchStart(e) {
    try {
      touchStartX.current = e.touches?.[0]?.clientX ?? null;
    } catch {
      touchStartX.current = null;
    }
  }

  function onTouchEnd(e) {
    try {
      const startX = touchStartX.current;
      const endX = e.changedTouches?.[0]?.clientX ?? null;
      touchStartX.current = null;

      if (startX == null || endX == null) return;

      const dx = endX - startX;
      const threshold = 45;

      if (dx > threshold) {
        setMobilePanelIndex((i) => Math.max(0, i - 1));
      } else if (dx < -threshold) {
        setMobilePanelIndex((i) => Math.min(panelTitles.length - 1, i + 1));
      }
    } catch {
      touchStartX.current = null;
    }
  }

  const HeaderBox = (
    <section
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center"
      aria-label="Profile analytics overview"
    >
      <h1 className="m-0 text-[#FF7043] text-2xl font-extrabold">Profile Analytics</h1>
      <p className="mt-1 mb-0 text-[#607D8B] max-w-3xl mx-auto text-sm">
        Track engagement on your profile and content.
      </p>
    </section>
  );

  const kpiValue = (v) => (v === null || typeof v === 'undefined' ? '—' : String(v));

  // show charts when arrays exist (even if all zeros)
  const detailedAnalyticsAvailable =
    Array.isArray(analytics.viewsLast7Days) &&
    Array.isArray(analytics.searchAppearancesLast7Days) &&
    Array.isArray(analytics.connectionsLast7Days);

  return (
    <>
      <Head>
        <title>Profile Analytics | ForgeTomorrow</title>
      </Head>

      <Layout
        title="Profile Analytics | ForgeTomorrow"
        header={HeaderBox}
        right={<RightRailPlacementManager surfaceId="profile" />}
        activeNav="profile"
        sidebarInitialOpen={{ coaching: false, seeker: false }}
      >
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          {/* ---------------------------
              MOBILE: viewport-locked experience (md:hidden)
             --------------------------- */}
          <div className="md:hidden">
            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-[#607D8B]">
                    Profile Visibility
                  </div>

                  <div className={`mt-1 text-lg font-extrabold ${visibility.tone}`}>
                    {profileLoading ? 'Checking…' : visibility.level}
                  </div>

                  <p className="mt-1 mb-0 text-sm text-[#455A64]">
                    {profileLoading ? 'Loading your live completion status.' : visibility.blurb}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(withChrome('/anvil?module=profile'))}
                  className="shrink-0 rounded-xl px-4 py-2 font-bold text-sm bg-[#FF7043] text-white shadow-sm"
                >
                  Strengthen
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-[#607D8B]">
                  Completion:{' '}
                  <span className="font-bold text-[#263238]">
                    {profileLoading ? '—' : `${Number(analytics.profileCompletionPct) || 0}%`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileDetailsOpen(true)}
                  className="text-sm font-bold text-[#FF7043]"
                >
                  View detailed analytics →
                </button>
              </div>
            </section>

            <section className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <h2 className="m-0 text-[#263238] font-extrabold text-base">
                    {panelTitles[mobilePanelIndex]}
                  </h2>
                  <div className="flex items-center gap-2">
                    {panelTitles.map((t, idx) => {
                      const active = idx === mobilePanelIndex;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setMobilePanelIndex(idx)}
                          aria-label={`Show ${t}`}
                          className="flex items-center gap-1"
                        >
                          <span
                            className={`inline-block rounded-full transition-all ${
                              active ? 'w-3 h-3' : 'w-2 h-2'
                            }`}
                            style={{
                              background: active ? '#FF7043' : 'rgba(96,125,139,0.35)',
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs text-[#607D8B]">
                  {panelTitles.map((t, idx) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMobilePanelIndex(idx)}
                      className={`font-bold ${
                        idx === mobilePanelIndex ? 'text-[#FF7043]' : 'text-[#607D8B]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 pb-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                {/* Actions */}
                {mobilePanelIndex === 0 ? (
                  <div>
                    <p className="m-0 text-sm text-[#455A64]">
                      Next best actions (live from your profile).
                    </p>

                    <div className="mt-3 space-y-2">
                      {profileLoading ? (
                        <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-4 text-sm text-[#455A64]">
                          Loading…
                        </div>
                      ) : nextActions.length ? (
                        nextActions.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => router.push(withChrome('/anvil?module=profile'))}
                            className="w-full text-left bg-[#FAFAFA] border border-gray-200 rounded-xl px-3 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-extrabold text-[#263238]">{item.label}</div>
                                <div className="text-xs text-[#607D8B] mt-0.5">
                                  Tap to strengthen in The Anvil
                                </div>
                              </div>
                              <span className="shrink-0 text-sm font-bold text-[#FF7043]">
                                Open →
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-4 text-sm text-[#455A64]">
                          Your checklist is complete.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Reach */}
                {mobilePanelIndex === 1 ? (
                  <div>
                    <p className="m-0 text-sm text-[#455A64]">
                      Reach across the last 7 days.
                    </p>
                    <div className="mt-3 bg-[#FAFAFA] border border-gray-200 rounded-xl p-3 text-sm text-[#455A64]">
                      {analyticsLoading ? 'Loading…' : `Profile interactions: ${analytics.totalViews.toLocaleString()}`}
                    </div>
                  </div>
                ) : null}

                {/* Activity */}
                {mobilePanelIndex === 2 ? (
                  <div>
                    <p className="m-0 text-sm text-[#455A64]">
                      Recent viewers and activity.
                    </p>
                    <div className="mt-3 bg-[#FAFAFA] border border-gray-200 rounded-xl p-3 text-sm text-[#455A64]">
                      {analyticsLoading ? 'Loading…' : `Recent viewers: ${analytics.recentViewers.length}`}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Mobile Details Modal */}
            {mobileDetailsOpen ? (
              <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setMobileDetailsOpen(false)}
                  aria-label="Close details"
                />
                <div className="relative w-full max-w-xl bg-white rounded-t-2xl shadow-2xl border border-gray-200">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
                    <div className="font-extrabold text-[#263238]">Detailed Analytics</div>
                    <button
                      type="button"
                      onClick={() => setMobileDetailsOpen(false)}
                      className="text-sm font-bold text-[#FF7043]"
                    >
                      Close
                    </button>
                  </div>

                  <div className="p-4 space-y-4 max-h-[78vh] overflow-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <KPI label="Profile Interactions" value={kpiValue(analytics.totalViews)} />
                      <KPI label="Profile Completion" value={`${analytics.profileCompletionPct}%`} />
                      <KPI label="Posts" value={kpiValue(analytics.postsCount)} />
                      <KPI label="Comments" value={kpiValue(analytics.commentsCount)} />
                    </div>

                    {/* Charts */}
                    {detailedAnalyticsAvailable ? (
                      <>
                        <ViewsChart labels={analytics.daysLabels} data={analytics.viewsLast7Days} />
                        <SearchAppearancesChart labels={analytics.daysLabels} data={analytics.searchAppearancesLast7Days} />
                        <ConnectionsMiniChart labels={analytics.daysLabels} data={analytics.connectionsLast7Days} />
                      </>
                    ) : (
                      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-sm text-[#455A64]">
                        {analyticsLoading ? 'Loading…' : 'No 7-day chart data available yet.'}
                      </section>
                    )}

                    <ProfileCompletionCard completionPct={analytics.profileCompletionPct} checklist={analytics.profileChecklist} />

                    <RecentViewers viewers={analytics.recentViewers} allViewsHref={allViewsHref} />

                    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                      <h2 className="text-[#FF7043] font-semibold mb-3">Top Content</h2>
                      {hasTopPost ? (
                        <div className="mb-5">
                          <strong className="text-[#263238]">Top Post (Interactions)</strong>
                          <a href={withChrome(analytics.highestViewedPost.url)} className="block text-[#FF7043] font-bold mt-1">
                            {analytics.highestViewedPost.title}
                          </a>
                          <small className="text-[#607D8B]">{analytics.highestViewedPost.views.toLocaleString()} interactions</small>
                        </div>
                      ) : (
                        <div className="mb-5">
                          <strong className="text-[#263238]">Top Post (Interactions)</strong>
                          <p className="text-[#607D8B] text-sm mt-1 mb-0">
                            Your top-performing post will appear here once interaction tracking is added for feed content.
                          </p>
                        </div>
                      )}

                      {hasTopComment ? (
                        <div>
                          <strong className="text-[#263238]">Highest Liked Comment</strong>
                          <p className="text-[#455A64] italic mt-1">“{analytics.highestViewedComment.snippet}”</p>
                          <a href={withChrome(analytics.highestViewedComment.url)} className="text-[#FF7043] font-bold">
                            View comment
                          </a>
                          <small className="text-[#607D8B] block">{analytics.highestViewedComment.likes.toLocaleString()} likes</small>
                        </div>
                      ) : (
                        <div>
                          <strong className="text-[#263238]">Highest Liked Comment</strong>
                          <p className="text-[#607D8B] text-sm mt-1 mb-0">
                            Your most engaging comment will appear here once comment-level engagement tracking is added.
                          </p>
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* ---------------------------
              DESKTOP/TABLET
             --------------------------- */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <KPI label="Profile Interactions" value={kpiValue(analytics.totalViews)} />
              <KPI label="Posts" value={kpiValue(analytics.postsCount)} />
              <KPI label="Comments" value={kpiValue(analytics.commentsCount)} />
              <KPI label="Connections (7d)" value={kpiValue(analytics.connectionsGained7d)} />
              <KPI label="Profile Completion" value={`${analytics.profileCompletionPct}%`} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                {Array.isArray(analytics.viewsLast7Days) && Array.isArray(analytics.searchAppearancesLast7Days) ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <ViewsChart labels={analytics.daysLabels} data={analytics.viewsLast7Days} />
                    <SearchAppearancesChart labels={analytics.daysLabels} data={analytics.searchAppearancesLast7Days} />
                  </div>
                ) : (
                  <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-sm text-[#455A64]">
                    {analyticsLoading ? 'Loading charts…' : 'No view/search chart data available yet.'}
                  </section>
                )}
              </div>

              <ProfileCompletionCard completionPct={analytics.profileCompletionPct} checklist={analytics.profileChecklist} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {Array.isArray(analytics.connectionsLast7Days) ? (
                <ConnectionsMiniChart labels={analytics.daysLabels} data={analytics.connectionsLast7Days} />
              ) : (
                <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-sm text-[#455A64]">
                  {analyticsLoading ? 'Loading…' : 'No connection trend data available yet.'}
                </section>
              )}

              <RecentViewers viewers={analytics.recentViewers} allViewsHref={allViewsHref} />

              <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h2 className="text-[#FF7043] font-semibold mb-4">Top Content</h2>

                {hasTopPost ? (
                  <div className="mb-6">
                    <strong className="text-[#263238]">Top Post (Interactions)</strong>
                    <a
                      href={
                        analytics.highestViewedPost.url +
                        (isCoachChrome ? '?chrome=coach' : '')
                      }
                      className="block text-[#FF7043] font-bold mt-1"
                    >
                      {analytics.highestViewedPost.title}
                    </a>
                    <small className="text-[#607D8B]">
                      {analytics.highestViewedPost.views.toLocaleString()} interactions
                    </small>
                  </div>
                ) : (
                  <div className="mb-6">
                    <strong className="text-[#263238]">Top Post (Interactions)</strong>
                    <p className="text-[#607D8B] text-sm mt-1">
                      Your top-performing post will appear here once interaction tracking is added for feed content.
                    </p>
                  </div>
                )}

                {hasTopComment ? (
                  <div>
                    <strong className="text-[#263238]">Highest Liked Comment</strong>
                    <p className="text-[#455A64] italic mt-1">
                      “{analytics.highestViewedComment.snippet}”
                    </p>
                    <a
                      href={
                        analytics.highestViewedComment.url +
                        (isCoachChrome ? '?chrome=coach' : '')
                      }
                      className="text-[#FF7043] font-bold"
                    >
                      View comment
                    </a>
                    <small className="text-[#607D8B] block">
                      {analytics.highestViewedComment.likes.toLocaleString()} likes
                    </small>
                  </div>
                ) : (
                  <div>
                    <strong className="text-[#263238]">Highest Liked Comment</strong>
                    <p className="text-[#607D8B] text-sm mt-1">
                      Your most engaging comment will appear here once comment-level engagement tracking is added.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
