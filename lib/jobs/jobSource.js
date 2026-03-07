// lib/jobs/jobSource.js

export const JOBS_CRON_USER_ID = 'cmiwa2op6000cbvz0f2s8eafb';

export const EXTERNAL_SOURCES = new Set([
  'himalayas',
  'themuse',
  'usajobs',
]);

export const EXTERNAL_ID_PREFIXES = [
  'himalayas_',
  'themuse_',
  'usajobs_',
];

export function isInternalJob(job) {
  if (!job) return false;

  const source = (job.source || '').toString().trim().toLowerCase();
  const externalId = (job.externalId || '').toString().trim().toLowerCase();

  if (job.userId === JOBS_CRON_USER_ID) return false;
  if (EXTERNAL_SOURCES.has(source)) return false;
  if (EXTERNAL_ID_PREFIXES.some((prefix) => externalId.startsWith(prefix))) return false;

  if (job.accountKey) return true;

  return (
    source === 'internal' ||
    source === 'forge' ||
    source === 'forge recruiter' ||
    source === 'forgetomorrow' ||
    source === 'forgetomorrow recruiter'
  );
}

export function getJobTier(job) {
  if (!job) return 'external';

  const rawTier = job.tier;
  if (rawTier === 'ft-official' || rawTier === 'partner' || rawTier === 'external') {
    return rawTier;
  }

  const internal = isInternalJob(job);
  if (!internal) return 'external';

  const company = (job.company || '').trim().toLowerCase();
  if (company === 'forgetomorrow') return 'ft-official';

  return 'partner';
}

export function getDisplaySource(job) {
  return isInternalJob(job) ? 'Forge recruiter' : 'External';
}