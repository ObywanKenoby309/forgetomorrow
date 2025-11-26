// pages/api/jobs.js — UPDATED to use Railway Postgres (forge-jobs-cron)
// and include per-user isPinned using a pinned_jobs table

import { Pool } from 'pg';
import { getServerSession } from 'next-auth';
import authOptions from './auth/[...nextauth]';

// Use a separate env var so we don't collide with auth DBs, etc.
const connectionString =
  process.env.FORGE_JOBS_DATABASE_URL ||
  process.env.DATABASE_URL ||
  null;

// Lazily-initialized connection pool
let pool = null;

function getPool() {
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Railway uses self-signed certs
      },
    });
  }
  return pool;
}

// Your existing fallback jobs — keeps the site up even if DB is not ready
const fallbackJobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    company: 'ForgeTomorrow',
    description: 'Build cutting-edge UIs for modern professionals.',
    location: 'Remote',
  },
  {
    id: 2,
    title: 'Mentor Coordinator',
    company: 'ForgeTomorrow',
    description: 'Help manage and scale mentorship experiences.',
    location: 'Hybrid (Remote/Nashville)',
  },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try to resolve the current user (optional — jobs stay public)
  let userEmail = null;
  try {
    const session = await getServerSession(req, res, authOptions);
    userEmail = session?.user?.email || null;
  } catch (err) {
    console.warn('[jobs] unable to resolve session (continuing as guest)', err);
  }

  const dbPool = getPool();

  // If DB isn’t configured, quietly fall back
  if (!dbPool) {
    console.warn('FORGE_JOBS_DATABASE_URL not set; using fallback jobs');
    // No pinned info when using fallback
    return res.status(200).json({
      jobs: fallbackJobs.map((job) => ({ ...job, isPinned: false })),
    });
  }

  try {
    const client = await dbPool.connect();

    try {
      // Ensure pinned table exists for this Postgres DB
      await client.query(`
        CREATE TABLE IF NOT EXISTS pinned_jobs (
          id SERIAL PRIMARY KEY,
          user_email TEXT NOT NULL,
          job_id INTEGER NOT NULL,
          pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT pinned_jobs_unique_user_job UNIQUE (user_email, job_id)
        );
      `);

      // Load jobs from the cron-fed jobs table
      const result = await client.query(
        `
        SELECT
          id,
          title,
          company,
          location,
          description,
          url,
          salary,
          tags,
          source,
          publishedat
        FROM jobs
        ORDER BY
          publishedat DESC NULLS LAST,
          id DESC
        LIMIT 200;
        `
      );

      const rows = result.rows || [];

      if (rows.length === 0) {
        console.warn('Jobs table is empty; using fallback jobs');
        return res.status(200).json({
          jobs: fallbackJobs.map((job) => ({ ...job, isPinned: false })),
        });
      }

      // Look up which of these jobs are pinned by this user (if logged in)
      let pinnedSet = new Set();
      if (userEmail) {
        const pinnedRes = await client.query(
          `
          SELECT job_id
          FROM pinned_jobs
          WHERE user_email = $1
          `,
          [userEmail]
        );
        pinnedSet = new Set(pinnedRes.rows.map((r) => r.job_id));
      }

      // Shape final payload, tagging each job with isPinned
      const jobs = rows.map((row) => ({
        ...row,
        isPinned: userEmail ? pinnedSet.has(row.id) : false,
      }));

      return res.status(200).json({ jobs });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Jobs API error (Postgres):', error);
    // If anything goes wrong, keep the site working with fallback
    return res.status(200).json({
      jobs: fallbackJobs.map((job) => ({ ...job, isPinned: false })),
    });
  }
}
