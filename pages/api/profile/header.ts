import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { getCorporateBannerByKey } from "@/lib/profileCorporateBanners";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const email = session.user.email;

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          slug: true,
          headline: true,
          pronouns: true,
          location: true,
          status: true,
          avatarUrl: true,
          coverUrl: true,
          bannerMode: true,
          bannerHeight: true,
          bannerFocalY: true,
          isProfilePublic: true,
          wallpaperUrl: true,
          corporateBannerKey: true,
          corporateBannerLocked: true,
        },
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      // ── Inject corporate banner details if locked ──────────────────────────
      let corporateBanner = null;
      if (user.corporateBannerKey) {
        const found = getCorporateBannerByKey(user.corporateBannerKey);
        if (found) {
          corporateBanner = {
            key: user.corporateBannerKey,
            ...found,
          };
        }
      }

      return res.status(200).json({
        user,
        corporateBanner,
      });
    } catch (err) {
      console.error("GET /api/profile/header", err);
      return res.status(500).json({ error: "Failed to load profile" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const {
        headline,
        pronouns,
        location,
        status,
        avatarUrl,
        coverUrl,
        bannerMode,
        bannerHeight,
        bannerFocalY,
        slug,
        isProfilePublic,
        wallpaperUrl,
      } = req.body;

      const updateData: any = {
        headline,
        pronouns,
        location,
        status,
        avatarUrl,
        bannerMode,
        bannerHeight,
        bannerFocalY,
        isProfilePublic,
        wallpaperUrl,
      };

      // Prevent staff with locked banners from overwriting their corporate cover
      const staff = await prisma.user.findUnique({
        where: { email },
        select: { corporateBannerLocked: true, corporateBannerKey: true },
      });

      if (!staff?.corporateBannerLocked) {
        updateData.coverUrl = coverUrl;
      } else {
        // keep corporate banner, do not allow override
        const banner = getCorporateBannerByKey(staff.corporateBannerKey);
        if (banner) {
          updateData.coverUrl = banner.bannerSrc;
        }
      }

      if (typeof slug === "string" && slug.trim().length > 0) {
        updateData.slug = slug.trim();
      }

      const updated = await prisma.user.update({
        where: { email },
        data: updateData,
        select: { id: true, slug: true },
      });

      return res
        .status(200)
        .json({ success: true, id: updated.id, slug: updated.slug });
    } catch (err) {
      console.error("PATCH /api/profile/header", err);

      if (err.code === "P2002" && err.meta?.target?.includes("slug")) {
        return res
          .status(409)
          .json({ error: "That URL is already taken. Please choose another." });
      }

      return res.status(500).json({ error: "Failed to save profile" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
