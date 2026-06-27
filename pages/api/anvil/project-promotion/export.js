// pages/api/anvil/project-promotion/export.js
// Exports a saved Project & Promotion Intelligence result as a PDF.
// Auth: user must own the record.
// GET /api/anvil/project-promotion/export?id=xxx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import ProjectPromotionPDF from '@/components/vault/pdf/ProjectPromotionPDF';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const record = await prisma.projectPromotionResult.findFirst({
      where: { id: String(id), userId: session.user.id },
      select: { id: true, title: true, formInput: true, result: true, createdAt: true },
    });

    if (!record) return res.status(404).json({ error: 'Record not found' });

    const result    = typeof record.result    === 'string' ? JSON.parse(record.result)    : record.result    || {};
    const formInput = typeof record.formInput === 'string' ? JSON.parse(record.formInput) : record.formInput || {};
    const title     = record.title || 'Project & Promotion Brief';

    const buffer = await renderToBuffer(
      React.createElement(ProjectPromotionPDF, {
        title,
        result,
        formInput,
        createdAt: record.createdAt,
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
    console.error('[api/anvil/project-promotion/export]', err);
    return res.status(500).json({ error: 'Could not export result' });
  }
}