// pages/api/appointments/requests.ts
//
// GET — returns all AppointmentRequests for the authenticated coach
//       with requester info joined, ordered newest first.

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const coachId = session.user.id;

  try {
    const raw = await prisma.appointmentRequest.findMany({
      where: { coachId },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: {
            id: true, name: true, firstName: true, lastName: true,
            email: true, slug: true, image: true,
          },
        },
      },
    });

    const requests = raw.map((r) => ({
      id:             r.id,
      status:         r.status,
      preferredSlots: r.preferredSlots,
      timezone:       r.timezone,
      message:        r.message,
      suggestedAt:    r.suggestedAt,
      coachNotes:     r.coachNotes,
      createdAt:      r.createdAt,
      requesterId:    r.requesterId,
      requesterName:  r.requester.firstName
        ? `${r.requester.firstName} ${r.requester.lastName || ''}`.trim()
        : r.requester.name || 'Unknown',
      requesterEmail: r.requester.email,
      requesterSlug:  r.requester.slug,
      requesterImage: r.requester.image,
    }));

    return res.status(200).json({ requests });
  } catch (err) {
    console.error('[appointments/requests] error:', err);
    return res.status(500).json({ error: 'Failed to load requests' });
  }
}