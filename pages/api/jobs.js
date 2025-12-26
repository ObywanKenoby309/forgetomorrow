// pages/api/jobs.js — combine external Supabase jobs + internal recruiter jobs (Prisma)
// with SSL override for Supabase
import { Pool } from 'pg';
import { prisma } from '@/lib/prisma';

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

function toPublishedIso(v) {
  try {
    return v ? new Date(v).toISOString() : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function mapInternalJob(job) {
  const published = job.publishedat || job.createdAt || null;
  const publishedIso = toPublishedIso(published);

  const companyName = (job.company || '').trim();
  const isFtOfficial = companyName.toLowerCase() === 'forgetomorrow';

  const tier = isFtOfficial ? 'ft-official' : 'partner';
  const logoUrl = isFtOfficial ? '/images/logo-color.png' : null;

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    url: null,
    salary: job.compensation || null,
    tags: null,

    source: 'Forge recruiter',
    origin: 'internal',
    status: job.status || 'Open',
    publishedat: publishedIso,
    updatedAt: job.updatedAt || null,

    tier,
    logoUrl,
  };
}

function mapExternalRow(row) {
  const created = row.createdAt || row.createdat || row.created_at || null;
  const publishedIso = toPublishedIso(created);

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
    status: 'Open',
    publishedat: publishedIso,

    tier: 'external',
    logoUrl: null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dbPool = getPool();

  // ──────────────────────────────────────────────────────────────
  // ✅ NEW: single-job fetch for resume builder: /api/jobs?jobId=...
  // ──────────────────────────────────────────────────────────────
  const jobIdParam = req.query?.jobId;
  const jobId = Array.isArray(jobIdParam) ? jobIdParam[0] : jobIdParam;

  if (jobId && String(jobId).trim()) {
    const id = String(jobId).trim();

    // 1) Try internal (Prisma)
    try {
      const internal = await prisma.job.findUnique({ where: { id } });
      if (internal && String(internal.status || '').toLowerCase() !== 'draft') {
        return res.status(200).json({ job: mapInternalJob(internal) });
      }
    } catch (e) {
      // ignore and fall through to external
      console.error('[jobs] findUnique internal job error:', e);
    }

    // 2) Try external (Supabase jobs table)
    if (dbPool) {
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
            WHERE id::text = $1
            LIMIT 1;
            `,
            [id]
          );

          const row = result.rows?.[0];
          if (row) {
            return res.status(200).json({ job: mapExternalRow(row) });
          }
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('[jobs] Postgres external job lookup error:', error);
      }
    }

    return res.status(404).json({ error: 'Job not found' });
  }

  // ──────────────────────────────────────────────────────────────
  // Existing list behavior: GET /api/jobs (merged feed)
  // ──────────────────────────────────────────────────────────────
  let externalJobs = [];
  let internalJobs = [];

  // 1) External jobs from Supabase
  if (!dbPool) {
    console.warn('[jobs] DATABASE_URL not set; skipping external jobs');
  } else {
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

        externalJobs = (result.rows || []).map(mapExternalRow);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[jobs] Postgres external jobs error:', error);
    }
  }

  // 2) Internal recruiter jobs from Prisma
  try {
    const prismaJobs = await prisma.job.findMany({
      // hide Drafts from the public feed
      where: {
        status: {
          not: 'Draft',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    internalJobs = prismaJobs.map(mapInternalJob);
  } catch (error) {
    console.error('[jobs] Prisma internal jobs error:', error);
  }

  // 3) Merge and sort by published date (newest first)
  const allJobs = [...internalJobs, ...externalJobs].sort((a, b) => {
    const da = a.publishedat ? new Date(a.publishedat).getTime() : 0;
    const db = b.publishedat ? new Date(b.publishedat).getTime() : 0;
    return db - da;
  });

  return res.status(200).json({
    jobs: allJobs,
    debugTotal: allJobs.length,
    debugExternalCount: externalJobs.length,
    debugInternalCount: internalJobs.length,
  });
}
