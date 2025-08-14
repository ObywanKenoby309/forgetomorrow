// pages/api/analytics/track.js
import { prisma } from '@/lib/prisma';

const ALLOWED = new Set(['JOB_VIEW', 'APPLY_SUBMIT', 'MESSAGE_SENT']);
const MAX_METADATA_BYTES = 8 * 1024; // 8KB soft cap

function clampMetadata(meta) {
  try {
    const str = JSON.stringify(meta ?? {});
    if (Buffer.byteLength(str, 'utf8') <= MAX_METADATA_BYTES) return meta ?? {};
    // If too large, keep a tiny marker only
    return { truncated: true };
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const {
      eventType,
      userId = null,
      companyId = null,
      jobId = null,
      recruiterId = null,
      applicationId = null,
      metadata = {},
    } = req.body || {};

    // Validate event type
    if (!eventType || !ALLOWED.has(eventType)) {
      return res.status(400).json({ ok: false, error: 'Invalid or missing eventType' });
    }

    // Optional: very light string sanitation (keep nulls if not provided)
    const data = {
      eventType: String(eventType),
      userId: userId ? String(userId) : null,
      companyId: companyId ? String(companyId) : null,
      jobId: jobId ? String(jobId) : null,
      recruiterId: recruiterId ? String(recruiterId) : null,
      applicationId: applicationId ? String(applicationId) : null,
      metadata: clampMetadata({
        ...metadata,
        context: {
          ip: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket?.remoteAddress || null,
          ua: req.headers['user-agent'] || null,
        },
      }),
    };

    await prisma.analyticsEvent.create({ data });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('analytics/track error:', e);
    return res.status(500).json({ ok: false });
  }
}
