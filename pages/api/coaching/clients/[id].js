// pages/api/coaching/clients/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const coachId = session.user.id as string;
  const { id } = req.query as { id: string };

  // ── Verify ownership ──────────────────────────────────────────────────────
  const client = await prisma.coachingClient.findFirst({
    where: { id, coachId },
  });

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const full = await prisma.coachingClient.findUnique({
        where: { id },
        include: {
          coachingNotes: {
            orderBy: { createdAt: 'desc' },
          },
          coachingDocuments: {
            orderBy: { uploadedAt: 'desc' },
          },
          sessions: {
            orderBy: { startAt: 'desc' },
            take: 20,
          },
        },
      });

      // Hydrate display name/email from linked User if internal client
      let displayName = full!.name;
      let displayEmail = full!.email;

      if (full!.clientId) {
        const user = await prisma.user.findUnique({
          where: { id: full!.clientId },
          select: { id: true, name: true, firstName: true, lastName: true, email: true },
        });
        if (user) {
          displayName =
            user.name ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            full!.name;
          displayEmail = user.email || full!.email;
        }
      }

      return res.status(200).json({
        client: {
          id: full!.id,
          coachId: full!.coachId,
          clientId: full!.clientId,
          name: displayName,
          email: displayEmail,
          status: full!.status,
          nextSession: full!.nextSession?.toISOString() ?? null,
          lastContact: full!.lastContact?.toISOString() ?? null,
          notes: full!.notes ?? '',
          createdAt: full!.createdAt.toISOString(),
          updatedAt: full!.updatedAt.toISOString(),
          coachingNotes: full!.coachingNotes.map((n) => ({
            id: n.id,
            body: n.body,
            createdAt: n.createdAt.toISOString(),
            updatedAt: n.updatedAt.toISOString(),
          })),
          coachingDocuments: full!.coachingDocuments.map((d) => ({
            id: d.id,
            title: d.title,
            url: d.url,
            type: d.type,
            uploadedAt: d.uploadedAt.toISOString(),
          })),
          sessions: full!.sessions.map((s) => ({
            id: s.id,
            startAt: s.startAt.toISOString(),
            durationMin: s.durationMin,
            type: s.type,
            status: s.status,
            notes: s.notes ?? '',
            followUpDueAt: s.followUpDueAt?.toISOString() ?? null,
            followUpDone: s.followUpDone,
          })),
        },
      });
    } catch (err) {
      console.error('GET client error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ── PUT ───────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    try {
      const { name, email, status, nextSession, lastContact, notes } =
        req.body as {
          name?: string;
          email?: string | null;
          status?: string;
          nextSession?: string | null;
          lastContact?: string | null;
          notes?: string;
        };

      const updated = await prisma.coachingClient.update({
        where: { id },
        data: {
          ...(name     !== undefined && { name:        name.trim() }),
          ...(email    !== undefined && { email:       email?.trim() || null }),
          ...(status   !== undefined && { status }),
          ...(notes    !== undefined && { notes }),
          ...(nextSession  !== undefined && {
            nextSession: nextSession ? new Date(nextSession) : null,
          }),
          ...(lastContact  !== undefined && {
            lastContact: lastContact ? new Date(lastContact) : null,
          }),
        },
      });

      return res.status(200).json({
        client: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          status: updated.status,
          nextSession: updated.nextSession?.toISOString() ?? null,
          lastContact: updated.lastContact?.toISOString() ?? null,
          notes: updated.notes ?? '',
        },
      });
    } catch (err) {
      console.error('PUT client error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      await prisma.coachingClient.delete({ where: { id } });
      return res.status(204).end();
    } catch (err) {
      console.error('DELETE client error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}