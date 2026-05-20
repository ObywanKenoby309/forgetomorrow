/* eslint-disable no-console */
// scripts/jobs-cron.cjs
// ForgeTomorrow Jobs Import Cron
//
// Changes from previous version:
// - Raised description cap from 3000 to 8000 for all sources
// - Added fetchFullDescriptionFromUrl() for Jooble and Adzuna
//   which only provide short snippets — follows job.url to get full JD
// - Added enrichDescriptionIfShort() to enrich any job under 800 chars
// - All full-JD sources (Himalayas, Muse, Greenhouse, Lever, USAJobs)
//   already receive full text from their APIs — cap raised, no URL fetching needed

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Constants ────────────────────────────────────────────────────────────────

const CRON_USER_ID = 'cmiwa2op6000cbvz0f2s8eafb';
const IMPORT_STATUS = 'Published';
const SOURCES = ['himalayas', 'themuse', 'usajobs', 'adzuna', 'jooble', 'greenhouse', 'lever'];
const RETENTION_DAYS = 7;
const WRITE_BATCH_SIZE = 40;

// Description thresholds
const DESCRIPTION_CAP = 8000;           // raised from 3000
const SHORT_DESCRIPTION_THRESHOLD = 800; // below this, try to fetch full JD from URL

// Fetch settings
const FETCH_TIMEOUT_MS = 6000;
const ENRICH_CONCURRENCY = 5; // how many URL fetches to run in parallel

// Source URLs
const HIMALAYAS_URL = 'https://himalayas.app/jobs/api';
const HIMALAYAS_LIMIT = 100;
const HIMALAYAS_MAX_PAGES = 10;

const MUSE_URL = 'https://www.themuse.com/api/public/jobs';
const MUSE_MAX_PAGES = 10;

const JOOBLE_URL = 'https://jooble.org/api/';
const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;
const JOOBLE_PAGE_LIMIT = 5;

const GREENHOUSE_URL = 'https://boards-api.greenhouse.io/v1/boards';
const GREENHOUSE_BOARDS = [
  'stripe', 'airbnb', 'figma', 'databricks', 'notion', 'doordash',
  'instacart', 'robinhood', 'discord', 'reddit', 'lyft', 'affirm',
  'ramp', 'rippling', 'gusto', 'benchling', 'flatironhealth', 'color',
  'formationbio', 'modernhealth', 'peloton', 'thriveglobal', 'quizlet',
  'duolingo', 'udacity', 'coursera', 'handshake', 'komodohealth',
  'samsara', 'hashicorp',
];

const LEVER_URL = 'https://api.lever.co/v0/postings';
const LEVER_COMPANIES = [
  'netflix', 'coinbase', 'openai', 'scaleai', 'mongodb', 'asana',
  'brex', 'yelp', 'eventbrite', 'zapier', 'cruise', 'niantic',
  'flexport', 'impossiblefoods', 'headspace', 'talkiatry', 'noom',
  'masterclass', 'wealthfront', 'udemy', 'applyboard', 'brightwheel',
  'collectivehealth', 'caredx', 'carbonhealth', 'himsandhers',
];

const USAJOBS_URL = 'https://data.usajobs.gov/api/search';
const USAJOBS_RESULTS_PER_PAGE = 25;
const USAJOBS_MAX_PAGES_PER_KEYWORD = 2;
const USAJOBS_KEYWORDS = [
  'customer service', 'administrative assistant', 'human resources',
  'project manager', 'program analyst', 'management analyst',
  'contract specialist', 'education', 'teacher', 'training specialist',
  'medical', 'nurse', 'laboratory', 'biologist', 'chemist',
  'maintenance', 'mechanic', 'electrician', 'logistics', 'warehouse',
];

