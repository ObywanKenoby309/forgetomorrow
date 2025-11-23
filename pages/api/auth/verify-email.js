// pages/api/auth/verify-email.js
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// NEW — slug utilities
import { normalizeSlug, hasBannedTerm, randomSuffix } from '@/lib/slug';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Billing gate — testing = off, production = on
const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';

// Password must be 12+ chars with uppercase, lowercase, number, and symbol
const isStrongPassword = (password) => {
  const strongRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
  return strongRegex.test(password);
};

// Generate a clean unique slug for the new user
async function generateUniqueSlug(firstName, lastName) {
  const base = normalizeSlug(`${firstName}-${lastName}`);

  // If name reduces to empty or garbage, fallback
  const safeBase = base || "user";

  let attempt = 0;
  while (attempt < 10) {
    const candidate = `${safeBase}-${randomSuffix(5)}`;

    // Check banned content
    if (hasBannedTerm(candidate)) {
      attempt++;
      continue;
    }

    // Check DB uniqueness
    const exists = await prisma.user.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!exists) return candidate;

    attempt++;
  }

  // If all attempts fail — generate a fully random slug
  return `user-${randomSuffix(8)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ error: 'Token and password are required.' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          'Password must be at least 12 characters long and include an uppercase letter, a lowercase letter, a number, and a symbol.',
      });
    }

    // Look up staged record in verification_tokens table
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return res
        .status(400)
        .json({ error: 'Invalid or expired token. Please sign up again.' });
    }

    // Check expiry
    if (new Date() > record.expiresAt) {
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return res
        .status(400)
        .json({ error: 'Link expired. Please sign up again.' });
    }

    const email = record.email.toLowerCase();
    const firstName = record.firstName;
    const lastName = record.lastName;

    // Normalize plan
    const planFromToken = (record.plan || 'FREE').toUpperCase();
    const validPlans = ['FREE', 'PRO', 'COACH', 'SMALL_BIZ', 'ENTERPRISE'];
    const planForUser = validPlans.includes(planFromToken)
      ? planFromToken
      : 'FREE';

    // Safety: if user already exists, abort
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return res.status(400).json({
        error: 'An account with this email already exists. Please sign in.',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // NEW — Create the user's slug
    const slug = await generateUniqueSlug(firstName, lastName);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: true,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        plan: planForUser,
        newsletter: record.newsletter ?? false,
        slug,  // ←←← NEW FIELD
      },
    });

    // Clean up token
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

    const plan = user.plan;

    // ─────────────────────────────────────────
    // BILLING DISABLED → instant login
    // ─────────────────────────────────────────
    if (!BILLING_ENABLED) {
      const jwt = sign(
        {
          userId: user.id,
          email: user.email,
          plan,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.setHeader(
        'Set-Cookie',
        `auth=${jwt}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
      );

      const isPaidPlan = ['PRO', 'COACH', 'SMALL_BIZ'].includes(plan);
      return res.json({ success: true, billingDeferred: isPaidPlan, slug: user.slug });
    }

    // ─────────────────────────────────────────
    // BILLING ENABLED → paid plans → Stripe checkout
    // ─────────────────────────────────────────
    const paidPlans = ['PRO', 'COACH', 'SMALL_BIZ'];

    if (paidPlans.includes(plan)) {
      const priceMap = {
        PRO: process.env.STRIPE_PRICE_PRO,
        COACH: process.env.STRIPE_PRICE_COACH,
        SMALL_BIZ: process.env.STRIPE_PRICE_SMALL_BIZ,
      };

      const priceId = priceMap[plan];
      if (!priceId) {
        return res.status(500).json({
          error: `Missing Stripe price ID for plan ${plan}`,
        });
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_OPEN_SITE ||
        'https://forgetomorrow.com';

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/profile?verified=1`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: { userId: user.id, plan, slug: user.slug },
      });

      return res.json({
        redirectToStripe: true,
        checkoutUrl: session.url,
      });
    }

    // FREE + ENTERPRISE → instant login
    const jwt = sign(
      {
        userId: user.id,
        email: user.email,
        plan,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.setHeader(
      'Set-Cookie',
      `auth=${jwt}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    );

    return res.json({ success: true, slug: user.slug });
  } catch (err) {
    console.error('Verify-email POST error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
