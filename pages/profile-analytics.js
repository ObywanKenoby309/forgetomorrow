// pages/profile-analytics.js
import React, { useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
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

  const HeaderBox = (
    <section
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center"
      aria-label="Profile analytics overview"
    >
      <h1 className="m-0 text-[#FF7043] text-2xl font-extrabold">
        Profile Analytics
      </h1>
      <p className="mt-1 mb-0 text-[#607D8B] max-w-3xl mx-auto text-sm">
        Track engagement on your profile and content. Detailed analytics are
        rolling out gradually, so some numbers may be limited for now.
      </p>
    </section>
  );

  const allViewsHref =
    (analytics.lastProfileViewer?.profileUrl || '/profile?tab=views') +
    (isCoachChrome ? '&chrome=coach' : '');

  const hasTopPost = !!analytics.highestViewedPost;
  const hasTopComment = !!analytics.highestViewedComment;

  return (
    <>
      <Head>
        <title>Profile Analytics | ForgeTomorrow</title>
      </Head>
      <Layout
        title="Profile Analytics | ForgeTomorrow"
        header={HeaderBox}
        right={null}
        activeNav="profile"
        sidebarInitialOpen={{ coaching: false, seeker: false }}
      >
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title card */}
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center mb-6">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">Profile Analytics</h1>
            <p className="text-gray-600">
              Track engagement on your profile and content. Detailed analytics are rolling out gradually, so some numbers may be limited for now.
            </p>
          </section>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <KPI label="Profile Views" value={analytics.totalViews.toLocaleString()} />
            <KPI label="Posts" value={analytics.postsCount} />
            <KPI label="Comments" value={analytics.commentsCount} />
            <KPI label="Connections (7d)" value={analytics.connectionsGained7d} />
            <KPI label="Profile Completion" value={`${analytics.profileCompletionPct}%`} />
          </div>

          {/* Charts row — side-by-side on md+, stack on mobile */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <ViewsChart
              labels={analytics.daysLabels}
              data={analytics.viewsLast7Days}
            />
            <SearchAppearancesChart
              labels={analytics.daysLabels}
              data={analytics.searchAppearancesLast7Days}
            />
          </div>

          {/* Profile Completion card */}
          <ProfileCompletionCard
            completionPct={analytics.profileCompletionPct}
            checklist={analytics.profileChecklist}
            className="mb-6"
          />

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

          {/* Back to Profile */}
          <section className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex items-center justify-between">
            <div className="text-[#607D8B] text-sm">
              Review and refine your profile sections to improve engagement.
              As analytics expand, this page will help you see what is working.
            </div>
            <a
              href={'/profile' + (isCoachChrome ? '?chrome=coach' : '')}
              className="bg-[#FF7043] text-white rounded-lg px-6 py-3 font-bold no-underline text-sm"
            >
              Back to Profile
            </a>
          </section>
        </div>
      </Layout>
    </>
  );
}