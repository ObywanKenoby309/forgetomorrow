// pages/api/auth/verify.js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).send('Missing token');
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return res.status(400).send('Invalid or expired token');
  }

  // If link is expired, clean up and stop
  if (new Date() > record.expiresAt) {
    await prisma.verificationToken
      .delete({ where: { token } })
      .catch(() => {});
    return res.status(400).send('Link expired. Please sign up again.');
  }

  // Send user to password setup page instead of creating the account here
  const baseUrl =
    process.env.NEXT_PUBLIC_OPEN_SITE ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001';

  const redirectTo = `${baseUrl}/verify-email?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(record.email)}&plan=${encodeURIComponent(
    record.plan || 'FREE'
  )}`;

  return res.redirect(redirectTo);
}
