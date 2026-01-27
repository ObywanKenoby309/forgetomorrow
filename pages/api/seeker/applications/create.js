// pages/api/seeker/applications/create.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

function normalizeStatus(s) {
  if (!s) return "Applied";
  if (s === "Closed Out") return "ClosedOut";
  return s;
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
    const { title, company, location, url, notes, status = "Applied" } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: "title and company required" });
    }

    const normalizedStatus = normalizeStatus(status);

    const application = await prisma.application.create({
      data: {
        userId,
        title,
        company,
        location: location || "",
        url: url || "",
        notes: notes || "",
        status: normalizedStatus,
        // 🔹 NEW: explicit unscoped seeker application
        accountKey: null,
      },
    });

    const card = {
      id: application.id,
      title: application.title,
      company: application.company,
      location: application.location,
      url: application.url,
      link: application.url,
      notes: application.notes,
      dateAdded: application.appliedAt.toISOString().split("T")[0],
    };

    return res.status(200).json({ success: true, card });
  } catch (err) {
    console.error("[api/seeker/applications/create] error:", err);
    return res.status(500).json({ error: "Failed to create application" });
  }
}
