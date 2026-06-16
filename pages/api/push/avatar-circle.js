// pages/api/push/avatar-circle.js
// Takes an avatar image URL, crops it into a circle with a transparent background,
// and returns the processed PNG. Used specifically for push notification icons,
// since push notifications are rendered by the OS (not CSS) and need an actual
// transparent-cornered circular image to look correct everywhere.
//
// GET /api/push/avatar-circle?url=<encoded avatar URL>&size=192
//
// Results are cached aggressively (immutable, 1 year) since avatar URLs change
// whenever a new avatar is uploaded (new filename), so the same URL always maps
// to the same image content.

import sharp from 'sharp';

const DEFAULT_SIZE = 192;
const MAX_SIZE = 512;
const FETCH_TIMEOUT_MS = 5000;

function buildCircleMask(size) {
  // SVG circle mask — sharp composites this as an alpha channel to round the corners.
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawUrl = String(req.query.url || '').trim();
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Only allow http(s) URLs — block anything trying to reach internal/file paths.
  let sourceUrl;
  try {
    sourceUrl = new URL(rawUrl);
    if (sourceUrl.protocol !== 'http:' && sourceUrl.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
  } catch {
    return res.status(400).json({ error: 'Invalid url parameter' });
  }

  const requestedSize = parseInt(req.query.size, 10);
  const size = Number.isFinite(requestedSize)
    ? Math.min(Math.max(requestedSize, 32), MAX_SIZE)
    : DEFAULT_SIZE;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const sourceRes = await fetch(sourceUrl.toString(), { signal: controller.signal }).finally(() =>
      clearTimeout(timeout)
    );

    if (!sourceRes.ok) {
      return res.status(502).json({ error: 'Could not fetch source image' });
    }

    const arrayBuffer = await sourceRes.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Resize to a square covering the target size, then composite the circular mask
    // as the alpha channel so corners become transparent.
    const resized = await sharp(inputBuffer)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .ensureAlpha()
      .toBuffer();

    const mask = buildCircleMask(size);

    const circular = await sharp(resized)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(circular);
  } catch (err) {
    console.error('[api/push/avatar-circle] error:', err?.message || err);
    return res.status(500).json({ error: 'Could not process image' });
  }
}