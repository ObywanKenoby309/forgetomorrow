// scripts/jobs-cron.cjs
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CRON_USER_ID = 'cmiwa2op6000cbvz0f2s8eafb';
const IMPORT_STATUS = 'Published';
const SOURCES = ['himalayas', 'themuse', 'usajobs', 'adzuna', 'jooble'];
const RETENTION_DAYS = 7;
const WRITE_BATCH_SIZE = 40;

const HIMALAYAS_URL = 'https://himalayas.app/jobs/api';
const HIMALAYAS_LIMIT = 100;
const HIMALAYAS_MAX_PAGES = 10;

const MUSE_URL = 'https://www.themuse.com/api/public/jobs';
const MUSE_MAX_PAGES = 10;

const JOOBLE_URL = 'https://jooble.org/api/';
const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;
const JOOBLE_PAGE_LIMIT = 5;

const USAJOBS_URL = 'https://data.usajobs.gov/api/search';
const USAJOBS_RESULTS_PER_PAGE = 25;
const USAJOBS_MAX_PAGES_PER_KEYWORD = 2;
const USAJOBS_KEYWORDS = [
  'customer service',
  'administrative assistant',
  'human resources',
  'project manager',
  'program analyst',
  'management analyst',
  'contract specialist',
  'education',
  'teacher',
  'training specialist',
  'medical',
  'nurse',
  'laboratory',
  'biologist',
  'chemist',
  'maintenance',
  'mechanic',
  'electrician',
  'logistics',
  'warehouse',
];

const ADZUNA_URL = 'https://api.adzuna.com/v1/api/jobs/us/search';
const ADZUNA_RESULTS_PER_PAGE = 25;
const ADZUNA_MAX_PAGES = 4;
const ADZUNA_KEYWORDS = [
  'warehouse',
  'forklift',
  'CDL',
  'electrician',
  'HVAC',
  'maintenance technician',
  'construction',
  'manufacturing',
  'field service technician',
  'customer service',
  'administrative assistant',
  'project manager',
];

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

  if (source === 'usajobs') {
    const descriptor = job?.MatchedObjectDescriptor || job || {};
    const id = descriptor.PositionID ? String(descriptor.PositionID).trim() : '';
    if (id) return `usajobs_${id}`;

    const uri = descriptor.PositionURI ? String(descriptor.PositionURI).trim() : '';
    if (uri) return `usajobs_${uri}`;

    return `usajobs_${descriptor.PositionTitle || ''}|${descriptor.OrganizationName || ''}|${descriptor.PublicationStartDate || ''}`;
  }

  if (source === 'adzuna') {
    const id = job?.id ? String(job.id).trim() : '';
    if (id) return `adzuna_${id}`;

    return `adzuna_${job?.title || ''}|${job?.company?.display_name || ''}|${job?.created || ''}`;
  }

if (source === 'jooble') {
    const id = job.id ? String(job.id).trim() : '';

    if (id) return `jooble_${id}`;

    return `jooble_${job.title || ''}|${job.company || ''}|${job.location || ''}`;
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

function parseJooble(job) {
  const location = job.location || 'Unknown';

  return {
    externalId: buildExternalId('jooble', job),
    title: job.title || 'Untitled Role',
    company: job.company || 'Unknown Company',
    location,
    worksite: inferWorksite(location, job.type),
    type: normalizeJobType(job.type),
    compensation: null,
    salary: null,
    description: htmlToCleanText(job.snippet || '').substring(0, 3000) || 'No description provided.',
    url: job.link || null,
    tags: null,
    source: 'jooble',
    status: IMPORT_STATUS,
    urgent: false,
    isTemplate: false,
    accountKey: null,
    userId: CRON_USER_ID,
    publishedAt: toDateOrNull(job.updated || job.created || null),
    publishedat: toDateOrNull(job.updated || job.created || null),
  };
}

function buildUSAJobsSalary(remuneration) {
  if (!Array.isArray(remuneration) || remuneration.length === 0) return null;

  const item = remuneration[0] || {};
  const min = item.MinimumRange;
  const max = item.MaximumRange;
  const interval = item.RateIntervalCode ? String(item.RateIntervalCode).trim() : '';

  const fmt = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return null;

    return `$${n.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    })}`;
  };

  const minText = fmt(min);
  const maxText = fmt(max);

  if (minText && maxText) return `${minText} - ${maxText}${interval ? ` / ${interval}` : ''}`;
  if (minText) return `${minText}+${interval ? ` / ${interval}` : ''}`;
  if (maxText) return `Up to ${maxText}${interval ? ` / ${interval}` : ''}`;

  return null;
}

