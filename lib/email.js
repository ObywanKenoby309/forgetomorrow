// lib/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email, token) {
  const url = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: '"Forge Tomorrow" <noreply@forgetomorrow.com>',
    to: email,
    subject: 'Verify Your Email',
    html: `
      <h1>Welcome to Forge Tomorrow!</h1>
      <p>Click below to verify your email:</p>
      <a href="${url}" style="padding:10px 20px; background:#0070f3; color:white; text-decoration:none;">Verify Email</a>
      <p>Or copy: ${url}</p>
    `,
  });
}