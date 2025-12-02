// pages/api/auth/verify.js
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
}
