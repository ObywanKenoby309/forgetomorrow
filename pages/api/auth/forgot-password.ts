// pages/api/auth/forgot-password.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

function asString(v: any) {
  return typeof v === 'string' ? v : '';
}

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function safeEmailDebug() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER || 'unset';
  const port = process.env.SMTP_PORT || process.env.EMAIL_PORT || 'unset';
  const secure = process.env.SMTP_SECURE ?? '(inferred)';

  const hasUser = !!(process.env.SMTP_USER || process.env.EMAIL_USER);
  const hasPass = !!(process.env.SMTP_PASS || process.env.EMAIL_PASSWORD);

  return { host, port, secure, hasUser, hasPass, nodeEnv: process.env.NODE_ENV };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const emailRaw = asString(req.body?.email).toLowerCase().trim();

  // Always return the same response to avoid account enumeration
  const okResponse = () =>
    res.status(200).json({
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });

  if (!emailRaw) return okResponse();

  // Look up user
  const user = await prisma.user.findUnique({
    where: { email: emailRaw },
    select: { id: true, email: true, passwordHash: true },
  });

  // If no user OR user has no password set yet (verification flow), do nothing (neutral)
  if (!user || !user.passwordHash) return okResponse();

  // Throttle: if a token was created in last 2 minutes, do not create/send another
  const last = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (last) {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (last.createdAt > twoMinAgo) {
      return okResponse();
    }
  }

  // Optional cleanup: remove expired/used tokens for this user (keeps table clean)
  try {
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });
  } catch {
    // ignore cleanup failures
  }

  // Create new reset token (store hash only)
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256Hex(token);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Send email (best effort). Even if email fails, still return neutral response.
  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (e: any) {
    // ✅ SAFE: shows env presence + host/port without secrets
    console.error('Password reset email send failed:', {
      debug: safeEmailDebug(),
      error: String(e?.message || e),
    });
  }

  return okResponse();
}
