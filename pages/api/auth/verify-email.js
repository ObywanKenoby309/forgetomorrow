// pages/api/auth/verify-email.js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token } = req.body;

  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
  });

  if (!user) return res.status(400).json({ error: 'Invalid token' });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null },
  });

  res.status(200).json({ success: true });
}