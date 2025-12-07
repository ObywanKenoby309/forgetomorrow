// pages/api/resume/setPrimary.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = session.user.id;
  const { resumeId } = req.body || {};
  if (!resumeId) return res.status(400).json({ error: 'Missing resumeId' });

  // Clear previous primary
  await prisma.resume.updateMany({
    where: { userId },
    data: { isPrimary: false },
  });

  // Set new primary (guarded by userId)
  await prisma.resume.updateMany({
    where: { id: Number(resumeId), userId },
    data: { isPrimary: true },
  });

  return res.json({ success: true });
}
