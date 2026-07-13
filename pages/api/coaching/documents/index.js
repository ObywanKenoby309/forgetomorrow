// pages/api/coaching/documents/index.js
//
// GET  — returns all CoachingDocuments for the authenticated coach,
//         joined with coachingClient name. R2 references are converted
//         to short-lived signed download URLs.
// POST — multipart upload: stores file in Cloudflare R2, then creates
//         the CoachingDocument record.
//
// File path in bucket: coaching-documents/{coachId}/{documentId}/{filename}
// All operations scoped to session.user.id.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import {
  deleteFile,
  fromR2Reference,
  getSignedUrl,
  toR2Reference,
  uploadFile,
} from '@/lib/storage';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }, // required for multipart
};

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const coachId = session.user.id;

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const documents = await prisma.coachingDocument.findMany({
        where: { coachId },
        include: {
          coachingClient: { select: { id: true, name: true, email: true } },
        },
        orderBy: { uploadedAt: 'desc' },
      });

      const resolvedDocuments = await Promise.all(
        documents.map(async document => {
          const storagePath = fromR2Reference(document.url);
          if (!storagePath) return document;

          try {
            return {
              ...document,
              url: await getSignedUrl(storagePath, 3600),
            };
          } catch (error) {
            console.error('[coaching/documents GET] signed URL', error);
            return { ...document, url: '' };
          }
        })
      );

      return res.status(200).json({ documents: resolvedDocuments });
    } catch (err) {
      console.error('[coaching/documents GET]', err);
      return res.status(500).json({ error: 'Failed to load documents' });
    }
  }

  // ── POST ──────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const form = formidable({ maxFileSize: 20 * 1024 * 1024 }); // 20 MB cap
    let fields;
    let files;

    try {
      [fields, files] = await form.parse(req);
    } catch (err) {
      return res.status(400).json({ error: 'Failed to parse upload' });
    }

    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
    const coachingClientId = Array.isArray(fields.coachingClientId)
      ? fields.coachingClientId[0]
      : fields.coachingClientId;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!coachingClientId) return res.status(400).json({ error: 'Client is required' });
    if (!file) return res.status(400).json({ error: 'File is required' });

    const client = await prisma.coachingClient.findFirst({
      where: { id: coachingClientId, coachId },
    });
    if (!client) return res.status(403).json({ error: 'Client not found or not yours' });

    let doc;
    try {
      doc = await prisma.coachingDocument.create({
        data: {
          coachId,
          coachingClientId,
          title: title.trim(),
          type: type || 'Other',
          url: '',
        },
      });
    } catch (err) {
      console.error('[coaching/documents POST] db create', err);
      return res.status(500).json({ error: 'Failed to create document record' });
    }

    const originalName = file.originalFilename || 'document';
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `coaching-documents/${coachId}/${doc.id}/${safeName}`;
    const fileBuffer = fs.readFileSync(file.filepath);

    try {
      await uploadFile({
        buffer: fileBuffer,
        path: storagePath,
        contentType: file.mimetype || 'application/octet-stream',
      });
    } catch (uploadError) {
      await prisma.coachingDocument.delete({ where: { id: doc.id } }).catch(() => {});
      console.error('[coaching/documents POST] storage upload', uploadError);
      return res.status(500).json({ error: 'File upload failed' });
    }

    try {
      const updated = await prisma.coachingDocument.update({
        where: { id: doc.id },
        data: { url: toR2Reference(storagePath) },
        include: {
          coachingClient: { select: { id: true, name: true, email: true } },
        },
      });

      return res.status(201).json({
        document: {
          ...updated,
          url: await getSignedUrl(storagePath, 3600),
        },
      });
    } catch (error) {
      await deleteFile(storagePath).catch(() => {});
      await prisma.coachingDocument.delete({ where: { id: doc.id } }).catch(() => {});
      console.error('[coaching/documents POST] db update', error);
      return res.status(500).json({ error: 'Failed to finalize document upload' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
