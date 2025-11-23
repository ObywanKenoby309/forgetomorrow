// pages/api/auth/signup.js ← FINAL WORKING VERSION (2025)
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '@/lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name, plan = 'FREE', newsletter = true } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const lowerEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const token = uuidv4();

    const user = await prisma.user.create({
      data: {
        email: lowerEmail,
        passwordHash: hashedPassword,
        name: name?.trim() || null,
        plan: plan.toUpperCase(), // FREE / PRO / COACH / SMALL_BIZ
        role: plan === 'COACH' || plan === 'SMALL_BIZ' ? 'COACH' : 'SEEKER',
        newsletter: Boolean(newsletter),
        emailVerificationToken: token,
        emailVerified: false,
      },
    });

    // THIS SENDS THE EMAIL — THIS WAS MISSING BEFORE
    try {
      await sendVerificationEmail(lowerEmail, token);
      console.log('Verification email sent to:', lowerEmail);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      // We don't fail the signup if email fails — user still exists
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}