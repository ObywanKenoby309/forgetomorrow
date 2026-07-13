// pages/api/media/[...key].js
// Streams public feed media from Cloudflare R2 through the ForgeTomorrow domain.

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET } from '@/lib/r2Client';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end('Method not allowed');
  }

  const rawKey = Array.isArray(req.query.key) ? req.query.key.join('/') : req.query.key;
  const key = String(rawKey || '').replace(/^\/+/, '');

  // This route is intentionally limited to feed media. Private documents use
  // signed URLs generated server-side and never pass through this public route.
  if (!key.startsWith('feed-media/')) {
    return res.status(403).end('Forbidden');
  }

  try {
    const object = await r2.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );

    res.setHeader('Content-Type', object.ContentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (object.ContentLength != null) {
      res.setHeader('Content-Length', String(object.ContentLength));
    }
    if (object.ETag) res.setHeader('ETag', object.ETag);

    if (req.method === 'HEAD') return res.status(200).end();

    if (!object.Body) return res.status(404).end('Not found');

    if (typeof object.Body.pipe === 'function') {
      object.Body.pipe(res);
      return;
    }

    const bytes = await object.Body.transformToByteArray();
    return res.status(200).send(Buffer.from(bytes));
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode === 404 ? 404 : 500;
    console.error('[R2 MEDIA GET]', error);
    return res.status(status).end(status === 404 ? 'Not found' : 'Failed to load media');
  }
}
