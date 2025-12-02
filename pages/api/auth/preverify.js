// pages/api/auth/preverify.js
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const VERIFICATION_EXPIRY_MINUTES = 60;
const isProd = process.env.NODE_ENV === 'production';

// Optional registration lock (0 = allow, 1 = block)
const REGISTRATION_LOCK = process.env.REGISTRATION_LOCK === '1';

// BREVO NEWSLETTER AUTO-ADD
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
      const txt = await res.text();
      console.error('[preverify] Brevo error:', txt);
    } else {
      console.log('[preverify] Brevo → added:', email);
    }
  } catch (err) {
    console.error('[preverify] Brevo exception:', err.message);
  }
}

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.warn('[preverify] Missing RECAPTCHA_SECRET_KEY; treating as valid');
    return true;
  }
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    if (!data.success) {
      console.warn('[preverify] reCAPTCHA failed:', data);
    }
    return !!data.success;
  } catch (err) {
    console.error('[preverify] reCAPTCHA verify error:', err);
    // Fail closed in prod, open in dev
    return !isProd;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (REGISTRATION_LOCK) {
    return res.status(403).json({
      error: 'New registrations are temporarily disabled. Please try again later.',
    });
  }

  const {
    firstName,
    lastName,
    email,
    password,
    plan = 'free',
    captchaToken,     // 👈 from client
    recaptchaToken,   // 👈 legacy / alternate name
    newsletter,
  } = req.body || {};

  console.log('[preverify] Incoming payload (sanitized):', {
    email,
    plan,
    newsletter,
  });

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Support both captchaToken and recaptchaToken
  const captchaTokenToUse = captchaToken || recaptchaToken;

  if (!captchaTokenToUse) {
    return res.status(400).json({ error: 'Missing reCAPTCHA token' });
  }

  // reCAPTCHA
  const captchaOk = await verifyRecaptcha(captchaTokenToUse);
  if (!captchaOk) {
    return res.status(400).json({ error: 'reCAPTCHA failed' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  // Check if user exists
  let existing;
  try {
    existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  } catch (err) {
    console.error('[preverify] DB check failed:', err);
    return res
      .status(500)
      .json({ error: 'Database error (user lookup)', details: err.message });
  }

  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Hash password
  let passwordHash;
  try {
    passwordHash = await bcrypt.hash(password, 10);
  } catch (err) {
    console.error('[preverify] bcrypt hash failed:', err);
    return res
      .status(500)
      .json({ error: 'Password hashing failed', details: err.message });
  }

  // Create verification token row
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
    console.log('[preverify] verificationToken row created for', normalizedEmail);
  } catch (err) {
    console.error('[preverify] Prisma create verificationToken failed:', err);
    return res
      .status(500)
      .json({ error: 'Database error (token create)', details: err.message });
  }

  // Newsletter → Brevo
  const wantsNewsletter =
    newsletter === 'on' || newsletter === true || newsletter === 'true';
  if (wantsNewsletter) {
    console.log('[preverify] User opted into newsletter; sending to Brevo');
    await addToBrevo(normalizedEmail, firstName, lastName);
  }

  // Build verification URL
  const baseUrl =
    process.env.NEXT_PUBLIC_OPEN_SITE ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001';

  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  // Choose transporter based on environment
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
             <p>Click below to verify your account (link expires in 1 hour):</p>
             <p><a href="${verifyUrl}" style="background:#FF7043;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Verify account</a></p>
             <p>If the button doesn’t work, copy and paste this URL into your browser:</p>
             <p>${verifyUrl}</p>`,
      text: `Verify your ForgeTomorrow account: ${verifyUrl}`,
    });
    console.log('[preverify] Verification email sent to:', normalizedEmail);
  } catch (err) {
    console.error('[preverify] EMAIL SEND FAILED:', err);

    if (isProd) {
      return res.status(500).json({ error: 'Email failed', details: err.message });
    } else {
      console.warn(
        '[preverify] Dev mode: email failed, but continuing. Verify URL:',
        verifyUrl
      );
    }
  }

  return res.status(200).json({ success: true });
}
