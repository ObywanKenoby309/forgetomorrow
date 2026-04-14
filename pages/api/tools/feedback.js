import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      toolName,
      entityId,
      inputSnapshot,
      outputSnapshot,
      feedbackScore,
      feedbackType,
      feedbackComment,
    } = req.body;

    if (!toolName || !feedbackScore) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const record = await prisma.toolFeedback.create({
      data: {
        toolName,
        entityId: entityId || null,
        inputSnapshot: inputSnapshot || null,
        outputSnapshot: outputSnapshot || null,
        feedbackScore,
        feedbackType: feedbackType || null,
        feedbackComment: feedbackComment || null,
      },
    });

    return res.status(200).json({ success: true, record });
  } catch (err) {
    console.error('Feedback error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}