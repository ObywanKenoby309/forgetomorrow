// pages/api/seeker/applications/[id].js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

function normalizeStatus(s) {
  if (!s) return null;
  if (s === "Closed Out") return "ClosedOut";
  return s;
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

  if (req.method === "PATCH") {
    try {
      const { title, company, location, url, notes, status } = req.body;
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

      const updated = await prisma.application.update({
        where: { id: Number(id), userId },
        data,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          url: true,
          notes: true,
          status: true,
          dateAdded: true,
          // Add any other fields you need in tracker
        },
      });

      return res.status(200).json({ card: updated });
    } catch (err) {
      console.error("[api/seeker/applications/[id]] patch error:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Application not found" });
      }
      return res.status(500).json({ error: "Failed to update application" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const deleted = await prisma.application.deleteMany({
        where: { id: Number(id), userId },
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