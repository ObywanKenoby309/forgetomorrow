import { clearSessionCookie } from '@/lib/session';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { name, value, options } = clearSessionCookie();
  const cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; HttpOnly; Path=${options.path}; SameSite=Lax; Max-Age=${options.maxAge}${
    options.secure ? '; Secure' : ''
  }`;
  res.setHeader('Set-Cookie', cookie);
  res.status(200).json({ ok: true });
}
