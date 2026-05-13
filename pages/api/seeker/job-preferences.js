// pages/api/seeker/job-preferences.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

function cleanString(value) {
  const text = String(value || "").trim();
  return text || null;
}

function cleanDays(value) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return null;
  return Math.min(parsed, 365);
}

async function getSessionUser(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
}

export default async function handler(req, res) {
  try {
    const user = await getSessionUser(req, res);

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (req.method === "GET") {
      const preference = await prisma.seekerJobPreference.findUnique({
        where: { userId: user.id },
      });

      return res.status(200).json({
        preference: preference
          ? {
              keyword: preference.keyword || "",
              company: preference.company || "",
              location: preference.location || "",
              locationType: preference.locationType || "",
              source: preference.source || "",
              days: preference.days || "",
              updatedAt: preference.updatedAt,
            }
          : null,
      });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const body = req.body || {};

      const data = {
        keyword: cleanString(body.keyword),
        company: cleanString(body.company),
        location: cleanString(body.location),
        locationType: cleanString(body.locationType),
        source: cleanString(body.source),
        days: cleanDays(body.days),
      };

      const preference = await prisma.seekerJobPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...data,
        },
        update: data,
      });

      return res.status(200).json({
        ok: true,
        preference: {
          keyword: preference.keyword || "",
          company: preference.company || "",
          location: preference.location || "",
          locationType: preference.locationType || "",
          source: preference.source || "",
          days: preference.days || "",
          updatedAt: preference.updatedAt,
        },
      });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[api/seeker/job-preferences] error:", err);
    return res.status(500).json({ error: "Failed to save job preferences" });
  }
}
