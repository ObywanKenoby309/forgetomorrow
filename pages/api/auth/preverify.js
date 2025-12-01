// pages/api/auth/preverify.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const VERIFICATION_EXPIRY_MINUTES = 60;
const isProd = process.env.NODE_ENV === 'production';
const REGISTRATION_LOCK = process.env.REGISTRATION_LOCK === '1';

// ─────────────────────────────────────────────
//  BREVO NEWSLETTER AUTO-ADD
// ─────────────────────────────────────────────
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
      console.log('[preverify] BREVO → added:', email);
    } else {
      console.error('[preverify] Brevo error:', await res.text());
    }
  } catch (err) {
    console.error('[preverify] Brevo exception:', err.message);
  }
}

// ─────────────────────────────────────────────
//  reCAPTCHA verify
// ─────────────────────────────────────────────
async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // if not configured, don't block

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });

  const data = await res.json();
  return data.success;
}

// ─────────────────────────────────────────────
//  HANDLER
// ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (REGISTRATION_LOCK) {
    return res
      .status(403)
      .json({ error: 'New registrations are temporarily disabled.' });
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

  console.log('[preverify] incoming body:', {
    email,
    plan,
    newsletter,
  });

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Missing reCAPTCHA token' });
  }

  if (isProd) {
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      return res.status(400).json({ error: 'reCAPTCHA failed' });
    }
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // ── Check if user already exists ──
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // ── Create verification token row ──
    const passwordHash = await bcrypt.hash(password, 10);
    const token = uuidv4();
    const expiresAt = new Date(
      Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000
    );

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
    console.log('[preverify] verification token saved');
  } catch (err) {
    console.error('[preverify] DB error:', err);
    return res.status(500).json({ error: 'Database error' });
  }

  // Newsletter opt-in → Brevo
  const wantsNewsletter =
    newsletter === 'on' || newsletter === true || newsletter === 'true';
  if (wantsNewsletter) {
    addToBrevo(normalizedEmail, firstName, lastName).catch((err) =>
      console.error('[preverify] Brevo async error:', err)
    );
  }

  // ── Build verify URL ──
  const baseUrl =
    process.env.NEXT_PUBLIC_OPEN_SITE ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001';

  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  // ── Nodemailer transport (Zoho / Maildev) ──
  let transporter;
  if (isProd) {
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
    });
  } else {
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      ignoreTLS: true,
      auth: null,
      tls: { rejectUnauthorized: false },
    });
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_ADMIN || 'ForgeTomorrow <no-reply@forgetomorrow.com>',
      to: normalizedEmail,
      subject: 'Verify your ForgeTomorrow account',
      html: `<h2>Welcome, ${firstName}!</h2>
             <p>Click below to verify (expires in 1 hour):</p>
             <p><a href="${verifyUrl}" style="background:#FF7043;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Account</a></p>
             <p>Or copy: ${verifyUrl}</p>`,
      text: `Verify: ${verifyUrl}`,
    });

    console.log('[preverify] verification email sent to', normalizedEmail);
  } catch (err) {
    console.error('[preverify] EMAIL SEND FAILED:', err);

    if (isProd) {
      return res.status(500).json({ error: 'Email failed' });
    } else {
      console.warn(
        '[preverify] Dev mode: email failed, but returning success. Verify URL:',
        verifyUrl
      );
    }
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  return res.status(200).json({ success: true });
}
