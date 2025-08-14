// lib/track.js
/**
 * Fire-and-forget event tracking that won't break UX.
 * - Dedupe short bursts (e.g., rerenders firing the same event)
 * - Uses navigator.sendBeacon when available; falls back to fetch(keepalive)
 * - Enriches metadata with page context (URL, referrer, viewport, tz)
 *
 * Usage:
 *   track('JOB_VIEW', { jobId })
 *   track('APPLY_SUBMIT', { jobId, applicationId })
 *   track('MESSAGE_SENT', { companyId, recruiterId })
 */

const ALLOWED = new Set(['JOB_VIEW', 'APPLY_SUBMIT', 'MESSAGE_SENT']);

// Simple client-side dedupe cache (eventType + primary id) for N ms
const recent = new Map();

/**
 * @param {string} eventType - 'JOB_VIEW' | 'APPLY_SUBMIT' | 'MESSAGE_SENT'
 * @param {object} payload - ids and optional metadata
 * @param {object} opts - { dedupeKey?: string, dedupeMs?: number }
 */
export async function track(eventType, payload = {}, opts = {}) {
  try {
    // Dev warning for typos
    if (process.env.NODE_ENV !== 'production' && !ALLOWED.has(eventType)) {
      // eslint-disable-next-line no-console
      console.warn(`[track] Unsupported eventType: ${eventType}`);
    }

    // Build a stable dedupe key
    const primaryId =
      payload.jobId || payload.applicationId || payload.companyId || payload.recruiterId || '';
    const dedupeKey = opts.dedupeKey || `${eventType}:${primaryId}`;
    const dedupeMs = typeof opts.dedupeMs === 'number' ? opts.dedupeMs : 3000;

    const now = Date.now();
    const last = recent.get(dedupeKey);
    if (last && now - last < dedupeMs) return; // drop duplicate burst
    recent.set(dedupeKey, now);

    // Page context (guard for SSR)
    const hasWindow = typeof window !== 'undefined' && typeof document !== 'undefined';
    const context = hasWindow
      ? {
          page: {
            href: window.location.href,
            referrer: document.referrer || null,
            title: document.title || null,
          },
          screen: {
            w: window.innerWidth || null,
            h: window.innerHeight || null,
            dpr: window.devicePixelRatio || null,
          },
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        }
      : {};

    // Merge/append metadata
    const metadata =
      payload.metadata && typeof payload.metadata === 'object'
        ? { ...payload.metadata, context }
        : { context };

    const body = JSON.stringify({ eventType, ...payload, metadata });

    // Prefer sendBeacon for reliability on unload
    if (hasWindow && navigator.sendBeacon) {
      const ok = navigator.sendBeacon('/api/analytics/track', new Blob([body], { type: 'application/json' }));
      if (ok) return;
      // fall through to fetch if beacon fails
    }

    // Fallback to fetch with keepalive
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      // keepalive lets it complete on page navigations in supporting browsers
      keepalive: true,
    });
  } catch {
    // swallow errors to keep UI snappy
  }
}
