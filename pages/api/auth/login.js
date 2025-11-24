// pages/api/auth/login.js
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SESSION_SECRET = process.env.NEXTAUTH_SECRET || 'dev-session-secret';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    // Create a simple JWT payload for the session cookie
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    const token = jwt.sign(payload, SESSION_SECRET, { expiresIn: '30d' });

    // Set ft_session cookie (what middleware is checking)
    const isProd = process.env.NODE_ENV === 'production';

    res.setHeader('Set-Cookie', [
      [
        'ft_session=',
        token,
        '; Path=/',
        '; HttpOnly',
        '; SameSite=Lax',
        isProd ? '; Secure' : '',
        '; Max-Age=2592000', // 30 days
      ].join(''),
    ]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('/api/auth/login error:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}