const ADZUNA_URL = 'https://api.adzuna.com/v1/api/jobs/us/search';
const ADZUNA_RESULTS_PER_PAGE = 25;
const ADZUNA_MAX_PAGES = 4;
const ADZUNA_KEYWORDS = [
  'warehouse', 'forklift', 'CDL', 'electrician', 'HVAC',
  'maintenance technician', 'construction', 'manufacturing',
  'field service technician', 'customer service', 'administrative assistant',
  'project manager',
];

// ─── Full description fetcher ─────────────────────────────────────────────────
// Follows job.url to get the full job description from the posting page.
// Used for Jooble and Adzuna which only provide short snippets.
// Returns null if fetch fails, times out, or produces no meaningful text.

async function fetchFullDescriptionFromUrl(url) {
  if (!url || typeof url !== 'string') return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ForgeTomorrow/1.0; +https://forgetomorrow.com)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;

    const html = await res.text();
    if (!html || html.length < 200) return null;

    return extractDescriptionFromHtml(html);
  } catch (err) {
    // Timeout, network error, redirect loop — silently return null
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Ordered list of extraction strategies — tries each in sequence,
// returns the first result that is meaningfully long (>300 chars).
function extractDescriptionFromHtml(html) {
  if (!html) return null;

  // Strategy 1: structured JSON-LD job posting
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      try {
        const jsonStr = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        const data = JSON.parse(jsonStr);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'JobPosting' && item.description) {
            const text = htmlToCleanText(item.description);
            if (text.length > 300) return text.substring(0, DESCRIPTION_CAP);
          }
        }
      } catch {
        // malformed JSON — continue
      }
    }
  }

  // Strategy 2: common job description CSS selectors (in priority order)
  const selectors = [
    /class="[^"]*job[_-]?description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*jobDescription[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*job[_-]?detail[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*job[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*posting[_-]?description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /id="[^"]*job[_-]?description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /id="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of selectors) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const text = htmlToCleanText(match[1]);
      if (text.length > 300) return text.substring(0, DESCRIPTION_CAP);
    }
  }

  // Strategy 3: <article> tag — many job boards use this
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch && articleMatch[1]) {
    const text = htmlToCleanText(articleMatch[1]);
    if (text.length > 300) return text.substring(0, DESCRIPTION_CAP);
  }

  // Strategy 4: <main> tag — fallback for well-structured pages
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch && mainMatch[1]) {
    const text = htmlToCleanText(mainMatch[1]);
    if (text.length > 300) return text.substring(0, DESCRIPTION_CAP);
  }

  return null;
}

// Enrich a single job's description if it's too short.
// Follows job.url and tries to get the full JD.
// Returns the job with description updated if successful.
async function enrichDescriptionIfShort(job) {
  if (!job) return job;
  const currentLength = String(job.description || '').length;
  if (currentLength >= SHORT_DESCRIPTION_THRESHOLD) return job;
  if (!job.url) return job;

  try {
    const fullText = await fetchFullDescriptionFromUrl(job.url);
    if (fullText && fullText.length > currentLength + 100) {
      console.log(
        `[Enrich] "${job.title}" at ${job.company}: ${currentLength} → ${fullText.length} chars`
      );
      return { ...job, description: fullText };
    }
  } catch (err) {
    // Never crash the cron over a failed enrich
    console.warn(`[Enrich] Failed for "${job.title}": ${err.message}`);
  }

  return job;
}

// Run enrichment in parallel with a concurrency limit.
async function enrichJobsBatch(jobs) {
  const results = [];
  for (let i = 0; i < jobs.length; i += ENRICH_CONCURRENCY) {
    const batch = jobs.slice(i, i + ENRICH_CONCURRENCY);
    const enriched = await Promise.all(batch.map((job) => enrichDescriptionIfShort(job)));
    results.push(...enriched);
  }
  return results;
}

// ─── HTML cleanup ─────────────────────────────────────────────────────────────

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

// ─── Shared helpers ───────────────────────────────────────────────────────────

