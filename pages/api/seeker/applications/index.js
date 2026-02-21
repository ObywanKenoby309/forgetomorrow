// pages/api/seeker/applications/index.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

function normalizeStatus(s) {
  if (!s) return "Applied";
  if (s === "Closed Out") return "ClosedOut";
  return s;
}

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
      const status = normalizeStatus(app.status) || "Applied";

      // ✅ Critical fix: app.job can be null for manually created applications
      const title = app.job?.title ?? app.title ?? "";
      const company = app.job?.company ?? app.company ?? "";
      const location = app.job?.location ?? app.location ?? "";
      const worksite = app.job?.worksite ?? null;
      const compensation = app.job?.compensation ?? null;
      const type = app.job?.type ?? null;

      const isInternal = !!app.jobId;

      // ✅ notes for seeker:
      // - internal apps: seekerNotes only
      // - external apps: legacy notes
      const safeNotes = isInternal ? (app.seekerNotes || "") : (app.notes || "");

      if (grouped[status]) {
        grouped[status].push({
          id: app.id,
          title,
          company,
          location,
          worksite,
          compensation,
          type,
          dateAdded: app.appliedAt.toISOString().split("T")[0],
          notes: safeNotes,
          url: app.url || "",
          link: app.url || "", // keep alias for any older UI usage
        });
      }
    });

    return res.status(200).json({ applications: grouped });
  } catch (err) {
    console.error("[api/seeker/applications] get error:", err);
    return res.status(500).json({ error: "Failed to load applications" });
  }
}