// pages/api/auth/preverify.js
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const VERIFICATION_EXPIRY_MINUTES = 60;
const isProd = process.env.NODE_ENV === 'production';

// Optional registration lock (0 = allow, 1 = block)
const REGISTRATION_LOCK = process.env.REGISTRATION_LOCK === '1';

// Optional reCAPTCHA bypass (0 = enforce, 1 = skip)
// Use this ONLY for controlled internal testing.
const RECAPTCHA_DISABLED = process.env.RECAPTCHA_DISABLED === '1';

// ─────────────────────────────────────────────────────────────
// CORS (minimal) — fixes OPTIONS preflight "Method Not Allowed"
// ─────────────────────────────────────────────────────────────
function getOrigin(hostOrUrl) {
  try {
    if (!hostOrUrl) return '';
    const s = String(hostOrUrl);
    if (s.startsWith('http://') || s.startsWith('https://')) return new URL(s).origin;
    // If only host provided, treat as https origin
    return `https://${s.replace(/\/+$/, '')}`;
  } catch {
    return '';
  }
}

function setCors(req, res) {
  const reqOrigin = String(req.headers.origin || '');
  const allowFromEnv = [
    getOrigin(process.env.NEXT_PUBLIC_OPEN_SITE),
    getOrigin(process.env.NEXT_PUBLIC_SITE_URL),
  ].filter(Boolean);

  // If request origin matches one of our known site origins, allow it
  const allowOrigin =
    reqOrigin && allowFromEnv.includes(reqOrigin)
      ? reqOrigin
      : !isProd
      ? reqOrigin || '*'
      : allowFromEnv[0] || '';

  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

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

function parseBoolEnv(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return null;
}

export default async function handler(req, res) {
  setCors(req, res);

  // ✅ Handle preflight cleanly
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    // Frontend currently sends `captchaToken`; we also accept `recaptchaToken` for flexibility.
    recaptchaToken,
    captchaToken,
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

  // Choose whichever token field was provided
  const tokenToVerify = recaptchaToken || captchaToken || null;

  if (!RECAPTCHA_DISABLED) {
    if (!tokenToVerify) {
      return res.status(400).json({ error: 'Missing reCAPTCHA token' });
    }

    const captchaOk = await verifyRecaptcha(tokenToVerify);
    if (!captchaOk) {
      return res.status(400).json({ error: 'reCAPTCHA failed' });
    }
  } else {
    console.warn('[preverify] RECAPTCHA_DISABLED=1 — skipping reCAPTCHA verification');
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
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000);

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
  const wantsNewsletter = newsletter === 'on' || newsletter === true || newsletter === 'true';
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

  // ✅ Use your existing env naming (SMTP_* and EMAIL_*)
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER;
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;

  const smtpSecureEnv = parseBoolEnv(process.env.SMTP_SECURE);
  const secure = smtpSecureEnv !== null ? smtpSecureEnv : smtpPort === 465; // 587 => false (STARTTLS)

  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

  const fromHeader =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM_SUPPORT ||
    'ForgeTomorrow <no-reply@forgetomorrow.com>';

  // Choose transporter based on environment
  let transporter;
  if (isProd) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
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
      from: fromHeader,
      to: normalizedEmail,
      subject: 'Welcome to ForgeTomorrow — Confirm your account',
      html: `
    <div style="margin:0;padding:0;background:#020817;">
      <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="background:#020817;padding:32px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;">
              <tr>
                <td style="padding:0 20px;">
                  <!-- Outer frame -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                    style="
                      border-radius:18px;
                      overflow:hidden;
                      background:radial-gradient(circle at top right,#1f2937,#020617);
                      box-shadow:0 18px 60px rgba(0,0,0,0.45);
                    ">
                    <tr>
                      <td style="padding:22px 22px 18px 22px;">
                        <!-- Tiny top bar / “forge” feel -->
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td align="left">
                              <span style="
                                display:inline-block;
                                padding:4px 10px;
                                border-radius:999px;
                                background:rgba(15,23,42,0.9);
                                border:1px solid rgba(148,163,184,0.4);
                                font-size:10px;
                                letter-spacing:0.18em;
                                text-transform:uppercase;
                                color:#e5e7eb;
                              ">
                                EARLY ACCESS • SEEKER
                              </span>
                            </td>
                            <td align="right">
                              <span style="font-size:11px;color:#9ca3af;">
                                ${new Date().getFullYear()}
                              </span>
                            </td>
                          </tr>
                        </table>

                        <!-- Main title -->
                        <h1 style="
                          margin:18px 0 4px 0;
                          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                          font-size:24px;
                          line-height:1.25;
                          font-weight:800;
                          letter-spacing:-0.02em;
                          color:#f9fafb;
                          text-align:left;
                        ">
                          Welcome, ${firstName}.
                        </h1>

                        <p style="
                          margin:0 0 6px 0;
                          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                          font-size:14px;
                          line-height:1.6;
                          color:#e5e7eb;
                        ">
                          You’re one click away from stepping into a different kind of professional network —
                          built for real seekers, real recruiters, and real momentum.
                        </p>

                        <p style="
                          margin:0 0 18px 0;
                          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                          font-size:12px;
                          line-height:1.6;
                          color:#9ca3af;
                        ">
                          This verification link is active for <strong>60 minutes</strong>. After that, you can always
                          request a new one.
                        </p>

                        <!-- Call to action -->
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
                          <tr>
                            <td align="left">
                              <a href="${verifyUrl}"
                                style="
                                  display:inline-block;
                                  padding:11px 26px;
                                  border-radius:999px;
                                  font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                                  font-size:14px;
                                  font-weight:600;
                                  text-decoration:none;
                                  color:#ffffff;
                                  background:linear-gradient(135deg,#ff7043,#ffb199);
                                  box-shadow:0 12px 30px rgba(0,0,0,0.35);
                                ">
                                Confirm my account
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Tagline strip -->
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                          style="
                            margin:0 0 16px 0;
                            border-radius:12px;
                            border:1px solid rgba(148,163,184,0.35);
                            background:linear-gradient(135deg,rgba(15,23,42,0.9),rgba(15,23,42,0.96));
                          ">
                          <tr>
                            <td style="padding:10px 14px;">
                              <p style="
                                margin:0;
                                font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                                font-size:11px;
                                line-height:1.6;
                                color:#d1d5db;
                              ">
                                <strong style="color:#ffb199;">ForgeTomorrow</strong><span style="color:#6b7280;"> · </span>
                                Professional networking <span style="color:#9ca3af;">without the noise</span> —
                                with all the tools you actually need.
                              </p>
                            </td>
                          </tr>
                        </table>

                        <!-- Fallback URL -->
                        <p style="
                          margin:0 0 10px 0;
                          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                          font-size:12px;
                          line-height:1.6;
                          color:#9ca3af;
                        ">
                          If the button above doesn’t work, copy and paste this link into your browser:
                        </p>
                        <p style="
                          margin:0 0 14px 0;
                          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                          font-size:11px;
                          line-height:1.5;
                          color:#e5e7eb;
                          word-break:break-all;
                        ">
                          <a href="${verifyUrl}" style="color:#ffb199;text-decoration:underline;">
                            ${verifyUrl}
                          </a>
                        </p>

                        <hr style="border:none;border-top:1px solid rgba(55,65,81,0.9);margin:6px 0 10px 0;" />

                        <!-- Footer -->
                        <p style="
                          margin:0 0 2px 0;
                          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                          font-size:11px;
                          line-height:1.5;
                          color:#6b7280;
                        ">
                          Didn’t try to create a ForgeTomorrow account? You can safely ignore this email.
                        </p>
                        <p style="
                          margin:0;
                          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                          font-size:10px;
                          line-height:1.5;
                          color:#4b5563;
                        ">
                          You’re receiving this message because someone used this email address to sign up for
                          ForgeTomorrow. We’ll never share or sell your data — ever.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Tiny bottom spacing -->
                  <p style="
                    margin:10px 0 0 0;
                    font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                    font-size:10px;
                    line-height:1.5;
                    color:#4b5563;
                    text-align:center;
                  ">
                    © ${new Date().getFullYear()} ForgeTomorrow. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `,
      text: [
        `Welcome, ${firstName}.`,
        ``,
        `You’re one click away from confirming your ForgeTomorrow account.`,
        ``,
        `This link is active for 60 minutes:`,
        `${verifyUrl}`,
        ``,
        `If you didn’t try to create an account, you can safely ignore this email.`,
        `ForgeTomorrow — professional networking without the noise, with all the tools.`,
      ].join('\n'),
    });
  } catch (err) {
    console.error('[preverify] sendMail failed:', err);
    return res
      .status(500)
      .json({ error: 'Failed to send verification email', details: err.message });
  }

  return res.status(200).json({ success: true });
}
