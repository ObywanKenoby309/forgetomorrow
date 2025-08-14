// lib/analytics/mock.js
// Extracted from previous API to keep identical behavior
export async function getAnalyticsMock({ range = '30d', jobId = 'all', recruiterId = 'all', from, to }) {
  const seedStr = `${range}|${jobId}|${recruiterId}|${from || ''}|${to || ''}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) % 1_000_000;
  const rng = () => (seed = (seed * 48271) % 0x7fffffff) / 0x7fffffff;

  const views = Math.floor(5000 + rng() * 15000);
  const clicks = Math.floor(views * (0.18 + rng() * 0.1));
  const applies = Math.floor(clicks * (0.25 + rng() * 0.15));
  const interviews = Math.floor(applies * (0.32 + rng() * 0.12));
  const offers = Math.floor(interviews * (0.22 + rng() * 0.15));
  const hires = Math.floor(offers * (0.45 + rng() * 0.2));
  const conversion = views ? +(applies / views * 100).toFixed(2) : 0;
  const timeToFill = +(20 + rng() * 25).toFixed(1);

  const funnel = [
    { stage: 'Views', value: views },
    { stage: 'Clicks', value: clicks },
    { stage: 'Applies', value: applies },
    { stage: 'Interviews', value: interviews },
    { stage: 'Offers', value: offers },
    { stage: 'Hires', value: hires },
  ];

  const s1 = Math.floor(applies * (0.55 + rng() * 0.1));
  const s2 = Math.floor(applies * (0.18 + rng() * 0.08));
  const s3 = Math.max(applies - s1 - s2, 0);
  const sources = [
    { name: 'Forge', value: s1 },
    { name: 'Referrals', value: s2 },
    { name: 'External Boards', value: s3 },
  ];

  const weeks = 8;
  const recruiterActivity = Array.from({ length: weeks }).map((_, i) => ({
    week: `W${i + 1}`,
    messages: Math.floor(40 + rng() * 60),
    responses: Math.floor(20 + rng() * 40),
  }));

  return {
    meta: { range, jobId, recruiterId, from, to, refreshedAt: new Date().toISOString(), source: 'mock' },
    kpis: {
      totalViews: views,
      totalApplies: applies,
      avgTimeToFillDays: timeToFill,
      conversionRatePct: conversion,
    },
    funnel,
    sources,
    recruiterActivity,
  };
}