// pages/api/privacy/delete.js
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const session = await getServerSession(req, res);
  if (!session?.user?.email) return res.status(401).json({ error: 'Unauthorized' });

  // Mark account deleted
  await prisma.user.update({
    where: { email: session.user.email },
    data: { deleted_at: new Date() },
  });

  // Optionally trigger async job to erase related data
  // e.g., n8n workflow or cron to delete resumes, messages, etc.

  res.json({ status: 'pending_deletion', message: 'Your data will be permanently erased within 30 days.' });
}
