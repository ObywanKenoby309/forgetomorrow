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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        plan: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🔹 Lightweight counts so Kat sees *something* that makes sense
    const [applicationsCount, pinnedJobsCount] = await Promise.all([
      prisma.application.count({ where: { userId: user.id } }),
      prisma.pinnedJob.count({ where: { userId: user.id } }),
    ]);

    // You can expand this later with real analytics, ATS score history, etc.
    return res.status(200).json({
      user: {
        id: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed",
        role: user.role,
        plan: user.plan,
      },
      stats: {
        applicationsCount,
        pinnedJobsCount,
        // placeholders for now so the UI doesn’t explode
        interviewsUpcoming: 0,
        offersCount: 0,
      },
      // safe default tiles so Seeker dashboard can render
      tiles: [
        {
          key: "applications",
          label: "Applications",
          value: applicationsCount,
        },
        {
          key: "saved",
          label: "Saved jobs",
          value: pinnedJobsCount,
        },
        {
          key: "interviews",
          label: "Upcoming interviews",
          value: 0,
        },
        {
          key: "offers",
          label: "Offers",
          value: 0,
        },
      ],
    });
  } catch (err) {
    console.error("[api/seeker/dashboard-data] error:", err);
    return res
      .status(500)
      .json({ error: "Failed to load dashboard data. Please try again." });
  }
}
