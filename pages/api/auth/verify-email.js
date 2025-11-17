// pages/api/auth/verify-email.js
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import Stripe from 'stripe';
import { sign } from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-fallback';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token, password, plan } = req.body;

  if (!token || !password || !plan) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password too short' });
  }

  try {
    // 1. Find user by token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true,
        emailVerificationToken: null,
        plan: plan.toUpperCase(), // FREE, PRO, PREMIUM
      },
    });

    // 4. If paid plan → Create Stripe Checkout
    if (plan !== 'free') {
      const priceMap = {
        pro: process.env.STRIPE_PRICE_PRO,
        premium: process.env.STRIPE_PRICE_PREMIUM,
      };

      const priceId = priceMap[plan];
      if (!priceId) {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email/cancel`,
        metadata: {
          userId: user.id,
        },
      });

      return res.status(200).json({
        redirectToStripe: true,
        checkoutUrl: session.url,
      });
    }

    // 5. Free plan → Auto-login
    const jwt = sign(
      { userId: updatedUser.id, email: updatedUser.email, plan: updatedUser.plan },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.setHeader('Set-Cookie', `auth=${jwt}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Verify email error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}