function inferWorksite(locationStr, jobType) {
  const loc = String(locationStr || '').toLowerCase();
  const type = String(jobType || '').toLowerCase();
  if (
    loc.includes('remote') || loc.includes('worldwide') ||
    loc.includes('anywhere') || loc.includes('global') ||
    loc.includes('flexible') || type.includes('remote')
  ) return 'Remote';
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
  const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
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
  if (source === 'greenhouse') {
    const boardToken = job?.boardToken ? String(job.boardToken).trim() : 'unknown';
    const id = job?.id ? String(job.id).trim() : '';
    if (id) return `greenhouse_${boardToken}_${id}`;
    return `greenhouse_${boardToken}_${job?.title || ''}|${job?.location?.name || ''}`;
  }
  if (source === 'lever') {
    const company = job?.companyToken ? String(job.companyToken).trim() : 'unknown';
    const id = job?.id ? String(job.id).trim() : '';
    if (id) return `lever_${company}_${id}`;
    return `lever_${company}_${job?.text || ''}|${job?.categories?.location || ''}`;
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

// ─── Source parsers ───────────────────────────────────────────────────────────
// All full-JD sources now use DESCRIPTION_CAP (8000) instead of 3000.

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
    description: description.substring(0, DESCRIPTION_CAP) || 'No description provided.',
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
  const level = Array.isArray(job.levels) && job.levels.length > 0
    ? job.levels[0]?.name || null
    : null;
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
    description: description.substring(0, DESCRIPTION_CAP) || 'No description provided.',
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
    // Jooble only gives a snippet — enrichDescriptionIfShort will follow job.url
    description: htmlToCleanText(job.snippet || '').substring(0, DESCRIPTION_CAP) || 'No description provided.',
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

function parseGreenhouse(job, boardToken) {
  const location = job?.location?.name || 'United States';
  const metadata = Array.isArray(job?.metadata) ? job.metadata : [];
  const tags = metadata
    .map((item) => item?.value || item?.name)
    .filter(Boolean)
    .join(', ') || null;
  return {
    externalId: buildExternalId('greenhouse', { ...job, boardToken }),
    title: String(job?.title || 'Untitled Role').trim(),
    company: String(boardToken || 'Greenhouse').trim(),
    location,
    worksite: inferWorksite(location, null),
    type: null,
    compensation: null,
    salary: null,
    description: htmlToCleanText(job?.content || '').substring(0, DESCRIPTION_CAP) || 'No description provided. View the full posting on the company careers page.',
    url: job?.absolute_url || null,
    tags,
    source: 'greenhouse',
    status: IMPORT_STATUS,
    urgent: false,
    isTemplate: false,
    accountKey: null,
    userId: CRON_USER_ID,
    publishedAt: toDateOrNull(job?.updated_at || null),
    publishedat: toDateOrNull(job?.updated_at || null),
  };
}

function parseLever(job, companyToken) {
  const location = job?.categories?.location || 'United States';
  const tags = [
    job?.categories?.team,
    job?.categories?.department,
    job?.categories?.commitment,
  ].filter(Boolean).join(', ') || null;
  return {
    externalId: buildExternalId('lever', { ...job, companyToken }),
    title: String(job?.text || 'Untitled Role').trim(),
    company: String(companyToken || 'Lever').trim(),
    location,
    worksite: inferWorksite(location, null),
    type: normalizeJobType(job?.categories?.commitment),
    compensation: null,
    salary: null,
    description: htmlToCleanText(job?.descriptionPlain || job?.description || '').substring(0, DESCRIPTION_CAP) || 'No description provided.',
    url: job?.hostedUrl || null,
    tags,
    source: 'lever',
    status: IMPORT_STATUS,
    urgent: false,
    isTemplate: false,
    accountKey: null,
    userId: CRON_USER_ID,
    publishedAt: toDateOrNull(job?.createdAt || null),
    publishedat: toDateOrNull(job?.createdAt || null),
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
    return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
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
  const location = job.PositionLocationDisplay ||
    (locations.length > 0 ? locations.join(', ') : 'United States');
  const worksite = inferWorksite(location, null);
  const schedule = Array.isArray(job.PositionSchedule) && job.PositionSchedule.length > 0
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
    ].filter(Boolean).join('\n\n')
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
    description: description.substring(0, DESCRIPTION_CAP) || 'No description provided. View the full announcement on USAJOBS.',
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
  const location = job?.location?.display_name ||
    job?.location?.area?.join(', ') ||
    'United States';
  const worksite = inferWorksite(location, null);
  const company = job?.company?.display_name || 'Unknown Company';
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
    // Adzuna only gives a short excerpt — enrichDescriptionIfShort will follow job.url
    description: htmlToCleanText(job.description || '').substring(0, DESCRIPTION_CAP),
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

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function safeFetchJson(url, extraHeaders = {}) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ForgeTomorrow Jobs Cron',
      ...extraHeaders,
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
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
      try { all.push(parseHimalayas(job)); }
      catch (err) { console.error(`[Himalayas] Parse failed for "${job?.title || 'Unknown'}": ${err.message}`); }
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
      try { all.push(parseMuse(job)); }
      catch (err) { console.error(`[The Muse] Parse failed for "${job?.name || 'Unknown'}": ${err.message}`); }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: '', location: 'USA', page }),
      });
      if (!response.ok) { console.error(`[Jooble] Request failed: ${response.status}`); break; }
      const data = await response.json();
      const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
      if (!jobs.length) break;
      for (const job of jobs) {
        try { all.push(parseJooble(job)); }
        catch (err) { console.error(`[Jooble] Parse failed for "${job?.title || 'Unknown'}": ${err.message}`); }
      }
    } catch (err) {
      console.error('[Jooble] Fetch failed:', err.message);
    }
  }
  return all;
}

