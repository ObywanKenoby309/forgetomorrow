// pages/api/ads/placements.js

/**
 * PRE-ADS stub:
 * - Always returns an empty placements array.
 * - This gives us stable plumbing so ads can be enabled later without touching pages.
 *
 * Next step (later): wire to DB models (Campaigns, Placements, Targeting, Budgets, etc.)
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    // Read but don't trust inputs (yet)
    const surfaceId = String(req.query.surfaceId || '');
    const slot = String(req.query.slot || '');
    const chrome = String(req.query.chrome || '');

    return res.status(200).json({
      ok: true,
      surfaceId,
      slot,
      chrome,
      placements: [],
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
