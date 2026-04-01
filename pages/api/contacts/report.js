// pages/api/contacts/report.js
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

    const reporterId = session.user.id;
    const reporterEmail = session.user.email || null;

    const { targetUserId, reason, source, contextType, contextId } = req.body || {};

    if (!targetUserId || typeof targetUserId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid targetUserId' });
    }

    if (targetUserId === reporterId) {
      return res.status(400).json({ error: 'You cannot report yourself.' });
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        slug: true,
      },
    });

    if (!target) {
      return res.status(404).json({ error: 'Reported user not found.' });
    }

    const trimmedReason =
      typeof reason === 'string' && reason.trim().length > 0
        ? reason.trim()
        : 'No reason provided.';

    const targetName =
      target.name ||
      [target.firstName, target.lastName].filter(Boolean).join(' ') ||
      'Unknown user';

    const subject = `Contact Report – ${targetName}`;

    const initialMessage = [
      `Reporter userId: ${reporterId}`,
      reporterEmail ? `Reporter email: ${reporterEmail}` : null,
      `Target userId: ${target.id}`,
      `Target name: ${targetName}`,
      target.email ? `Target email: ${target.email}` : null,
      target.slug ? `Target slug: ${target.slug}` : null,
      `Source: ${source || 'contact-card'}`,
      `Context type: ${contextType || 'contact'}`,
      contextId ? `Context id: ${contextId}` : null,
      '',
      'Reason:',
      trimmedReason,
    ]
      .filter(Boolean)
      .join('\n');

    await prisma.supportTicket.create({
      data: {
        userId: reporterId,
        userEmail: reporterEmail,
        subject,
        initialMessage,
        source: 'contact-report',
        personaId: 'abuse',
        intent: 'abuse',
        status: 'OPEN',
      },
    });

    return res.status(200).json({ reported: true });
  } catch (err) {
    console.error('[contacts/report] error', err);
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
}