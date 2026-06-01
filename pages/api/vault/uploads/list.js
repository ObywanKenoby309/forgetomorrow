// pages/api/vault/uploads/list.js
// Lists the current user's uploaded files.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const uploads = await prisma.vaultUpload.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSizeBytes: true,
        downloadUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ uploads });
  } catch (err) {
    console.error('[api/vault/uploads/list]', err);
    return res.status(500).json({ error: 'Could not load uploads' });
  }
}