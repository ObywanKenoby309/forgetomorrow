// pages/api/vault/file.js
// Streams a vault file from Supabase Storage.
// Access: sender, recipient of a VaultShare, or owner of a VaultUpload.
// Same streaming pattern as /api/files/download.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, BUCKET } from '@/lib/storage';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { path: storagePath } = req.query;
  if (!storagePath) return res.status(400).json({ error: 'path required' });

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const userId = session.user.id;
    const resolvedPath = String(storagePath);

    // ── Access control ────────────────────────────────────────────────────────
    // Check: is the user the sender or recipient of a VaultShare with this path?
    const shareAccess = await prisma.vaultShare.findFirst({
      where: {
        storagePath: resolvedPath,
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
      select: { id: true, fileName: true },
    });

    // Check: is the user the owner of a VaultUpload with this path?
    const uploadAccess = !shareAccess
      ? await prisma.vaultUpload.findFirst({
          where: { storagePath: resolvedPath, userId },
          select: { id: true, fileName: true },
        })
      : null;

    if (!shareAccess && !uploadAccess) {
      return res.status(403).json({ error: 'You do not have access to this file' });
    }

    const fileName = shareAccess?.fileName || uploadAccess?.fileName || 'document.pdf';

    // ── Stream from Supabase Storage ──────────────────────────────────────────
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(resolvedPath);

    if (error || !data) {
      console.error('[vault/file] storage error:', error);
      return res.status(404).json({ error: 'File not found in storage' });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    const ext = resolvedPath.split('.').pop()?.toLowerCase() || 'pdf';
    const mimeMap = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const contentType = mimeMap[ext] || 'application/pdf';
    const safeFileName = encodeURIComponent(fileName);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-cache');

    return res.status(200).send(buffer);
  } catch (err) {
    console.error('[api/vault/file]', err);
    return res.status(500).json({ error: 'Could not retrieve file' });
  }
}