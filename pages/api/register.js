// pages/api/register.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, role: inputRole } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // ---- Role + Tier mapping -------------------------------------------------
    const roleMap = {
      seeker: 'SEEKER',
      'seeker pro': 'SEEKER',
      coach: 'COACH',
      recruiter: 'RECRUITER',
      'recruiter smb': 'RECRUITER',
      'recruiter enterprise': 'RECRUITER',
      admin: 'ADMIN',
    };

    const tierMap = {
      'seeker pro': 'pro',
      'recruiter smb': 'smb',
      'recruiter enterprise': 'enterprise',
    };

    const normalized = (inputRole?.toLowerCase().trim() || 'seeker');
    const prismaRole = roleMap[normalized] || 'SEEKER';
    const tier = tierMap[normalized] ||
      (prismaRole === 'SEEKER' ? 'free' : null);

    // ---- Check existing user -------------------------------------------------
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // ---- Hash password -------------------------------------------------------
    const passwordHash = await bcrypt.hash(password, 12);

    // ---- Create user ---------------------------------------------------------
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: prismaRole,
        tier,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tier: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({
      error: 'Failed to register user',
      details: err.message,
    });
  } finally {
    await prisma.$disconnect();
  }
}