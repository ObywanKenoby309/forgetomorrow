// lib/storage.js
// Cloudflare R2 storage helpers (server-side only)
// Never import this in client-side code

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as createPresignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET } from '@/lib/r2Client';

export const BUCKET = R2_BUCKET;

function normalizePath(path) {
  return String(path || '').replace(/^\/+/, '');
}

// Upload a file buffer to Cloudflare R2.
// Returns the storage path (not a public URL).
export async function uploadFile({ buffer, path, contentType }) {
  const key = normalizePath(path);
  if (!key) throw new Error('Storage upload failed: path is required');

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    })
  );

  return key;
}

// Generate a signed URL for a stored file (expires in seconds).
export async function getSignedUrl(path, expiresIn = 3600) {
  const key = normalizePath(path);
  if (!key) throw new Error('Signed URL failed: path is required');

  return createPresignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

// Delete a file from storage.
export async function deleteFile(path) {
  const key = normalizePath(path);
  if (!key) return true;

  await r2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  return true;
}

// Stable same-origin URL for media that may be displayed publicly.
// The API route streams the object from R2 without exposing credentials.
export function getMediaUrl(path) {
  const key = normalizePath(path);
  return `/api/media/${key.split('/').map(encodeURIComponent).join('/')}`;
}

// Store private object references in the existing DB URL field without
// pretending they are permanent public URLs.
export function toR2Reference(path) {
  return `r2://${normalizePath(path)}`;
}

export function fromR2Reference(value) {
  const text = String(value || '');
  if (text.startsWith('r2://')) return normalizePath(text.slice(5));
  if (text.startsWith('/api/media/')) {
    return text
      .slice('/api/media/'.length)
      .split('/')
      .map(segment => decodeURIComponent(segment))
      .join('/');
  }
  return null;
}
