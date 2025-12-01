// pages/api/auth/preverify.js
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const VERIFICATION_EXPIRY_MINUTES = 60;
const isProd = process.env.NODE_ENV === 'production';
const REGISTRATION_LOCK = process.env.REGISTRATION_LOCK === '1';

// ─────────────────────────────────────────────
//  Brevo newsletter auto-add
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

    if (!res.ok) {
      const text = await res.text();
      console.error('[preverify] Brevo error:', text);
    } else {
      console.log('[preverify] Brevo → added:', email);
    }
  } catch (err) {
    console.error('[preverify] Brevo exception:', err.message);
  }
}

// ─────────────────────────────────────────────
//  reCAPTCHA verify helper
// ─────────────────────────────────────────────
async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.warn('[preverify] No RECAPTCHA_SECRET_KEY set — skipping verify');
    return true;
  }

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });

  const data = await res.json();
  return !!data.success;
}

// ─────────────────────────────────────────────
//  Handler
// ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (REGISTRATION_LOCK && isProd) {
    console.warn('[preverify] Registration locked, blocking signup');
    return res.status(403).json({
      error: 'Signups are temporarily closed while we finalize launch.',
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
  } = req.body;

  console.log('[preverify] incoming body:', {
    hasFirstName: !!firstName,
    hasLastName: !!lastName,
    email,
    plan,
    hasRecaptcha: !!recaptchaToken,
    newsletter,
  });

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Missing reCAPTCHA token' });
  }

  // Only enforce captcha in prod
  if (isProd) {
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      console.warn('[preverify] reCAPTCHA failed for', email);
      return res.status(400).json({ error: 'reCAPTCHA failed' });
    }
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ─────────────────────────────────────
  // 1) Check if user already exists
  // ─────────────────────────────────────
  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
  } catch (err) {
    console.error('[preverify] DB check failed:', err);
    return res.status(500).json({
      error: 'Database error',
      details: err.message,
      code: err.code || null,
    });
  }

  // ─────────────────────────────────────
  // 2) Create verification token row
  // ─────────────────────────────────────
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

    console.log('[preverify] verificationToken saved for', normalizedEmail);
  } catch (error) {
    console.error('[preverify] PRISMA CREATE FAILED:', error);
    return res.status(500).json({
      error: 'Failed to save verification request',
      details: error.message,
      code: error.code || null,
    });
  }

  // ─────────────────────────────────────
  // 3) Newsletter → Brevo (fire and forget)
  // ─────────────────────────────────────
  const wantsNewsletter =
    newsletter === 'on' || newsletter === true || newsletter === 'true';

  if (wantsNewsletter) {
    console.log('[preverify] user opted into newsletter:', normalizedEmail);
    addToBrevo(normalizedEmail, firstName, lastName).catch((err) => {
      console.error('[preverify] Brevo async error:', err);
    });
  }

  // ─────────────────────────────────────
  // 4) Send verification email
  // ─────────────────────────────────────
  const baseUrl =
    process.env.NEXT_PUBLIC_OPEN_SITE ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001';

  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

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
      logger: true,
      debug: true,
    });
  } else {
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
             <p><a href="${verifyUrl}" style="background:#FF7043;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Account</a></p>
             <p>Or copy: ${verifyUrl}</p>`,
      text: `Verify your account: ${verifyUrl}`,
    });

    console.log('[preverify] verification email sent to', normalizedEmail);
  } catch (err) {
    console.error('[preverify] EMAIL SEND FAILED:', err);

    if (isProd) {
      // In prod we want this to be a real failure
      return res.status(500).json({ error: 'Email failed to send' });
    } else {
      console.warn(
        '[preverify] Dev mode: email failed, but continuing. Verify URL:',
        verifyUrl
      );
    }
  }

  // ─────────────────────────────────────
  // 5) Success
  // ─────────────────────────────────────
  return res.status(200).json({ success: true });
}
