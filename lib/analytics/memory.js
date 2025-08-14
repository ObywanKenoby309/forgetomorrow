// lib/analytics/memory.js
// In-memory provider (no DB). Deterministic sample data with real filtering.
// --- Sample catalog ---
const JOBS = [
  { id: 'jr-se', title: 'Jr. Software Engineer' },
  { id: 'sr-se', title: 'Sr. Software Engineer' },
  { id: 'cx-lead', title: 'Customer Success Lead' },
];
const RECRUITERS = [
  { id: 'r1', name: 'Alexis' },
  { id: 'r2', name: 'Jordan' },
  { id: 'r3', name: 'Taylor' },
];

// --- Deterministic RNG ---
function makeRNG(seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) % 1_000_000;
  return () => (seed = (seed * 48271) % 0x7fffffff) / 0x7fffffff;
}

// --- Generate 120 days of sample records per job/recruiter ---
const TODAY = new Date();
const DAY_MS = 24 * 3600 * 1000;
const DAYS = 120;

const SAMPLE = [];
(function buildSample() {
  for (const job of JOBS) {
    for (const rec of RECRUITERS) {
      const rng = makeRNG(`${job.id}|${rec.id}`);
      for (let d = 0; d < DAYS; d++) {
        const date = new Date(TODAY.getTime() - d * DAY_MS);
        const iso = date.toISOString().slice(0, 10);
        const views = Math.floor(60 + rng() * 260);
        const clicks = Math.floor(views * (0.15 + rng() * 0.1));
        const applies = Math.floor(clicks * (0.25 + rng() * 0.2));
        const interviews = Math.floor(applies * (0.3 + rng() * 0.2));
        const offers = Math.floor(interviews * (0.2 + rng() * 0.15));
        const hires = Math.floor(offers * (0.4 + rng() * 0.25));
        const srcForge = Math.floor(applies * (0.55 + rng() * 0.1));
        const srcRef = Math.floor(applies * (0.18 + rng() * 0.08));
        const srcBoards = Math.max(applies - srcForge - srcRef, 0);
        const messages = Math.floor(10 + rng() * 25);
        const responses = Math.min(messages, Math.floor(4 + rng() * 18));
        SAMPLE.push({ iso, jobId: job.id, recruiterId: rec.id, views, clicks, applies, interviews, offers, hires, srcForge, srcRef, srcBoards, messages, responses });
      }
    }
  }
})();

function parseWindow({ range = '30d', from, to }) {
  const end = range === 'custom' && to ? new Date(to) : TODAY;
  let start;
  if (range === '7d') start = new Date(end.getTime() - 7 * DAY_MS);
  else if (range === '30d') start = new Date(end.getTime() - 30 * DAY_MS);
  else if (range === '90d') start = new Date(end.getTime() - 90 * DAY_MS);
  else if (range === 'custom' && from) start = new Date(from);
  else start = new Date(end.getTime() - 30 * DAY_MS);
  const startISO = start.toISOString().slice(0, 10);
  const endISO = end.toISOString().slice(0, 10);
  return { startISO, endISO };
}

export async function getAnalyticsMemory({ range = '30d', jobId = 'all', recruiterId = 'all', from, to }) {
  const { startISO, endISO } = parseWindow({ range, from, to });

  // Filter records
  const rows = SAMPLE.filter(r => r.iso >= startISO && r.iso <= endISO)
    .filter(r => jobId === 'all' ? true : r.jobId === jobId)
    .filter(r => recruiterId === 'all' ? true : r.recruiterId === recruiterId);

  // Aggregate KPIs
  const sum = (k) => rows.reduce((acc, r) => acc + r[k], 0);
  const totalViews = sum('views');
  const totalApplies = sum('applies');
  const conversionRatePct = totalViews ? +(totalApplies / totalViews * 100).toFixed(2) : 0;

  // Approximate time-to-fill: average days between first apply and first hire per job
  const byJob = new Map();
  for (const r of rows) {
    if (!byJob.has(r.jobId)) byJob.set(r.jobId, []);
    byJob.get(r.jobId).push(r);
  }
  let timeToFillDays = 0, jobsCounted = 0;
  for (const [job, arr] of byJob) {
    const byDate = arr.slice().sort((a,b)=>a.iso.localeCompare(b.iso));
    const firstApply = byDate.find(x => x.applies > 0);
    const firstHire = byDate.find(x => x.hires > 0);
    if (firstApply && firstHire) {
      const days = (new Date(firstHire.iso) - new Date(firstApply.iso)) / (24 * 3600 * 1000);
      if (days >= 0) { timeToFillDays += days; jobsCounted++; }
    }
  }
  const avgTimeToFillDays = jobsCounted ? +((timeToFillDays / jobsCounted).toFixed(1)) : 0;

  // Funnel: use totals over window
  const clicks = sum('clicks');
  const applies = totalApplies;
  const interviews = sum('interviews');
  const offers = sum('offers');
  const hires = sum('hires');
  const funnel = [
    { stage: 'Views', value: totalViews },
    { stage: 'Clicks', value: clicks },
    { stage: 'Applies', value: applies },
    { stage: 'Interviews', value: interviews },
    { stage: 'Offers', value: offers },
    { stage: 'Hires', value: hires },
  ];

  // Sources
  const s1 = sum('srcForge');
  const s2 = sum('srcRef');
  const s3 = sum('srcBoards');
  const sources = [
    { name: 'Forge', value: s1 },
    { name: 'Referrals', value: s2 },
    { name: 'External Boards', value: s3 },
  ];

  // Recruiter activity (weekly buckets across window)
  const byWeek = new Map();
  for (const r of rows) {
    const date = new Date(r.iso);
    const oneJan = new Date(date.getUTCFullYear(), 0, 1);
    const week = 'W' + Math.ceil((((date - oneJan) / (24 * 3600 * 1000)) + oneJan.getUTCDay() + 1) / 7);
    const key = week;
    if (!byWeek.has(key)) byWeek.set(key, { week: key, messages: 0, responses: 0 });
    const acc = byWeek.get(key);
    acc.messages += r.messages; acc.responses += r.responses;
  }
  const recruiterActivity = Array.from(byWeek.values()).sort((a,b)=>a.week.localeCompare(b.week));

  return {
    meta: { range, jobId, recruiterId, from, to, refreshedAt: new Date().toISOString(), source: 'memory' },
    kpis: { totalViews, totalApplies, avgTimeToFillDays, conversionRatePct },
    funnel,
    sources,
    recruiterActivity,
  };
}