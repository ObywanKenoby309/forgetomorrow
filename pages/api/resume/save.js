// pages/api/resume/save.js
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

    if (!session || !session.user || !session.user.email) {
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

    const {
      id,         // optional — if present, update instead of create
      name,
      content,    // can be object or string from the builder
      setPrimary, // optional boolean
    } = req.body || {};

    // name is required; content just needs to be non-null/undefined
    if (!name || content === undefined || content === null) {
      return res.status(400).json({ error: 'Missing "name" or "content"' });
    }

    // Prisma expects String here, but the builder sends an object.
    // Safely serialize to JSON, but avoid double-stringifying.
    const serializedContent =
      typeof content === 'string' ? content : JSON.stringify(content);

    const existingCount = await prisma.resume.count({
      where: { userId },
    });

    // If creating a new resume (no id) enforce max 5
    if (!id && existingCount >= 5) {
      return res.status(400).json({
        error: 'Resume limit reached (max 5). Delete one before adding another.',
        limit: 5,
      });
    }

    let targetResume = null;
    if (id) {
      targetResume = await prisma.resume.findFirst({
        where: { id: Number(id), userId },
      });

      if (!targetResume) {
        return res.status(404).json({ error: 'Resume not found for this user' });
      }
    }

    // Decide if this resume should be primary
    const shouldBePrimary =
      Boolean(setPrimary) ||
      (!id && existingCount === 0); // first ever resume => primary by default

    // If this should be primary, clear primary flag on all others first
    if (shouldBePrimary) {
      await prisma.resume.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    let saved;

    if (id) {
      saved = await prisma.resume.update({
        where: { id: Number(id) },
        data: {
          name,
          content: serializedContent,
          // if caller wants primary, use it; otherwise keep the existing flag
          isPrimary: shouldBePrimary ? true : targetResume.isPrimary,
        },
      });
    } else {
      saved = await prisma.resume.create({
        data: {
          userId,
          name,
          content: serializedContent,
          isPrimary: shouldBePrimary,
        },
      });
    }

    return res.status(200).json({
      resume: saved,
      limit: 5,
    });
  } catch (err) {
    console.error('[resume/save] Error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
