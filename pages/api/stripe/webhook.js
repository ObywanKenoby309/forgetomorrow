// pages/api/stripe/webhook.js ← FINAL VERSION (DO THIS NOW)
import { buffer } from 'micro';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email?.toLowerCase();
    const plan = session.metadata.plan; // "PRO", "COACH", "SMALL_BIZ"

    if (!email || !plan) {
      console.error('Missing email or plan in webhook');
      return res.status(400).end();
    }

    // Map plan → role
    const roleMap = {
      PRO: 'SEEKER',
      COACH: 'COACH',
      SMALL_BIZ: 'RECRUITER',
      ENTERPRISE: 'RECRUITER',
    };

    await prisma.user.update({
      where: { email },
      data: {
        plan,
        role: roleMap[plan] || 'SEEKER',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
      },
    });

    console.log(`UPGRADED → ${email} | Plan: ${plan} | Role: ${roleMap[plan] || 'SEEKER'}`);
  }

  res.json({ received: true });
}