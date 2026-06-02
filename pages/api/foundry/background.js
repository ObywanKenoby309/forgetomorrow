// pages/api/foundry/background.js
// GET  → returns the current user's saved Foundry background
// POST → saves the current user's preferred Foundry background

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

const FOUNDER_USER_ID = 'cmivpwcf90009bvz0xnck0acv';
const FOUNDER_EMAIL = 'eric.james@forgetomorrow.com';

const PUBLIC_BACKGROUNDS = new Set([
  'none',
  'blur',
  'forge-office',
  'coaching-library',
  'coaching-strategy-room',
  'forge-floor',
  'neutral-professional',
]);

const FOUNDER_ONLY_BACKGROUNDS = new Set(['founder-office']);

function isFounderUser(user) {
  return user?.id === FOUNDER_USER_ID || String(user?.email || '').toLowerCase() === FOUNDER_EMAIL;
}

function isAllowedBackground(value, user) {
  if (PUBLIC_BACKGROUNDS.has(value)) return true;
  if (FOUNDER_ONLY_BACKGROUNDS.has(value) && isFounderUser(user)) return true;
  return false;
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, foundryBackground: true },
      });

      const saved = user?.foundryBackground || 'none';
      const background = isAllowedBackground(saved, user) ? saved : 'none';

      return res.status(200).json({
        background,
        isFounder: isFounderUser(user),
      });
    } catch (err) {
      console.error('[foundry/background][GET]', err);
      return res.status(500).json({ error: 'Could not load Foundry background preference' });
    }
  }

  if (req.method === 'POST') {
    const background = String(req.body?.background || '').trim();

    if (!background) {
      return res.status(400).json({ error: 'Background is required' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true },
      });

      if (!isAllowedBackground(background, user)) {
        return res.status(403).json({ error: 'Background is not available for this user' });
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { foundryBackground: background },
      });

      return res.status(200).json({ ok: true, background });
    } catch (err) {
      console.error('[foundry/background][POST]', err);
      return res.status(500).json({ error: 'Could not save Foundry background preference' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
