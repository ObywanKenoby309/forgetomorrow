// pages/api/profile/resume.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import authOptions from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// /api/profile/resume
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = (await getServerSession(req, res, authOptions)) as
    | { user?: { email?: string | null } }
    | null;

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const email = session.user.email as string;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userId = user.id;

  // ──────────────── GET: list resumes + primary ────────────────
  if (req.method === "GET") {
    try {
      const resumes = await prisma.resume.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      });

      const primary =
        resumes.find((r) => r.isPrimary) || resumes[0] || null;

      return res.status(200).json({ resumes, primary });
    } catch (err) {
      console.error("GET /api/profile/resume", err);
      return res.status(500).json({ error: "Failed to load resumes" });
    }
  }

  // ──────────────── POST: create resume ────────────────
  if (req.method === "POST") {
    try {
      const { name, content, isPrimary } = req.body || {};

      if (!name?.trim()) {
        return res.status(400).json({ error: "Resume name is required." });
      }
      if (!content?.trim()) {
        return res.status(400).json({ error: "Resume content is required." });
      }

      const count = await prisma.resume.count({ where: { userId } });
      if (count >= 5) {
        return res.status(400).json({
          error:
            "You can save up to 5 resumes. Please delete one before adding another.",
        });
      }

      const createData: any = {
        userId,
        name: name.trim(),
        content: content.trim(),
      };

      if (count === 0) {
        createData.isPrimary = true;
      } else if (isPrimary === true) {
        await prisma.resume.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
        createData.isPrimary = true;
      }

      const created = await prisma.resume.create({ data: createData });

      const resumes = await prisma.resume.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      });
      const primary =
        resumes.find((r) => r.isPrimary) || resumes[0] || null;

      return res.status(201).json({ created, resumes, primary });
    } catch (err) {
      console.error("POST /api/profile/resume", err);
      return res.status(500).json({ error: "Failed to create resume" });
    }
  }

  // ──────────────── PATCH: update resume ────────────────
  if (req.method === "PATCH") {
    try {
      const { id, name, content, isPrimary } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: "Resume id is required." });
      }

      const resumeId = Number(id);
      if (Number.isNaN(resumeId)) {
        return res.status(400).json({ error: "Invalid resume id." });
      }

      const existing = await prisma.resume.findFirst({
        where: { id: resumeId, userId },
      });

      if (!existing) {
        return res.status(404).json({ error: "Resume not found." });
      }

      const data: any = {};

      if (name?.trim()) data.name = name.trim();
      if (content?.trim()) data.content = content.trim();

      if (isPrimary === true) {
        await prisma.resume.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
        data.isPrimary = true;
      }

      const updated = await prisma.resume.update({
        where: { id: resumeId },
        data,
      });

      const resumes = await prisma.resume.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      });
      const primary =
        resumes.find((r) => r.isPrimary) || resumes[0] || null;

      return res.status(200).json({ updated, resumes, primary });
    } catch (err) {
      console.error("PATCH /api/profile/resume", err);
      return res.status(500).json({ error: "Failed to update resume" });
    }
  }

  // ──────────────── DELETE: delete resume ────────────────
  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: "Resume id is required." });
      }

      const resumeId = Number(id);
      if (Number.isNaN(resumeId)) {
        return res.status(400).json({ error: "Invalid resume id." });
      }

      const existing = await prisma.resume.findFirst({
        where: { id: resumeId, userId },
      });

      if (!existing) {
        return res.status(404).json({ error: "Resume not found." });
      }

      const wasPrimary = existing.isPrimary;

      await prisma.resume.delete({
        where: { id: resumeId },
      });

      if (wasPrimary) {
        const remaining = await prisma.resume.findMany({
          where: { userId },
          orderBy: [{ updatedAt: "desc" }],
        });

        const hasPrimary = remaining.some((r) => r.isPrimary);

        if (!hasPrimary && remaining.length > 0) {
          await prisma.resume.update({
            where: { id: remaining[0].id },
            data: { isPrimary: true },
          });
        }
      }

      const resumes = await prisma.resume.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      });
      const primary =
        resumes.find((r) => r.isPrimary) || resumes[0] || null;

      return res.status(200).json({ success: true, resumes, primary });
    } catch (err) {
      console.error("DELETE /api/profile/resume", err);
      return res.status(500).json({ error: "Failed to delete resume" });
    }
  }

  // ──────────────── Unsupported methods ────────────────
  res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