async function fetchGreenhouseJobs() {
  const all = [];
  for (const boardToken of GREENHOUSE_BOARDS) {
    const url = `${GREENHOUSE_URL}/${encodeURIComponent(boardToken)}/jobs?content=true`;
    let data;
    try { data = await safeFetchJson(url); }
    catch (err) { console.error(`[Greenhouse] Fetch failed for "${boardToken}": ${err.message}`); continue; }
    const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
    if (!jobs.length) continue;
    for (const job of jobs) {
      try { all.push(parseGreenhouse(job, boardToken)); }
      catch (err) { console.error(`[Greenhouse] Parse failed for "${boardToken}" / "${job?.title || 'Unknown'}": ${err.message}`); }
    }
  }
  return all;
}

async function fetchLeverJobs() {
  const all = [];
  for (const companyToken of LEVER_COMPANIES) {
    const url = `${LEVER_URL}/${encodeURIComponent(companyToken)}?mode=json`;
    let jobs = [];
    try { jobs = await safeFetchJson(url); }
    catch (err) { console.error(`[Lever] Fetch failed for "${companyToken}": ${err.message}`); continue; }
    if (!Array.isArray(jobs) || !jobs.length) continue;
    for (const job of jobs) {
      try { all.push(parseLever(job, companyToken)); }
      catch (err) { console.error(`[Lever] Parse failed for "${companyToken}" / "${job?.text || 'Unknown'}": ${err.message}`); }
    }
  }
  return all;
}

async function fetchUSAJobs() {
  const userAgent = process.env.USAJOBS_USER_AGENT;
  const authorizationKey = process.env.USAJOBS_AUTHORIZATION_KEY;
  if (!userAgent || !authorizationKey) {
    console.warn('[USAJOBS] Missing credentials. Skipping.');
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
      try { data = await safeFetchJson(url, headers); }
      catch (err) { console.error(`[USAJOBS] Fetch failed for keyword "${keyword}" page ${page}: ${err.message}`); break; }
      const items = Array.isArray(data?.SearchResult?.SearchResultItems)
        ? data.SearchResult.SearchResultItems
        : [];
      if (items.length === 0) break;
      for (const item of items) {
        const title = item?.MatchedObjectDescriptor?.PositionTitle || 'Unknown';
        try { all.push(parseUSAJobs(item)); }
        catch (err) { console.error(`[USAJOBS] Parse failed for "${title}": ${err.message}`); }
      }
      if (items.length < USAJOBS_RESULTS_PER_PAGE) break;
    }
  }
  return all;
}

