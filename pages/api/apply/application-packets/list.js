// pages/api/apply/application-packets/list.js
// Lists saved applications that can be exported as privacy-safe application packets.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safe(value = '') {
  return String(value || '').trim();
}

function packetName(app) {
  const title = safe(app.title || app.job?.title || 'Application');
  const company = safe(app.company || app.job?.company || 'Company');
  return `${company} — ${title} Application Packet`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }, { appliedAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        status: true,
        appliedAt: true,
        submittedAt: true,
        updatedAt: true,
        resume: { select: { id: true, name: true } },
        cover: { select: { id: true, name: true } },
        job: { select: { id: true, title: true, company: true, location: true } },
        packetExports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, url: true, createdAt: true, version: true },
        },
      },
    });

    const packets = applications.map((app) => ({
      id: app.id,
      applicationId: app.id,
      name: packetName(app),
      type: 'Application Packet',
      sourceType: 'APPLICATION_PACKET',
      status: app.status,
      company: app.company || app.job?.company || null,
      title: app.title || app.job?.title || null,
      resumeName: app.resume?.name || null,
      coverName: app.cover?.name || null,
      submittedAt: app.submittedAt || null,
      updatedAt: app.updatedAt || app.appliedAt || null,
      latestExport: app.packetExports?.[0] || null,
    }));

    return res.status(200).json({ packets });
  } catch (err) {
    console.error('[api/apply/application-packets/list]', err);
    return res.status(500).json({ error: 'Could not load application packets' });
  }
}
