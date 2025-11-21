// pages/api/register/stage-user.js ← FINAL VERSION (supports newsletter + paid flow)
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, plan = 'job-seeker-free', newsletter = true, captchaToken } = req.body;

    // Basic validation (captcha already verified on frontend, but we keep this for safety)
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    const token = uuidv4();

    // Map frontend plan key → Prisma enum value
    const planMap = {
  'job-seeker-free': 'FREE',
  'job-seeker-pro': 'FREE',      // ← forced to FREE until payment
  'coach-mentor': 'FREE',         // ← forced to FREE until payment
  'recruiter-smb': 'FREE',        // ← forced to FREE until payment
  'enterprise-recruiter': 'FREE', // ← not used anyway
};
const dbPlan = planMap[plan] || 'FREE';

    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {
        name: name.trim(),
        plan: dbPlan,
        emailVerificationToken: token,
        newsletter: Boolean(newsletter), // ← restored
      },
      create: {
        email: email.toLowerCase(),
        name: name.trim(),
        plan: dbPlan,
        emailVerified: false,
        emailVerificationToken: token,
        role: 'SEEKER',
        newsletter: Boolean(newsletter), // ← restored
      },
    });

    console.log('SUCCESS → User staged:', user.email, '| Plan:', user.plan, '| Newsletter:', user.newsletter);

    // Send verification email (works with Maildev in dev, real SMTP in prod)
    await sendVerificationEmail(email.toLowerCase(), token);

    return res.status(200).json({
      success: true,
      message: 'Account created! Check your email to continue.',
    });

  } catch (err) {
    console.error('STAGE-USER ERROR:', err.message);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}