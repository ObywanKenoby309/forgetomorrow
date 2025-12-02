// pages/api/auth/verify.js
import { prisma } from "@/lib/prisma";

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
      return res.status(400).send("This link is invalid or has already been used.");
    }

    if (vt.expiresAt < new Date()) {
      return res.status(400).send("This link has expired. Please sign up again.");
    }

    // Check if a user already exists for this email
    let user = await prisma.user.findUnique({
      where: { email: vt.email },
    });

    if (!user) {
      // Create a new user record from the token payload
      user = await prisma.user.create({
        data: {
          email: vt.email,
          firstName: vt.firstName || null,
          lastName: vt.lastName || null,
          name: [vt.firstName, vt.lastName].filter(Boolean).join(" ") || null,
          passwordHash: vt.passwordHash,
          emailVerified: true,
          newsletter: vt.newsletter ?? false,
          plan: "FREE",
        },
      });
    } else if (!user.emailVerified) {
      // Mark existing user as verified if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    // Clean up token so it can't be reused
    await prisma.verificationToken.delete({
      where: { token },
    });

    // For now, just send a simple success page.
    // Later we can redirect to a dedicated "verified" landing page.
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>ForgeTomorrow – Email verified</title>
          <style>
            body {
              font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
              background: #0B1724;
              color: #F9FAFB;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
            }
            .card {
              background: #F5F7FA;
              color: #111827;
              border-radius: 16px;
              padding: 24px 28px;
              max-width: 480px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.25);
              text-align: center;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 1.5rem;
              color: #FF7043;
            }
            p {
              margin: 4px 0;
              font-size: 0.9rem;
            }
            a.button {
              display: inline-block;
              margin-top: 16px;
              padding: 10px 18px;
              border-radius: 999px;
              background: #FF7043;
              color: white;
              text-decoration: none;
              font-weight: 600;
              font-size: 0.9rem;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Email verified</h1>
            <p>Your ForgeTomorrow account is ready.</p>
            <p>You can now sign in and complete your profile.</p>
            <a class="button" href="https://www.forgetomorrow.com/login">
              Go to sign in
            </a>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("[verify] error:", err);
    return res.status(500).send("Internal server error.");
  }
}
