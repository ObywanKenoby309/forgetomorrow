// pages/api/signal/start-or-get.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;
    const { toUserId, channel = 'seeker' } = req.body || {};

    if (!toUserId || typeof toUserId !== 'string') {
      return res.status(400).json({ error: 'Missing toUserId' });
    }

    if (toUserId === userId) {
      return res.status(400).json({ error: 'You cannot message yourself.' });
    }

    // ─────────────────────────────────────────────────────────────
    // 0. Load target user (for role + display)
    // ─────────────────────────────────────────────────────────────
    const target = await prisma.user.findUnique({
      where: { id: toUserId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        headline: true,
        role: true, // enum UserRole (e.g. SEEKER / COACH / RECRUITER / ADMIN)
      },
    });

    if (!target) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const targetRole = target.role;
    const otherName =
      target.name ||
      [target.firstName, target.lastName].filter(Boolean).join(' ') ||
      'Member';

    // ─────────────────────────────────────────────────────────────
    // 0.5 DM GATE: Coach / Recruiter require connection first
    // ─────────────────────────────────────────────────────────────
    const normalizedRole =
      typeof targetRole === 'string' ? targetRole.toUpperCase() : null;

    if (normalizedRole === 'COACH' || normalizedRole === 'RECRUITER') {
      const existingContact = await prisma.contact.findFirst({
        where: {
          OR: [
            { userId, contactUserId: toUserId },
            { userId: toUserId, contactUserId: userId },
          ],
        },
      });

      if (!existingContact) {
        const isCoach = normalizedRole === 'COACH';

        return res.status(200).json({
          ok: false,
          blocked: true,
          blockReason: 'ROLE_GATE',
          role: normalizedRole,
          message: isCoach
            ? 'To respect the privacy of coaches, please send a connection request or engage through their mentorship programs before opening a private conversation.'
            : 'To respect the privacy of recruiters, please send a connection request before opening a private conversation.',
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 1. Try to find an existing 1:1 conversation for these users
    // ─────────────────────────────────────────────────────────────
    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        channel,
        participants: {
          some: { userId },
        },
        AND: {
          participants: {
            some: { userId: toUserId },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    // ─────────────────────────────────────────────────────────────
    // 2. If not found, create it (plus participants)
    // ─────────────────────────────────────────────────────────────
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          channel,
          participants: {
            // keep same shape as your original (no roles to avoid schema mismatch)
            create: [{ userId }, { userId: toUserId }],
          },
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Return same shape as your original (plus role on otherUser)
    // ─────────────────────────────────────────────────────────────
    return res.status(200).json({
      ok: true,
      conversation: {
        id: conversation.id,
        isGroup: conversation.isGroup,
        title: otherName,
        channel: conversation.channel,
      },
      otherUser: {
        id: target.id,
        name: otherName,
        avatarUrl: target.avatarUrl || null,
        headline: target.headline || '',
        role: targetRole || null,
      },
    });
  } catch (err) {
    console.error('signal/start-or-get error:', err);

    return res.status(500).json({
      error: 'Internal server error',
      detail: String(err),
      code: err?.code || null,
    });
  }
}
