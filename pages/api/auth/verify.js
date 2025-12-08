// pages/api/auth/verify.js
import { prisma } from "@/lib/prisma";
import { normalizeSlug, hasBannedTerm, randomSuffix } from "@/lib/slug";

// NOTE: We are no longer creating the user here.
// User creation + password setup is handled by /api/auth/verify-email
// after the user lands on /verify-email and submits the form.

// (We keep generateUniqueSlug here in case you want to reuse it later)
async function generateUniqueSlug(firstName, lastName) {
  const base = normalizeSlug(`${firstName || ""}-${lastName || ""}`);
  const safeBase = base || "user";

  let attempt = 0;
  while (attempt < 10) {
    const candidate = `${safeBase}-${randomSuffix(5)}`;

    if (hasBannedTerm(candidate)) {
      attempt++;
      continue;
    }

    const exists = await prisma.user.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!exists) return candidate;

    attempt++;
  }

  return `user-${randomSuffix(8)}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).end("Method Not Allowed");
  }

  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).send("Missing verification token.");
  }

  try {
    const vt = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!vt) {
      return res
        .status(400)
        .send("This link is invalid or has already been used.");
    }

    if (vt.expiresAt < new Date()) {
      return res
        .status(400)
        .send("This link has expired. Please sign up again.");
    }

    // ✅ NEW BEHAVIOR:
    // Instead of creating the user + deleting the token here,
    // just redirect the user to the React "verify-email" page
    // so they can set their password.
    //
    // The /verify-email page will POST to /api/auth/verify-email,
    // which will:
    //  - validate the token again
    //  - hash the password
    //  - create the user
    //  - delete the token
    //
    // We pass email + plan as query params for display only.
    const searchParams = new URLSearchParams({
      token,
      email: vt.email,
      plan: vt.plan || "FREE",
    });

    // Relative redirect keeps domain correct (prod, preview, local).
    res.redirect(302, `/verify-email?${searchParams.toString()}`);
  } catch (err) {
    console.error("[verify] error:", err);
    return res.status(500).send("Internal server error.");
  }
}
