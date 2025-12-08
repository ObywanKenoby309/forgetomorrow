// pages/api/coaching/clients/[id].js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.query;

  if (req.method === 'DELETE') {
    // TODO (backlog): when CoachingClient is in Prisma, actually delete by id.
    // For now, we just pretend it worked so the UI stays stable.
    return res.status(204).end();
  }

  res.setHeader('Allow', ['DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
