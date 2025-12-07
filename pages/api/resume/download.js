// pages/api/resume/download.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;
    const { id } = req.query || {};
    const resumeId = Number(id);

    if (!resumeId || Number.isNaN(resumeId)) {
      return res.status(400).json({ error: 'Invalid resume id' });
    }

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found for this user' });
    }

    const baseName =
      (resume.name && resume.name.trim()) || 'resume';

    // very simple filename sanitizing
    const safeName = baseName.replace(/[^a-z0-9_\-]+/gi, '_');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}.json"`
    );

    // resume.content is already a string (JSON from builder)
    return res.status(200).send(resume.content);
  } catch (err) {
    console.error('[api/resume/download] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
