// lib/email.js
import nodemailer from 'nodemailer';

const isDev = process.env.NODE_ENV !== 'production';

function pickEnv(primaryKey, fallbackKey, defaultValue = '') {
  const primary = process.env[primaryKey];
  if (primary !== undefined && String(primary).trim() !== '') return String(primary).trim();

  const fallback = process.env[fallbackKey];
  if (fallback !== undefined && String(fallback).trim() !== '') return String(fallback).trim();

  return defaultValue;
}

function parseBool(v, fallback = false) {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return fallback;
}

function getFromAddress() {
  // Prefer EMAIL_FROM if set.
  const envFrom = (process.env.EMAIL_FROM || '').trim();
  if (envFrom) return envFrom;

  // Fallback: use the configured SMTP/EMAIL user so "from" always matches a real sender.
  const fallbackEmail = pickEnv('SMTP_USER', 'EMAIL_USER', 'forgetomorrow.noreply@gmail.com');
  return `ForgetTomorrow <${fallbackEmail}>`;
}

function getProdTransportConfig() {
  // Prefer SMTP_* (Vercel), fallback to EMAIL_* (.env)
  const host = pickEnv('SMTP_HOST', 'EMAIL_SERVER', 'smtp.gmail.com');
  const portStr = pickEnv('SMTP_PORT', 'EMAIL_PORT', '587');
  const port = Number(portStr) || 587;

  const user = pickEnv('SMTP_USER', 'EMAIL_USER', '');
  const pass = pickEnv('SMTP_PASS', 'EMAIL_PASSWORD', '');

  // If you set SMTP_SECURE, honor it. Otherwise infer from port (465 => implicit TLS)
  const secureFromEnv = process.env.SMTP_SECURE;
  const secure = secureFromEnv !== undefined ? parseBool(secureFromEnv, false) : port === 465;

  return {
    host,
    port,
    secure,
    auth: { user, pass },

    // Helpful in serverless environments
    requireTLS: !secure,

    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,

    tls: {
      rejectUnauthorized: true,
      servername: host,
    },
  };
}

const transporter = nodemailer.createTransport(
  isDev
    ? {
        host: 'localhost',
        port: 1025,
        secure: false,
        ignoreTLS: true, // ✅ was typo'd before
        tls: { rejectUnauthorized: false },
        logger: true,
        debug: true,
      }
    : getProdTransportConfig()
);

async function safeSendMail(mailOptions, meta = {}) {
  try {
    await transporter.sendMail({
      from: getFromAddress(),
      ...mailOptions,
    });
    return { ok: true };
  } catch (err) {
    // ✅ SAFE diagnostics (no secrets)
    const host = isDev ? 'localhost' : pickEnv('SMTP_HOST', 'EMAIL_SERVER', 'smtp.gmail.com');
    const portStr = isDev ? '1025' : pickEnv('SMTP_PORT', 'EMAIL_PORT', '587');
    const port = Number(portStr) || 587;

    const hasUser = !!pickEnv('SMTP_USER', 'EMAIL_USER', '');
    const hasPass = !!pickEnv('SMTP_PASS', 'EMAIL_PASSWORD', '');
    const secure =
      !isDev && process.env.SMTP_SECURE !== undefined
        ? parseBool(process.env.SMTP_SECURE, false)
        : port === 465;

    console.error('[email] send failed', {
      meta,
      host,
      port,
      secure,
      hasUser,
      hasPass,
      nodeEnv: process.env.NODE_ENV,
      error: String(err?.message || err),
    });

    throw err;
  }
}

export async function sendVerificationEmail(email, token) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/verify-email?token=${token}`;

  await safeSendMail(
    {
      to: email,
      subject: 'Verify Your Email – Forge Tomorrow',
      html: `
        <h1>Welcome to Forge Tomorrow!</h1>
        <p>Click the button below to set your password and choose your plan:</p>
        <p style="text-align:center; margin:40px 0;">
          <a href="${url}" style="padding:16px 32px; background:#FF7043; color:white; text-decoration:none; border-radius:8px; font-weight:bold; font-size:18px;">
            Complete Your Account
          </a>
        </p>
        <p>Or copy this link:<br><a href="${url}">${url}</a></p>
        <p style="color:#666; font-size:12px;">This link expires in 24 hours.</p>
      `,
    },
    { type: 'verify', to: email }
  );

  if (isDev) console.log('EMAIL SENT → Open http://localhost:1080 to see it!');
  else console.log('Production email sent to:', email);
}

export async function sendPasswordResetEmail(email, token) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/reset-password?token=${token}`;

  await safeSendMail(
    {
      to: email,
      subject: 'Reset Your Password – Forge Tomorrow',
      html: `
        <h1>Password Reset</h1>
        <p>We received a request to reset your Forge Tomorrow password.</p>
        <p style="text-align:center; margin:40px 0;">
          <a href="${url}" style="padding:16px 32px; background:#FF7043; color:white; text-decoration:none; border-radius:8px; font-weight:bold; font-size:18px;">
            Reset Password
          </a>
        </p>
        <p>This link expires in <strong>15 minutes</strong> and can only be used once.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p style="color:#666; font-size:12px;">Or copy this link:<br><a href="${url}">${url}</a></p>
      `,
    },
    { type: 'password_reset', to: email }
  );

  if (isDev) console.log('RESET EMAIL SENT → Open http://localhost:1080 to see it!');
  else console.log('Password reset email sent to:', email);
}
