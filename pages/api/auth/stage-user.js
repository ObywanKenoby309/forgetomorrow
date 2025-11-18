// pages/api/auth/stage-user.js
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, plan, newsletter } = req.body;
  if (!name || !email || !plan) return res.status(400).json({ error: 'Missing fields' });

  const token = uuidv4();

  await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      selectedPlan: plan,
      newsletter,
      emailVerificationToken: token,
      status: 'pending_payment', // free will be activated instantly later
    },
  });

  await sendVerificationEmail(email, token);
  res.status(200).json({ success: true });
}