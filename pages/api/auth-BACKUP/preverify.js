import { prisma } from '@/lib/prisma';
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

const VERIFICATION_EXPIRY_MINUTES = 60;

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const res = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await res.json();
  return data.success;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { firstName, lastName, email, password, plan, recaptchaToken } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!recaptchaToken) return res.status(400).json({ error: "Missing reCAPTCHA token" });

  // Only verify recaptcha in production
  if (process.env.NODE_ENV === "production") {
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) return res.status(400).json({ error: "reCAPTCHA verification failed" });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return res.status(400).json({ error: "An account with that email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationToken.create({
    data: { token, email: email.toLowerCase(), firstName, lastName, passwordHash, plan, expiresAt },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_OPEN_SITE || "http://localhost:3001"}/api/auth/verify?token=${token}`;

  if (process.env.NODE_ENV === "development") {
    console.log("DEV MODE: Verification email would be sent to:", email);
    console.log("Verification link:", verifyUrl);
  } else {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM_SUPPORT || "ForgetTomorrow <no-reply@forgetomorrow.com>",
        to: email,
        subject: "Verify your ForgeTomorrow account",
        html: `<p>Hi ${firstName},</p>
               <p>Click the button below to confirm your account. This link is valid for 1 hour.</p>
               <p><a href="${verifyUrl}" style="background:#FF7043;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;">Verify account</a></p>
               <p>If the button doesn't work, paste this URL in your browser:</p>
               <pre>${verifyUrl}</pre>`,
      });
    } catch (err) {
      console.error("Email send failed", err);
      return res.status(500).json({ error: "Failed to send verification email" });
    }
  }

  return res.status(200).json({ success: true });
}
