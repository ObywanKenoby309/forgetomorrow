// pages/api/resume/setPrimary.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const userId = session.user.id;
  const { resumeId } = req.body || {};
  if (!resumeId) return res.status(400).json({ error: 'Missing resumeId' });

  await prisma.resume.updateMany({ where: { userId }, data: { isPrimary: false } });
  await prisma.resume.update({ where: { id: resumeId }, data: { isPrimary: true } });

  return res.json({ success: true });
}
