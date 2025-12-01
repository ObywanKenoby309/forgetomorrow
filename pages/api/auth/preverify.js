// pages/api/auth/preverify.js
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const VERIFICATION_EXPIRY_MINUTES = 60;
const isProd = process.env.NODE_ENV === 'production';
const REGISTRATION_LOCK = process.env.REGISTRATION_LOCK === '1';

// BREVO NEWSLETTER AUTO-ADD
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

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // fail-open if not configured

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await res.json();
  return data.success;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Global kill-switch for new registrations
  if (REGISTRATION_LOCK) {
    return res.status(503).json({
      error: 'Registrations are currently closed. Please try again later.',
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

  console.log('RAW NEWSLETTER VALUE:', newsletter);

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

  // 1) Check if user exists
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

  // 2) Create verification token row
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
    console.log('DB save successful for preverify:', normalizedEmail);
  } catch (error) {
    console.error('PRISMA CREATE FAILED:', error);
    return res.status(500).json({
      error: 'Failed to save verification token',
      details: error.message,
    });
  }

  // 3) Newsletter → Brevo
  const wantsNewsletter =
    newsletter === 'on' || newsletter === true || newsletter === 'true';

  console.log('WANTS NEWSLETTER?', wantsNewsletter);

  if (wantsNewsletter) {
    console.log('CALLING BREVO...');
    await addToBrevo(normalizedEmail, firstName, lastName);
  }

  // 4) Build verification URL
  const baseUrl =
    process.env.NEXT_PUBLIC_OPEN_SITE ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001';

  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  // 5) Email transport
  let emailSent = false;

  try {
    let transporter;

    if (isProd) {
      // Production: real SMTP
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
      // Development: Maildev / local SMTP
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

    await transporter.sendMail({
      from: 'ForgeTomorrow <no-reply@forgetomorrow.com>',
      to: normalizedEmail,
      subject: 'Verify your ForgeTomorrow account',
      html: `<h2>Welcome, ${firstName}!</h2>
             <p>Click below to verify (expires in 1 hour):</p>
             <p><a href="${verifyUrl}" style="background:#FF7043;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Account</a></p>
             <p>Or copy: ${verifyUrl}</p>`,
      text: `Verify: ${verifyUrl}`,
    });

    emailSent = true;
    console.log('EMAIL SENT TO:', normalizedEmail);
  } catch (err) {
    // 🔸 IMPORTANT CHANGE: log error, but don't block the response
    emailSent = false;
    console.error('EMAIL SEND FAILED (non-blocking):', err);
  }

  // 6) Respond OK regardless of email status
  // Frontend currently just checks res.ok → "sent" state
  return res.status(200).json({
    success: true,
    emailSent,
    // In dev you *could* expose verifyUrl for debugging if you wanted:
    // verifyUrl: isProd ? undefined : verifyUrl,
  });
}
