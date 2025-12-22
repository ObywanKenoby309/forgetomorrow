// pages/api/seeker/resume-align-limit.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, plan: true, resumeAlignFreeUses: true, resumeAlignLastResetMonth: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Unlimited for all paid tiers
  if (user.plan !== 'FREE') {
    return res.status(200).json({ allowed: true });
  }

  // Free tier — enforce 3-use limit
  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-12"

  let uses = user.resumeAlignFreeUses || 0;
  let lastReset = user.resumeAlignLastResetMonth || '';

  if (lastReset !== currentMonth) {
    // New month — reset
    uses = 0;
    await prisma.user.update({
      where: { id: user.id },
      data: { resumeAlignLastResetMonth: currentMonth, resumeAlignFreeUses: 0 },
    });
  }

  if (uses >= 3) {
    return res.status(200).json({
      allowed: false,
      message: "You've used your 3 free Resume-Role Aligns this month — great job taking action!  \n\nUpgrade to Seeker Pro for unlimited aligns ($9.99/mo) when you're ready, or visit the Spotlights page to connect with a coach for personalized guidance.",
    });
  }

  // Allow and increment
  await prisma.user.update({
    where: { id: user.id },
    data: { resumeAlignFreeUses: uses + 1 },
  });

  return res.status(200).json({ allowed: true });
}