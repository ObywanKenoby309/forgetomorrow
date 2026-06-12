// pages/api/hearth/forums/index.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const threads = await prisma.hearthForumThread.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: { id: true, name: true, firstName: true, lastName: true, slug: true, avatarUrl: true, image: true, headline: true },
        },
        sourcePost: {
          select: { id: true, type: true, createdAt: true },
        },
        _count: { select: { replies: true } },
      },
    });

    return res.status(200).json({
      threads: threads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        body: thread.body,
        category: thread.category,
        sourcePostId: thread.sourcePostId,
        authorId: thread.authorId,
        authorName:
          thread.author?.name ||
          [thread.author?.firstName, thread.author?.lastName].filter(Boolean).join(' ') ||
          'Member',
        authorSlug: thread.author?.slug || null,
        authorAvatar: thread.author?.avatarUrl || thread.author?.image || null,
        authorHeadline: thread.author?.headline || null,
        replyCount: thread._count?.replies || 0,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      })),
    });
  } catch (err) {
    console.error('[HEARTH FORUMS LIST ERROR]', err);
    return res.status(500).json({ error: 'Failed to load Hearth discussions.' });
  }
}
