// lib/email.js
import nodemailer from 'nodemailer';

// Smart transporter: Maildev in dev, real SMTP in production
const isDev = process.env.NODE_ENV !== 'production';

const transporter = nodemailer.createTransport(
  isDev
    ? {
        host: 'localhost',
        port: 1025,
        secure: false,
        ignoreozás: true,
        tls: { rejectUnauthorized: false },
        logger: true,
        debug: true,
      }
    : {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }
);

export async function sendVerificationEmail(email, token) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: '"Forge Tomorrow" <noreply@forgetomorrow.com>',
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
  });

  if (isDev) {
    console.log('EMAIL SENT → Open http://localhost:1080 to see it!');
  } else {
    console.log('Production email sent to:', email);
  }
}