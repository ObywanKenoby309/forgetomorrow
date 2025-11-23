// pages/api/auth/verify.js
import { prisma } from '@/lib/prisma';
import { parse } from "url";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).send("Missing token");

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record) {
    return res.status(400).send("Invalid or expired token");
  }

  if (new Date() > record.expiresAt) {
    // token expired — cleanup and inform
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return res.status(400).send("Link expired. Please sign up again.");
  }

  // Double-check user doesn't suddenly exist (race condition)
  const existing = await prisma.user.findUnique({ where: { email: record.email } });
  if (existing) {
    // remove token and redirect to sign-in (account already exists)
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return res.redirect(`${process.env.NEXT_PUBLIC_OPEN_SITE || "https://forgetomorrow.com"}/auth/signin?already=true`);
  }

  // create user now (passwordHash already stored)
  const user = await prisma.user.create({
    data: {
      email: record.email,
      passwordHash: record.passwordHash,
      emailVerified: true,
      firstName: record.firstName,
      lastName: record.lastName,
      name: `${record.firstName} ${record.lastName}`,
      plan: record.plan || "FREE",
    },
  });

  // remove token
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  // Redirect to desired page. Optionally auto-login.
  // For now, we redirect to a setup page (you can implement auto sign-in if needed)
  const redirectTo = `${process.env.NEXT_PUBLIC_OPEN_SITE || "https://forgetomorrow.com"}/profile?verified=true&email=${encodeURIComponent(user.email)}`;
  return res.redirect(redirectTo);
}
