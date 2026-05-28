// pages/api/foundry/resolve-code.js
// Resolves a Foundry room id or external guest code from the lobby Join field.

import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const raw = String(req.body?.code || '').trim();
  if (!raw) return res.status(400).json({ error: 'Code is required.' });

  const code = raw.replace(/^#+/, '').trim();

  try {
    const roomById = await prisma.foundryRoom.findUnique({
      where: { roomId: code },
      select: { roomId: true, status: true },
    });

    if (roomById) {
      if (roomById.status === 'ENDED') return res.status(410).json({ error: 'This Foundry has ended.' });
      return res.status(200).json({ roomId: roomById.roomId, type: 'room' });
    }

    const roomByGuestCode = await prisma.foundryRoom.findFirst({
      where: { guestToken: code },
      select: { roomId: true, status: true, guestToken: true },
    });

    if (!roomByGuestCode) return res.status(404).json({ error: 'Foundry not found for that code.' });
    if (roomByGuestCode.status === 'ENDED') return res.status(410).json({ error: 'This Foundry has ended.' });

    return res.status(200).json({
      roomId: roomByGuestCode.roomId,
      guestCode: roomByGuestCode.guestToken,
      type: 'guest',
    });
  } catch (err) {
    console.error('[foundry/resolve-code]', err);
    return res.status(500).json({ error: 'Could not resolve Foundry code.' });
  }
}
