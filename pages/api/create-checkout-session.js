// pages/api/create-checkout-session.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const prices = {
  'job-seeker-pro': 'price_1SUQc00l9wtvF7U5Kfo04KZU',
  'coach-mentor':    'price_1SUQcs0l9wtvF7U5aLqzGV2q',
  'recruiter-smb':   'price_1SUQdf0l9wtvF7U5nPY1bnLe',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { plan, userId } = req.body; // plan = one of the keys above

  if (!prices[plan]) return res.status(400).json({ error: 'Invalid plan' });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: prices[plan], quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    metadata: { userId: userId || '' },
  });

  res.status(200).json({ url: session.url });
}