async function fetchAdzunaJobs() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    console.warn('[Adzuna] Missing credentials. Skipping.');
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
        'content-type': 'application/json',
      });
      const url = `${ADZUNA_URL}/${page}?${params.toString()}`;
      let data;
      try { data = await safeFetchJson(url); }
      catch (err) { console.error(`[Adzuna] Fetch failed for keyword "${keyword}" page ${page}: ${err.message}`); break; }
      const jobs = Array.isArray(data?.results) ? data.results : [];
      if (jobs.length === 0) break;
      for (const job of jobs) {
        try { all.push(parseAdzuna(job)); }
        catch (err) { console.error(`[Adzuna] Parse failed for "${job?.title || 'Unknown'}": ${err.message}`); }
      }
      if (jobs.length < ADZUNA_RESULTS_PER_PAGE) break;
    }
  }
  return all;
}

// ─── Dedup + save ─────────────────────────────────────────────────────────────

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
      select: { id: true, externalId: true },
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
        await prisma.job.update({ where: { id: match.id }, data: payload });
        updated += 1;
      } else {
        await prisma.job.create({ data: payload });
        created += 1;
      }
    }
    console.log(`[Save] Batch ${index + 1}/${chunks.length} complete (${batch.length} jobs processed).`);
  }
  console.log(`[Save] Created ${created}, updated ${updated}.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[Cron] Starting jobs import...');

  const [
    himalayasJobs,
    museJobs,
    usaJobs,
    adzunaJobs,
    joobleJobs,
    greenhouseJobs,
    leverJobs,
  ] = await Promise.all([
    fetchHimalayasJobs(),
    fetchMuseJobs(),
    fetchUSAJobs(),
    fetchAdzunaJobs(),
    fetchJoobleJobs(),
    fetchGreenhouseJobs(),
    fetchLeverJobs(),
  ]);

  console.log(`[Fetch] Himalayas parsed: ${himalayasJobs.length}`);
  console.log(`[Fetch] The Muse parsed: ${museJobs.length}`);
  console.log(`[Fetch] Jooble parsed: ${joobleJobs.length}`);
  console.log(`[Fetch] Greenhouse parsed: ${greenhouseJobs.length}`);
  console.log(`[Fetch] Lever parsed: ${leverJobs.length}`);
  console.log(`[Fetch] USAJOBS parsed: ${usaJobs.length}`);
  console.log(`[Fetch] Adzuna parsed: ${adzunaJobs.length}`);

  // Full-JD sources — already have complete text, no enrichment needed
  const fullJdJobs = [
    ...himalayasJobs,
    ...museJobs,
    ...usaJobs,
    ...greenhouseJobs,
    ...leverJobs,
  ];

  // Snippet-only sources — enrich by following job.url
  console.log('[Enrich] Enriching Jooble and Adzuna jobs from full posting URLs...');
  const joobleEnriched = await enrichJobsBatch(joobleJobs);
  const adzunaEnriched = await enrichJobsBatch(adzunaJobs);

  const joobleImproved = joobleEnriched.filter(
    (job, i) => job.description.length > (joobleJobs[i]?.description?.length || 0)
  ).length;
  const adzunaImproved = adzunaEnriched.filter(
    (job, i) => job.description.length > (adzunaJobs[i]?.description?.length || 0)
  ).length;
  console.log(`[Enrich] Jooble enriched: ${joobleImproved}/${joobleJobs.length}`);
  console.log(`[Enrich] Adzuna enriched: ${adzunaImproved}/${adzunaJobs.length}`);

  const parsed = [...fullJdJobs, ...joobleEnriched, ...adzunaEnriched];
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
