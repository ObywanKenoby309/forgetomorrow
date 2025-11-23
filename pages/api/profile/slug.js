// pages/api/profile/slug.js
//
// Public profile slug setter for authenticated users.
// Rules:
// - Normalize → lowercase, hyphens, alphanumeric
// - Must be unique
// - Must pass banned/NSFW filter
// - Optional cooldown disabled for now
// - Returns { success, slug }

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verify } from 'jsonwebtoken';
import { normalizeSlug, hasBannedTerm } from '@/lib/slug';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';

// Resolve current authenticated user ID (NextAuth OR fallback JWT)
async function getUserId(req, res) {
  // 1) NextAuth session
  const session = await getServerSession(req, res, authOptions);
  if (session?.user?.id) return session.user.id;

  // 2) Custom auth cookie
  const token = req.cookies?.auth;
  if (!token) return null;

  try {
    const payload = verify(token, JWT_SECRET);
    return payload?.userId || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserId(req, res);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { desiredSlug } = req.body || {};
    if (!desiredSlug || typeof desiredSlug !== 'string') {
      return res.status(400).json({ error: 'Slug is required.' });
    }

    // Normalize user input
    let slug = normalizeSlug(desiredSlug);

    // Basic rules
    if (!slug || slug.length < 3) {
      return res.status(400).json({ error: 'Profile URL must be at least 3 characters.' });
    }

    if (slug.length > 40) {
      return res.status(400).json({ error: 'Profile URL must be 40 characters or fewer.' });
    }

    if (hasBannedTerm(slug)) {
      return res.status(400).json({ error: 'That profile URL is not allowed.' });
    }

    // Load the current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, slug: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // If unchanged, no-op
    if (user.slug === slug) {
      return res.json({ success: true, slug });
    }

    // Ensure uniqueness
    const existing = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: 'That profile URL is already taken.' });
    }

    // Update DB
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        slug,
      },
      select: { slug: true },
    });

    return res.json({ success: true, slug: updated.slug });
  } catch (err) {
    console.error('[/api/profile/slug] Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
