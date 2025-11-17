// lib/email.js  ← KEEP THIS FILE (you already have it)

import nodemailer from 'nodemailer';

// Use environment variables only – never hardcode credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // 587 = TLS, secure: false is correct
  auth: {
    user: process.env.SMTP_USER,     // ← change from EMAIL_USER
    pass: process.env.SMTP_PASS,     // ← change from EMAIL_PASS
  },
});

// ONLY CHANGE: use NEXT_PUBLIC_SITE_URL instead of NEXTAUTH_URL
export async function sendVerificationEmail(email, token) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: '"Forge Tomorrow" <noreply@forgetomorrow.com>',
    to: email,
    subject: 'Verify Your Email – Forge Tomorrow',
    html: `
      <h1>Welcome to Forge Tomorrow!</h1>
      <p>Click the button below to set your password and choose your plan:</p>
      <p style="text-align:center; margin:30px 0;">
        <a href="${url}" style="padding:14px 28px; background:#FF7043; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">
          Complete Your Account
        </a>
      </p>
      <p>Or copy this link:<br><a href="${url}">${url}</a></p>
    `,
  });
}