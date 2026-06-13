// pages/api/feed/post-view.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// ─────────────────────────────────────────────────────────────
// Auth helpers (match your other APIs: session OR HttpOnly `auth` cookie)
// ─────────────────────────────────────────────────────────────
function getCookie(req, name) {
  try {
    const raw = req.headers?.cookie || '';
    const parts = raw.split(';').map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + '=')) return decodeURIComponent(p.slice(name.length + 1));
    }
    return '';
  } catch {
    return '';
  }
}

function getJwtSecret() {
  return process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';
}

async function getAuthedUserId(req, res) {
  // 1) NextAuth session
  const session = await getServerSession(req, res, authOptions);
  const sessionUserId = session?.user?.id ? String(session.user.id) : null;
  if (sessionUserId) return sessionUserId;

  const sessionEmail = session?.user?.email ? String(session.user.email) : null;
  if (sessionEmail) {
    const u = await prisma.user.findUnique({
      where: { email: sessionEmail.toLowerCase().trim() },
      select: { id: true },
    });
    return u?.id || null;
  }

  // 2) HttpOnly `auth` cookie JWT (email-based)
  const token = getCookie(req, 'auth');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const email = decoded?.email ? String(decoded.email).toLowerCase().trim() : null;
    if (!email) return null;

    const u = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return u?.id || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const viewerId = await getAuthedUserId(req, res); // may be null (anonymous ok)

    const { postId, source } = req.body || {};
    const idNum = Number(postId);

    if (!idNum || Number.isNaN(idNum)) {
      return res.status(400).json({ error: 'postId is required' });
    }

    // Verify post exists + grab authorId so we can avoid self-inflation
    const post = await prisma.feedPost.findUnique({
      where: { id: idNum },
      select: { id: true, authorId: true },
    });

    if (!post) return res.status(204).end();

    // ✅ Do NOT count the author’s own interactions as views/interactions
    if (viewerId && post.authorId && String(post.authorId) === String(viewerId)) {
      return res.status(204).end();
    }

    const sourceSafe = String(source || 'feed').slice(0, 40);

    // ✅ Best-effort dedupe for authed users:
    // if same viewer logs same post+source within 60s, skip
    if (viewerId) {
      const since = new Date(Date.now() - 60 * 1000);

      const already = await prisma.feedPostView.findFirst({
        where: {
          postId: idNum,
          viewerId: String(viewerId),
          source: sourceSafe,
          createdAt: { gte: since },
        },
        select: { id: true },
      });

      if (already) return res.status(204).end();
    }

    await prisma.feedPostView.create({
      data: {
        postId: idNum,
        viewerId: viewerId ? String(viewerId) : null,
        source: sourceSafe,
      },
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[api/feed/post-view] error:', err);
    return res.status(500).json({ error: 'Failed to log post view' });
  }
}
