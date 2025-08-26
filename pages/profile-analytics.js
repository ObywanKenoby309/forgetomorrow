// pages/profile-analytics.js
import React, { useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Layouts
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';

// Charts
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const UI = { CARD_PAD: 16, SECTION_GAP: 16 };

export default function ProfileAnalyticsPage() {
  const router = useRouter();
  const isCoachChrome = (router.query.chrome || '').toString() === 'coach';
  const Layout = isCoachChrome ? CoachingLayout : SeekerLayout;

  // ---- Mock analytics (replace with real data later) ----
  const analytics = useMemo(() => {
    const daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      totalViews: 1234,
      postsCount: 42,
      commentsCount: 58,
      daysLabels,
      viewsLast7Days: [50, 75, 60, 80, 100, 90, 110],
      lastProfileViewer: { name: 'Jane Doe', profileUrl: '/profile?tab=views' },
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

  const chartData = useMemo(
    () => ({
      labels: analytics.daysLabels,
      datasets: [
        {
          label: 'Profile Views',
          data: analytics.viewsLast7Days,
          backgroundColor: 'rgba(255,112,67,0.7)', // brand orange
          borderRadius: 4,
        },
      ],
    }),
    [analytics]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 20 } },
      },
    }),
    []
  );

  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: UI.CARD_PAD,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Profile Analytics
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Track engagement on your profile and content. (Charts are mock data for now.)
      </p>
    </section>
  );

  return (
    <>
      <Head><title>Profile Analytics | ForgeTomorrow</title></Head>

      {/* Coach chrome when ?chrome=coach, Seeker chrome otherwise */}
      <Layout
        title="Profile Analytics | ForgeTomorrow"
        header={HeaderBox}
        right={null}
        activeNav="profile"        // highlights Profile in both sidebars
        sidebarInitialOpen={{ coaching: false, seeker: false }}
      >
        <div style={{ maxWidth: 860, display: 'grid', gap: UI.SECTION_GAP }}>
          {/* KPI Strip */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              <KPI label="Profile Views" value={analytics.totalViews.toLocaleString()} />
              <KPI label="Posts" value={analytics.postsCount} />
              <KPI label="Comments" value={analytics.commentsCount} />
            </div>
          </section>

          {/* Chart */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 12 }}>Views (Last 7 Days)</h2>
            <Bar data={chartData} options={chartOptions} />
          </section>

          {/* Last profile viewer */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
              display: 'grid',
              gap: 6,
            }}
          >
            <h2 style={{ color: '#FF7043', margin: 0 }}>Last Profile Viewer</h2>
            <div style={{ color: '#263238', fontWeight: 700 }}>{analytics.lastProfileViewer.name}</div>
            <a
              href={analytics.lastProfileViewer.profileUrl + (isCoachChrome ? '?chrome=coach' : '')}
              style={{ color: '#FF7043', fontWeight: 700, textDecoration: 'none' }}
            >
              See all profile views →
            </a>
          </section>

          {/* Top content */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
              display: 'grid',
              gap: 12,
            }}
          >
            <h2 style={{ color: '#FF7043', margin: 0 }}>Top Content</h2>

            <div style={{ display: 'grid', gap: 6 }}>
              <strong style={{ color: '#263238' }}>Highest Viewed Post</strong>
              <a
                href={analytics.highestViewedPost.url + (isCoachChrome ? '?chrome=coach' : '')}
                style={{ color: '#FF7043', fontWeight: 700, textDecoration: 'none' }}
              >
                {analytics.highestViewedPost.title}
              </a>
              <small style={{ color: '#607D8B' }}>
                {analytics.highestViewedPost.views.toLocaleString()} views
              </small>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <strong style={{ color: '#263238' }}>Highest Liked Comment</strong>
              <p style={{ color: '#455A64', margin: 0, fontStyle: 'italic' }}>
                “{analytics.highestViewedComment.snippet}”
              </p>
              <a
                href={analytics.highestViewedComment.url + (isCoachChrome ? '?chrome=coach' : '')}
                style={{ color: '#FF7043', fontWeight: 700, textDecoration: 'none' }}
              >
                View comment
              </a>
              <small style={{ color: '#607D8B' }}>
                {analytics.highestViewedComment.likes.toLocaleString()} likes
              </small>
            </div>
          </section>

          {/* Back to Profile */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: UI.CARD_PAD,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ color: '#607D8B' }}>
              Review and refine your profile sections to improve engagement.
            </div>
            <a
              href={'/profile' + (isCoachChrome ? '?chrome=coach' : '')}
              style={{
                background: '#FF7043',
                color: 'white',
                borderRadius: 10,
                padding: '8px 12px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Back to Profile
            </a>
          </section>
        </div>
      </Layout>
    </>
  );
}

/* ---- Tiny UI helpers ---- */
function KPI({ label, value }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 12,
        minHeight: 70,
        display: 'grid',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, color: '#607D8B', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#263238' }}>{value}</div>
    </div>
  );
}
