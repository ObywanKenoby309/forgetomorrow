// lib/r2Client.js
// Cloudflare R2 client (server-side only). Never import this in client-side code.

import { S3Client } from '@aws-sdk/client-s3';

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.warn('[r2] Missing R2 environment variables');
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'forge-media';

export const r2 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});
