// pages/job/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { track } from '@/lib/track';

export default function PublicJobView() {
  const router = useRouter();
  const { id: jobId } = router.query;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fire a JOB_VIEW when the page knows the jobId
  useEffect(() => {
    if (!jobId) return;
    track('JOB_VIEW', { jobId });
  }, [jobId]);

  // (Optional) try to load job details if you have an API like /api/jobs/[id]
  useEffect(() => {
    let active = true;
    async function run() {
      if (!jobId) return;
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) throw new Error('not ok');
        const json = await res.json();
        if (active) setJob(json);
      } catch {
        // Swallow errors quietly; page still renders with the ID
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => { active = false; };
  }, [jobId]);

  return (
    <>
      <Head><title>{job?.title ? `${job.title} — Job` : 'Job'}</title></Head>

      <main className="max-w-3xl mx-auto p-6 space-y-4">
        <Link href="/jobs" className="text-sm" style={{ color: '#FF7043' }}>
          ← Back to jobs
        </Link>

        <h1 className="text-2xl font-bold" style={{ color: '#263238' }}>
          {job?.title || (loading ? 'Loading…' : `Job ${jobId}`)}
        </h1>

        {job?.company && (
          <div className="text-sm" style={{ color: '#607D8B' }}>
            {job.company}
          </div>
        )}

        <section className="bg-white border rounded-lg p-4">
          {job?.description
            ? <div dangerouslySetInnerHTML={{ __html: job.description }} />
            : <p style={{ color: '#607D8B' }}>
                {loading ? 'Loading details…' : 'No job details available.'}
              </p>}
        </section>
      </main>
    </>
  );
}
