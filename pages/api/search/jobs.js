// pages/api/search/jobs.js
import { searchService } from '@/lib/searchClient';
import { expandStateNamesInQuery, expandStateQuery } from '@/lib/stateNormalize';

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

    // ── State-name normalization ──────────────────────────────────────────
    // If the user typed a full state name (e.g. "Tennessee"), expand it so
    // the search service can match records stored as "Nashville, TN" etc.
    //
    // We do this in TWO places:
    //  1. The free-text query  →  "engineer Tennessee" becomes "engineer Tennessee TN"
    //  2. The location filter  →  "Tennessee" becomes OR-joined ["Tennessee","TN"]
    // ─────────────────────────────────────────────────────────────────────

    // 1. Expand state names embedded in the free-text query
    const normalizedQuery = expandStateNamesInQuery(query || '');

    // 2. Expand the location filter into alternate forms
    //    The search service accepts a single string for filters.location,
    //    so we join the expanded variants with a space — the FTS parser
    //    treats them as OR terms and trigram picks up partial matches.
    const locationVariants = expandStateQuery(locationFilter);
    const normalizedLocation = locationVariants.join(' ');

    const filters = {};
    if (normalizedLocation) filters.location = normalizedLocation;
    if (locationTypeFilter) filters.worksite = locationTypeFilter;

    const response = await searchService({
      query: normalizedQuery,
      entity: 'jobs',
      filters,
      limit,
      offset,
    });

    let results = Array.isArray(response.results) ? response.results : [];

    // Keep company filter local (fast-ship; move to service later)
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