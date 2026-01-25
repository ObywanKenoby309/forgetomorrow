// pages/api/apply/consent.js
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
      termsAccepted,
      emailUpdatesAccepted,
      signatureName,
      consentTextVersion,
    } = req.body || {};

    const appId = Number(applicationId);
    if (!appId) return res.status(400).json({ error: 'Missing applicationId' });

    // Ensure application exists and belongs to current user
    const app = await prisma.application.findUnique({ where: { id: appId } });
    if (!app || app.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const accepted = !!termsAccepted;
    const emailsOk = !!emailUpdatesAccepted;
    const sig = String(signatureName || '').trim();

    // Mandatory: if they’re accepting terms, signature must be present
    if (accepted && sig.length < 2) {
      return res.status(400).json({ error: 'Signature name is required' });
    }

    const now = new Date();

    const saved = await prisma.applicationConsent.upsert({
      where: { applicationId: appId },
      update: {
        termsAccepted: accepted,
        emailUpdatesAccepted: emailsOk,
        consentTextVersion: consentTextVersion ? String(consentTextVersion) : null,
        signatureName: sig || null,
        signedAt: accepted ? now : null,
      },
      create: {
        applicationId: appId,
        termsAccepted: accepted,
        emailUpdatesAccepted: emailsOk,
        consentTextVersion: consentTextVersion ? String(consentTextVersion) : null,
        signatureName: sig || null,
        signedAt: accepted ? now : null,
      },
    });

    return res.status(200).json({ ok: true, consent: saved });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
