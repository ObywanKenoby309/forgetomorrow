// pages/api/coaching/clients/strategy/export.js
// Exports a saved coaching target strategy as a PDF using @react-pdf/renderer.
// Auth: coach must own the CoachingClient record.
// GET /api/coaching/clients/strategy/export?clientId=xxx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import StrategyPDF from '@/components/vault/pdf/StrategyPDF';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: 'clientId required' });

  try {
    const client = await prisma.coachingClient.findFirst({
      where: { id: String(clientId), coachId: session.user.id },
      select: {
        id: true,
        name: true,
        strategyJson: true,
        targetCompanies: true,
        updatedAt: true,
      },
    });

    if (!client)              return res.status(404).json({ error: 'Client not found' });
    if (!client.strategyJson) return res.status(404).json({ error: 'No strategy found for this client' });

    const strategy = typeof client.strategyJson === 'string'
      ? JSON.parse(client.strategyJson)
      : client.strategyJson;

    const clientName = client.name || 'Client';
    const title      = `${clientName} — Target Strategy`;
    const generatedAt = strategy.generatedAt || client.updatedAt;

    const buffer = await renderToBuffer(
      React.createElement(StrategyPDF, {
        clientName,
        title,
        strategy,
        targetCompanies: client.targetCompanies || '',
        generatedAt,
      })
    );

    const safeTitle = title.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_');
    const fileName  = encodeURIComponent(`${safeTitle}.pdf`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"; filename*=UTF-8''${fileName}`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-cache');
    return res.status(200).send(buffer);

  } catch (err) {
    console.error('[api/coaching/clients/strategy/export]', err);
    return res.status(500).json({ error: 'Could not export strategy' });
  }
}