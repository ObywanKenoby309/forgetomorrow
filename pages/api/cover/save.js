import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
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

    if (!user?.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;

    const { id, jobId, name, content, setPrimary } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: 'Missing "name"' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Missing cover content' });
    }

    const serializedContent =
      typeof content === 'string' ? content : JSON.stringify(content);

    // Optional jobId
    const parsedJobId =
      jobId === null || jobId === undefined || jobId === ''
        ? null
        : Number(jobId);

    if (parsedJobId !== null && Number.isNaN(parsedJobId)) {
      return res.status(400).json({ error: 'Invalid "jobId"' });
    }

    // Limit (match resume pattern; adjust if you want different)
    const existingCount = await prisma.cover.count({ where: { userId } });
    if (!id && existingCount >= 5) {
      return res
        .status(400)
        .json({ error: 'Cover limit reached (max 5).', limit: 5 });
    }

    // If updating, ensure ownership
    let targetCover = null;
    if (id) {
      targetCover = await prisma.cover.findFirst({
        where: { id: Number(id), userId },
      });

      if (!targetCover) {
        return res.status(404).json({ error: 'Cover not found for this user' });
      }
    }

    const shouldBePrimary =
      Boolean(setPrimary) || (!id && existingCount === 0);

    if (shouldBePrimary) {
      await prisma.cover.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    let saved;

    if (id) {
      saved = await prisma.cover.update({
        where: { id: Number(id) },
        data: {
          name,
          content: serializedContent,
          jobId: parsedJobId,
          isPrimary: shouldBePrimary ? true : targetCover.isPrimary,
        },
      });
    } else {
      saved = await prisma.cover.create({
        data: {
          userId,
          name,
          content: serializedContent,
          jobId: parsedJobId,
          isPrimary: shouldBePrimary,
        },
      });
    }

    return res.status(200).json({ cover: saved, limit: 5 });
  } catch (err) {
    console.error('[api/cover/save] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
