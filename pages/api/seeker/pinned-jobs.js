// pages/seeker/pinned-jobs.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

export default function PinnedJobsPage() {
  const router = useRouter();
  const [pinned, setPinned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/seeker/pinned-jobs');

        if (res.status === 401 || res.status === 403) {
          router.push(
            `/auth/signin?from=${encodeURIComponent('/seeker/pinned-jobs')}`
          );
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setPinned(Array.isArray(data.jobs) ? data.jobs : []);
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

  async function unpinJob(job) {
    try {
      const res = await fetch('/api/seeker/pinned-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (!res.ok) {
        console.error('Failed to unpin job');
        return;
      }

      // DB is updated — now update UI
      setPinned((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err) {
      console.error('Unpin error:', err);
    }
  }

  const Header = (
    <section className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-orange-600">Your Pinned Jobs</h1>
      <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
        These are the roles you’ve flagged as worth fighting for.
      </p>
    </section>
  );

  const RightRail = <SeekerRightColumn variant="pinned" />;

  if (loading) {
    return (
      <SeekerLayout header={Header} right={RightRail}>
        <div className="text-center py-20">Loading your pinned jobs...</div>
      </SeekerLayout>
    );
  }

  return (
    <SeekerLayout title="Pinned Jobs" header={Header} right={RightRail} activeNav="pinned">
      <div className="grid gap-7 px-6">
        {pinned.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-2xl">
            <h3 className="text-2xl font-bold text-gray-800">No pinned jobs yet</h3>
          </div>
        ) : (
          pinned.map((job) => (
            <div
              key={job.id}
              className="bg-white border rounded-xl p-7 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{job.title}</h3>
                  <p className="text-gray-600">{job.company}</p>
                </div>

                <button
                  onClick={() => unpinJob(job)}
                  className="text-gray-400 hover:text-red-600"
                  title="Unpin"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </SeekerLayout>
  );
}
