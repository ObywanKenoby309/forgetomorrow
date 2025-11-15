// pages/api/auth/signup.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '../../../lib/email';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;

  // Validate
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate verification token
  const token = uuidv4();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Create user
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerified: false,
      verificationToken: token,
      verificationExpires: expires,
      role: 'JOB_SEEKER',
      plan: 'FREE',
    },
  });

  // Send email
  await sendVerificationEmail(email, token);

  res.status(200).json({ success: true });
}