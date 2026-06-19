// pages/api/visibility/summary.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const userId = session.user.id;

    const [
      totalViews,
      profileViews,
      resumeViews,
      portfolioViews,
      recruiterViews,
    ] = await Promise.all([
      prisma.visibilityEvent.count({
        where: {
          targetUserId: userId,
        },
      }),

      prisma.visibilityEvent.count({
        where: {
          targetUserId: userId,
          eventType: "PROFILE_VIEW",
        },
      }),

      prisma.visibilityEvent.count({
        where: {
          targetUserId: userId,
          eventType: "RESUME_VIEW",
        },
      }),

      prisma.visibilityEvent.count({
        where: {
          targetUserId: userId,
          eventType: "PORTFOLIO_VIEW",
        },
      }),

      prisma.visibilityEvent.count({
        where: {
          targetUserId: userId,
          eventType: "RECRUITER_PROFILE_VIEW",
        },
      }),
    ]);

    return res.status(200).json({
      totalViews,
      profileViews,
      resumeViews,
      portfolioViews,
      recruiterViews,
    });
  } catch (error) {
    console.error("[visibility/summary]", error);

    return res.status(500).json({
      error: "Failed to load visibility summary",
    });
  }
}