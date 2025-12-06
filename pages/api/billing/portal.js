// pages/api/billing/portal.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn(
    "[BillingPortal] STRIPE_SECRET_KEY is not set. Billing portal will not work."
  );
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    })
  : null;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Must be logged in
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!stripe) {
    return res.status(500).json({
      error: "Billing is not available right now. Missing Stripe configuration.",
    });
  }

  // Look up the user to get stripeCustomerId
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return res.status(400).json({
      error:
        "No billing profile found for this account yet. If you've upgraded, contact support.",
    });
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://forgetomorrow.com";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/settings`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("[BillingPortal] Error creating session:", err);
    return res.status(500).json({
      error: "Unable to open billing portal right now. Please contact support.",
    });
  }
}
