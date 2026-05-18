// pages/api/jobs.js
import { Pool } from 'pg';
import { prisma } from '@/lib/prisma';
import { rankJobsBySignalRelevance } from '@/lib/intelligence/forgeJobMatchEngine';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || '';
const CRON_USER_ID = 'cmiwa2op6000cbvz0f2s8eafb';

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

function toPublishedIso(v) {
  try {
    return v ? new Date(v).toISOString() : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function mapJob(row) {
  const published =
    row.publishedat ||
    row.publishedAt ||
    row.createdAt ||
    row.createdat ||
    row.created_at ||
    null;

  const publishedIso = toPublishedIso(published);
  const companyName = (row.company || '').trim();
  const isFtOfficial = companyName.toLowerCase() === 'forgetomorrow';

  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    description: row.description,
    url: row.url || null,
    salary: row.compensation || row.salary || null,
    tags: row.tags || null,

    source: row.source || null,
    userId: row.userId || row.userid || null,
    accountKey: row.accountKey || row.accountkey || null,
    externalId: row.externalId || row.externalid || null,

    origin: row.userId === CRON_USER_ID || row.userid === CRON_USER_ID ? 'external' : 'internal',
    status: row.status || 'Open',
    publishedat: publishedIso,
    updatedAt: row.updatedAt || row.updatedat || null,

    tier: isFtOfficial ? 'ft-official' : row.externalId || row.externalid ? null : 'partner',
    logoUrl: isFtOfficial ? '/images/logo-color.png' : null,
  };
}

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(Array.isArray(value) ? value[0] : value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dbPool = getPool();

  const jobIdParam = req.query?.jobId;
  const jobId = Array.isArray(jobIdParam) ? jobIdParam[0] : jobIdParam;

  if (jobId && String(jobId).trim()) {
    const id = String(jobId).trim();

    try {
      const numericId = Number(id);

      if (!Number.isNaN(numericId)) {
        const internal = await prisma.job.findUnique({
          where: { id: numericId },
        });

        if (internal && String(internal.status || '').toLowerCase() !== 'draft') {
          return res.status(200).json({ job: mapJob(internal) });
        }
      }
    } catch (e) {
      console.error('[jobs] findUnique job error:', e);
    }

    if (dbPool) {
      try {
        const client = await dbPool.connect();

        try {
          const result = await client.query(
            `
            SELECT
              id, title, company, location, description,
              url, salary, compensation, tags, source, status,
              "userId", "accountKey", "externalId",
              "publishedAt", "publishedat", "createdAt", "updatedAt"
            FROM jobs
            WHERE id::text = $1
            LIMIT 1;
            `,
            [id]
          );

          const row = result.rows?.[0];

          if (row) {
            return res.status(200).json({ job: mapJob(row) });
          }
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('[jobs] Postgres job lookup error:', error);
      }
    }

    return res.status(404).json({ error: 'Job not found' });
  }

  const page = parsePositiveInt(req.query.page, 1);
  const requestedPageSize = parsePositiveInt(req.query.pageSize, 20);
  const pageSize = Math.min(requestedPageSize, 100);
  const offset = (page - 1) * pageSize;
  const keyword = String(req.query.keyword || '').trim();
  const company = String(req.query.company || '').trim();
  const location = String(req.query.location || '').trim();
  const locationType = String(req.query.locationType || '').trim();
  const source = String(req.query.source || '').trim();
  const days = parsePositiveInt(req.query.days, 0);
  
  if (!dbPool) {
    return res.status(200).json({
      jobs: [],
      page,
      pageSize,
      totalCount: 0,
      totalPages: 1,
      debugTotal: 0,
      debugExternalCount: 0,
      debugInternalCount: 0,
    });
  }

  try {
    const client = await dbPool.connect();

    try {
      const countResult = await client.query(
  `
  SELECT COUNT(*)::int AS count
  FROM jobs
  WHERE LOWER(COALESCE(status, '')) NOT IN ('draft', 'expired')
  AND ($1 = '' OR LOWER(title) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1))
  AND ($2 = '' OR LOWER(company) LIKE LOWER($2))
  AND ($3 = '' OR LOWER(location) LIKE LOWER($3))
  AND (
    $4 = ''
    OR (
      $4 = 'Remote' AND LOWER(location) LIKE '%remote%'
    )
    OR (
      $4 = 'Hybrid' AND LOWER(location) LIKE '%hybrid%'
    )
    OR (
      $4 = 'On-site'
      AND LOWER(location) NOT LIKE '%remote%'
      AND LOWER(location) NOT LIKE '%hybrid%'
    )
  )
  AND (
    $5 = ''
    OR (
      $5 = 'external' AND "userId" = $6
    )
    OR (
      $5 = 'internal' AND "userId" != $6
    )
  )
  AND (
    $7 = 0
    OR COALESCE("publishedat", "publishedAt", "createdAt") >= NOW() - ($7 || ' days')::interval
  );
  `,
  [
    `%${keyword}%`,
    `%${company}%`,
    `%${location}%`,
    locationType,
    source,
    CRON_USER_ID,
    days,
  ]
);

      const totalCount = Number(countResult.rows?.[0]?.count || 0);
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      const result = await client.query(
        `
        SELECT
          id, title, company, location, description,
          url, salary, compensation, tags, source, status,
          "userId", "accountKey", "externalId",
          "publishedAt", "publishedat", "createdAt", "updatedAt"
        FROM jobs
        WHERE LOWER(COALESCE(status, '')) NOT IN ('draft', 'expired')
AND ($3 = '' OR LOWER(title) LIKE LOWER($3) OR LOWER(description) LIKE LOWER($3))
AND ($4 = '' OR LOWER(company) LIKE LOWER($4))
AND ($5 = '' OR LOWER(location) LIKE LOWER($5))
AND (
  $6 = ''
  OR (
    $6 = 'Remote' AND LOWER(location) LIKE '%remote%'
  )
  OR (
    $6 = 'Hybrid' AND LOWER(location) LIKE '%hybrid%'
  )
  OR (
    $6 = 'On-site'
    AND LOWER(location) NOT LIKE '%remote%'
    AND LOWER(location) NOT LIKE '%hybrid%'
  )
)
AND (
  $7 = ''
  OR (
    $7 = 'external' AND "userId" = $8
  )
  OR (
    $7 = 'internal' AND "userId" != $8
  )
)
AND (
  $9 = 0
  OR COALESCE("publishedat", "publishedAt", "createdAt") >= NOW() - ($9 || ' days')::interval
)
        ORDER BY
          COALESCE("publishedat", "publishedAt", "createdAt") DESC NULLS LAST,
          id DESC
        LIMIT $1 OFFSET $2;
        `,
        [
  pageSize,
  offset,
  `%${keyword}%`,
  `%${company}%`,
  `%${location}%`,
  locationType,
  source,
  CRON_USER_ID,
  days,
]
      );

      const jobs = (result.rows || []).map(mapJob);
const hasSearchIntent =
  Boolean(keyword) ||
  Boolean(company) ||
  Boolean(location) ||
  Boolean(locationType) ||
  Boolean(source) ||
  Boolean(days);

const responseJobs = hasSearchIntent
  ? rankJobsBySignalRelevance(jobs, {
      keyword,
      company,
      location,
      locationType,
      source,
    }).map((job) => ({
      ...job,
      match: job.jobMatch ?? null,
    }))
  : jobs.map((job) => ({
      ...job,
      match: null,
    }));


      return res.status(200).json({
        jobs: responseJobs,
        page,
        pageSize,
        totalCount,
        totalPages,
        debugTotal: jobs.length,
        debugExternalCount: jobs.filter((job) => job.origin === 'external').length,
        debugInternalCount: jobs.filter((job) => job.origin === 'internal').length,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[jobs] paginated jobs error:', error);

    return res.status(500).json({
      error: 'Failed to load jobs',
    });
  }
}