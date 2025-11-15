// lib/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email, token) {
  const link = `${process.env.NEXTAUTH_URL}/api/auth/verify/${token}`;

  await transporter.sendMail({
    from: '"ForgeTomorrow" <no-reply@forgotomorrow.com>',
    to: email,
    subject: 'Confirm Your Email',
    html: `
      <h2>Welcome!</h2>
      <p>Click below to confirm your email:</p>
      <a href="${link}" style="background:#FF7043;color:white;padding:12px 24px;border-radius:8px;display:inline-block;">
        Confirm Email
      </a>
      <p>Link expires in 24 hours.</p>
    `,
  });
}