// pages/api/resume/list.js
import { prisma } from '@/lib/prisma';

// NOTE: your codebase has BOTH patterns in different files.
// We support either export shape safely to stop 500s.
import * as NextAuthMod from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

function pickAuthOptions(mod) {
  // supports: export default authOptions  OR  export const authOptions = ...
  if (mod && mod.authOptions) return mod.authOptions;
  if (mod && mod.default) return mod.default;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authOptions = pickAuthOptions(NextAuthMod);

    // ✅ If authOptions is wrong, DO NOT THROW → return 401 instead of 500.
    if (!authOptions) {
      console.error('[resume/list] Missing authOptions export from [...nextauth]');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let session = null;
    try {
      session = await getServerSession(req, res, authOptions);
    } catch (e) {
      console.error('[resume/list] getServerSession threw', e);
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const emailRaw = session?.user?.email ? String(session.user.email).trim() : '';
    const email = emailRaw ? emailRaw.toLowerCase() : '';

    // ✅ email-only, same as the working version
    if (!email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        title: true,
        createdAt: true,
        isPrimary: true,
      },
    });

    return res.status(200).json({
      resumes,
      count: resumes.length,
    });
  } catch (err) {
    console.error('[resume/list] Error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
