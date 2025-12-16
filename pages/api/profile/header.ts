// pages/api/profile/header.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import authOptions from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { getCorporateBannerByKey } from "@/lib/profileCorporateBanners";

const prisma = new PrismaClient();

function normalizeVisibility(v: any): "PRIVATE" | "PUBLIC" | "RECRUITERS_ONLY" | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toUpperCase();
  if (s === "PRIVATE") return "PRIVATE";
  if (s === "PUBLIC") return "PUBLIC";
  if (s === "RECRUITERS_ONLY") return "RECRUITERS_ONLY";
  return null;
}

function computeDisplayName(u: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) {
  const byParts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return (u.name || byParts || u.email || "Unnamed").trim();
}

function joinSkills(skillsJson: any): string | null {
  if (!Array.isArray(skillsJson)) return null;
  const items = skillsJson
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
  return items.length ? items.join(", ") : null;
}

function joinLanguages(languagesJson: any): string | null {
  if (!Array.isArray(languagesJson)) return null;

  const items = languagesJson
    .map((x) => {
      if (typeof x === "string") return x.trim();
      if (x && typeof x === "object" && typeof x.name === "string") return x.name.trim();
      return "";
    })
    .filter(Boolean);

  return items.length ? items.join(", ") : null;
}

function toRelocateString(wp: any): string | null {
  const v = wp?.willingToRelocate;
  if (v === true) return "yes";
  if (v === false) return "no";
  return null;
}

async function syncCandidateRow(userId: string, visibility: "PRIVATE" | "PUBLIC" | "RECRUITERS_ONLY") {
  // PRIVATE => remove from recruiter discovery
  if (visibility === "PRIVATE") {
    await prisma.candidate.deleteMany({ where: { userId } });
    return;
  }

  // PUBLIC or RECRUITERS_ONLY => ensure candidate snapshot exists
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      headline: true,
      aboutMe: true,
      location: true,
      workPreferences: true,
      skillsJson: true,
      languagesJson: true,
    },
  });

  if (!u) return;

  const wp: any = u.workPreferences || {};
  const workStatus = typeof wp.workStatus === "string" ? wp.workStatus : null;
  const preferredWorkType = typeof wp.workType === "string" ? wp.workType : null;

  const payload = {
    userId: u.id,
    name: computeDisplayName(u),
    email: u.email || null,
    headline: typeof u.headline === "string" ? u.headline : null,
    summary: typeof u.aboutMe === "string" ? u.aboutMe : null,
    location: typeof u.location === "string" ? u.location : null,

    // Filters (safe)
    workStatus,
    preferredWorkType,
    willingToRelocate: toRelocateString(wp),
    skills: joinSkills(u.skillsJson),
    languages: joinLanguages(u.languagesJson),

    // Card/search helpers (optional)
    role: typeof u.headline === "string" ? u.headline : null,
    title: typeof u.headline === "string" ? u.headline : null,
    currentTitle: null,

    source: "Forge",
    pipelineStage: "new",
  };

  await prisma.candidate.upsert({
    where: { userId: u.id },
    create: payload,
    update: payload,
  });
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
            isProfilePublic: true,
            profileVisibility: true, // ✅ NEW
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
          (corporateBanner && corporateBanner.bannerSrc) || record.coverUrl || null;

        // Back-compat: if profileVisibility is missing (older rows), derive it
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
        return res.status(500).json({ error: "Failed to load profile header data" });
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
          isProfilePublic,
          profileVisibility, // ✅ NEW
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
        if (corporateBannerKey !== undefined) data.corporateBannerKey = corporateBannerKey;
        if (corporateBannerLocked !== undefined) data.corporateBannerLocked = corporateBannerLocked;
        if (pronouns !== undefined) data.pronouns = pronouns;
        if (location !== undefined) data.location = location;

        if (slug !== undefined) {
          data.slug =
            typeof slug === "string" && slug.trim().length > 0 ? slug.trim() : null;
        }

        // ✅ Visibility: prefer explicit profileVisibility when provided.
        const normalizedVis = normalizeVisibility(profileVisibility);

        if (normalizedVis) {
          data.profileVisibility = normalizedVis;

          // keep legacy boolean in sync (PUBLIC => true, otherwise false)
          data.isProfilePublic = normalizedVis === "PUBLIC";
        } else if (isProfilePublic !== undefined) {
          // legacy callers
          data.isProfilePublic = !!isProfilePublic;
          data.profileVisibility = !!isProfilePublic ? "PUBLIC" : "PRIVATE";
        }

        // Banner mode – only accept known values
        if (bannerMode !== undefined) {
          if (typeof bannerMode === "string" && (bannerMode === "cover" || bannerMode === "fit")) {
            data.bannerMode = bannerMode;
          }
        }

        // Coerce bannerHeight & bannerFocalY to integers, or ignore
        if (bannerHeight !== undefined && bannerHeight !== null && bannerHeight !== "") {
          const parsedHeight = Number.parseInt(String(bannerHeight), 10);
          if (Number.isFinite(parsedHeight)) {
            data.bannerHeight = parsedHeight;
          }
        }

        if (bannerFocalY !== undefined && bannerFocalY !== null && bannerFocalY !== "") {
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
            isProfilePublic: true,
            profileVisibility: true, // ✅ NEW
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

        // ✅ Activate recruiter discovery by syncing Candidate snapshot
        const effectiveVisibility =
          updated.profileVisibility || (updated.isProfilePublic ? "PUBLIC" : "PRIVATE");

        try {
          await syncCandidateRow(userId, effectiveVisibility);
        } catch (syncErr) {
          // Don't fail the profile save if candidate sync fails — but log it
          console.error("[profile/header] candidate sync error", syncErr);
        }

        let corporateBanner = null;
        if (updated.corporateBannerKey) {
          corporateBanner = getCorporateBannerByKey(updated.corporateBannerKey);
        }

        const effectiveCoverUrl =
          (corporateBanner && corporateBanner.bannerSrc) || updated.coverUrl || null;

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
    return res.status(500).json({ error: "Unexpected error in profile header endpoint" });
  }
}
