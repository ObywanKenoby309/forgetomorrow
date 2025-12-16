// pages/api/profile/header.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import authOptions from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { getCorporateBannerByKey } from "@/lib/profileCorporateBanners";

const prisma = new PrismaClient();

function normalizeVisibility(
  v: any
): "PRIVATE" | "PUBLIC" | "RECRUITERS_ONLY" | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toUpperCase();
  if (s === "PRIVATE") return "PRIVATE";
  if (s === "PUBLIC") return "PUBLIC";
  if (s === "RECRUITERS_ONLY") return "RECRUITERS_ONLY";
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = (await getServerSession(req, res, authOptions)) as
    | { user?: { email?: string | null } }
    | null;

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const email = session.user.email as string;

  try {
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
            name: true,
            pronouns: true,
            headline: true,
            status: true,
            location: true,
            slug: true,

            // Legacy + new visibility
            isProfilePublic: true,
            profileVisibility: true,

            avatarUrl: true,
            coverUrl: true,
            wallpaperUrl: true,
            bannerHeight: true,
            bannerMode: true,
            bannerFocalY: true,
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

        const effectiveCoverUrl =
          (corporateBanner && corporateBanner.bannerSrc) ||
          record.coverUrl ||
          null;

        // Back-compat: if profileVisibility is missing, derive it from legacy boolean.
        const effectiveVisibility =
          record.profileVisibility ||
          (record.isProfilePublic ? "PUBLIC" : "PRIVATE");

        return res.status(200).json({
          ...record,
          profileVisibility: effectiveVisibility,
          coverUrl: effectiveCoverUrl,
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
          pronouns,
          location,
          slug,

          // Legacy + new visibility
          isProfilePublic,
          profileVisibility,

          bannerHeight,
          bannerMode,
          bannerFocalY,
        } = req.body || {};

        const data: any = {};

        // Simple scalar fields
        if (headline !== undefined) data.headline = headline;
        if (status !== undefined) data.status = status;
        if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
        if (coverUrl !== undefined) data.coverUrl = coverUrl;
        if (wallpaperUrl !== undefined) data.wallpaperUrl = wallpaperUrl;
        if (corporateBannerKey !== undefined)
          data.corporateBannerKey = corporateBannerKey;
        if (corporateBannerLocked !== undefined)
          data.corporateBannerLocked = corporateBannerLocked;
        if (pronouns !== undefined) data.pronouns = pronouns;
        if (location !== undefined) data.location = location;

        if (slug !== undefined) {
          data.slug =
            typeof slug === "string" && slug.trim().length > 0
              ? slug.trim()
              : null;
        }

        // ✅ Visibility (User table = single source of truth)
        // Prefer explicit profileVisibility when provided.
        const normalizedVis = normalizeVisibility(profileVisibility);

        if (normalizedVis) {
          data.profileVisibility = normalizedVis;

          // Keep legacy boolean in sync for older callers
          data.isProfilePublic = normalizedVis === "PUBLIC";
        } else if (isProfilePublic !== undefined) {
          // Legacy callers
          data.isProfilePublic = !!isProfilePublic;
          data.profileVisibility = !!isProfilePublic ? "PUBLIC" : "PRIVATE";
        }

        // Banner mode – only accept known values
        if (bannerMode !== undefined) {
          if (
            typeof bannerMode === "string" &&
            (bannerMode === "cover" || bannerMode === "fit")
          ) {
            data.bannerMode = bannerMode;
          }
        }

        // Coerce bannerHeight & bannerFocalY to integers, or ignore
        if (
          bannerHeight !== undefined &&
          bannerHeight !== null &&
          bannerHeight !== ""
        ) {
          const parsedHeight = Number.parseInt(String(bannerHeight), 10);
          if (Number.isFinite(parsedHeight)) {
            data.bannerHeight = parsedHeight;
          }
        }

        if (
          bannerFocalY !== undefined &&
          bannerFocalY !== null &&
          bannerFocalY !== ""
        ) {
          const parsedFocal = Number.parseInt(String(bannerFocalY), 10);
          if (Number.isFinite(parsedFocal)) {
            data.bannerFocalY = parsedFocal;
          }
        }

        const updated = await prisma.user.update({
          where: { id: userId },
          data,
          select: {
            firstName: true,
            lastName: true,
            name: true,
            pronouns: true,
            headline: true,
            status: true,
            location: true,
            slug: true,

            // Legacy + new visibility
            isProfilePublic: true,
            profileVisibility: true,

            avatarUrl: true,
            coverUrl: true,
            wallpaperUrl: true,
            bannerHeight: true,
            bannerMode: true,
            bannerFocalY: true,
            corporateBannerKey: true,
            corporateBannerLocked: true,
          },
        });

        // Back-compat: ensure response always includes profileVisibility
        const effectiveVisibility =
          updated.profileVisibility ||
          (updated.isProfilePublic ? "PUBLIC" : "PRIVATE");

        let corporateBanner = null;
        if (updated.corporateBannerKey) {
          corporateBanner = getCorporateBannerByKey(updated.corporateBannerKey);
        }

        const effectiveCoverUrl =
          (corporateBanner && corporateBanner.bannerSrc) ||
          updated.coverUrl ||
          null;

        return res.status(200).json({
          ...updated,
          profileVisibility: effectiveVisibility,
          coverUrl: effectiveCoverUrl,
          corporateBanner,
        });
      } catch (err: any) {
        console.error("[profile/header] PATCH error", err);
        return res.status(500).json({ error: "Failed to update profile header" });
      }
    }

    // ──────────────── Unsupported Methods ────────────────
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (outerErr) {
    console.error("[profile/header] outer error", outerErr);
    return res
      .status(500)
      .json({ error: "Unexpected error in profile header endpoint" });
  }
}
