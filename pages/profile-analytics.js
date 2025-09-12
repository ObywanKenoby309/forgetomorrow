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

  // ---- Mock analytics (replace with real data later) ----
  const analytics = useMemo(() => {
    const daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      // KPIs
      totalViews: 1234,
      postsCount: 42,
      commentsCount: 58,
      connectionsGained7d: 8,
      profileCompletionPct: 78,

      // Time series
      daysLabels,
      viewsLast7Days: [50, 75, 60, 80, 100, 90, 110],
      searchAppearancesLast7Days: [120, 140, 135, 150, 180, 160, 200],
      connectionsLast7Days: [1, 0, 2, 1, 1, 2, 1],

      // Details
      lastProfileViewer: { name: 'Jane Doe', profileUrl: '/profile?tab=views' },
      recentViewers: [
        { name: 'Jane Doe', when: '2h ago' },
        { name: 'Alex Turner', when: '5h ago' },
        { name: 'Priya N.', when: 'Yesterday' },
        { name: 'Michael R.', when: '2 days ago' },
        { name: 'Dana C.', when: '3 days ago' },
      ],
      profileChecklist: [
        { label: 'Headline', done: true },
        { label: 'Summary', done: true },
        { label: 'Experience', done: true },
        { label: 'Skills', done: false },
        { label: 'Links/Portfolio', done: false },
        { label: 'Contact Preferences', done: true },
      ],
      highestViewedPost: {
        title: 'How to Optimize Your Resume for ATS Systems',
        views: 1200,
        url: '/feed/post/123',
      },
      highestViewedComment: {
        snippet: 'Great tips! I found this very helpful, thanks!',
        likes: 350,
        url: '/feed/comment/456',
      },
    };
  }, []);

  const HeaderBox = (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center">
      <h1 className="m-0 text-[#FF7043] text-2xl font-extrabold">Profile Analytics</h1>
      <p className="mt-1 mb-0 text-[#607D8B] max-w-3xl mx-auto">
        Track engagement on your profile and content. (Charts are mock data for now.)
      </p>
    </section>
  );

  const allViewsHref =
    (analytics.lastProfileViewer.profileUrl || '/profile?tab=views') +
    (isCoachChrome ? '&chrome=coach' : '');

  return (
    <>
      <Head><title>Profile Analytics | ForgeTomorrow</title></Head>

      <Layout
        title="Profile Analytics | ForgeTomorrow"
        header={HeaderBox}
        right={null}
        activeNav="profile"
        sidebarInitialOpen={{ coaching: false, seeker: false }}
      >
        <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
          {/* ===== Main Column ===== */}
          <div className="lg:col-span-8 grid gap-4 md:gap-6">
            {/* KPI Strip — full row */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <KPI label="Profile Views" value={analytics.totalViews.toLocaleString()} />
                <KPI label="Posts" value={analytics.postsCount} />
                <KPI label="Comments" value={analytics.commentsCount} />
                <KPI label="Connections (7d)" value={analytics.connectionsGained7d} />
                <KPI label="Profile Completion" value={`${analytics.profileCompletionPct}%`} />
              </div>
            </section>

            {/* NEW: Charts row — two columns on md+, stacked on mobile */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              <ViewsChart
                labels={analytics.daysLabels}
                data={analytics.viewsLast7Days}
              />
              <SearchAppearancesChart
                labels={analytics.daysLabels}
                data={analytics.searchAppearancesLast7Days}
              />
            </div>

            {/* Top content — full row */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 grid gap-3">
              <h2 className="text-[#FF7043] m-0 font-semibold">Top Content</h2>

              <div className="grid gap-1.5">
                <strong className="text-[#263238]">Highest Viewed Post</strong>
                <a
                  href={analytics.highestViewedPost.url + (isCoachChrome ? '?chrome=coach' : '')}
                  className="text-[#FF7043] font-bold no-underline"
                >
                  {analytics.highestViewedPost.title}
                </a>
                <small className="text-[#607D8B]">
                  {analytics.highestViewedPost.views.toLocaleString()} views
                </small>
              </div>

              <div className="grid gap-1.5">
                <strong className="text-[#263238]">Highest Liked Comment</strong>
                <p className="text-[#455A64] m-0 italic">
                  “{analytics.highestViewedComment.snippet}”
                </p>
                <a
                  href={analytics.highestViewedComment.url + (isCoachChrome ? '?chrome=coach' : '')}
                  className="text-[#FF7043] font-bold no-underline"
                >
                  View comment
                </a>
                <small className="text-[#607D8B]">
                  {analytics.highestViewedComment.likes.toLocaleString()} likes
                </small>
              </div>
            </section>

            {/* Back to Profile */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center justify-between">
              <div className="text-[#607D8B]">
                Review and refine your profile sections to improve engagement.
              </div>
              <a
                href={'/profile' + (isCoachChrome ? '?chrome=coach' : '')}
                className="bg-[#FF7043] text-white rounded-lg px-3 py-2 font-bold no-underline"
              >
                Back to Profile
              </a>
            </section>
          </div>

          {/* ===== Sidebar ===== */}
          <aside className="lg:col-span-4 grid gap-4 md:gap-6">
            <ProfileCompletionCard
              completionPct={analytics.profileCompletionPct}
              checklist={analytics.profileChecklist}
            />
            <ConnectionsMiniChart
              labels={analytics.daysLabels}
              data={analytics.connectionsLast7Days}
            />
            <RecentViewers viewers={analytics.recentViewers} allViewsHref={allViewsHref} />
          </aside>
        </div>
      </Layout>
    </>
  );
}
