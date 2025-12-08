// pages/seeker/pinned-jobs.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import { getClientSession } from '@/lib/auth-client';

export default function PinnedJobsPage() {
  const router = useRouter();
  const [pinned, setPinned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = await getClientSession();
      if (!session?.user?.id) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/seeker/pinned-jobs');
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const jobs = Array.isArray(data.jobs) ? data.jobs : [];
          setPinned(jobs);
        } else {
          setPinned([]);
        }
      } catch (err) {
        console.error('Pinned jobs load error:', err);
        setPinned([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const Header = (
    <section className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-orange-600">Your Pinned Jobs</h1>
      <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
        These are the roles you’ve flagged as worth fighting for. Keep them here and come back anytime.
      </p>
    </section>
  );

  const RightRail = <SeekerRightColumn variant="pinned" />;

  const Footer = (
    <div className="mt-16 text-center text-sm text-gray-500">
      © 2025 ForgeTomorrow • Built for humans who refuse to give up
    </div>
  );

  if (loading) {
    return (
      <SeekerLayout header={Header} right={RightRail} footer={Footer}>
        <div className="text-center py-20">Loading your pinned jobs...</div>
      </SeekerLayout>
    );
  }

  return (
    <SeekerLayout
      title="Pinned Jobs"
      header={Header}
      right={RightRail}
      footer={Footer}
      activeNav="pinned"
    >
      <div className="w-full max-w-none px-4 md:px-6 lg:px-8">
        <div className="grid gap-7">
          {pinned.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 rounded-2xl">
              <div className="text-6xl mb-6">📌</div>
              <h3 className="text-2xl font-bold text-gray-800">No pinned jobs yet</h3>
              <p className="text-gray-600 mt-4 max-w-md mx-auto">
                When you see a role that feels right, hit the pin. It will appear here.
              </p>
            </div>
          ) : (
            pinned.map((job) => (
              <div
                key={job.pinnedId || job.id}
                className="bg-white border border-gray-200 rounded-xl p-7 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {job.title || 'Untitled role'}
                    </h3>
                    <p className="text-lg text-gray-600 mt-1">
                      {job.company || 'Unknown company'}
                      {job.location ? ` • ${job.location}` : ''}
                    </p>
                    {job.pinnedAt && (
                      <p className="text-sm text-gray-500 mt-3">
                        Pinned on {new Date(job.pinnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => alert('Unpin coming soon')}
                    className="text-gray-400 hover:text-red-600 transition"
                    title="Unpin"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {job.id && (
                    <Link href={`/jobs/apply/${job.id}`} className="flex-1">
                      <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-8 rounded-lg transition text-base">
                        Apply Now
                      </button>
                    </Link>
                  )}

                  {job.company && (
                    <a
                      href={`https://google.com/search?q=${encodeURIComponent(
                        `${job.company} careers`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <button className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3.5 px-8 rounded-lg transition text-base flex items-center justify-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Company Site
                      </button>
                    </a>
                  )}
                </div>

                <div className="mt-5 text-center text-sm text-gray-500">
                  Want a custom AI cover letter? →{' '}
                  <Link
                    href="/resume-cover"
                    className="text-orange-600 font-medium hover:underline"
                  >
                    Open the Creator Tool
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SeekerLayout>
  );
}
