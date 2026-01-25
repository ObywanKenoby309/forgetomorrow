// pages/api/apply/selfid.js
import prisma from '@/lib/prisma';
import { getClientSession } from '@/lib/auth-client';

export default async function handler(req, res) {
  try {
    const session = await getClientSession(req);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const {
      applicationId,
      genderIdentity,
      raceEthnicity,
      veteranStatus,
      disabilityStatus,
    } = req.body || {};

    const appId = Number(applicationId);
    if (!appId) return res.status(400).json({ error: 'Missing applicationId' });

    const app = await prisma.application.findUnique({ where: { id: appId } });
    if (!app || app.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const saved = await prisma.applicationSelfId.upsert({
      where: { applicationId: appId },
      update: {
        genderIdentity: genderIdentity ? String(genderIdentity) : null,
        raceEthnicity: raceEthnicity ? String(raceEthnicity) : null,
        veteranStatus: veteranStatus ? String(veteranStatus) : null,
        disabilityStatus: disabilityStatus ? String(disabilityStatus) : null,
      },
      create: {
        applicationId: appId,
        genderIdentity: genderIdentity ? String(genderIdentity) : null,
        raceEthnicity: raceEthnicity ? String(raceEthnicity) : null,
        veteranStatus: veteranStatus ? String(veteranStatus) : null,
        disabilityStatus: disabilityStatus ? String(disabilityStatus) : null,
      },
    });

    return res.status(200).json({ ok: true, selfId: saved });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
