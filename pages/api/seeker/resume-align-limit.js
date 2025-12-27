// pages/api/seeker/resume-align-limit.js
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function monthKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      plan: true,
      resumeAlignFreeUses: true,
      resumeAlignLastResetMonth: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Unlimited for all paid tiers
  if (String(user.plan).toUpperCase() !== 'FREE') {
    return res.status(200).json({ allowed: true, remaining: null });
  }

  const currentMonth = monthKeyUTC(new Date());
  const lastReset = (user.resumeAlignLastResetMonth || '').toString();
  let uses = Number(user.resumeAlignFreeUses || 0);

  // New month — reset usage counter to 0 (DO NOT consume)
  if (lastReset !== currentMonth) {
    uses = 0;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resumeAlignLastResetMonth: currentMonth,
        resumeAlignFreeUses: 0,
      },
    });
  }

  if (uses >= 3) {
    return res.status(200).json({
      allowed: false,
      remaining: 0,
      message:
        "You've used your 3 free Forge Hammer uses this month.\n\nUpgrade to Seeker Pro for unlimited scoring + coaching, or come back next month for more free uses.",
    });
  }

  return res.status(200).json({
    allowed: true,
    remaining: Math.max(0, 3 - uses),
  });
}
