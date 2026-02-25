// pages/api/coaching/clients/[id]/documents.ts
// Create this file at: pages/api/coaching/clients/[id]/documents.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const coachId = session.user.id as string;
  const { id } = req.query as { id: string };

  // Verify ownership
  const client = await prisma.coachingClient.findFirst({ where: { id, coachId } });
  if (!client) return res.status(404).json({ error: 'Client not found' });

  // ── POST: add a document ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { title, url, type } = req.body as {
      title?: string;
      url?: string;
      type?: string;
    };

    if (!title?.trim()) return res.status(400).json({ error: 'Document title is required' });
    if (!url?.trim())   return res.status(400).json({ error: 'Document URL is required' });

    try {
      const doc = await prisma.coachingDocument.create({
        data: {
          coachingClientId: id,
          coachId,
          title: title.trim(),
          url: url.trim(),
          type: type || 'Other',
        },
      });

      return res.status(201).json({
        document: {
          id: doc.id,
          title: doc.title,
          url: doc.url,
          type: doc.type,
          uploadedAt: doc.uploadedAt.toISOString(),
        },
      });
    } catch (err) {
      console.error('POST document error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ── DELETE: remove a document ─────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { documentId } = req.body as { documentId?: string };
    if (!documentId) return res.status(400).json({ error: 'documentId is required' });

    try {
      await prisma.coachingDocument.deleteMany({
        where: { id: documentId, coachId },
      });
      return res.status(204).end();
    } catch (err) {
      console.error('DELETE document error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['POST', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}