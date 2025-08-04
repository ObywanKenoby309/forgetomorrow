import React from 'react';
import Link from 'next/link';
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

const mockData = {
  totalViews: 1234,
  postsCount: 42,
  commentsCount: 58,
  viewsLast7Days: [50, 75, 60, 80, 100, 90, 110],
  daysLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  highestViewedPost: {
    title: 'How to Optimize Your Resume for ATS Systems',
    views: 1200,
    url: '/user/posts/123',
  },
  highestViewedComment: {
    snippet: 'Great tips! I found this very helpful, thanks!',
    likes: 350,
    url: '/user/comments/456',
  },
  lastProfileViewer: {
    name: 'Jane Doe',
    profileUrl: '/profile/views',
  },
};

export default function ProfileMetrics({
  showTopContent = false,
  showLastProfileViewer = false,
}) {
  const data = {
    labels: mockData.daysLabels,
    datasets: [
      {
        label: 'Profile Views',
        data: mockData.viewsLast7Days,
        backgroundColor: 'rgba(255, 112, 67, 0.7)', // brand orange
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 20 },
      },
    },
  };

  return (
    <section className="border border-gray-300 rounded-lg p-5 bg-white">
      <h2 className="mb-5 text-[#FF7043] text-2xl font-semibold">Profile Metrics</h2>

      <div className="flex justify-around mb-8 text-center">
        <div>
          <h3 className="text-3xl font-bold">{mockData.totalViews}</h3>
          <p>Profile Views</p>
        </div>
        <div>
          <h3 className="text-3xl font-bold">{mockData.postsCount}</h3>
          <p>Posts Made</p>
        </div>
        <div>
          <h3 className="text-3xl font-bold">{mockData.commentsCount}</h3>
          <p>Comments Made</p>
        </div>
      </div>

      {/* Profile Views Chart */}
      <Bar data={data} options={options} />

      {/* Last Profile Viewer */}
      {showLastProfileViewer && (
        <div className="mt-5 border-t border-gray-200 pt-4 text-center">
          <strong>Last Profile Viewer:</strong>
          <div className="mt-2 font-bold text-[#FF7043] text-lg">
            {mockData.lastProfileViewer.name}
          </div>
          <Link
            href={mockData.lastProfileViewer.profileUrl}
            className="text-[#FF7043] font-bold block mt-1 underline"
          >
            See all profile views
          </Link>
        </div>
      )}

      {/* Top Content: Highest Viewed Post & Comment */}
      {showTopContent && (
        <section className="mt-8 border-t border-gray-200 pt-5">
          <h3 className="text-[#FF7043] mb-3 text-xl font-semibold">Top Content</h3>

          {/* Highest Viewed Post */}
          <div className="mb-6">
            <strong>Highest Viewed Post:</strong>
            <p className="my-1">
              <Link
                href={mockData.highestViewedPost.url}
                className="text-[#FF7043] underline font-bold"
              >
                {mockData.highestViewedPost.title}
              </Link>
            </p>
            <small>Views: {mockData.highestViewedPost.views.toLocaleString()}</small>
            <br />
            <Link
              href="/user/posts"
              className="text-[#FF7043] font-bold mt-1 inline-block underline"
            >
              View all posts
            </Link>
          </div>

          {/* Highest Viewed Comment */}
          <div>
            <strong>Highest Viewed Comment:</strong>
            <p className="my-1 italic">"{mockData.highestViewedComment.snippet}"</p>
            <small>Likes: {mockData.highestViewedComment.likes.toLocaleString()}</small>
            <br />
            <Link
              href="/user/comments"
              className="text-[#FF7043] font-bold mt-1 inline-block underline"
            >
              View all comments
            </Link>
          </div>
        </section>
      )}
    </section>
  );
}
