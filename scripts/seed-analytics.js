// scripts/seed-analytics.js
const prisma = require('../lib/db.js').default;

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

function makeRNG(seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) % 1_000_000;
  return () => (seed = (seed * 48271) % 0x7fffffff) / 0x7fffffff;
}

async function main() {
  for (const j of JOBS) {
    await prisma.job.upsert({ where: { id: j.id }, create: j, update: { title: j.title } });
  }
  for (const r of RECRUITERS) {
    await prisma.recruiter.upsert({ where: { id: r.id }, create: r, update: { name: r.name } });
  }

  const today = new Date();
  const DAY_MS = 24 * 3600 * 1000;
  const DAYS = 120;

  const rows = [];
  for (const job of JOBS) {
    for (const rec of RECRUITERS) {
      const rng = makeRNG(`${job.id}|${rec.id}`);
      for (let d = 0; d < DAYS; d++) {
        const date = new Date(today.getTime() - d * DAY_MS);
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

        rows.push({
          date,
          jobId: job.id,
          recruiterId: rec.id,
          views,
          clicks,
          applies,
          interviews,
          offers,
          hires,
          srcForge,
          srcRef,
          srcBoards,
          messages,
          responses,
        });
      }
    }
  }

  await prisma.dailyMetric.deleteMany();
  await prisma.dailyMetric.createMany({ data: rows, skipDuplicates: rows });

  console.log(`Seeded ${rows.length} DailyMetric rows.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
