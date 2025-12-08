// pages/api/jobs.js — Supabase/Postgres jobs only, with SSL override
import { Pool } from 'pg';

// Force Node to stop rejecting the Supabase cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Use your main DATABASE_URL (Supabase)
const connectionString = process.env.DATABASE_URL || '';

// Lazily-initialized connection pool (Postgres)
let pool = null;

function getPool() {
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        // Use SSL but ignore self-signed cert issue
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
    return res.status(200).json({
      jobs: [],
      debugTotal: 0,
      debugNote: 'No DATABASE_URL in environment',
    });
  }

  let jobs = [];
  let debugTotal = 0;

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
          "createdAt"
        FROM jobs
        ORDER BY
          "createdAt" DESC NULLS LAST,
          id DESC
        LIMIT 200;
        `
      );

      const rows = result.rows || [];
      debugTotal = rows.length;

      jobs = rows.map((row) => {
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
