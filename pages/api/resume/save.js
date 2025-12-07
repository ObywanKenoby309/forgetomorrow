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

    // ---------------------------------------------------------------------
    // REQUIRED FIELDS
    // ---------------------------------------------------------------------
    const {
      id,             // resume id if updating
      name,
      content,        // MUST contain template + data
      template,       // FE: ensure resume builder passes this each save
      setPrimary,
    } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: 'Missing "name"' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Missing resume content' });
    }

    // ---------------------------------------------------------------------
    // NORMALIZE CONTENT PAYLOAD
    // We accept:
    // 1) Old format: { ... }
    // 2) New format: { template, data }
    // ---------------------------------------------------------------------
    let normalized = {};

    if (content.template && content.data) {
      // Already in correct format
      normalized = content;
    } else {
      // Old format from builder → wrap it
      normalized = {
        template: template || 'hybrid', // fallback to hybrid
        data: content,
      };
    }

    const serializedContent =
      typeof normalized === 'string'
        ? normalized
        : JSON.stringify(normalized);

    // ---------------------------------------------------------------------
    // CHECK RESUME LIMIT
    // ---------------------------------------------------------------------
    const existingCount = await prisma.resume.count({ where: { userId } });

    if (!id && existingCount >= 5) {
      return res
        .status(400)
        .json({ error: 'Resume limit reached (max 5).', limit: 5 });
    }

    // ---------------------------------------------------------------------
    // FIND TARGET IF UPDATING
    // ---------------------------------------------------------------------
    let targetResume = null;

    if (id) {
      targetResume = await prisma.resume.findFirst({
        where: { id: Number(id), userId },
      });

      if (!targetResume) {
        return res.status(404).json({ error: 'Resume not found for this user' });
      }
    }

    // ---------------------------------------------------------------------
    // DETERMINE PRIMARY
    // ---------------------------------------------------------------------
    const shouldBePrimary =
      Boolean(setPrimary) || (!id && existingCount === 0);

    if (shouldBePrimary) {
      await prisma.resume.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    // ---------------------------------------------------------------------
    // SAVE RESUME
    // ---------------------------------------------------------------------
    let saved;

    if (id) {
      saved = await prisma.resume.update({
        where: { id: Number(id) },
        data: {
          name,
          content: serializedContent,
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
