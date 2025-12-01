// pages/api/auth/preverify.js
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const VERIFICATION_EXPIRY_MINUTES = 60;
const isProd = process.env.NODE_ENV === 'production';
const REGISTRATION_LOCK = process.env.REGISTRATION_LOCK === '1';

// ─────────────────────────────────────────
// Brevo newsletter auto-add
// ─────────────────────────────────────────
async function addToBrevo(email, firstName, lastName) {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_LIST_ID) {
    console.log('Brevo not configured — skipping');
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
      console.log('BREVO → added:', email);
    } else {
      console.error('Brevo error:', await res.text());
    }
  } catch (err) {
    console.error('Brevo exception:', err.message);
  }
}

// ─────────────────────────────────────────
// reCAPTCHA verify
// ─────────────────────────────────────────
async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    // If not configured, allow (we're already gated with REGISTRATION_LOCK)
    return true;
  }

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });

  const data = await res.json();
  return data.success;
}

// ─────────────────────────────────────────
// Handler
// ─────────────────────────────────────────
export default async function handler(req, res) {
  // If we ever need to slam the door, this is the single switch.
  if (REGISTRATION_LOCK) {
    return res.status(403).json({
      error:
        'Registration is temporarily closed while we prepare for launch. Please try again soon.',
    });
  }

  // We *could* 405 on non-POST, but to avoid weird 405s surfacing in UI,
  // we just let the normal validation fall through and give a clean 400.
  const { method } = req;

  if (method !== 'POST') {
    return res.status(400).json({ error: 'Invalid request method' });
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

  console.log('RAW NEWSLETTER VALUE:', newsletter);

  // Basic validation
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Missing reCAPTCHA token' });
  }

  // Only enforce reCAPTCHA strictly in production
  if (isProd) {
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      return res.status(400).json({ error: 'reCAPTCHA failed' });
    }
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
  } catch (err) {
    console.error('DB check failed:', err);
    return res.status(500).json({ error: 'Database error' });
  }

  // Create verification token row
  const passwordHash = await bcrypt.hash(password, 10);
  const token = uuidv4();
  const expiresAt = new Date(
    Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000
  );

  try {
    await prisma.verificationToken.create({
      data: {
        token,
        email: normalizedEmail,
        firstName,
        lastName,
        passwordHash,
        plan,
        newsletter: Boolean(newsletter),
        expiresAt,
      },
    });
    console.log('DB save successful');
  } catch (error) {
    console.error('PRISMA CREATE FAILED:', error);
    return res
      .status(500)
      .json({ error: 'Failed to save', details: error.message });
  }

  // Newsletter → Brevo
  const wantsNewsletter =
    newsletter === 'on' || newsletter === true || newsletter === 'true';

  console.log('WANTS NEWSLETTER?', wantsNewsletter);
  if (wantsNewsletter) {
    console.log('CALLING BREVO...');
    await addToBrevo(normalizedEmail, firstName, lastName);
  }

  // Build verification URL
  const baseUrl =
    process.env.NEXT_PUBLIC_OPEN_SITE ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001';

  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  // SMTP config
  let transporter;
  if (isProd) {
    // Production → Zoho (or other real SMTP)
    transporter = nodemailer.createTransport({
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
      logger: true,
      debug: true,
    });
  } else {
    // Dev → Maildev / local SMTP
    transporter = nodemailer.createTransport({
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

  try {
    await transporter.sendMail({
      from: 'ForgeTomorrow <no-reply@forgetomorrow.com>',
      to: normalizedEmail,
      subject: 'Verify your ForgeTomorrow account',
      html: `<h2>Welcome, ${firstName}!</h2>
        <p>Click below to verify (expires in 1 hour):</p>
        <p>
          <a href="${verifyUrl}"
             style="background:#FF7043;color:white;padding:15px 30px;
                    text-decoration:none;border-radius:8px;font-weight:bold;">
            Verify Account
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${verifyUrl}</p>`,
      text: `Verify your ForgeTomorrow account: ${verifyUrl}`,
    });

    console.log('EMAIL SENT TO:', normalizedEmail);
  } catch (err) {
    console.error('EMAIL SEND FAILED:', err);

    if (isProd) {
      // In production, fail hard if SMTP is wrong
      return res.status(500).json({ error: 'Email failed to send' });
    } else {
      console.warn(
        'Dev mode: email failed, but continuing. Verify URL:',
        verifyUrl
      );
    }
  }

  return res.status(200).json({ success: true });
}
