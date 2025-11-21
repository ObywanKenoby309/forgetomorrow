// pages/api/stripe/create-checkout.js ← FINAL WORKING VERSION (MUST BE THIS)
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name, priceId, plan } = req.body;

  console.log('Creating checkout for:', { email, priceId, plan });

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/check-email?paid=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/pricing`,
      metadata: { name, plan },
    });

    // THIS LINE IS THE KEY — return JSON, NOT redirect
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}