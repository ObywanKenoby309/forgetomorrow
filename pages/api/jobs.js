// pages/api/jobs.js — Supabase/Postgres jobs only, no TypeScript syntax

import { Pool } from 'pg';

// Use your main DATABASE_URL (Supabase)
const connectionString = process.env.DATABASE_URL || null;

// Lazily-initialized connection pool (Postgres)
let pool = null;

function getPool() {
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  return pool;
}

// Fallback jobs — keeps the site up even if DB is not ready
const fallbackJobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    company: 'ForgeTomorrow',
    description: 'Build cutting-edge UIs for modern professionals.',
    location: 'Remote',
    url: null,
    salary: null,
    tags: null,
    source: 'Fallback',
    origin: 'fallback',
    publishedat: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Mentor Coordinator',
    company: 'ForgeTomorrow',
    description: 'Help manage and scale mentorship experiences.',
    location: 'Hybrid (Remote/Nashville)',
    url: null,
    salary: null,
    tags: null,
    source: 'Fallback',
    origin: 'fallback',
    publishedat: new Date().toISOString(),
  },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dbPool = getPool();

  if (!dbPool) {
    console.warn('[jobs] DATABASE_URL not set; serving fallback jobs');
    return res.status(200).json({ jobs: fallbackJobs });
  }

  let jobs = [];

  try {
    const client = await dbPool.connect();
    try {
      // Read from your Supabase "jobs" table
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
          publishedAt
        FROM jobs
        ORDER BY
          publishedAt DESC NULLS LAST,
          id DESC
        LIMIT 200;
        `
      );

      const rows = result.rows || [];

      jobs = rows.map((row) => ({
        id: row.id,
        title: row.title,
        company: row.company,
        location: row.location,
        description: row.description,
        url: row.url,
        salary: row.salary,
        tags: row.tags,
        source: row.source || 'External',
        origin: 'external',
        // Normalize to something Date(...) can handle on the frontend
        publishedat: row.publishedat || row.publishedat || row.publishedat,
      }));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[jobs] Postgres jobs error:', error);
  }

  if (!jobs.length) {
    console.warn('[jobs] No jobs found; using fallback');
    return res.status(200).json({ jobs: fallbackJobs });
  }

  return res.status(200).json({ jobs });
}
