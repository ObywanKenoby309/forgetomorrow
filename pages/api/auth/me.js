// /pages/api/auth/me.js
import { verifyJwt, readSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const token = readSessionCookie(req);
  if (!token) return res.status(200).json({ ok: true, user: null });

  const payload = verifyJwt(token);
  if (!payload?.sub) return res.status(200).json({ ok: true, user: null });

  // (optional) re-load a few fields from DB
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, name: true },
  });

  return res.status(200).json({ ok: true, user });
}
