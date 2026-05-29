// pages/api/offer-negotiation/save.js
// DB-first persistence for Offer & Negotiation reports.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const { negotiationId, formData, plan, result, pdfUrl } = req.body || {};
    const resolvedResult = result || plan;

    if (!resolvedResult || typeof resolvedResult !== 'object') {
      return res.status(400).json({ error: 'Missing negotiation result' });
    }

    const input = {
      formData: formData || {},
      savedFrom: 'offer-negotiation',
    };

    let saved;

    if (negotiationId) {
      saved = await prisma.negotiation.updateMany({
        where: { id: String(negotiationId), userId: session.user.id },
        data: {
          input,
          result: resolvedResult,
          ...(typeof pdfUrl === 'string' ? { pdfUrl } : {}),
        },
      });

      if (!saved.count) {
        return res.status(404).json({ error: 'Negotiation report not found' });
      }

      const record = await prisma.negotiation.findFirst({
        where: { id: String(negotiationId), userId: session.user.id },
        select: { id: true, createdAt: true, pdfUrl: true },
      });

      return res.status(200).json({ negotiation: record });
    }

    const created = await prisma.negotiation.create({
      data: {
        userId: session.user.id,
        input,
        result: resolvedResult,
        ...(typeof pdfUrl === 'string' ? { pdfUrl } : {}),
      },
      select: { id: true, createdAt: true, pdfUrl: true },
    });

    return res.status(200).json({ negotiation: created });
  } catch (err) {
    console.error('[api/offer-negotiation/save]', err);
    return res.status(500).json({ error: 'Could not save negotiation report' });
  }
}
