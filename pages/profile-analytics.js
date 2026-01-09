// pages/profile-analytics.js
import React, { useMemo, useState, useRef, useCallback } from 'react';
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

export default function ProfileAnalyticsPage() {
  const router = useRouter();
  const isCoachChrome = (router.query.chrome || '').toString() === 'coach';
  const Layout = isCoachChrome ? CoachingLayout : SeekerLayout;

  // ---- Current analytics: safe defaults (no demo/test data) ----
  const analytics = useMemo(() => {
    const daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      // KPIs (0 until live analytics are wired)
      totalViews: 0,
      postsCount: 0,
      commentsCount: 0,
      connectionsGained7d: 0,
      profileCompletionPct: 0,
      // Time series (flat until we have real signals)
      daysLabels,
      viewsLast7Days: [0, 0, 0, 0, 0, 0, 0],
      searchAppearancesLast7Days: [0, 0, 0, 0, 0, 0, 0],
      connectionsLast7Days: [0, 0, 0, 0, 0, 0, 0],
      // Details
      lastProfileViewer: {
        name: null,
        profileUrl: '/profile?tab=views',
      },
      recentViewers: [],
      profileChecklist: [
        { label: 'Headline', done: false },
        { label: 'Summary', done: false },
        { label: 'Experience', done: false },
        { label: 'Skills', done: false },
        { label: 'Links / Portfolio', done: false },
        { label: 'Contact Preferences', done: false },
      ],
      // Top content: not yet available
      highestViewedPost: null,
      highestViewedComment: null,
    };
  }, []);

  const allViewsHref =
    (analytics.lastProfileViewer?.profileUrl || '/profile?tab=views') +
    (isCoachChrome ? '&chrome=coach' : '');

  const hasTopPost = !!analytics.highestViewedPost;
  const hasTopComment = !!analytics.highestViewedComment;

  const withChrome = useCallback(
    (href) => {
      const s = String(href || '');
      if (!isCoachChrome) return s;
      return s.includes('?') ? `${s}&chrome=coach` : `${s}?chrome=coach`;
    },
    [isCoachChrome]
  );

  // ---------------------------
  // Mobile: swipe-dot panels + details modal
  // ---------------------------
  const [mobilePanelIndex, setMobilePanelIndex] = useState(0);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const touchStartX = useRef(null);

  const panelTitles = ['Actions', 'Reach', 'Activity'];

  const impactByLabel = useMemo(() => {
    return {
      Headline: 'High impact',
      Summary: 'High impact',
      Experience: 'High impact',
      Skills: 'Medium impact',
      'Links / Portfolio': 'Medium impact',
      'Contact Preferences': 'Medium impact',
    };
  }, []);

  const nextActions = useMemo(() => {
    const list = Array.isArray(analytics.profileChecklist)
      ? analytics.profileChecklist
      : [];
    return list.filter((x) => !x?.done).slice(0, 4);
  }, [analytics.profileChecklist]);

  const sum = (arr) =>
    Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0;

  const views7d = useMemo(() => sum(analytics.viewsLast7Days), [analytics.viewsLast7Days]);
  const search7d = useMemo(
    () => sum(analytics.searchAppearancesLast7Days),
    [analytics.searchAppearancesLast7Days]
  );
  const connections7d = useMemo(
    () => sum(analytics.connectionsLast7Days),
    [analytics.connectionsLast7Days]
  );

  const visibility = useMemo(() => {
    const c = Number(analytics.profileCompletionPct) || 0;
    const v = Number(analytics.totalViews) || 0;

    if (c >= 80 && (views7d > 0 || v > 0)) {
      return {
        level: 'STRONG',
        tone: 'text-emerald-700',
        blurb: 'You are showing up. Keep momentum and maintain freshness.',
      };
    }
    if (c >= 40) {
      return {
        level: 'BUILDING',
        tone: 'text-amber-700',
        blurb: 'You are close. A few upgrades will increase recruiter visibility.',
      };
    }
    return {
      level: 'LOW',
      tone: 'text-red-700',
      blurb: 'Recruiters are unlikely to find you yet. Let’s fix the basics first.',
    };
  }, [analytics.profileCompletionPct, analytics.totalViews, views7d]);

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
        // swipe right => previous
        setMobilePanelIndex((i) => Math.max(0, i - 1));
      } else if (dx < -threshold) {
        // swipe left => next
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
        Track engagement on your profile and content. Detailed analytics are rolling out
        gradually, so some numbers may be limited for now.
      </p>
    </section>
  );

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
              - anchored status + CTA
              - swipe-dot panels (Actions / Reach / Activity)
              - charts behind "View detailed analytics"
             --------------------------- */}
          <div className="md:hidden">
            {/* Anchored status / visibility */}
            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-[#607D8B]">
                    Profile Visibility
                  </div>
                  <div className={`mt-1 text-lg font-extrabold ${visibility.tone}`}>
                    {visibility.level}
                  </div>
                  <p className="mt-1 mb-0 text-sm text-[#455A64]">{visibility.blurb}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(withChrome('/profile'))}
                  className="shrink-0 rounded-xl px-4 py-2 font-bold text-sm bg-[#FF7043] text-white shadow-sm"
                >
                  Improve
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-[#607D8B]">
                  Completion:{' '}
                  <span className="font-bold text-[#263238]">
                    {Number(analytics.profileCompletionPct) || 0}%
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

            {/* Swipe-dot panels */}
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

                {/* Optional labels for clarity (still modern) */}
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

              <div
                className="px-4 pb-4"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {/* Panel: Actions */}
                {mobilePanelIndex === 0 ? (
                  <div>
                    <p className="m-0 text-sm text-[#455A64]">
                      Your next best actions to improve visibility.
                    </p>

                    <div className="mt-3 space-y-2">
                      {nextActions.length ? (
                        nextActions.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => router.push(withChrome('/profile'))}
                            className="w-full text-left bg-[#FAFAFA] border border-gray-200 rounded-xl px-3 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-extrabold text-[#263238]">
                                  {item.label}
                                </div>
                                <div className="text-xs text-[#607D8B] mt-0.5">
                                  {impactByLabel[item.label] || 'Impact'}
                                </div>
                              </div>
                              <span className="shrink-0 text-sm font-bold text-[#FF7043]">
                                Edit →
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-4 text-sm text-[#455A64]">
                          Nice. Your checklist is complete.
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-xs text-[#607D8B]">
                      Tip: A strong headline + skills dramatically improves search matching.
                    </div>
                  </div>
                ) : null}

                {/* Panel: Reach */}
                {mobilePanelIndex === 1 ? (
                  <div>
                    <p className="m-0 text-sm text-[#455A64]">
                      A simple snapshot of your reach (no noise).
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-3">
                        <div className="text-xs uppercase tracking-wide text-[#607D8B]">
                          Views (7d)
                        </div>
                        <div className="mt-1 text-xl font-extrabold text-[#263238]">
                          {Number(views7d || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-3">
                        <div className="text-xs uppercase tracking-wide text-[#607D8B]">
                          Search (7d)
                        </div>
                        <div className="mt-1 text-xl font-extrabold text-[#263238]">
                          {Number(search7d || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 bg-[#FAFAFA] border border-gray-200 rounded-xl p-3">
                      <div className="text-xs uppercase tracking-wide text-[#607D8B]">
                        Momentum Tip
                      </div>
                      <div className="mt-1 text-sm text-[#455A64]">
                        Recruiters search by titles and skills. Add a clear headline and 10–15
                        skills to increase appearances.
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Panel: Activity */}
                {mobilePanelIndex === 2 ? (
                  <div>
                    <p className="m-0 text-sm text-[#455A64]">
                      Who is noticing you (and what is moving).
                    </p>

                    <div className="mt-3 bg-[#FAFAFA] border border-gray-200 rounded-xl p-3">
                      <div className="text-xs uppercase tracking-wide text-[#607D8B]">
                        Connections (7d)
                      </div>
                      <div className="mt-1 text-xl font-extrabold text-[#263238]">
                        {Number(analytics.connectionsGained7d || 0).toLocaleString()}
                      </div>
                      <div className="mt-1 text-xs text-[#607D8B]">
                        Trend points: {Number(connections7d || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-3 bg-[#FAFAFA] border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-wide text-[#607D8B]">
                          Recent Viewers
                        </div>
                        <a
                          href={allViewsHref}
                          className="text-sm font-bold text-[#FF7043]"
                        >
                          See all →
                        </a>
                      </div>

                      <div className="mt-2">
                        {Array.isArray(analytics.recentViewers) &&
                        analytics.recentViewers.length ? (
                          <ul className="m-0 p-0 list-none space-y-2">
                            {analytics.recentViewers.slice(0, 3).map((v, idx) => (
                              <li
                                key={(v?.name || 'viewer') + idx}
                                className="flex items-center justify-between"
                              >
                                <span className="text-sm font-bold text-[#263238]">
                                  {v?.name || 'Viewer'}
                                </span>
                                <span className="text-xs text-[#607D8B]">
                                  {v?.when || ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-[#455A64]">
                            No recent viewers yet — let’s change that.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Mobile Details Modal (charts live here) */}
            {mobileDetailsOpen ? (
              <div
                className="fixed inset-0 z-[60] flex items-end justify-center"
                role="dialog"
                aria-modal="true"
                aria-label="Detailed analytics"
              >
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
                      <KPI
                        label="Profile Views"
                        value={analytics.totalViews.toLocaleString()}
                      />
                      <KPI label="Profile Completion" value={`${analytics.profileCompletionPct}%`} />
                      <KPI label="Posts" value={analytics.postsCount} />
                      <KPI label="Comments" value={analytics.commentsCount} />
                    </div>

                    <ViewsChart labels={analytics.daysLabels} data={analytics.viewsLast7Days} />
                    <SearchAppearancesChart
                      labels={analytics.daysLabels}
                      data={analytics.searchAppearancesLast7Days}
                    />
                    <ConnectionsMiniChart
                      labels={analytics.daysLabels}
                      data={analytics.connectionsLast7Days}
                    />

                    <ProfileCompletionCard
                      completionPct={analytics.profileCompletionPct}
                      checklist={analytics.profileChecklist}
                    />

                    <RecentViewers viewers={analytics.recentViewers} allViewsHref={allViewsHref} />

                    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                      <h2 className="text-[#FF7043] font-semibold mb-3">Top Content</h2>
                      {hasTopPost ? (
                        <div className="mb-5">
                          <strong className="text-[#263238]">Highest Viewed Post</strong>
                          <a
                            href={withChrome(analytics.highestViewedPost.url)}
                            className="block text-[#FF7043] font-bold mt-1"
                          >
                            {analytics.highestViewedPost.title}
                          </a>
                          <small className="text-[#607D8B]">
                            {analytics.highestViewedPost.views.toLocaleString()} views
                          </small>
                        </div>
                      ) : (
                        <div className="mb-5">
                          <strong className="text-[#263238]">Highest Viewed Post</strong>
                          <p className="text-[#607D8B] text-sm mt-1 mb-0">
                            As you start posting on the feed, your top-performing post will appear here.
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
                            href={withChrome(analytics.highestViewedComment.url)}
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
                          <p className="text-[#607D8B] text-sm mt-1 mb-0">
                            As you join conversations, we’ll highlight your most engaging comments here.
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
              DESKTOP/TABLET: keep existing layout as-is (hidden on mobile)
             --------------------------- */}
          <div className="hidden md:block">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <KPI
                label="Profile Views"
                value={analytics.totalViews.toLocaleString()}
              />
              <KPI label="Posts" value={analytics.postsCount} />
              <KPI label="Comments" value={analytics.commentsCount} />
              <KPI label="Connections (7d)" value={analytics.connectionsGained7d} />
              <KPI
                label="Profile Completion"
                value={`${analytics.profileCompletionPct}%`}
              />
            </div>

            {/* Charts + Completion row */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                <ViewsChart
                  labels={analytics.daysLabels}
                  data={analytics.viewsLast7Days}
                />
                <SearchAppearancesChart
                  labels={analytics.daysLabels}
                  data={analytics.searchAppearancesLast7Days}
                />
              </div>
              <ProfileCompletionCard
                completionPct={analytics.profileCompletionPct}
                checklist={analytics.profileChecklist}
              />
            </div>

            {/* Bottom row — Connections, Recent Viewers, Top Content */}
            <div className="grid lg:grid-cols-3 gap-6">
              <ConnectionsMiniChart
                labels={analytics.daysLabels}
                data={analytics.connectionsLast7Days}
              />
              <RecentViewers
                viewers={analytics.recentViewers}
                allViewsHref={allViewsHref}
              />
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h2 className="text-[#FF7043] font-semibold mb-4">Top Content</h2>
                {hasTopPost ? (
                  <div className="mb-6">
                    <strong className="text-[#263238]">Highest Viewed Post</strong>
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
                      {analytics.highestViewedPost.views.toLocaleString()} views
                    </small>
                  </div>
                ) : (
                  <div className="mb-6">
                    <strong className="text-[#263238]">Highest Viewed Post</strong>
                    <p className="text-[#607D8B] text-sm mt-1">
                      As you start posting on the feed, your top-performing post will appear here.
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
                      As you join conversations, we’ll highlight your most engaging comments here.
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
