// pages/api/auth/verify.js
<<<<<<< HEAD
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  const { token } = req.query || {};
  if (!token || typeof token !== "string") {
    return res.status(400).send("Missing token");
  }

  try {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return res.status(400).send("Invalid or expired token.");
    }

    // Check expiry
    if (record.expiresAt && record.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({ where: { token } });
      return res.status(400).send("This verification link has expired.");
    }

    // If user already exists (clicked twice), just delete token + redirect
    let user = await prisma.user.findUnique({
      where: { email: record.email },
    });

    if (!user) {
      // Map plan → role/tier (simple defaults for now)
      const plan = record.plan || "free";
      let role = "SEEKER";
      let tier = "free";

      if (plan === "pro") tier = "pro";
      if (plan === "smb") {
        role = "RECRUITER";
        tier = "smb";
      }
      if (plan === "enterprise") {
        role = "RECRUITER";
        tier = "enterprise";
      }

      user = await prisma.user.create({
        data: {
          email: record.email,
          passwordHash: record.passwordHash,
          firstName: record.firstName,
          lastName: record.lastName,
          role,
          tier,
          // If you have additional required fields, add them here.
        },
      });

      console.log("[verify] created user from token:", user.id, user.email);
    } else {
      console.log("[verify] user already existed for", record.email);
    }

    // Clean up token
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Decide where to send newly verified users:
    // You can set this per-env so we never have to touch code:
    // e.g. NEXT_PUBLIC_POST_VERIFY_REDIRECT=/seeker/profile
    const redirectTarget =
      process.env.NEXT_PUBLIC_POST_VERIFY_REDIRECT || "/profile/setup";

    res.writeHead(302, { Location: redirectTarget });
    res.end();
  } catch (err) {
    console.error("[verify] error:", err);
    return res.status(500).send("Internal server error.");
  }
=======
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).send('Missing token');
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return res.status(400).send('Invalid or expired token');
  }

  // If link is expired, clean up and stop
  if (new Date() > record.expiresAt) {
    await prisma.verificationToken
      .delete({ where: { token } })
      .catch(() => {});
    return res.status(400).send('Link expired. Please sign up again.');
  }

  // Send user to password setup page instead of creating the account here
  const baseUrl =
    process.env.NEXT_PUBLIC_OPEN_SITE ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3001';

  const redirectTo = `${baseUrl}/verify-email?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(record.email)}&plan=${encodeURIComponent(
    record.plan || 'FREE'
  )}`;

  return res.redirect(redirectTo);
>>>>>>> 6ee98c0 (Add privacy delete user data system)
}
