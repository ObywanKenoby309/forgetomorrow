// pages/api/jobs.js — UPDATED to use Railway Postgres (forge-jobs-cron) with safe fallback

import { Pool } from 'pg';

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

  const dbPool = getPool();

  // If DB isn’t configured, quietly fall back
  if (!dbPool) {
    console.warn('FORGE_JOBS_DATABASE_URL not set; using fallback jobs');
    return res.status(200).json({ jobs: fallbackJobs });
  }

  try {
    const client = await dbPool.connect();

    try {
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
        return res.status(200).json({ jobs: fallbackJobs });
      }

      // Return real jobs from Railway Postgres
      return res.status(200).json({ jobs: rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Jobs API error (Postgres):', error);
    // If anything goes wrong, keep the site working with fallback
    return res.status(200).json({ jobs: fallbackJobs });
  }
}
