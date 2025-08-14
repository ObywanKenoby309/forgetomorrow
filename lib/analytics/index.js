// lib/analytics/index.js
// Data source selector – swap between 'mock' and 'sql' with ENV
const DATASOURCE = process.env.NEXT_PUBLIC_ANALYTICS_DATASOURCE || process.env.ANALYTICS_DATASOURCE || 'mock';

export async function getAnalytics(params) {
  if (DATASOURCE === 'sql') {
    const { getAnalyticsSQL } = await import('./sql');
    return getAnalyticsSQL(params);
  }
  if (DATASOURCE === 'memory') {
    const { getAnalyticsMemory } = await import('./memory');
    return getAnalyticsMemory(params);
  }
  const { getAnalyticsMock } = await import('./mock');
  return getAnalyticsMock(params);
}
// =============================================
// File: .env.local (use memory provider while no DB exists)
// =============================================
// ANALYTICS_DATASOURCE=memory  # switch to 'mock' or 'sql' later