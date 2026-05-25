// pages/api/foundry/room/[roomId]/share-file.js
// Records a file as shared into the session's shared workspace.
// source: 'FORGE' (platform doc) or 'COMPUTER' (upload)

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).end();

  const { roomId } = req.query;
  const { fileName, fileUrl, source } = req.body; // source: 'FORGE' | 'COMPUTER'

  if (!fileName) return res.status(400).json({ error: 'fileName required' });

  try {
    const room = await prisma.foundryRoom.findUnique({ where: { roomId } });
    if (!room) return res.status(404).end();
    if (room.status === 'ENDED') return res.status(410).json({ error: 'Session has ended' });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });
    const sharedByName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Unknown';

    const file = await prisma.foundrySharedFile.create({
      data: {
        roomId: room.id,
        sharedById: session.user.id,
        sharedByName,
        fileName,
        fileUrl: fileUrl || null,
        source: source || 'COMPUTER',
        sharedAt: new Date(),
      },
    });

    return res.status(200).json({ file });
  } catch (err) {
    console.error('[foundry/share-file]', err);
    return res.status(500).end();
  }
}
