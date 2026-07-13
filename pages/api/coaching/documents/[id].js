// pages/api/coaching/documents/[id].js
//
// DELETE — removes the CoachingDocument record and its Cloudflare R2 object.
//          Scoped to the authenticated coach.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { deleteFile, fromR2Reference } from '@/lib/storage';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const coachId = session.user.id;
  const { id } = req.query;

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const doc = await prisma.coachingDocument.findFirst({
      where: { id, coachId },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const storagePath = fromR2Reference(doc.url);
    if (storagePath) {
      try {
        await deleteFile(storagePath);
      } catch (removeError) {
        // Log but do not block DB cleanup.
        console.error('[coaching/documents DELETE] storage remove', removeError);
      }
    }

    await prisma.coachingDocument.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[coaching/documents DELETE]', err);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
}
