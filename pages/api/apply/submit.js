// pages/api/apply/submit.js
import prisma from '@/lib/prisma';
import { getClientSession } from '@/lib/auth-client';

export default async function handler(req, res) {
  try {
    const session = await getClientSession(req);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { applicationId } = req.body || {};
    const appId = Number(applicationId);
    if (!appId) return res.status(400).json({ error: 'Missing applicationId' });

    const app = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        consent: true,
        answers: true,
        template: true,
      },
    });

    if (!app || app.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    // Mandatory consent enforcement (server-side)
    if (!app.consent || !app.consent.termsAccepted) {
      return res.status(400).json({ error: 'Consent is required before submitting.' });
    }
    const sig = String(app.consent.signatureName || '').trim();
    if (sig.length < 2) {
      return res.status(400).json({ error: 'Signature name is required before submitting.' });
    }

    // Prevent double-submit
    if (app.submittedAt) {
      return res.status(200).json({ ok: true, alreadySubmitted: true, submittedAt: app.submittedAt });
    }

    const now = new Date();

    // Submit + bump job counter in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedApp = await tx.application.update({
        where: { id: appId },
        data: {
          submittedAt: now,
          status: 'Applied', // keep consistent with your enum
        },
      });

      if (updatedApp.jobId) {
        await tx.job.update({
          where: { id: updatedApp.jobId },
          data: { applicationsCount: { increment: 1 } },
        });
      }

      return updatedApp;
    });

    return res.status(200).json({ ok: true, application: result });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