function parseUSAJobs(item) {
  const job = item?.MatchedObjectDescriptor || item || {};
  const userAreaDetails = job?.UserArea?.Details || {};

  const locations = Array.isArray(job.PositionLocation)
    ? job.PositionLocation.map((location) => location?.LocationName).filter(Boolean)
    : [];

  const location =
    job.PositionLocationDisplay ||
    (locations.length > 0 ? locations.join(', ') : 'United States');

  const worksite = inferWorksite(location, null);

  const schedule =
    Array.isArray(job.PositionSchedule) && job.PositionSchedule.length > 0
      ? job.PositionSchedule[0]?.Name || null
      : null;

  const type = normalizeJobType(schedule);

  const salary = buildUSAJobsSalary(job.PositionRemuneration);

  const description = htmlToCleanText(
    [
      userAreaDetails.JobSummary,
      job.QualificationSummary,
      userAreaDetails.MajorDuties,
      userAreaDetails.Education,
      userAreaDetails.Requirements,
    ]
      .filter(Boolean)
      .join('\n\n')
  );

  const categoryTags = Array.isArray(job.JobCategory)
    ? job.JobCategory.map((category) => category?.Name).filter(Boolean)
    : [];

  const offeringTags = Array.isArray(job.PositionOfferingType)
    ? job.PositionOfferingType.map((offering) => offering?.Name).filter(Boolean)
    : [];

  const tags = [...categoryTags, ...offeringTags].filter(Boolean).join(', ') || null;

  const publishedAt = toIsoOrNull(job.PublicationStartDate);

  return {
    externalId: buildExternalId('usajobs', item),
    title: String(job.PositionTitle || 'Untitled Federal Role').trim(),
    company: String(job.OrganizationName || job.DepartmentName || 'USAJOBS').trim(),
    location,
    worksite,
    type,
    compensation: salary,
    salary,
    description: description.substring(0, 3000) || 'No description provided. View the full announcement on USAJOBS.',
    url: job.PositionURI || null,
    tags,
    source: 'usajobs',
    status: IMPORT_STATUS,
    urgent: false,
    isTemplate: false,
    accountKey: null,
    userId: CRON_USER_ID,
    publishedAt: toDateOrNull(publishedAt),
    publishedat: toDateOrNull(publishedAt),
  };
}


function parseAdzuna(job) {
  const location =
    job?.location?.display_name ||
    job?.location?.area?.join(', ') ||
    'United States';

  const worksite = inferWorksite(location, null);

  const company =
    job?.company?.display_name ||
    'Unknown Company';

  const salaryMin = Number(job?.salary_min || 0);
  const salaryMax = Number(job?.salary_max || 0);

  let salary = null;

  if (salaryMin > 0 && salaryMax > 0) {
    salary = `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`;
  }

  const tags = Array.isArray(job?.category?.tag)
    ? job.category.tag.join(', ')
    : job?.category?.label || null;

  const publishedAt = toIsoOrNull(job.created);

  return {
    externalId: buildExternalId('adzuna', job),
    title: String(job.title || 'Untitled Role').trim(),
    company: String(company).trim(),
    location,
    worksite,
    type: normalizeJobType(job.contract_type),
    compensation: salary,
    salary,
    description: htmlToCleanText(job.description || '').substring(0, 3000),
    url: job.redirect_url || null,
    tags,
    source: 'adzuna',
    status: IMPORT_STATUS,
    urgent: false,
    isTemplate: false,
    accountKey: null,
    userId: CRON_USER_ID,
    publishedAt: toDateOrNull(publishedAt),
    publishedat: toDateOrNull(publishedAt),
  };
}

async function safeFetchJson(url, extraHeaders = {}) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ForgeTomorrow Jobs Cron',
      ...extraHeaders,
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

