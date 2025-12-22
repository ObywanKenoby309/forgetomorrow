// pages/api/seeker/applications/index.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

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

  try {
    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            worksite: true,
            compensation: true,
            type: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    // Group by status
    const grouped = {
      Applied: [],
      Interviewing: [],
      Offers: [],
      ClosedOut: [],
    };

    applications.forEach((app) => {
      const status = app.status || "Applied";
      if (grouped[status]) {
        grouped[status].push({
          id: app.id,
          title: app.job.title,
          company: app.job.company,
          location: app.job.location,
          worksite: app.job.worksite,
          compensation: app.job.compensation,
          type: app.job.type,
          dateAdded: app.appliedAt.toISOString().split('T')[0],
          notes: app.notes || '',
          link: app.link || '',
        });
      }
    });

    return res.status(200).json({ applications: grouped });
  } catch (err) {
    console.error("[api/seeker/applications] get error:", err);
    return res.status(500).json({ error: "Failed to load applications" });
  }
}