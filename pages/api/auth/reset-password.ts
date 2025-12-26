// pages/api/auth/reset-password.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

function asString(v: any) {
  return typeof v === 'string' ? v : '';
}

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const token = asString(req.body?.token).trim();
  const password = asString(req.body?.password);

  if (!token) return res.status(400).json({ ok: false, message: 'Invalid token.' });
  if (!password || password.length < 8) {
    return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters.' });
  }

  const tokenHash = sha256Hex(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });

  if (!record) return res.status(400).json({ ok: false, message: 'Invalid or expired token.' });
  if (record.usedAt) return res.status(400).json({ ok: false, message: 'This reset link has already been used.' });
  if (record.expiresAt < new Date()) return res.status(400).json({ ok: false, message: 'Invalid or expired token.' });

  const newHash = await bcrypt.hash(password, 10);

  // Atomic-ish update: update password + mark token used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Optional: invalidate any other outstanding tokens for this user
    prisma.passwordResetToken.updateMany({
      where: {
        userId: record.userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
        NOT: { id: record.id },
      },
      data: { usedAt: new Date() },
    }),
  ]);

  return res.status(200).json({ ok: true, message: 'Password updated.' });
}
