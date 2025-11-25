// pages/api/profile/header.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import authOptions from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { getCorporateBannerByKey } from "@/lib/profileCorporateBanners";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = (await getServerSession(req, res, authOptions)) as
    | { user?: { email?: string | null } }
    | null;

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const email = session.user.email as string;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userId = user.id;

  // ──────────────── GET ────────────────
  if (req.method === "GET") {
    try {
      const record = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          headline: true,
          status: true,
          avatarUrl: true,
          coverUrl: true,
          wallpaperUrl: true,
          corporateBannerKey: true,
          corporateBannerLocked: true,
        },
      });

      if (!record) {
        return res.status(404).json({ error: "Profile header not found" });
      }

      let corporateBanner = null;
      if (record.corporateBannerKey) {
        corporateBanner = getCorporateBannerByKey(record.corporateBannerKey);
      }

      return res.status(200).json({
        ...record,
        corporateBanner,
      });
    } catch (err) {
      console.error("[profile/header] GET error", err);
      return res
        .status(500)
        .json({ error: "Failed to load profile header data" });
    }
  }

  // ──────────────── PATCH ────────────────
  if (req.method === "PATCH") {
    try {
      const {
        headline,
        status,
        avatarUrl,
        coverUrl,
        wallpaperUrl,
        corporateBannerKey,
        corporateBannerLocked,
      } = req.body || {};

      const data: any = {};

      if (headline !== undefined) data.headline = headline;
      if (status !== undefined) data.status = status;
      if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
      if (coverUrl !== undefined) data.coverUrl = coverUrl;
      if (wallpaperUrl !== undefined) data.wallpaperUrl = wallpaperUrl;
      if (corporateBannerKey !== undefined)
        data.corporateBannerKey = corporateBannerKey;
      if (corporateBannerLocked !== undefined)
        data.corporateBannerLocked = corporateBannerLocked;

      const updated = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          firstName: true,
          lastName: true,
          headline: true,
          status: true,
          avatarUrl: true,
          coverUrl: true,
          wallpaperUrl: true,
          corporateBannerKey: true,
          corporateBannerLocked: true,
        },
      });

      let corporateBanner = null;
      if (updated.corporateBannerKey) {
        corporateBanner = getCorporateBannerByKey(updated.corporateBannerKey);
      }

      return res.status(200).json({
        ...updated,
        corporateBanner,
      });
    } catch (err) {
      console.error("[profile/header] PATCH error", err);
      return res
        .status(500)
        .json({ error: "Failed to update profile header" });
    }
  }

  // ──────────────── Unsupported Methods ────────────────
  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method not allowed" });
}
