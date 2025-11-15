import { findUserByEmail, validatePassword } from '@/lib/auth';
import { createSessionCookie } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Missing email or password' });

  try {
    const user = await findUserByEmail(String(email).toLowerCase().trim());
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const ok = await validatePassword(user, password);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const { name, value, options } = createSessionCookie({ user });

    // Set cookie header
    const cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; HttpOnly; Path=${options.path}; SameSite=Lax; Max-Age=${options.maxAge}${
      options.secure ? '; Secure' : ''
    }`;
    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
