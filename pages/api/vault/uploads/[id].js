// pages/api/vault/uploads/[id].js
// DELETE — removes a VaultUpload record and its Supabase Storage file.
// Only the owner can delete their own uploads.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const upload = await prisma.vaultUpload.findFirst({
      where: { id: String(id), userId: session.user.id },
    });

    if (!upload) return res.status(404).json({ error: 'Upload not found' });

    // Clean up Supabase Storage
    if (upload.storagePath) {
      try {
        const { deleteFile } = await import('@/lib/storage');
        await deleteFile(upload.storagePath);
      } catch (storageErr) {
        console.error('[vault/uploads/delete] storage cleanup error:', storageErr);
        // Non-blocking — still delete the DB record
      }
    }

    await prisma.vaultUpload.delete({ where: { id: upload.id } });

    return res.status(200).json({ ok: true, id: upload.id });
  } catch (err) {
    console.error('[api/vault/uploads/[id]]', err);
    return res.status(500).json({ error: 'Could not delete upload' });
  }
}