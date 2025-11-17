// pages/api/webhook.js
import { buffer } from 'micro';
import prisma from '@/lib/prisma';

// Disable Next.js body parsing — required for Stripe webhooks
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  // Temporary bypass while creating the endpoint in Stripe (prevents 500)
  if (!process.env.STRIPE_WEBHOOK_SECRET || !sig) {
    console.log('Webhook secret not set or no signature – accepting (setup mode)');
    return res.status(200).json({ received: true });
  }

  try {
    // Dynamic import so we don’t crash on GET requests
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Webhook received: ${event.type}`);

    // Your existing logic — unchanged and perfect
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_email || session.customer_details?.email;
      const plan = session.metadata?.plan;

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
        console.log(`User ${email} upgraded to ${getRoleFromPlan(plan)}`);
      }
    }

    // Add more event handlers here later (invoice.paid, subscription.deleted, etc.)

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}

// Map your 3 plans → roles
function getRoleFromPlan(plan) {
  const map = {
    'job-seeker-pro': 'pro',
    'coach-mentor': 'coach',
    'recruiter-smb': 'recruiter',
  };
  return map[plan] || 'free';
}