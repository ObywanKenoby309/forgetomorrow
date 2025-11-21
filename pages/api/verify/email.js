// pages/api/verify/email.js
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user || user.emailVerified) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Free plan → activate instantly
    if (user.selectedPlan === 'job-seeker-free') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          status: 'active',
          emailVerificationToken: null,
        },
      });
      return res.json({ success: true, plan: 'job-seeker-free' });
    }

    // Paid plan → send to Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{
        price: process.env[`STRIPE_${user.selectedPlan.toUpperCase().replace(/-/g, '_')}_PRICE_ID`],
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_OPEN_SITE}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_OPEN_SITE}/pricing`,
      metadata: { userId: user.id.toString(), plan: user.selectedPlan },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: null },
    });

    res.json({ success: true, checkoutUrl: session.url });
  } catch (err) {
    console.error('VERIFY EMAIL ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
}