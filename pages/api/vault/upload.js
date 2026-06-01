// pages/api/vault/upload.js
// Accepts PDF and DOCX only, max 10MB.
// Uploads to Supabase Storage, creates VaultUpload record.
// Uses same uploadFile pattern as resume/cover export-foundry endpoints.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage';
import { nanoid } from 'nanoid';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
};

const ALLOWED_TYPES = {
  'application/pdf':                                                     'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword':                                                  'docx',
};

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function safeFileName(name) {
  return String(name || 'document')
    .replace(/[^a-z0-9_.\-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120) || 'document';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const userId = session.user.id;

    // Parse multipart form
    const form = formidable({ maxFileSize: MAX_BYTES, keepExtensions: true });
    const [, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const uploaded = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploaded) return res.status(400).json({ error: 'No file provided' });

    const mimeType = uploaded.mimetype || '';
    const fileType = ALLOWED_TYPES[mimeType];
    if (!fileType) {
      return res.status(400).json({ error: 'Only PDF and DOCX files are allowed' });
    }

    if (uploaded.size > MAX_BYTES) {
      return res.status(400).json({ error: 'File exceeds 10MB limit' });
    }

    const originalName = safeFileName(uploaded.originalFilename || uploaded.newFilename);
    const storagePath = `${userId}/vault/uploads/${nanoid(12)}-${originalName}`;

    const buffer = fs.readFileSync(uploaded.filepath);

    const savedPath = await uploadFile({
      buffer,
      path: storagePath,
      contentType: mimeType,
    });

    // Clean up temp file
    try { fs.unlinkSync(uploaded.filepath); } catch {}

    // Build download URL — same pattern as other Supabase uploads in the codebase
    const downloadUrl = `/api/vault/file?path=${encodeURIComponent(savedPath)}`;

    const record = await prisma.vaultUpload.create({
      data: {
        userId,
        fileName: originalName,
        fileType,
        fileSizeBytes: uploaded.size,
        storagePath: savedPath,
        downloadUrl,
      },
    });

    return res.status(200).json({
      ok: true,
      upload: {
        id: record.id,
        fileName: record.fileName,
        fileType: record.fileType,
        fileSizeBytes: record.fileSizeBytes,
        downloadUrl: record.downloadUrl,
        createdAt: record.createdAt,
      },
    });
  } catch (err) {
    console.error('[api/vault/upload]', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File exceeds 10MB limit' });
    }
    return res.status(500).json({ error: 'Upload failed' });
  }
}