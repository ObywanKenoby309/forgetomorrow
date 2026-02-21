// pages/api/seeker/applications/create.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

function normalizeStatus(s) {
  if (!s) return "Applied";
  if (s === "Closed Out") return "ClosedOut";
  return s;
}

function toInt(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
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
    const {
      title,
      company,
      location,
      url,
      notes,
      status = "Applied",
      jobId,
    } = req.body || {};

    const normalizedStatus = normalizeStatus(status);

    // Optional job link (internal job applications)
    const jobIdInt = toInt(jobId);
    const isInternal = !!jobIdInt;

    // If no jobId, require manual title/company
    if (!jobIdInt && (!title || !company)) {
      return res.status(400).json({ error: "title and company required" });
    }

    const application = await prisma.application.create({
      data: {
        userId,

        // If job-linked, we can omit these and still render via app.job fallback
        title: jobIdInt ? (title ?? null) : title,
        company: jobIdInt ? (company ?? null) : company,
        location: location || "",
        url: url || "",

        // ✅ notes routing
        notes: isInternal ? null : (notes || ""),
        seekerNotes: isInternal ? (notes || "") : null,

        status: normalizedStatus,
        jobId: jobIdInt || null,

        // 🔹 explicit unscoped seeker application
        accountKey: null,
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        url: true,
        notes: true,
        seekerNotes: true,
        recruiterNotes: true, // selected but NEVER returned to seeker
        status: true,
        appliedAt: true,
        jobId: true,
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
    });

    const internal = !!application.jobId;

    const card = {
      id: application.id,
      title: application.job?.title ?? application.title ?? "",
      company: application.job?.company ?? application.company ?? "",
      location: application.job?.location ?? application.location ?? "",
      worksite: application.job?.worksite ?? null,
      compensation: application.job?.compensation ?? null,
      type: application.job?.type ?? null,
      url: application.url || "",
      link: application.url || "",
      notes: internal ? (application.seekerNotes || "") : (application.notes || ""),
      status: application.status,
      dateAdded: application.appliedAt.toISOString().split("T")[0],
    };

    return res.status(200).json({ success: true, card });
  } catch (err) {
    console.error("[api/seeker/applications/create] error:", err);
    return res.status(500).json({ error: "Failed to create application" });
  }
}