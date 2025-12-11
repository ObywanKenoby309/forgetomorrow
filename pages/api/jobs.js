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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dbPool = getPool();

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

        externalJobs = (result.rows || []).map((row) => {
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
            // external feed jobs
            source: 'External',
            origin: 'external',
            status: 'Open', // external feed jobs are treated as open
            publishedat: publishedIso,
          };
        });
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

    internalJobs = prismaJobs.map((job) => {
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
        company: job.company,
        location: job.location,
        description: job.description,
        url: null,
        salary: job.compensation || null,
        tags: null,
        // 🔸 mark these as internal recruiter postings
        source: 'Forge recruiter',
        origin: 'internal',
        status: job.status || 'Open',
        publishedat: publishedIso,
        updatedAt: job.updatedAt || null,
      };
    });
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
