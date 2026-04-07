// pages/api/coaching/documents/index.js
//
// GET  — returns all CoachingDocuments for the authed coach,
//         joined with coachingClient name
// POST — multipart upload: stores file in Supabase Storage
//         (bucket: coaching-documents), then creates CoachingDocument
//         record with the resulting public URL
//
// File path in bucket: {coachId}/{documentId}/{filename}
// All operations scoped to session.user.id.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }, // required for multipart
};

const BUCKET = 'coaching-documents';

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
      return res.status(200).json({ documents });
    } catch (err) {
      console.error('[coaching/documents GET]', err);
      return res.status(500).json({ error: 'Failed to load documents' });
    }
  }

  // ── POST ──────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    // Parse multipart form
    const form = formidable({ maxFileSize: 20 * 1024 * 1024 }); // 20 MB cap
    let fields, files;
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

    // Verify client belongs to this coach
    const client = await prisma.coachingClient.findFirst({
      where: { id: coachingClientId, coachId },
    });
    if (!client) return res.status(403).json({ error: 'Client not found or not yours' });

    // Create the DB record first to get the ID for the storage path
    let doc;
    try {
      doc = await prisma.coachingDocument.create({
        data: {
          coachId,
          coachingClientId,
          title: title.trim(),
          type: type || 'Other',
          url: '', // filled in after upload
        },
      });
    } catch (err) {
      console.error('[coaching/documents POST] db create', err);
      return res.status(500).json({ error: 'Failed to create document record' });
    }

    // Upload to Supabase Storage
    const originalName = file.originalFilename || 'document';
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `${coachId}/${doc.id}/${safeName}`;
    const fileBuffer = fs.readFileSync(file.filepath);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      // Clean up the orphaned DB record
      await prisma.coachingDocument.delete({ where: { id: doc.id } }).catch(() => {});
      console.error('[coaching/documents POST] storage upload', uploadError);
      return res.status(500).json({ error: 'File upload failed' });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData?.publicUrl || '';

    // Update the record with the real URL
    const updated = await prisma.coachingDocument.update({
      where: { id: doc.id },
      data: { url: publicUrl },
      include: {
        coachingClient: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json({ document: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}