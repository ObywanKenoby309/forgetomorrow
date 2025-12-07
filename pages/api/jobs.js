// pages/api/jobs.js — Supabase/Postgres jobs only, with debug count

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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dbPool = getPool();

  if (!dbPool) {
    console.warn('[jobs] DATABASE_URL not set; returning empty list');
    return res.status(200).json({ jobs: [], debugTotal: 0, debugNote: 'No DATABASE_URL' });
  }

  let jobs = [];
  let debugTotal = 0;

  try {
    const client = await dbPool.connect();
    try {
      // Minimal, safe query: only select columns we KNOW exist
      const result = await client.query(
        `
        SELECT
          id,
          title,
          company,
          location,
          description
        FROM jobs
        ORDER BY
          id DESC
        LIMIT 200;
        `
      );

      const rows = result.rows || [];
      debugTotal = rows.length;

      jobs = rows.map((row) => {
        // Try to infer a "published" date if any timestamp columns exist,
        // but don't trust or require it to be there
        const created =
          row.createdAt ||
          row.createdat ||
          row.created_at ||
          null;

        const publishedIso = created
          ? new Date(created).toISOString()
          : new Date().toISOString();

        return {
          id: row.id,
          title: row.title,
          company: row.company,
          location: row.location,
          description: row.description,
          url: null,
          salary: null,
          tags: null,
          source: 'External',
          origin: 'external',
          publishedat: publishedIso,
        };
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[jobs] Postgres jobs error:', error);
    return res.status(200).json({
      jobs: [],
      debugTotal: 0,
      debugError: error.message ?? 'unknown error',
    });
  }

  return res.status(200).json({ jobs, debugTotal });
}
