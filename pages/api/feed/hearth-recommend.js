// pages/api/feed/hearth-recommend.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications/writer';

const HEARTH_RECOMMENDATION_THRESHOLD = 5;

function getScopeForUser(user) {
  const role = String(user?.role || '').toUpperCase();
  if (role === 'COACH') return 'COACH';
  if (role === 'RECRUITER') return 'RECRUITER';
  return 'SEEKER';
}

function getBodyPreview(content) {
  const raw = String(content || '').trim();
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.body) return String(parsed.body).trim();
  } catch {}
  return raw;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const idNum = Number(req.body?.postId);
    if (!idNum || Number.isNaN(idNum)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const post = await prisma.feedPost.findUnique({
      where: { id: idNum },
      include: {
        hearthThreads: { select: { id: true, title: true }, take: 1 },
      },
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId === session.user.id) {
      return res.status(400).json({ error: 'You cannot recommend your own post for the Hearth.' });
    }

    await prisma.feedHearthRecommendation.upsert({
      where: { postId_userId: { postId: idNum, userId: session.user.id } },
      update: {},
      create: { postId: idNum, userId: session.user.id },
    });

    const count = await prisma.feedHearthRecommendation.count({ where: { postId: idNum } });
    const reachedThreshold = count >= HEARTH_RECOMMENDATION_THRESHOLD;

    if (reachedThreshold && !post.hearthThreads?.length) {
      const postAuthor = await prisma.user.findUnique({
        where: { id: post.authorId },
        select: { id: true, role: true },
      });

      if (postAuthor?.id) {
        const preview = getBodyPreview(post.content).slice(0, 140);
        await createNotification({
          userId: postAuthor.id,
          actorUserId: session.user.id,
          category: 'SOCIAL',
          scope: getScopeForUser(postAuthor),
          entityType: 'FEED_POST',
          entityId: String(idNum),
          dedupeKey: `feed-hearth-recommend:${idNum}`,
          title: 'Your post was recommended for the Hearth',
          body: `${count} members recommended continuing this discussion in the Hearth.`,
          requiresAction: true,
          metadata: {
            postId: idNum,
            recommendationCount: count,
            threshold: HEARTH_RECOMMENDATION_THRESHOLD,
            preview,
            action: 'branch_to_hearth',
          },
          pushUrl: '/feed',
        });
      }
    }

    return res.status(200).json({
      ok: true,
      count,
      threshold: HEARTH_RECOMMENDATION_THRESHOLD,
      reachedThreshold,
      recommendedByViewer: true,
      hearthThreadId: post.hearthThreads?.[0]?.id || null,
    });
  } catch (err) {
    console.error('[HEARTH RECOMMEND ERROR]', err);
    return res.status(500).json({ error: 'Failed to recommend this post for the Hearth.' });
  }
}