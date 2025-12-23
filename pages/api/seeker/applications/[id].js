// pages/api/seeker/applications/[id].js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

function normalizeStatus(s) {
  if (!s) return null;

  // UI label -> enum value
  if (s === "Closed Out") return "ClosedOut";

  // If UI accidentally sends "ClosedOut", allow it
  if (s === "ClosedOut") return "ClosedOut";

  // Allow only known enum values; otherwise ignore
  if (s === "Applied" || s === "Interviewing" || s === "Offers") return s;

  return null;
}

export default async function handler(req, res) {
  const { id } = req.query;

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
  const appId = Number(id);

  if (!Number.isFinite(appId)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  if (req.method === "PATCH") {
    try {
      const { title, company, location, url, notes, status } = req.body || {};
      const normalizedStatus = normalizeStatus(status);

      const data = {};
      if (title !== undefined) data.title = title;
      if (company !== undefined) data.company = company;
      if (location !== undefined) data.location = location;
      if (url !== undefined) data.url = url;
      if (notes !== undefined) data.notes = notes;
      if (normalizedStatus) data.status = normalizedStatus;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      // ✅ ownership check (because Prisma update where can't include userId here)
      const existing = await prisma.application.findFirst({
        where: { id: appId, userId },
        select: { id: true },
      });

      if (!existing) {
        return res.status(404).json({ error: "Application not found" });
      }

      const updated = await prisma.application.update({
        where: { id: appId },
        data,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          url: true,
          notes: true,
          status: true,
          appliedAt: true,
        },
      });

      // Return card shape your UI expects
      return res.status(200).json({
        card: {
          id: updated.id,
          title: updated.title || "",
          company: updated.company || "",
          location: updated.location || "",
          url: updated.url || "",
          link: updated.url || "",
          notes: updated.notes || "",
          status: updated.status, // enum string
          dateAdded: updated.appliedAt.toISOString().split("T")[0],
        },
      });
    } catch (err) {
      console.error("[api/seeker/applications/[id]] patch error:", err);
      return res.status(500).json({ error: "Failed to update application" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // ✅ ownership-safe delete
      const deleted = await prisma.application.deleteMany({
        where: { id: appId, userId },
      });

      if (deleted.count === 0) {
        return res.status(404).json({ error: "Application not found" });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[api/seeker/applications/[id]] delete error:", err);
      return res.status(500).json({ error: "Failed to delete application" });
    }
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
