// pages/api/anvil/project-promotion/save.js
// Saves a completed Project & Promotion Intelligence result to the DB.
// Result is then accessible via ForgeVault as a forge doc.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const userId = session.user.id;
    const { formInput, result } = req.body || {};

    if (!result || !formInput) {
      return res.status(400).json({ error: 'formInput and result are required' });
    }

    // Derive a human-readable title from the form inputs
    const role = String(formInput.currentRole || '').trim();
    const company = String(formInput.currentCompany || '').trim();
    const title = role && company
      ? `${role} at ${company} — Project & Promotion Brief`
      : role
      ? `${role} — Project & Promotion Brief`
      : 'Project & Promotion Brief';

    const saved = await prisma.projectPromotionResult.create({
      data: {
        userId,
        title,
        formInput,
        result,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ ok: true, result: saved });
  } catch (err) {
    console.error('[api/anvil/project-promotion/save]', err);
    return res.status(500).json({ error: 'Could not save project promotion result' });
  }
}