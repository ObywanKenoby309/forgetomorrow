// pages/api/jobs.js — Supabase/Postgres jobs + internal recruiter jobs (Prisma), with SSL override
import { Pool } from 'pg';
import { prisma } from '@/lib/prisma';

// Force Node to stop rejecting the Supabase cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Use your main DATABASE_URL (Supabase for external jobs)
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

// Shape external / cron-fed jobs
function shapeExternalJob(row) {
  const created =
    row.createdAt ||
    row.createdat ||
    row.created_at ||
    null;

  const publishedIso = created
    ? new Date(created).toISOString()
    : new Date().toISOString();

  const title = row.title || '';
  const company = row.company || '';

  return {
    id: row.id,
    title,
    company: company || null,
    location: row.location || null,
    description: row.description || '',
    url: null,
    salary: null,
    tags: null,
    source: 'External',
    origin: 'external',
    status: 'Open', // external feed treated as open for now
    publishedat: publishedIso,
  };
}

// Shape internal recruiter-created jobs (Prisma Job model)
function shapeInternalJob(job) {
  const published =
    job.publishedat ||
    job.createdAt ||
    null;

  const publishedIso = published
    ? new Date(published).toISOString()
    : new Date().toISOString();

  return {
    id: job.id,
    title: job.title,
    company: job.company || null,
    location: job.location || null,
    description: job.description || '',
    url: null,
    salary: job.compensation || null,
    tags: null,
    source: job.source || 'Forge recruiter',
    origin: job.origin || 'internal',
    status: job.status || 'Open',
    publishedat: publishedIso,
  };
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

  let externalJobs = [];
  let internalJobs = [];

  // ─────────────────────────────────────────
  // 1) External jobs from Supabase/Postgres
  // ─────────────────────────────────────────
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
      externalJobs = rows.map(shapeExternalJob);

      // TEMP: filter out earlier test rows so they don't appear as external
      externalJobs = externalJobs.filter((job) => {
        const title = (job.title || '').toLowerCase();
        const company = (job.company || '').toLowerCase();

        // adjust these if you know the exact test names
        if (title.includes('test role')) return false;
        if (company === 'test') return false;

        return true;
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[jobs] Postgres jobs error:', error);
    // If external feed fails, still allow internal recruiter jobs below
    externalJobs = [];
  }

  // ─────────────────────────────────────────
  // 2) Internal recruiter-created jobs (Prisma)
  // ─────────────────────────────────────────
  try {
    const prismaJobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    internalJobs = prismaJobs.map(shapeInternalJob);
  } catch (err) {
    console.error('[jobs] Prisma recruiter jobs error:', err);
    internalJobs = [];
  }

  const jobs = [...externalJobs, ...internalJobs];
  const debugTotal = jobs.length;

  return res.status(200).json({ jobs, debugTotal });
}
