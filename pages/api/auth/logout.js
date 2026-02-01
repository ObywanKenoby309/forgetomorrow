// pages/api/auth/logout.js
export default function handler(req, res) {
  res.status(410).json({ error: 'Deprecated. Use NextAuth signOut().' });
}
