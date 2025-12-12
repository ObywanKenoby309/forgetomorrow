// pages/api/contacts/remove.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;
    const { contactUserId } = req.body || {};

    if (!contactUserId || typeof contactUserId !== 'string') {
      return res.status(400).json({ error: 'Missing contactUserId' });
    }

    // Remove relationship in BOTH directions
    await prisma.contact.deleteMany({
      where: {
        OR: [
          { userId, contactUserId },
          { userId: contactUserId, contactUserId: userId },
        ],
      },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contacts/remove] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
