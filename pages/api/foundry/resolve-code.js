// pages/api/foundry/resolve-code.js
// Public helper for Foundry join form. Accepts a room ID or guest invite code
// and returns the correct route without requiring a ForgeTomorrow account.

import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawCode = String(req.body?.code || '').trim();

  if (!rawCode) {
    return res.status(400).json({ error: 'Foundry code or invite link is required.' });
  }

  const code = rawCode
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/foundry\/join\//, '')
    .replace(/^\/foundry\//, '')
    .split('?')[0]
    .trim();

  const queryCode = rawCode.includes('code=')
    ? new URL(rawCode, 'https://forgetomorrow.local').searchParams.get('code')
    : null;

  const candidates = [queryCode, code, rawCode].filter(Boolean);

  try {
    const room = await prisma.foundryRoom.findFirst({
      where: {
        OR: [
          { roomId: { in: candidates } },
          { guestToken: { in: candidates } },
        ],
      },
      select: {
        roomId: true,
        guestToken: true,
        status: true,
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Foundry not found. Check the code or invite link.' });
    }

    if (room.status === 'ENDED') {
      return res.status(410).json({ error: 'This Foundry has already ended.' });
    }

    const matchedGuestCode = candidates.find((value) => value === room.guestToken);

    if (matchedGuestCode) {
      return res.status(200).json({
        kind: 'guest',
        roomId: room.roomId,
        joinUrl: `/foundry/join/${room.roomId}?code=${room.guestToken}`,
      });
    }

    return res.status(200).json({
      kind: 'room',
      roomId: room.roomId,
      joinUrl: `/foundry/${room.roomId}`,
    });
  } catch (err) {
    console.error('[foundry/resolve-code]', err);
    return res.status(500).json({ error: 'Could not resolve Foundry code.' });
  }
}
