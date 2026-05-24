// pages/api/anvil/identity.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const config = {
  api: {
    bodyParser: { sizeLimit: "2mb" },
  },
};

function getCookie(req: NextApiRequest, name: string) {
  const raw = req.headers.cookie || "";
  const parts = raw.split(";").map((p) => p.trim());

  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }

  return null;
}

function getJwtSecret() {
  return process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";
}

async function getAuthedEmail(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string | null> {
  const session = (await getServerSession(req, res, authOptions)) as
    | { user?: { email?: string | null } }
    | null;

  const sessionEmail = session?.user?.email ? String(session.user.email) : null;
  if (sessionEmail) return sessionEmail.toLowerCase().trim();

  const token = getCookie(req, "auth");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const email = decoded?.email ? String(decoded.email) : null;
    return email ? email.toLowerCase().trim() : null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const email = await getAuthedEmail(req, res);

  if (!email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (req.method === "GET") {
    try {
      const profile = await prisma.professionalOperatingProfile.findUnique({
        where: { userId: user.id },
      });

      return res.status(200).json({ profile });
    } catch (err) {
      console.error("[anvil/identity] GET error", err);
      return res.status(500).json({ error: "Failed to load professional operating profile" });
    }
  }

  if (req.method === "POST" || req.method === "PATCH") {
    try {
      const body = req.body || {};

      if (!body.answersJson || typeof body.answersJson !== "object") {
        return res.status(400).json({ error: "answersJson is required" });
      }

      if (!body.snapshotJson || typeof body.snapshotJson !== "object") {
        return res.status(400).json({ error: "snapshotJson is required" });
      }

      const profile = await prisma.professionalOperatingProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          answersJson: body.answersJson,
          snapshotJson: body.snapshotJson,
          showOnPortfolio: Boolean(body.showOnPortfolio),
          shareWithCoach: Boolean(body.shareWithCoach),
          includeInHiringPacket: Boolean(body.includeInHiringPacket),
        },
        update: {
          answersJson: body.answersJson,
          snapshotJson: body.snapshotJson,
          showOnPortfolio: Boolean(body.showOnPortfolio),
          shareWithCoach: Boolean(body.shareWithCoach),
          includeInHiringPacket: Boolean(body.includeInHiringPacket),
        },
      });

      return res.status(200).json({ profile });
    } catch (err) {
      console.error("[anvil/identity] SAVE error", err);
      return res.status(500).json({ error: "Failed to save professional operating profile" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PATCH"]);
  return res.status(405).json({ error: "Method not allowed" });
}