import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const coachId = String(session.user.id || '');
  const { id } = req.query || {};

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid client id' });
  }

  const client = await prisma.coachingClient.findFirst({
    where: { id, coachId },
  });

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

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

      if (!full) {
        return res.status(404).json({ error: 'Client not found' });
      }

      let displayName = full.name;
      let displayEmail = full.email;
      let displayAvatarUrl = '';
      let displaySlug = '';

      if (full.clientId) {
        const user = await prisma.user.findUnique({
          where: { id: full.clientId },
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            slug: true,
            avatarUrl: true,
            image: true,
          },
        });

        if (user) {
          displayName =
            user.name ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            full.name;

          displayEmail = user.email || full.email;
          displayAvatarUrl = user.avatarUrl || user.image || '';
          displaySlug = user.slug || '';
        }
      }

      return res.status(200).json({
        client: {
          id: full.id,
          coachId: full.coachId,
          clientId: full.clientId,
          slug: displaySlug,
          avatarUrl: displayAvatarUrl,
          name: displayName,
          email: displayEmail,
          status: full.status,
          nextSession: full.nextSession?.toISOString() ?? null,
          lastContact: full.lastContact?.toISOString() ?? null,
          notes: full.notes ?? '',
          createdAt: full.createdAt.toISOString(),
          updatedAt: full.updatedAt.toISOString(),
          coachingNotes: (full.coachingNotes || []).map((n) => ({
            id: n.id,
            body: n.body,
            createdAt: n.createdAt.toISOString(),
            updatedAt: n.updatedAt.toISOString(),
          })),
          coachingDocuments: (full.coachingDocuments || []).map((d) => ({
            id: d.id,
            title: d.title,
            url: d.url,
            type: d.type,
            uploadedAt: d.uploadedAt.toISOString(),
          })),
          sessions: (full.sessions || []).map((s) => ({
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

  if (req.method === 'PUT') {
    try {
      const body = req.body || {};
      const { name, email, status, nextSession, lastContact, notes } = body;

      const updated = await prisma.coachingClient.update({
        where: { id },
        data: {
          ...(name !== undefined && typeof name === 'string' && { name: name.trim() }),
          ...(email !== undefined && {
            email: email ? String(email).trim() : null,
          }),
          ...(status !== undefined && { status }),
          ...(notes !== undefined && { notes }),
          ...(nextSession !== undefined && {
            nextSession: nextSession ? new Date(nextSession) : null,
          }),
          ...(lastContact !== undefined && {
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