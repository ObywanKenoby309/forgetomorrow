// pages/api/signal/set-home.js
// Moves a conversation to a different homeLocation.
// Only a participant of the conversation may call this.
//
// POST body:
//   conversationId  (number, required)
//   homeLocation    (string, required) – "seeker" | "coach" | "recruiter"

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

const VALID_HOME_LOCATIONS = ['seeker', 'coach', 'recruiter'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { conversationId, homeLocation } = req.body || {};

  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId is required' });
  }
  if (!VALID_HOME_LOCATIONS.includes(homeLocation)) {
    return res.status(400).json({
      error: `homeLocation must be one of: ${VALID_HOME_LOCATIONS.join(', ')}`,
    });
  }

  const convId = Number(conversationId);
  if (!Number.isFinite(convId)) {
    return res.status(400).json({ error: 'conversationId must be a number' });
  }

  try {
    // Verify caller is a participant (findFirst to match codebase pattern)
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: convId, userId },
    });

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    const updated = await prisma.conversation.update({
      where:  { id: convId },
      data:   { homeLocation, updatedAt: new Date() },
      select: { id: true, homeLocation: true },
    });

    return res.status(200).json({
      conversationId: updated.id,
      homeLocation:   updated.homeLocation,
    });
  } catch (err) {
    console.error('[signal/set-home] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
