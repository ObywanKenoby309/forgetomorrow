// scripts/jobs-cron.js
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CRON_USER_ID = 'cmiwa2op6000cbvz0f2s8eafb';
const IMPORT_STATUS = 'Published';
const SOURCES = ['himalayas', 'themuse'];
const RETENTION_DAYS = 7;
const WRITE_BATCH_SIZE = 40;

const HIMALAYAS_URL = 'https://himalayas.app/jobs/api';
const HIMALAYAS_LIMIT = 100;
const HIMALAYAS_MAX_PAGES = 10;

const MUSE_URL = 'https://www.themuse.com/api/public/jobs';
const MUSE_MAX_PAGES = 10;

function htmlToCleanText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<h1[^>]*>/gi, '\n\n# ')
    .replace(/<\/h1>/gi, '\n')
    .replace(/<h2[^>]*>/gi, '\n\n## ')
    .replace(/<\/h2>/gi, '\n')
    .replace(/<h3[^>]*>/gi, '\n\n### ')
    .replace(/<\/h3>/gi, '\n')
    .replace(/<h[4-6][^>]*>/gi, '\n#### ')
    .replace(/<\/h[4-6]>/gi, '\n')
    .replace(/<strong[^>]*>|<b[^>]*>/gi, '**')
    .replace(/<\/strong>|<\/b>/gi, '**')
    .replace(/<em[^>]*>|<i[^>]*>/gi, '_')
    .replace(/<\/em>|<\/i>/gi, '_')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function inferWorksite(locationStr, jobType) {
  const loc = String(locationStr || '').toLowerCase();
  const type = String(jobType || '').toLowerCase();

  if (
    loc.includes('remote') ||
    loc.includes('worldwide') ||
    loc.includes('anywhere') ||
    loc.includes('global') ||
    loc.includes('flexible') ||
    type.includes('remote')
  ) {
    return 'Remote';
  }

  if (loc.includes('hybrid') || type.includes('hybrid')) return 'Hybrid';
  if (!locationStr || loc === '' || loc === 'null') return 'Remote';
  return 'On-site';
}

function normalizeJobType(raw) {
  if (!raw) return null;
  const t = String(raw).toLowerCase();

  if (t.includes('full')) return 'Full-time';
  if (t.includes('part')) return 'Part-time';
  if (t.includes('contract')) return 'Contract';
  if (t.includes('freelance')) return 'Freelance';
  if (t.includes('intern')) return 'Internship';
  if (t.includes('temp')) return 'Temporary';

  return String(raw).trim() || null;
}

function buildSalaryFromRange(min, max, currency) {
  if (!min && !max) return null;

  const cur = currency || 'USD';
  const fmt = (n) =>
    Number(n).toLocaleString('en-US', {
      maximumFractionDigits: 0,
    });

  if (min && max) return `${cur} ${fmt(min)} - ${fmt(max)}`;
  if (min) return `${cur} ${fmt(min)}+`;
  if (max) return `Up to ${cur} ${fmt(max)}`;
  return null;
}

function buildExternalId(source, job) {
  if (source === 'himalayas') {
    const guid = job.guid ? String(job.guid).trim() : '';
    if (guid) return `himalayas_${guid}`;

    const link = job.applicationLink ? String(job.applicationLink).trim() : '';
    if (link) return `himalayas_${link}`;

    return `himalayas_${job.title || ''}|${job.companyName || ''}|${job.pubDate || ''}`;
  }

  if (source === 'themuse') {
    const id = job.id !== null && job.id !== undefined ? String(job.id).trim() : '';
    if (id) return `themuse_${id}`;

    return `themuse_${job.short_name || job.name || 'unknown'}`;
  }

  return null;
}

function toIsoOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toDateOrNull(value) {
  const iso = toIsoOrNull(value);
  return iso ? new Date(iso) : null;
}

