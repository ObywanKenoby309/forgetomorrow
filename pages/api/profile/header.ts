// pages/api/profile/header.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import authOptions from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { getCorporateBannerByKey } from "@/lib/profileCorporateBanners";
import jwt from "jsonwebtoken";

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

// ------------------------------
// Slug helpers
// ------------------------------
function slugBaseFromUser(record: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
}) {
  const raw =
    [record.firstName, record.lastName].filter(Boolean).join(" ") ||
    record.name ||
    "user";

  const base = raw
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || "user";
}

function rand4() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += letters[Math.floor(Math.random() * letters.length)];
  }
  return out;
}

function cleanSlugInput(v: any) {
  if (typeof v !== "string") return null;
  const cleaned = v
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned.length ? cleaned : null;
}

async function ensureUserSlug(userId: string, base: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { slug: true },
  });
  if (existing?.slug) return existing.slug;

  for (let i = 0; i < 10; i++) {
    const candidate = `${base}-${rand4()}`;
    try {
      await prisma.user.updateMany({
        where: { id: userId, slug: null },
        data: {
          slug: candidate,
          slugLastChangedAt: null,
          slugChangeCount: 0,
        },
      });

      const after = await prisma.user.findUnique({
        where: { id: userId },
        select: { slug: true },
      });

      if (after?.slug) return after.slug;
    } catch (err: any) {
      if (err?.code === "P2002") continue;
      throw err;
    }
  }

  throw new Error("Failed to generate unique slug");
}

// ─────────────────────────────────────────────────────────────
// ✅ MIN CHANGE: allow auth via NextAuth session OR HttpOnly `auth` cookie
// ─────────────────────────────────────────────────────────────
function getCookie(req: NextApiRequest, name: string) {
  const raw = req.headers.cookie || "";
  const parts = raw.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) {
      return decodeURIComponent(p.slice(name.length + 1));
    }
  }
  return null;
}

function getJwtSecret() {
  // Must match /api/auth/verify-email
  return process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";
}

async function getAuthedEmail(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string | null> {
  // 1) NextAuth session
  try {
    const session = (await getServerSession(req, res, authOptions)) as
      | { user?: { email?: string | null } }
      | null;

    const sessionEmail = session?.user?.email ? String(session.user.email) : null;
    if (sessionEmail) return sessionEmail.toLowerCase().trim();
  } catch {
    // fall through
  }

  // 2) Custom auth cookie
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

        // ✅ Ensure slug exists
        let ensuredSlug = record.slug;
        if (!ensuredSlug) {
          const base = slugBaseFromUser(record);
          ensuredSlug = await ensureUserSlug(userId, base);
        }

        let corporateBanner = null;
        if (record.corporateBannerKey) {
          corporateBanner = getCorporateBannerByKey(record.corporateBannerKey);
        }

        const effectiveCoverUrl =
          (corporateBanner && corporateBanner.bannerSrc) ||
          record.coverUrl ||
          null;

        const effectiveVisibility =
          record.profileVisibility ||
          (record.isProfilePublic ? "PUBLIC" : "PRIVATE");

        return res.status(200).json({
          ...record,
          slug: ensuredSlug,
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
          profileVisibility,

          bannerHeight,
          bannerMode,
          bannerFocalY,
        } = req.body || {};

        const data: any = {};

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
          const cleaned = cleanSlugInput(slug);

          if (cleaned) {
            const current = await prisma.user.findUnique({
              where: { id: userId },
              select: { slug: true, slugLastChangedAt: true },
            });

            const isChanging = cleaned !== (current?.slug || null);

            if (isChanging) {
              const last = current?.slugLastChangedAt;
              if (last) {
                const ms = Date.now() - new Date(last).getTime();
                const day = 24 * 60 * 60 * 1000;
                if (ms < day) {
                  return res.status(429).json({
                    error: "You can change your personal URL once per day.",
                  });
                }
              }

              data.slug = cleaned;
              data.slugLastChangedAt = new Date();
              data.slugChangeCount = { increment: 1 };
            }
          }
        }

        const normalizedVis = normalizeVisibility(profileVisibility);
        if (normalizedVis) {
          data.profileVisibility = normalizedVis;
          data.isProfilePublic = normalizedVis === "PUBLIC";
        } else if (isProfilePublic !== undefined) {
          data.isProfilePublic = !!isProfilePublic;
          data.profileVisibility = !!isProfilePublic ? "PUBLIC" : "PRIVATE";
        }

        if (bannerMode !== undefined) {
          if (
            typeof bannerMode === "string" &&
            (bannerMode === "cover" || bannerMode === "fit")
          ) {
            data.bannerMode = bannerMode;
          }
        }

        if (bannerHeight !== undefined && bannerHeight !== null && bannerHeight !== "") {
          const parsedHeight = Number.parseInt(String(bannerHeight), 10);
          if (Number.isFinite(parsedHeight)) data.bannerHeight = parsedHeight;
        }

        if (bannerFocalY !== undefined && bannerFocalY !== null && bannerFocalY !== "") {
          const parsedFocal = Number.parseInt(String(bannerFocalY), 10);
          if (Number.isFinite(parsedFocal)) data.bannerFocalY = parsedFocal;
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

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (outerErr) {
    console.error("[profile/header] outer error", outerErr);
    return res.status(500).json({ error: "Unexpected error in profile header endpoint" });
  }
}
