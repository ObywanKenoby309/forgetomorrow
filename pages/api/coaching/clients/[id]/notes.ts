// pages/api/coaching/clients/[id]/notes.ts
// Create this file at: pages/api/coaching/clients/[id]/notes.ts
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

  // ── POST: add a note ──────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { body } = req.body as { body?: string };
    if (!body?.trim()) return res.status(400).json({ error: 'Note body is required' });

    try {
      const note = await prisma.coachingNote.create({
        data: {
          coachingClientId: id,
          coachId,
          body: body.trim(),
        },
      });

      return res.status(201).json({
        note: {
          id: note.id,
          body: note.body,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        },
      });
    } catch (err) {
      console.error('POST note error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ── DELETE: remove a note (pass noteId in body) ───────────────────────────
  if (req.method === 'DELETE') {
    const { noteId } = req.body as { noteId?: string };
    if (!noteId) return res.status(400).json({ error: 'noteId is required' });

    try {
      await prisma.coachingNote.deleteMany({
        where: { id: noteId, coachId },
      });
      return res.status(204).end();
    } catch (err) {
      console.error('DELETE note error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['POST', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}