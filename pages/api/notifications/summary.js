// pages/api/notifications/summary.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    // 🔹 Contacts count (connected members)
    const contactsCount = await prisma.contact.count({
      where: {
        OR: [{ userId }, { contactUserId: userId }],
      },
    });

    // 🔹 Pending incoming invites (to you)
    const invitesInCount = await prisma.contactRequest.count({
      where: {
        toUserId: userId,
        status: 'PENDING',
      },
    });

    // 🔹 Pending outgoing requests (from you)
    const invitesOutCount = await prisma.contactRequest.count({
      where: {
        fromUserId: userId,
        status: 'PENDING',
      },
    });

    // 🔹 Conversations you are part of (Signal threads)
    const conversationsCount = await prisma.conversationParticipant.count({
      where: { userId },
    });

    // 🔹 Recent profile views (optional: last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const profileViewsCount = await prisma.profileView.count({
      where: {
        targetId: userId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return res.status(200).json({
      ok: true,
      counts: {
        contacts: contactsCount,
        invitesIn: invitesInCount,
        invitesOut: invitesOutCount,
        conversations: conversationsCount,
        profileViews: profileViewsCount,
      },
    });
  } catch (err) {
    console.error('notifications/summary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
