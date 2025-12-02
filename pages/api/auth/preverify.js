// pages/api/auth/preverify.js
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const VERIFICATION_EXPIRY_MINUTES = 60;
const isProd = process.env.NODE_ENV === 'production';

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

    if (res.ok) {
      console.log('[preverify] BREVO → added:', email);
    } else {
      console.error('[preverify] Brevo error:', await res.text());
    }
  } catch (err) {
    console.error('[preverify] Brevo exception:', err.message);
  }
}

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.log('[preverify] No RECAPTCHA_SECRET_KEY set — skipping verification');
    return true;
  }

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });

  const data = await res.json();
  console.log('[preverify] reCAPTCHA result:', data);
  return data.success;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    firstName,
    lastName,
    email,
    plan,
    hasPassword: Boolean(password),
    hasRecaptcha: Boolean(recaptchaToken),
    newsletter,
  });

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Missing reCAPTCHA token' });
  }

  if (process.env.NODE_ENV === 'production') {
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
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
      console.log('[preverify] existing user found for', normalizedEmail);
      return res.status(400).json({ error: 'Email already registered' });
    }
  } catch (err) {
    console.error('[preverify] DB check failed (user.findUnique):', err);
    return res.status(500).json({
      error: 'Database error',
      where: 'user.findUnique',
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
    const vt = await prisma.verificationToken.create({
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

    console.log('[preverify] verificationToken created:', {
      id: vt.id,
      email: vt.email,
      expiresAt: vt.expiresAt,
    });
  } catch (err) {
    console.error('[preverify] PRISMA CREATE FAILED (verificationToken):', err);
    return res.status(500).json({
      error: 'Database error',
      where: 'verificationToken.create',
      details: err.message,
      code: err.code || null,
    });
  }

  // ─────────────────────────────────────
  // 3) Newsletter → Brevo (optional)
  // ─────────────────────────────────────
  const wantsNewsletter =
    newsletter === 'on' || newsletter === true || newsletter === 'true';

  console.log('[preverify] WANTS NEWSLETTER?', wantsNewsletter);
  if (wantsNewsletter) {
    console.log('[preverify] Calling Brevo for', normalizedEmail);
    await addToBrevo(normalizedEmail, firstName, lastName);
  }

  // ─────────────────────────────────────
  // 4) Build verification URL
  // ─────────────────────────────────────
  const baseUrl =
    process.env.NEXT_PUBLIC_OPEN_SITE ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001';

  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;
  console.log('[preverify] verifyUrl:', verifyUrl);

  // ─────────────────────────────────────
  // 5) Email transport (Zoho in prod, Maildev in dev)
  // ─────────────────────────────────────
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
             <p>Click below to verify (expires in ${VERIFICATION_EXPIRY_MINUTES} minutes):</p>
             <p><a href="${verifyUrl}" style="background:#FF7043;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Account</a></p>
             <p>Or copy: ${verifyUrl}</p>`,
      text: `Verify: ${verifyUrl}`,
    });

    console.log('[preverify] EMAIL SENT TO:', normalizedEmail);
  } catch (err) {
    console.error('[preverify] EMAIL SEND FAILED:', err);

    if (isProd) {
      return res.status(500).json({
        error: 'Email failed',
        details: err.message,
      });
    } else {
      console.warn(
        '[preverify] Dev mode: email failed, but continuing. Verify URL:',
        verifyUrl
      );
    }
  }

  return res.status(200).json({ success: true });
}
