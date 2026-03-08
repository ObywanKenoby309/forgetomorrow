// pages/api/search/jobs.js
import { searchService } from '@/lib/searchClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      query = '',
      companyFilter = '',
      locationFilter = '',
      locationTypeFilter = '',
      pageSize = 20,
      currentPage = 1,
    } = req.body || {};

    const limit = Number(pageSize) || 20;
    const offset = (Math.max(Number(currentPage) || 1, 1) - 1) * limit;

    const filters = {};

    // Map existing jobs page filters to the search service
    if (locationFilter) filters.location = locationFilter;
    if (locationTypeFilter) filters.worksite = locationTypeFilter;

    const response = await searchService({
      query: query || '',
      entity: 'jobs',
      filters,
      limit,
      offset,
    });

    let results = Array.isArray(response.results) ? response.results : [];

    // Keep company filter local for tonight so we ship fast
    if (companyFilter) {
      const companyNeedle = String(companyFilter).trim().toLowerCase();
      results = results.filter((r) =>
        String(r?.data?.company || '').toLowerCase().includes(companyNeedle)
      );
    }

    return res.status(200).json({
      jobs: results.map((r) => ({
        id: r.id,
        ...r.data,
        score: r.score,
      })),
      total: results.length,
      rawTotal: response.total,
      executionMs: response.executionMs,
      parsedQuery: response.query,
    });
  } catch (error) {
    console.error('[api/search/jobs] error:', error);
    return res.status(500).json({ error: 'Job search failed' });
  }
}