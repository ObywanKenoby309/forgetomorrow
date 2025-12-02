// pages/api/internal/user-by-api-key.js
// Internal endpoint: look up a user by api_key header token.
// IMPORTANT: No longer lives at /api/auth/session so it won't conflict with NextAuth.

import { Pool } from 'pg';

// Use the same database your Prisma client uses (Railway)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  // Only allow GET for this internal check
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const query = 'SELECT id, name FROM users WHERE api_key = $1';

  try {
    const result = await pool.query(query, [token]);

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
}
