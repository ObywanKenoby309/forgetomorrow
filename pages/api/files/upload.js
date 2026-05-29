// pages/api/files/upload.js
// Accepts a file as base64 in JSON body, stores in Supabase Storage.
// Returns storagePath (never a public URL — access via /api/files/download).
//
// POST body: { fileName, fileBase64, mimeType, context, roomId }

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { uploadFile } from '@/lib/storage';
import { nanoid } from 'nanoid';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb', // slightly above 10MB to allow for base64 overhead
    },
  },
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB decoded

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { fileName, fileBase64, mimeType, context = 'general', roomId = '' } = req.body || {};

  if (!fileName || !fileBase64 || !mimeType) {
    return res.status(400).json({ error: 'fileName, fileBase64, and mimeType are required' });
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return res.status(415).json({ error: `File type not allowed: ${mimeType}` });
  }

  // Decode base64 to buffer
  let buffer;
  try {
    // Strip data URL prefix if present (data:mime/type;base64,...)
    const base64Data = fileBase64.includes(',')
      ? fileBase64.split(',')[1]
      : fileBase64;
    buffer = Buffer.from(base64Data, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid base64 data' });
  }

  if (buffer.length > MAX_SIZE_BYTES) {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }

  // Build storage path
  const ext = path.extname(fileName).toLowerCase() || '';
  const safeName = `${Date.now()}-${nanoid(8)}${ext}`;
  const storagePath = context === 'foundry' && roomId
    ? `${session.user.id}/foundry/${roomId}/${safeName}`
    : `${session.user.id}/${context}/${safeName}`;

  try {
    const savedPath = await uploadFile({ buffer, path: storagePath, contentType: mimeType });

    return res.status(200).json({
      storagePath: savedPath,
      fileName,
      mimeType,
      size: buffer.length,
    });
  } catch (err) {
    console.error('[files/upload]', err);
    return res.status(500).json({ error: 'Could not store file. Please try again.' });
  }
}