// pages/api/offer-negotiation/list.js
// Lists saved Offer & Negotiation reports for the current user.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function reportName(record) {
  const result = record?.result || {};
  const input = record?.input || {};
  const form = input?.formData || {};

  const role =
    result?.roleContext?.interpretedRole ||
    form?.offerRoleTitle ||
    form?.currentJobTitle ||
    'Negotiation Brief';

  const company = form?.offerCompany ? ` · ${form.offerCompany}` : '';
  return `${safeText(role, 'Negotiation Brief')}${company}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const records = await prisma.negotiation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        input: true,
        result: true,
        pdfUrl: true,
        createdAt: true,
      },
    });

    const negotiations = records.map((record) => ({
      id: record.id,
      name: reportName(record),
      type: 'Offer & Negotiation Brief',
      createdAt: record.createdAt,
      updatedAt: record.createdAt,
      hasPdf: Boolean(record.pdfUrl),
    }));

    return res.status(200).json({ negotiations });
  } catch (err) {
    console.error('[api/offer-negotiation/list]', err);
    return res.status(500).json({ error: 'Could not load negotiation reports' });
  }
}
