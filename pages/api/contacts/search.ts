// pages/api/contacts/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔐 Require logged-in user
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id as string;
  const q = String(req.query.q || '').trim().toLowerCase();

  try {
    // Pull this coach/user's contacts with their related contactUser
    const contacts = await prisma.contact.findMany({
      where: { userId },
      include: {
        contactUser: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter in JS – safe and fast for typical contact list sizes
    const filtered = contacts.filter((c) => {
      const u = c.contactUser;
      if (!u) return false;

      const name =
        (u.name ||
          `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
          u.email ||
          ''
        ).toLowerCase();

      const email = (u.email || '').toLowerCase();

      if (!q) {
        // If no query, just show everything (or you could limit to first N)
        return true;
      }

      return name.includes(q) || email.includes(q);
    });

    // Shape payload to what the UI expects
    const results = filtered.map((c) => {
      const u = c.contactUser!;
      const displayName =
        u.name ||
        `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
        u.email ||
        'Unknown';

      return {
        // The "user" being contacted
        id: u.id,
        // The Contact row id (if needed later)
        contactId: c.id,
        name: displayName,
        email: u.email,
        headline: u.headline ?? null,
        avatarUrl: u.avatarUrl ?? null,
      };
    });

    return res.status(200).json({ contacts: results });
  } catch (err) {
    console.error('Error in /api/contacts/search:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
