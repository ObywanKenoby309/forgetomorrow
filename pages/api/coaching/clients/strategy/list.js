// pages/api/coaching/clients/strategy/list.js
// ForgeVault-ready list of saved Coaching Target Strategy / Command Brief artifacts.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const clients = await prisma.coachingClient.findMany({
      where: {
        coachId: session.user.id,
        strategyJson: { not: undefined },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        strategyJson: true,
        strategyNextStep: true,
        updatedAt: true,
        targetCompanies: true,
      },
    });

    const strategies = clients
      .filter((client) => !!client.strategyJson)
      .map((client) => {
        const strategy = client.strategyJson || {};
        return {
          id: client.id,
          type: 'Target Strategy',
          title: `${safeText(client.name, 'Client')} — Target Strategy`,
          clientName: client.name || '',
          clientEmail: client.email || '',
          generatedAt: strategy.generatedAt || client.updatedAt,
          updatedAt: client.updatedAt,
          targetCompanies: client.targetCompanies || '',
          summary: strategy.positioningInsight || client.strategyNextStep || strategy.nextStep || '',
          downloadUrl: `/api/coaching/clients/strategy/export-foundry?clientId=${encodeURIComponent(client.id)}`,
          shareEndpoint: '/api/coaching/clients/strategy/export-foundry',
          sharePayload: { clientId: client.id },
        };
      });

    return res.status(200).json({ strategies });
  } catch (err) {
    console.error('[api/coaching/clients/strategy/list]', err);
    return res.status(500).json({ error: 'Failed to list target strategies' });
  }
}
