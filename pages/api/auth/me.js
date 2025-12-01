// pages/api/auth/me.js
import { getServerSession } from 'next-auth';
import { authOptions } from './[...nextauth]';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    // No session → treat as "not authenticated" but still respond with JSON
    if (!session || !session.user) {
      return res
        .status(401)
        .json({ authenticated: false, user: null });
    }

    const user = session.user || {};

    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id ?? null,
        name: user.name ?? null,
        email: user.email ?? null,
        image: user.image ?? null,
        // if you add extra fields to the session later, map them here
      },
    });
  } catch (err) {
    console.error('[api/auth/me] error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
