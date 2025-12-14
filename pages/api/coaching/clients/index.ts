// pages/api/coaching/clients/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function toDisplayName(user: any | null, fallbackName?: string | null) {
  if (!user) {
    return fallbackName || '';
  }

  return (
    user.name ||
    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
    user.email ||
    fallbackName ||
    ''
  );
}

function toClientPayload(row: any, user: any | null) {
  // For internal clients, we *can* override display with latest user info.
  const displayName = toDisplayName(user, row.name);
  const email = user?.email || row.email || null;

  return {
    id: row.id as string,
    name: displayName,
    email,
    status: row.status as string,
    next: row.nextSession ? row.nextSession.toISOString() : null,
    last: row.lastContact ? row.lastContact.toISOString() : null,
    // For internal clients we expose the underlying Forge user id
    clientId: row.clientId ?? null,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const coachId = session.user.id as string;

  try {
    // ───────────── GET: list all clients for this coach ─────────────
    if (req.method === 'GET') {
      const rows = await prisma.coachingClient.findMany({
        where: { coachId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          coachId: true,
          clientId: true,
          name: true,
          email: true,
          status: true,
          nextSession: true,
          lastContact: true,
        },
      });

      const userIds = Array.from(
        new Set(
          rows
            .map((r) => r.clientId)
            .filter((id): id is string => !!id)
        )
      );

      const users =
        userIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: userIds } },
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            })
          : [];

      const userMap = new Map<string, any>();
      for (const u of users) {
        userMap.set(u.id, u);
      }

      const clients = rows.map((row) =>
        toClientPayload(
          row,
          row.clientId ? userMap.get(row.clientId) || null : null
        )
      );

      return res.status(200).json({ clients });
    }

    // ───────────── POST: add client (internal or external) ─────────────
    if (req.method === 'POST') {
      const {
        mode,
        status,
        contactUserId,
        name,
        email,
      } = (req.body || {}) as {
        mode?: 'internal' | 'external';
        status?: string;
        contactUserId?: string | null;
        name?: string;
        email?: string | null;
      };

      const finalStatus = status || 'Active';

      // Internal client: must point at a Forge user (User.id)
      if (mode === 'internal') {
        if (!contactUserId) {
          return res
            .status(400)
            .json({ error: 'Missing contactUserId for internal client' });
        }

        // If this coach already has this internal client, just update status
        const existing = await prisma.coachingClient.findFirst({
          where: {
            coachId,
            clientId: contactUserId,
          },
        });

        let row;
        if (existing) {
          row = await prisma.coachingClient.update({
            where: { id: existing.id },
            data: {
              status: finalStatus,
            },
          });
        } else {
          // Pull basic user info to seed name/email
          const user = await prisma.user.findUnique({
            where: { id: contactUserId },
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          });

          const displayName = toDisplayName(user, name || null);
          const userEmail = user?.email || email || null;

          row = await prisma.coachingClient.create({
            data: {
              coachId,
              clientId: contactUserId,
              name: displayName,
              email: userEmail,
              status: finalStatus,
            },
          });
        }

        // Rehydrate with linked user for payload
        const user = await prisma.user.findUnique({
          where: { id: row.clientId! },
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        });

        return res.status(201).json({
          client: toClientPayload(row, user),
        });
      }

      // Default / explicit external mode
      const extName = (name || '').trim();
      if (!extName) {
        return res
          .status(400)
          .json({ error: 'Missing name for external client' });
      }

      const row = await prisma.coachingClient.create({
        data: {
          coachId,
          clientId: null, // external client; no Forge user yet
          name: extName,
          email: email?.trim() || null,
          status: finalStatus,
        },
      });

      return res.status(201).json({
        client: toClientPayload(row, null),
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Coaching clients API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
