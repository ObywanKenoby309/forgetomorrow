// pages/api/resume/delete.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = session.user.id;
  const { id } = req.body || {};

  const resumeId = Number(id);
  if (!resumeId || Number.isNaN(resumeId)) {
    return res.status(400).json({ error: 'Invalid resume id' });
  }

  try {
    const result = await prisma.resume.deleteMany({
      where: {
        id: resumeId,
        userId,
      },
    });

    if (result.count === 0) {
      return res
        .status(404)
        .json({ error: 'Resume not found or does not belong to you.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[resume/delete] error', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
