// pages/api/resume/list.js
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import * as NextAuthModule from '../auth/[...nextauth]';

function resolveAuthOptions(mod) {
  if (mod && mod.authOptions) return mod.authOptions;
  if (mod && mod.default) return mod.default;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dbg = {
    step: 'init',
    hasAuthOptions: false,
    sessionHasUser: false,
    sessionHasEmail: false,
    email: null,
    userFound: false,
    resumeCount: null,
  };

  try {
    const authOptions = resolveAuthOptions(NextAuthModule);
    dbg.step = 'authOptions';
    dbg.hasAuthOptions = !!authOptions;

    if (!authOptions) {
      return res.status(200).json({ ok: false, dbg, error: 'authOptions missing export' });
    }

    let session = null;
    try {
      session = await getServerSession(req, res, authOptions);
    } catch (e) {
      dbg.step = 'getServerSession_throw';
      return res.status(200).json({ ok: false, dbg, error: 'getServerSession threw', detail: String(e?.message || e) });
    }

    dbg.step = 'session';
    dbg.sessionHasUser = !!session?.user;
    dbg.sessionHasEmail = !!session?.user?.email;

    const emailRaw = session?.user?.email ? String(session.user.email).trim() : '';
    const email = emailRaw ? emailRaw.toLowerCase() : '';
    dbg.email = email || null;

    if (!email) {
      return res.status(200).json({ ok: false, dbg, error: 'no email in session' });
    }

    dbg.step = 'userLookup';
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    dbg.userFound = !!user;

    if (!user) {
      return res.status(200).json({ ok: false, dbg, error: 'user not found for email' });
    }

    dbg.step = 'resumeLookup';
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
    dbg.resumeCount = resumes.length;

    return res.status(200).json({ ok: true, dbg });
  } catch (err) {
    dbg.step = 'catch';
    return res.status(200).json({
      ok: false,
      dbg,
      error: 'caught exception',
      detail: String(err?.message || err),
    });
  }
}