function parseHimalayas(job) {
  const locationArr = Array.isArray(job.locationRestrictions)
    ? job.locationRestrictions.filter(Boolean)
    : [];
  const location = locationArr.length > 0 ? locationArr.join(', ') : 'Worldwide';
  const worksite = inferWorksite(location, job.employmentType);
  const description = htmlToCleanText(job.description);
  const salary = buildSalaryFromRange(job.minSalary, job.maxSalary, job.currency);
  const type = normalizeJobType(job.employmentType);

  let publishedAt = null;
  if (job.pubDate) {
    const d = new Date(Number(job.pubDate) * 1000);
    publishedAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const tags = Array.isArray(job.categories)
    ? job.categories.map((c) => String(c).replace(/-/g, ' ')).join(', ')
    : null;

  return {
    externalId: buildExternalId('himalayas', job),
    title: String(job.title || 'Untitled Role').trim(),
    company: String(job.companyName || 'Unknown Company').trim(),
    location,
    worksite,
    type,
    compensation: salary,
    salary,
    description: description.substring(0, 3000) || 'No description provided.',
    url: job.applicationLink || job.guid || null,
    tags,
    source: 'himalayas',
    status: IMPORT_STATUS,
    urgent: false,
    isTemplate: false,
    accountKey: null,
    userId: CRON_USER_ID,
    publishedAt: toDateOrNull(publishedAt),
    publishedat: toDateOrNull(publishedAt),
  };
}

function parseMuse(job) {
  const locationArr = Array.isArray(job.locations)
    ? job.locations.map((l) => l?.name).filter(Boolean)
    : [];
  const location = locationArr.length > 0 ? locationArr.join(', ') : 'Flexible / Remote';
  const worksite = inferWorksite(location, null);
  const description = htmlToCleanText(job.contents || '');

  const level =
    Array.isArray(job.levels) && job.levels.length > 0 ? job.levels[0]?.name || null : null;

  const categoryTags = Array.isArray(job.categories)
    ? job.categories.map((c) => c?.name).filter(Boolean)
    : [];

  const allTags = [...categoryTags, ...(level ? [level] : [])];
  const tags = allTags.length > 0 ? allTags.join(', ') : null;

  const publishedAt = toIsoOrNull(job.publication_date);

  return {
    externalId: buildExternalId('themuse', job),
    title: String(job.name || 'Untitled Role').trim(),
    company: String(job.company?.name || 'Unknown Company').trim(),
    location,
    worksite,
    type: null,
    compensation: null,
    salary: null,
    description: description.substring(0, 3000) || 'No description provided.',
    url: job.refs?.landing_page || null,
    tags,
    source: 'themuse',
    status: IMPORT_STATUS,
    urgent: false,
    isTemplate: false,
    accountKey: null,
    userId: CRON_USER_ID,
    publishedAt: toDateOrNull(publishedAt),
    publishedat: toDateOrNull(publishedAt),
  };
}

async function safeFetchJson(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ForgeTomorrow Jobs Cron',
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} for ${url}`);
  }

  return res.json();
}

async function fetchHimalayasJobs() {
  const all = [];

  for (let page = 0; page < HIMALAYAS_MAX_PAGES; page += 1) {
    const offset = page * HIMALAYAS_LIMIT;
    const url = `${HIMALAYAS_URL}?limit=${HIMALAYAS_LIMIT}&offset=${offset}`;
    const data = await safeFetchJson(url);
    const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

    if (jobs.length === 0) break;

    for (const job of jobs) {
      try {
        all.push(parseHimalayas(job));
      } catch (err) {
        console.error(`[Himalayas] Parse failed for "${job?.title || 'Unknown'}": ${err.message}`);
      }
    }

    if (jobs.length < HIMALAYAS_LIMIT) break;
  }

  return all;
}

async function fetchMuseJobs() {
  const all = [];

  for (let page = 1; page <= MUSE_MAX_PAGES; page += 1) {
    const url = `${MUSE_URL}?page=${page}`;
    const data = await safeFetchJson(url);
    const jobs = Array.isArray(data?.results) ? data.results : [];
    const pageCount = Number(data?.page_count || 1);

    if (jobs.length === 0) break;

    for (const job of jobs) {
      try {
        all.push(parseMuse(job));
      } catch (err) {
        console.error(`[The Muse] Parse failed for "${job?.name || 'Unknown'}": ${err.message}`);
      }
    }

    if (page >= pageCount) break;
  }

  return all;
}

function dedupeJobs(jobs) {
  const map = new Map();

  for (const job of jobs) {
    if (!job?.externalId) continue;
    map.set(job.externalId, job);
  }

  return [...map.values()];
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function expireOldImportedJobs() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const deleted = await prisma.job.deleteMany({
    where: {
      userId: CRON_USER_ID,
      source: { in: SOURCES },
      status: IMPORT_STATUS,
      OR: [
        { publishedAt: { lt: cutoff } },
        { publishedAt: null, createdAt: { lt: cutoff } },
      ],
    },
  });

  console.log(`[Expire] Deleted ${deleted.count} old imported jobs.`);
}

async function saveJobs(jobs) {
  if (!jobs.length) {
    console.log('[Save] No jobs to save.');
    return;
  }

  const chunks = chunk(jobs, WRITE_BATCH_SIZE);
  let created = 0;
  let updated = 0;

  for (let index = 0; index < chunks.length; index += 1) {
    const batch = chunks[index];
    const externalIds = batch.map((job) => job.externalId).filter(Boolean);

    const existing = await prisma.job.findMany({
      where: {
        userId: CRON_USER_ID,
        source: { in: SOURCES },
        externalId: { in: externalIds },
      },
      select: {
        id: true,
        externalId: true,
      },
    });

    const existingMap = new Map(existing.map((job) => [job.externalId, job]));

    for (const job of batch) {
      const payload = {
        company: job.company,
        title: job.title,
        worksite: job.worksite,
        location: job.location,
        type: job.type,
        compensation: job.compensation,
        description: job.description,
        status: job.status,
        urgent: job.urgent,
        userId: job.userId,
        accountKey: job.accountKey,
        url: job.url,
        salary: job.salary,
        tags: job.tags,
        source: job.source,
        isTemplate: job.isTemplate,
        publishedAt: job.publishedAt,
        publishedat: job.publishedat,
        externalId: job.externalId,
      };

      const match = existingMap.get(job.externalId);

      if (match) {
        await prisma.job.update({
          where: { id: match.id },
          data: payload,
        });
        updated += 1;
      } else {
        await prisma.job.create({
          data: payload,
        });
        created += 1;
      }
    }

    console.log(
      `[Save] Batch ${index + 1}/${chunks.length} complete (${batch.length} jobs processed).`
    );
  }

  console.log(`[Save] Created ${created}, updated ${updated}.`);
}

async function main() {
  console.log('[Cron] Starting jobs import...');

  const [himalayasJobs, museJobs] = await Promise.all([
    fetchHimalayasJobs(),
    fetchMuseJobs(),
  ]);

  console.log(`[Fetch] Himalayas parsed: ${himalayasJobs.length}`);
  console.log(`[Fetch] The Muse parsed: ${museJobs.length}`);

  const parsed = [...himalayasJobs, ...museJobs];
  const deduped = dedupeJobs(parsed);

  console.log(`[Parser] Total parsed: ${parsed.length}`);
  console.log(`[Parser] Total deduped: ${deduped.length}`);

  await saveJobs(deduped);
  await expireOldImportedJobs();

  const finalCount = await prisma.job.count({
    where: {
      userId: CRON_USER_ID,
      source: { in: SOURCES },
      status: IMPORT_STATUS,
    },
  });

  console.log(`[Done] Imported job count currently in DB: ${finalCount}`);
}

main()
  .catch((err) => {
    console.error('[Fatal]', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });