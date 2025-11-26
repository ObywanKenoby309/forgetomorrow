// pages/api/seeker/pinned-jobs.js
import { Pool } from 'pg';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // adjust if your auth file lives elsewhere

// Use the same DB as /api/jobs
const connectionString =
  process.env.FORGE_JOBS_DATABASE_URL ||
  process.env.DATABASE_URL ||
  null;

if (!connectionString) {
  console.warn(
    '[PinnedJobs] No FORGE_JOBS_DATABASE_URL or DATABASE_URL set – API will not work until configured.'
  );
}

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : null;

let tablePrepared = false;

async function ensurePinnedTable() {
  if (!pool) {
    throw new Error('No DB connection (pool is null)');
  }

  if (tablePrepared) return;

  // Extremely simple, Postgres-safe schema for pinned jobs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pinned_jobs (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      job_id INTEGER NOT NULL,
      pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, job_id)
    );
  `);

  tablePrepared = true;
}

export default async function handler(req, res) {
  if (!pool) {
    console.error('[PinnedJobs] Missing DB connection string');
    return res
      .status(500)
      .json({ error: 'Pinned jobs database is not configured on the server.' });
  }

  // Auth – use NextAuth session
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Fallback to email if session.user.id is not present
  const userId = session.user.id || session.user.email;

  try {
    await ensurePinnedTable();
  } catch (err) {
    console.error('[PinnedJobs] failed to ensure pinned_jobs table:', err);
    return res.status(500).json({
      error: 'Failed to prepare pinned jobs table',
      detail: err.message || String(err),
    });
  }

  // ─────────────────────────────────────────────────────
  // GET  → list pinned jobs for the current user
  // ─────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const limitRaw = req.query.limit;
    let limit = Number(limitRaw || 25);
    if (!Number.isFinite(limit) || limit <= 0) limit = 25;
    if (limit > 50) limit = 50;

    try {
      const { rows } = await pool.query(
        `
        SELECT
          j.id,
          j.title,
          j.company,
          j.location,
          j.description,
          j.url,
          j.source,
          j.publishedat,
          p.pinned_at
        FROM pinned_jobs p
        JOIN jobs j ON j.id = p.job_id
        WHERE p.user_id = $1
        ORDER BY p.pinned_at DESC
        LIMIT $2;
      `,
        [userId, limit]
      );

      const jobs = rows.map((row) => ({
        id: row.id,
        title: row.title,
        company: row.company,
        location: row.location,
        description: row.description,
        url: row.url,
        source: row.source,
        publishedat: row.publishedat,
        pinnedAt: row.pinned_at,
      }));

      return res.status(200).json({ jobs });
    } catch (err) {
      console.error('[PinnedJobs] GET error:', err);
      return res.status(500).json({
        error: 'Could not load pinned jobs',
        detail: err.message || String(err),
      });
    }
  }

  // ─────────────────────────────────────────────────────
  // POST → pin / re-pin a job
  // body: { jobId: number }
  // ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { jobId } = req.body || {};
    const idNum = Number(jobId);

    if (!idNum || !Number.isFinite(idNum)) {
      return res.status(400).json({ error: 'jobId is required (number)' });
    }

    try {
      const { rows } = await pool.query(
        `
        INSERT INTO pinned_jobs (user_id, job_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, job_id)
        DO UPDATE SET pinned_at = NOW()
        RETURNING id, user_id, job_id, pinned_at;
      `,
        [userId, idNum]
      );

      return res.status(200).json({
        ok: true,
        pin: rows[0],
      });
    } catch (err) {
      console.error('[PinnedJobs] POST error:', err);
      return res.status(500).json({
        error: 'Could not pin this job',
        detail: err.message || String(err),
      });
    }
  }

  // ─────────────────────────────────────────────────────
  // DELETE → unpin a job
  // query or body: { jobId: number }
  // ─────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const jobIdRaw = req.query.jobId ?? req.body?.jobId;
    const idNum = Number(jobIdRaw);

    if (!idNum || !Number.isFinite(idNum)) {
      return res.status(400).json({ error: 'jobId is required (number)' });
    }

    try {
      await pool.query(
        `
        DELETE FROM pinned_jobs
        WHERE user_id = $1 AND job_id = $2;
      `,
        [userId, idNum]
      );

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[PinnedJobs] DELETE error:', err);
      return res.status(500).json({
        error: 'Could not unpin this job',
        detail: err.message || String(err),
      });
    }
  }

  // ─────────────────────────────────────────────────────
  // Fallback for unsupported methods
  // ─────────────────────────────────────────────────────
  res.setHeader('Allow', 'GET,POST,DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
