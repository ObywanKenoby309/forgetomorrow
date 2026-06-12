// pages/api/hearth/forums/[id].js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function displayName(user) {
  return user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Member';
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const id = String(req.query?.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Missing thread id' });

  try {
    if (req.method === 'GET') {
      const thread = await prisma.hearthForumThread.findUnique({
        where: { id },
        include: {
          author: {
            select: { id: true, name: true, firstName: true, lastName: true, slug: true, avatarUrl: true, image: true, headline: true },
          },
          sourcePost: { select: { id: true, type: true, createdAt: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: { id: true, name: true, firstName: true, lastName: true, slug: true, avatarUrl: true, image: true, headline: true },
              },
            },
          },
        },
      });

      if (!thread) return res.status(404).json({ error: 'Thread not found' });

      return res.status(200).json({
        thread: {
          id: thread.id,
          title: thread.title,
          body: thread.body,
          category: thread.category,
          sourcePostId: thread.sourcePostId,
          authorId: thread.authorId,
          authorName: displayName(thread.author),
          authorSlug: thread.author?.slug || null,
          authorAvatar: thread.author?.avatarUrl || thread.author?.image || null,
          authorHeadline: thread.author?.headline || null,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          replies: thread.replies.map((reply) => ({
            id: reply.id,
            body: reply.body,
            authorId: reply.authorId,
            authorName: displayName(reply.author),
            authorSlug: reply.author?.slug || null,
            authorAvatar: reply.author?.avatarUrl || reply.author?.image || null,
            authorHeadline: reply.author?.headline || null,
            createdAt: reply.createdAt,
          })),
        },
      });
    }

    if (req.method === 'POST') {
      const body = String(req.body?.body || '').trim();
      if (!body) return res.status(400).json({ error: 'Reply body is required.' });

      const thread = await prisma.hearthForumThread.findUnique({ where: { id }, select: { id: true } });
      if (!thread) return res.status(404).json({ error: 'Thread not found' });

      const reply = await prisma.hearthForumReply.create({
        data: { threadId: id, authorId: session.user.id, body },
        include: {
          author: {
            select: { id: true, name: true, firstName: true, lastName: true, slug: true, avatarUrl: true, image: true, headline: true },
          },
        },
      });

      await prisma.hearthForumThread.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return res.status(201).json({
        reply: {
          id: reply.id,
          body: reply.body,
          authorId: reply.authorId,
          authorName: displayName(reply.author),
          authorSlug: reply.author?.slug || null,
          authorAvatar: reply.author?.avatarUrl || reply.author?.image || null,
          authorHeadline: reply.author?.headline || null,
          createdAt: reply.createdAt,
        },
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[HEARTH FORUM THREAD ERROR]', err);
    return res.status(500).json({ error: 'Failed to load Hearth discussion.' });
  }
}
