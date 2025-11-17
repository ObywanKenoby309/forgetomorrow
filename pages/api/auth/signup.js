// pages/api/auth/signup.js
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '@/lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email taken' });

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = uuidv4();

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      emailVerificationToken: verificationToken,
      emailVerified: false,
      plan: 'FREE',
    },
  });

  await sendVerificationEmail(email, verificationToken);

  res.status(200).json({ success: true });
}
