// pages/api/webhook.js
import Stripe from 'stripe';
import { buffer } from 'micro';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Required for raw body
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err) {
    console.log('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const email = session.customer_email || session.customer_details?.email;
    const plan = session.metadata?.plan; // we set this in create-checkout-session

    if (email && plan) {
      await prisma.user.upsert({
        where: { email },
        update: { role: getRoleFromPlan(plan) },
        create: {
          email,
          name: session.customer_details?.name || 'Customer',
          role: getRoleFromPlan(plan),
          stripeCustomerId: session.customer,
        },
      });
    }
  }

  res.json({ received: true });
}

function getRoleFromPlan(plan) {
  const map = {
    'job-seeker-pro': 'pro',
    'coach-mentor': 'coach',
    'recruiter-smb': 'recruiter',
  };
  return map[plan] || 'free';
}