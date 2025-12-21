// pages/api/seeker/dashboard-data.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = user.id;

    // Parallel fetch of everything we need
    const [
      applications,
      profileViews,
      interviews,
      offers,
      allApplications,
    ] = await Promise.all([
      prisma.application.count({ where: { userId } }),
      prisma.profileView.count({ where: { targetId: userId } }),
      prisma.interview.count({ where: { userId } }),
      prisma.offer.count({ where: { userId } }),
      prisma.application.findMany({
        where: { userId },
        select: { appliedAt: true },
        orderBy: { appliedAt: "desc" },
      }),
    ]);

    // Last application date (or null)
    const lastApplication = allApplications.length > 0
      ? allApplications[0].appliedAt.toISOString()
      : null;

    // Return exactly the shape seeker-dashboard.js expects
    return res.status(200).json({
      applications,
      views: profileViews,
      interviews,
      offers,
      lastApplication,
      allApplications: allApplications.map(app => ({
        appliedAt: app.appliedAt.toISOString(),
      })),
    });

  } catch (err) {
    console.error("[api/seeker/dashboard-data] error:", err);
    return res
      .status(500)
      .json({ error: "Failed to load dashboard data. Please try again." });
  }
}