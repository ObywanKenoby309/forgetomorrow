// pages/api/feed/branch-to-hearth.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

const HEARTH_RECOMMENDATION_THRESHOLD = 5;

function parsePostBody(content) {
  const raw = String(content || '').trim();
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.body) return String(parsed.body).trim();
  } catch {}
  return raw;
}

function makeTitle(input) {
  const cleaned = String(input || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'Community discussion';
  return cleaned.length > 82 ? `${cleaned.slice(0, 79).trim()}...` : cleaned;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const postId = Number(req.body?.postId);
    const requestedTitle = String(req.body?.title || '').trim();

    if (!postId || Number.isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      include: {
        hearthThreads: { select: { id: true, title: true }, take: 1 },
        _count: { select: { hearthRecommendations: true } },
      },
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId !== session.user.id) {
      return res.status(403).json({ error: 'Only the original poster can move this discussion into the Hearth.' });
    }

    if (post.hearthThreads?.length) {
      return res.status(200).json({ ok: true, thread: post.hearthThreads[0], alreadyExists: true });
    }

    const recommendationCount = post._count?.hearthRecommendations || 0;
    if (recommendationCount < HEARTH_RECOMMENDATION_THRESHOLD) {
      return res.status(400).json({
        error: `This post needs ${HEARTH_RECOMMENDATION_THRESHOLD} recommendations before it can be continued in the Hearth.`,
        count: recommendationCount,
        threshold: HEARTH_RECOMMENDATION_THRESHOLD,
      });
    }

    const body = parsePostBody(post.content);
    const title = makeTitle(requestedTitle || body);

    const thread = await prisma.hearthForumThread.create({
      data: {
        title,
        body: body || 'Community discussion continued from the Feed.',
        category: post.type === 'personal' ? 'Personal Growth' : 'Business',
        sourcePostId: post.id,
        authorId: post.authorId,
      },
    });

    await prisma.notification.updateMany({
      where: {
        userId: post.authorId,
        dedupeKey: `feed-hearth-recommend:${post.id}`,
      },
      data: { readAt: new Date() },
    });

    return res.status(201).json({ ok: true, thread, alreadyExists: false });
  } catch (err) {
    console.error('[BRANCH TO HEARTH ERROR]', err);
    return res.status(500).json({ error: 'Failed to continue this discussion in the Hearth.' });
  }
}
