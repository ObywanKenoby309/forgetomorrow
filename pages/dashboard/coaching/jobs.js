// pages/dashboard/coaching/jobs.js
import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

import CoachingHeader from '@/components/coaching/CoachingHeader';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';

export default function CoachingJobsPage() {
  // (Optional) If coaches “view” jobs for clients, track here later
  useEffect(() => {}, []);

  const jobs = [
    { id: 1, title: 'Frontend Developer', company: 'ForgeTomorrow', description: 'Build cutting-edge UIs for modern professionals.', location: 'Remote' },
    { id: 2, title: 'Mentor Coordinator', company: 'ForgeTomorrow', description: 'Help manage and scale mentorship experiences.', location: 'Hybrid (Remote/Nashville)' },
  ];

  return (
    <>
      <Head><title>The Pipeline — Coaching | ForgeTomorrow</title></Head>
      <CoachingHeader />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px minmax(860px, 1fr) 280px',
          gridTemplateRows: 'auto 1fr',
          gridTemplateAreas: `
            "left header right"
            "left content right"
          `,
          gap: 20,
          padding: '30px 20px 20px',
          minHeight: '100vh',
          backgroundColor: '#ECEFF1',
        }}
      >
        {/* LEFT */}
        <aside style={{ gridArea: 'left', alignSelf: 'start' }}>
          <CoachingSidebar active="resources" />
        </aside>

        {/* HEADER */}
        <section
          style={{
            gridArea: 'header',
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>The Pipeline</h1>
          <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
            Browse openings your clients might be interested in. Share links directly.
          </p>
        </section>

        {/* RIGHT (simple tips for now) */}
        <aside
          style={{
            gridArea: 'right',
            alignSelf: 'start',
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            minHeight: 120,
            color: 'white',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Shortcuts</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Link href="/dashboard/coaching/clients" style={{ color: 'white', textDecoration: 'underline' }}>Clients</Link>
            <Link href="/dashboard/coaching/sessions" style={{ color: 'white', textDecoration: 'underline' }}>Sessions</Link>
            <Link href="/dashboard/coaching/resources" style={{ color: 'white', textDecoration: 'underline' }}>Resources</Link>
          </div>
        </aside>

        {/* CONTENT */}
        <main style={{ gridArea: 'content' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {jobs.map((job) => (
              <section
                key={job.id}
                style={{
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'grid', gap: 2 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#263238' }}>{job.title}</div>
                  <div style={{ fontSize: 13, color: '#607D8B' }}>
                    {job.company} — {job.location}
                  </div>
                </div>

                <p style={{ marginTop: 10, marginBottom: 0, color: '#455A64' }}>{job.description}</p>

                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={`/job/${job.id}`} className="px-3 py-2 rounded-md border" style={{ color: '#263238', background: 'white' }}>
                    View details
                  </Link>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
