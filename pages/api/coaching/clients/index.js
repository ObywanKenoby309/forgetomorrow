// pages/api/coaching/clients/index.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  // Require login
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    // TODO (backlog): replace with real Prisma-backed CoachingClient model
    // For launch, return a clean empty list (no fake data, no crashes).
    return res.status(200).json({ clients: [] });
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}