async function fetchJoobleJobs() {
  if (!JOOBLE_API_KEY) {
    console.log('[Jooble] Missing JOOBLE_API_KEY. Skipping.');
    return [];
  }

  const all = [];

  for (let page = 1; page <= JOOBLE_PAGE_LIMIT; page += 1) {
    try {
      const response = await fetch(`${JOOBLE_URL}${JOOBLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: '',
          location: 'USA',
          page,
        }),
      });

      if (!response.ok) {
        console.error(`[Jooble] Request failed: ${response.status}`);
        break;
      }

      const data = await response.json();

      const jobs = Array.isArray(data?.jobs)
        ? data.jobs
        : [];

      if (!jobs.length) break;

      for (const job of jobs) {
        try {
          all.push(parseJooble(job));
        } catch (err) {
          console.error(
            `[Jooble] Parse failed for "${job?.title || 'Unknown'}": ${err.message}`
          );
        }
      }
    } catch (err) {
      console.error('[Jooble] Fetch failed:', err.message);
    }
  }

  return all;
}

async function fetchUSAJobs() {
  const userAgent = process.env.USAJOBS_USER_AGENT;
  const authorizationKey = process.env.USAJOBS_AUTHORIZATION_KEY;

  if (!userAgent || !authorizationKey) {
    console.warn('[USAJOBS] Missing USAJOBS_USER_AGENT or USAJOBS_AUTHORIZATION_KEY. Skipping USAJOBS import.');
    return [];
  }

  const all = [];
  const headers = {
    Host: 'data.usajobs.gov',
    'User-Agent': userAgent,
    'Authorization-Key': authorizationKey,
  };

  for (const keyword of USAJOBS_KEYWORDS) {
    for (let page = 1; page <= USAJOBS_MAX_PAGES_PER_KEYWORD; page += 1) {
      const params = new URLSearchParams({
        Keyword: keyword,
        Page: String(page),
        ResultsPerPage: String(USAJOBS_RESULTS_PER_PAGE),
      });

      const url = `${USAJOBS_URL}?${params.toString()}`;

      let data;
      try {
        data = await safeFetchJson(url, headers);
      } catch (err) {
        console.error(`[USAJOBS] Fetch failed for keyword "${keyword}" page ${page}: ${err.message}`);
        break;
      }

      const items = Array.isArray(data?.SearchResult?.SearchResultItems)
        ? data.SearchResult.SearchResultItems
        : [];

      if (items.length === 0) break;

      for (const item of items) {
        const title = item?.MatchedObjectDescriptor?.PositionTitle || 'Unknown';

        try {
          all.push(parseUSAJobs(item));
        } catch (err) {
          console.error(`[USAJOBS] Parse failed for "${title}": ${err.message}`);
        }
      }

      if (items.length < USAJOBS_RESULTS_PER_PAGE) break;
    }
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

async function fetchAdzunaJobs() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn('[Adzuna] Missing ADZUNA_APP_ID or ADZUNA_APP_KEY. Skipping Adzuna import.');
    return [];
  }

  const all = [];

  for (const keyword of ADZUNA_KEYWORDS) {
    for (let page = 1; page <= ADZUNA_MAX_PAGES; page += 1) {
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: String(ADZUNA_RESULTS_PER_PAGE),
        what: keyword,
        content-type: 'application/json',
      });

      const url = `${ADZUNA_URL}/${page}?${params.toString()}`;

      let data;

      try {
        data = await safeFetchJson(url);
      } catch (err) {
        console.error(`[Adzuna] Fetch failed for keyword "${keyword}" page ${page}: ${err.message}`);
        break;
      }

      const jobs = Array.isArray(data?.results)
        ? data.results
        : [];

      if (jobs.length === 0) break;

      for (const job of jobs) {
        try {
          all.push(parseAdzuna(job));
        } catch (err) {
          console.error(`[Adzuna] Parse failed for "${job?.title || 'Unknown'}": ${err.message}`);
        }
      }

      if (jobs.length < ADZUNA_RESULTS_PER_PAGE) break;
    }
  }

  return all;
}

async function main() {
  console.log('[Cron] Starting jobs import...');

  const [himalayasJobs, museJobs, usaJobs, adzunaJobs, joobleJobs] = await Promise.all([
    fetchHimalayasJobs(),
    fetchMuseJobs(),
    fetchUSAJobs(),
    fetchAdzunaJobs(),
	fetchJoobleJobs(),
  ]);

  console.log(`[Fetch] Himalayas parsed: ${himalayasJobs.length}`);
  console.log(`[Fetch] The Muse parsed: ${museJobs.length}`);
  console.log(`[Fetch] Jooble parsed: ${joobleJobs.length}`);
  console.log(`[Fetch] USAJOBS parsed: ${usaJobs.length}`);
  console.log(`[Fetch] Adzuna parsed: ${adzunaJobs.length}`);

  const parsed = [...himalayasJobs, ...museJobs, ...usaJobs, ...adzunaJobs, ...joobleJobs,];
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