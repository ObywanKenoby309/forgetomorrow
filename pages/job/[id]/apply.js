// pages/job/[id]/apply.js
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function JobApplyPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>Apply {id ? `• Job ${id}` : ''} — ForgeTomorrow</title>
      </Head>

      <main style={{ padding: 24 }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ marginBottom: 16 }}>
            <Link href={id ? `/job/${id}` : '/jobs'} style={{ color: '#FF7043' }}>
              ← Back to job
            </Link>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Application
          </h1>

          <p style={{ color: '#607D8B' }}>
            This is a placeholder so the build succeeds. We’ll wire the premium multi-step application flow next.
          </p>

          <div style={{ marginTop: 18, padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Job ID</div>
            <div>{id || 'Loading…'}</div>
          </div>
        </div>
      </main>
    </>
  );
}
