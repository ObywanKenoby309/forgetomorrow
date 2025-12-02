// pages/api/auth/preverify.js
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

const isProd = process.env.NODE_ENV === 'production';
const REGISTRATION_LOCK = process.env.REGISTRATION_LOCK === '1';

// Optional: verify reCAPTCHA if keys are configured
async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  // If no secret configured, don't block signup on it
  if (!secret) return true;

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token || '',
      }),
    });

    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('[preverify] reCAPTCHA verify error', err);
    // Fail open to avoid bricking signup because Google is flaky
    return true;
  }
}

// Get a nodemailer transporter (Zoho in prod, Maildev in dev)
function getTransporter() {
  if (isProd) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      logger: false,
      debug: false,
    });
  }

  // Dev: Maildev / local SMTP
  return nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false,
    ignoreTLS: true,
    auth: null,
    tls: { rejectUnauthorized: false },
    logger: true,
    debug: true,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (REGISTRATION_LOCK) {
    return res
      .status(403)
      .json({ error: 'Registration is temporarily disabled.' });
  }

  const {
    firstName,
    lastName,
    email,
    password,
    plan = 'FREE',
    recaptchaToken,
  } = req.body || {};

  // Basic validation
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  // reCAPTCHA (if configured)
  const recaptchaOk = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaOk) {
    return res.status(400).json({ error: 'reCAPTCHA failed.' });
  }

  // Check if user already exists
  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: 'An account with this email already exists.' });
    }
  } catch (err) {
    console.error('[preverify] DB lookup failed', err);
    return res.status(500).json({ error: 'Database error.' });
  }

  // Hash password & create user directly
  const passwordHash = await bcrypt.hash(password, 12);

  // Simple role/tier mapping for now: everything from this form is a free SEEKER
  const role = 'SEEKER';
  const tier = 'free';
  const name = `${firstName} ${lastName}`.trim();

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role,
        tier,
        name,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tier: true,
        createdAt: true,
      },
    });
  } catch (err) {
    console.error('[preverify] User create failed', err);
    return res.status(500).json({ error: 'Database error.' });
  }

  // Fire-and-forget welcome email (non-fatal if it fails)
  try {
    const transporter = getTransporter();

    const fromAddress =
      process.env.SMTP_FROM || 'ForgeTomorrow <no-reply@forgetomorrow.com>';

    await transporter.sendMail({
      from: fromAddress,
      to: normalizedEmail,
      subject: 'Welcome to ForgeTomorrow',
      html: `
        <h2>Welcome, ${firstName}!</h2>
        <p>Your ForgeTomorrow account has been created.</p>
        <p>You can now sign in using this email and the password you chose.</p>
        <p>
          <a href="${process.env.NEXTAUTH_URL || 'https://www.forgetomorrow.com'}/auth/signin"
             style="background:#FF7043;color:white;padding:12px 24px;
                    text-decoration:none;border-radius:8px;font-weight:bold;">
            Sign in to ForgeTomorrow
          </a>
        </p>
      `,
      text: `Your ForgeTomorrow account is ready. Sign in at ${
        process.env.NEXTAUTH_URL || 'https://www.forgetomorrow.com'
      }/auth/signin`,
    });
  } catch (err) {
    console.warn('[preverify] Welcome email failed (non-fatal)', err);
    // Do NOT fail signup here — the user is already created.
  }

  // All good
  return res.status(201).json({
    success: true,
    user,
  });
}
