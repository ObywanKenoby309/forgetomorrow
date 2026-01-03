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
    const [profileViews, pinned, statusCounts, allApplications] = await Promise.all([
      prisma.profileView.count({ where: { targetId: userId } }),
      prisma.pinnedJob.count({ where: { userId } }),
      prisma.application.groupBy({
        by: ["status"],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.application.findMany({
        where: { userId },
        select: { appliedAt: true },
        orderBy: { appliedAt: "desc" },
      }),
    ]);

    // Normalize application status counts
    const counts = {
      Applied: 0,
      Interviewing: 0,
      Offers: 0,
      ClosedOut: 0,
    };

    for (const row of statusCounts || []) {
      const key = String(row.status || "");
      const n = Number(row?._count?._all || 0);
      if (Object.prototype.hasOwnProperty.call(counts, key)) {
        counts[key] = n;
      }
    }

    const applicationsTotal =
      counts.Applied + counts.Interviewing + counts.Offers + counts.ClosedOut;

    // Last application date (or null)
    const lastApplication =
      allApplications.length > 0 ? allApplications[0].appliedAt.toISOString() : null;

    // Return exactly what the dashboard needs (DB is source of truth)
    return res.status(200).json({
      // Pipeline KPI tiles
      pinned,
      applied: counts.Applied,
      interviewing: counts.Interviewing,
      offers: counts.Offers,
      closedOut: counts.ClosedOut,

      // Back-compat + extra dashboard data
      applications: applicationsTotal,
      views: profileViews,
      lastApplication,
      allApplications: allApplications.map((app) => ({
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
