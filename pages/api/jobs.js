// pages/api/jobs.js — return real jobs from Supabase (cron-fed) only

import { Pool } from 'pg';

// Use your main DATABASE_URL (Supabase)
const connectionString = process.env.DATABASE_URL || null;

// Lazily-initialized connection pool
let pool: Pool | null = null;

function getPool() {
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Supabase/managed PG usually needs SSL
      },
    });
  }
  return pool;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dbPool = getPool();

  if (!dbPool) {
    console.error('[jobs] No DATABASE_URL configured');
    return res.status(500).json({ error: 'Jobs database not configured' });
  }

  try {
    const client = await dbPool.connect();

    try {
      // Read the real cron-fed jobs from the `jobs` table.
      // Columns should match what n8n writes:
      // id, title, company, location, url, description, salary, tags,
      // publishedAt, source, createdAt, updatedAt
      const result = await client.query(
        `
        SELECT
          id,
          title,
          company,
          location,
          url,
          description,
          salary,
          tags,
          source,
          publishedat,
          createdat,
          updatedat
        FROM jobs
        ORDER BY
          publishedat DESC NULLS LAST,
          createdat DESC NULLS LAST,
          id DESC
        LIMIT 200;
        `
      );

      const rows = result.rows || [];

      // Normalize into the shape the jobs page expects
      const jobs = rows.map((row) => ({
        id: row.id,
        title: row.title,
        company: row.company,
        location: row.location,
        description: row.description,
        url: row.url,
        salary: row.salary,
        tags: row.tags,
        source: row.source || 'External',
        origin: 'external', // used by the filter on /jobs
        publishedat: row.publishedat,
        createdAt: row.createdat,
        updatedAt: row.updatedat,
      }));

      return res.status(200).json({ jobs });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[jobs] Error loading jobs from Postgres:', error);
    return res.status(500).json({ error: 'Failed to load jobs' });
  }
}
