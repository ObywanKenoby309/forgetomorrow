// pages/api/auth/preverify.js
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const VERIFICATION_EXPIRY_MINUTES = 60; // kept for future use if we restore tokens
const isProd = process.env.NODE_ENV === 'production';
const REGISTRATION_LOCK = process.env.REGISTRATION_LOCK === '1';

// ─────────────────────────────
// Brevo newsletter auto-add
// ─────────────────────────────
async function addToBrevo(email, firstName, lastName) {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_LIST_ID) {
    console.log('[preverify] Brevo not configured — skipping');
    return;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: firstName, LASTNAME: lastName },
        listIds: [Number(process.env.BREVO_LIST_ID)],
      }),
    });

    if (res.ok) {
      console.log('[preverify] Brevo contact added:', email);
    } else {
      console.error(
        '[preverify] Brevo error:',
        res.status,
        await res.text().catch(() => '<no text>')
      );
    }
  } catch (err) {
    console.error('[preverify] Brevo exception:', err);
  }
}

// ─────────────────────────────
// reCAPTCHA verify
// ─────────────────────────────
async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.warn('[preverify] Missing RECAPTCHA_SECRET_KEY — skipping check');
    return true;
  }

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('[preverify] reCAPTCHA verify error:', err);
    // Fail open rather than block signups if Google is flaky
    return true;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (REGISTRATION_LOCK) {
    return res.status(403).json({
      error: 'Registration is currently locked. Please try again later.',
    });
  }

  const {
    firstName,
    lastName,
    email,
    password,
    plan = 'free',
    recaptchaToken,
    newsletter,
  } = req.body || {};

  // ─────────────────────────────
  // Basic validation
  // ─────────────────────────────
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Missing reCAPTCHA token' });
  }

  // ─────────────────────────────
  // reCAPTCHA (only enforced in prod)
  // ─────────────────────────────
  if (isProd) {
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      return res.status(400).json({ error: 'reCAPTCHA failed' });
    }
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // ─────────────────────────────
    // Check if user already exists
    // ─────────────────────────────
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // ─────────────────────────────
    // DIRECT USER CREATION (no token)
    // This mirrors pages/api/register.js behaviour
    // ─────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    // Simple role / tier mapping for now — SEEKER/free
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: 'SEEKER',
        tier: 'free',
        // If your User model has name/firstName/lastName fields, you can
        // add them here later once we confirm the schema in production.
      },
      select: {
        id: true,
        email: true,
        role: true,
        tier: true,
        createdAt: true,
      },
    });

    console.log('[preverify] User created via signup:', user.email);

    // ─────────────────────────────
    // Newsletter → Brevo (optional)
    // ─────────────────────────────
    const wantsNewsletter =
      newsletter === 'on' || newsletter === true || newsletter === 'true';

    if (wantsNewsletter) {
      await addToBrevo(normalizedEmail, firstName, lastName);
    }

    // For now, we don’t send a verification email — account is ready to log in.
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('[preverify] DB error:', err);

    return res.status(500).json({
      error: 'Database error',
      details: err?.message || 'Unknown DB error',
      code: err?.code || null,
    });
  }
}
