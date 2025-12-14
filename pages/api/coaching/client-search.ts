// pages/api/coaching/client-search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const coachId = session.user.id as string;
  const q = String(req.query.q ?? '').trim().toLowerCase();

  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: coachId },
      include: {
        contactUser: true,
      },
    });

    const results = contacts
      .map((c) => {
        const u = c.contactUser;
        if (!u) return null;

        const name =
          u.name ||
          `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
          u.email;

        const headline =
          (u.headline as string | null | undefined) ||
          undefined;

        return {
          id: u.id,
          name,
          email: u.email,
          headline,
        };
      })
      .filter(Boolean) as { id: string; name: string; email: string; headline?: string }[];

    const filtered = q
      ? results.filter((r) => {
          const haystack =
            `${r.name} ${r.email} ${r.headline || ''}`.toLowerCase();
          return haystack.includes(q);
        })
      : results;

    // Light limit for UI
    return res.status(200).json({ results: filtered.slice(0, 20) });
  } catch (err) {
    console.error('Error in /api/coaching/client-search:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
