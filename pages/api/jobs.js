// pages/api/jobs.js — blend external (Railway) + internal (Prisma) jobs
// and include per-user isPinned using a pinned_jobs table in Postgres

import { Pool } from 'pg';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

// Use a separate env var so we don't collide with auth DBs, etc.
const connectionString =
  process.env.FORGE_JOBS_DATABASE_URL ||
  process.env.DATABASE_URL ||
  null;

// Lazily-initialized connection pool (Railway Postgres)
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

// Lazily-initialized Prisma client (SQLite dev.db)
let prisma = null;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Fallback jobs — keeps the site up even if DBs are not ready
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
  const prismaClient = getPrisma();

  let externalJobs = [];
  let internalJobs = [];
  let pinnedSet = new Set();

  // ───────────────────────────────────────────────────────────
  // 1) External jobs from Railway Postgres
  // ───────────────────────────────────────────────────────────
  if (!dbPool) {
    console.warn('[jobs] FORGE_JOBS_DATABASE_URL not set; skipping external jobs');
  } else {
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

        // Look up which of these jobs are pinned by this user (if logged in)
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

        externalJobs = rows.map((row) => ({
          id: row.id,
          title: row.title,
          company: row.company,
          location: row.location,
          description: row.description,
          url: row.url,
          salary: row.salary,
          tags: row.tags,
          // Human-readable source; keep DB source for transparency
          source: row.source || 'External',
          origin: 'external',
          publishedat: row.publishedat,
          isPinned: userEmail ? pinnedSet.has(row.id) : false,
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[jobs] External jobs (Postgres) error:', error);
      // We don't return yet — we still want to serve internal jobs if available
    }
  }

  // ───────────────────────────────────────────────────────────
  // 2) Internal recruiter jobs from Prisma Job table
  // ───────────────────────────────────────────────────────────
  try {
    const rawInternal = await prismaClient.job.findMany({
      where: {
        // Only show "Open" roles to seekers
        status: 'Open',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    internalJobs = rawInternal.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      url: null, // internal jobs live on Forge
      salary: job.compensation || null,
      tags: null,
      source: 'Forge Recruiter', // what seekers will see in the UI
      origin: 'internal',
      publishedat: job.createdAt, // serialized to ISO in JSON
      isPinned: userEmail ? pinnedSet.has(job.id) : false,
    }));
  } catch (error) {
    console.error('[jobs] Internal jobs (Prisma) error:', error);
  }

  // ───────────────────────────────────────────────────────────
  // 3) Combine sources or fall back
  // ───────────────────────────────────────────────────────────
  const combinedJobs = [...externalJobs, ...internalJobs];

  if (!combinedJobs.length) {
    console.warn('[jobs] No external or internal jobs found; using fallback');
    return res.status(200).json({
      jobs: fallbackJobs.map((job) => ({
        ...job,
        isPinned: false,
        origin: 'fallback',
        source: job.source || 'Fallback',
        publishedat: new Date().toISOString(),
      })),
    });
  }

  return res.status(200).json({ jobs: combinedJobs });
}
