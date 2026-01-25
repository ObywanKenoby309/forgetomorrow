// pages/api/apply/answers.js
import prisma from '@/lib/prisma';
import { getClientSession } from '@/lib/auth-client';

export default async function handler(req, res) {
  try {
    const session = await getClientSession(req);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { applicationId, answers } = req.body || {};
    const appId = Number(applicationId);
    if (!appId) return res.status(400).json({ error: 'Missing applicationId' });

    const app = await prisma.application.findUnique({ where: { id: appId } });
    if (!app || app.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const ops = (answers || []).map((a) =>
      prisma.applicationAnswer.upsert({
        where: { applicationId_questionKey: { applicationId: appId, questionKey: a.questionKey } },
        update: { value: a.value ?? null },
        create: { applicationId: appId, questionKey: a.questionKey, value: a.value ?? null },
      })
    );

    await prisma.$transaction(ops);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
