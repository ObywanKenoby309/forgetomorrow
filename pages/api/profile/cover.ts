// pages/api/profile/cover.ts
import { getServerSession } from "next-auth"
import authOptions from "../auth/[...nextauth]"
import { PrismaClient } from "@prisma/client"
import type { NextApiRequest, NextApiResponse } from "next"

const prisma = new PrismaClient()

// /api/profile/cover
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Tell TS what we expect the session shape to be
  const session = (await getServerSession(req, res, authOptions)) as
    | { user?: { email?: string | null } }
    | null

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  const email = session.user.email as string

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  const userId = user.id

  // ──────────────── GET ────────────────
  if (req.method === "GET") {
    try {
      const covers = await prisma.cover.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      })
      const primary = covers.find((c) => c.isPrimary) || covers[0] || null
      return res.status(200).json({ covers, primary })
    } catch (err) {
      console.error("GET /api/profile/cover", err)
      return res.status(500).json({ error: "Failed to load covers" })
    }
  }

  // ──────────────── POST ────────────────
  if (req.method === "POST") {
    try {
      const { name, content, jobId, isPrimary } = req.body || {}
      if (!name?.trim()) {
        return res.status(400).json({ error: "Cover letter name is required." })
      }
      if (!content?.trim()) {
        return res.status(400).json({ error: "Cover letter content is required." })
      }

      const count = await prisma.cover.count({ where: { userId } })
      if (count >= 5) {
        return res.status(400).json({
          error:
            "You can save up to 5 cover letters. Please delete one before adding another.",
        })
      }

      const createData: any = {
        userId,
        name: name.trim(),
        content: content.trim(),
      }

      if (jobId != null) {
        const parsedJobId = Number(jobId)
        if (!Number.isNaN(parsedJobId)) createData.jobId = parsedJobId
      }

      if (count === 0) {
        createData.isPrimary = true
      } else if (isPrimary === true) {
        await prisma.cover.updateMany({
          where: { userId },
          data: { isPrimary: false },
        })
        createData.isPrimary = true
      }

      const created = await prisma.cover.create({ data: createData })

      const covers = await prisma.cover.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      })
      const primary = covers.find((c) => c.isPrimary) || covers[0] || null

      return res.status(201).json({ created, covers, primary })
    } catch (err) {
      console.error("POST /api/profile/cover", err)
      return res.status(500).json({ error: "Failed to create cover letter" })
    }
  }

  // ──────────────── PATCH ────────────────
  if (req.method === "PATCH") {
    try {
      const { id, name, content, jobId, isPrimary } = req.body || {}
      if (!id) {
        return res.status(400).json({ error: "Cover id is required." })
      }

      const coverId = Number(id)
      if (Number.isNaN(coverId)) {
        return res.status(400).json({ error: "Invalid cover id." })
      }

      const existing = await prisma.cover.findFirst({
        where: { id: coverId, userId },
      })

      if (!existing) {
        return res.status(404).json({ error: "Cover letter not found." })
      }

      const data: any = {}

      if (name?.trim()) data.name = name.trim()
      if (content?.trim()) data.content = content.trim()

      if (jobId !== undefined) {
        if (jobId === null || jobId === "") {
          data.jobId = null
        } else {
          const parsedJobId = Number(jobId)
          if (!Number.isNaN(parsedJobId)) {
            data.jobId = parsedJobId
          }
        }
      }

      if (isPrimary === true) {
        await prisma.cover.updateMany({
          where: { userId },
          data: { isPrimary: false },
        })
        data.isPrimary = true
      }

      const updated = await prisma.cover.update({
        where: { id: coverId },
        data,
      })

      const covers = await prisma.cover.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      })
      const primary = covers.find((c) => c.isPrimary) || covers[0] || null

      return res.status(200).json({ updated, covers, primary })
    } catch (err) {
      console.error("PATCH /api/profile/cover", err)
      return res.status(500).json({ error: "Failed to update cover letter" })
    }
  }

  // ──────────────── DELETE ────────────────
  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {}
      if (!id) {
        return res.status(400).json({ error: "Cover id is required." })
      }

      const coverId = Number(id)
      if (Number.isNaN(coverId)) {
        return res.status(400).json({ error: "Invalid cover id." })
      }

      const existing = await prisma.cover.findFirst({
        where: { id: coverId, userId },
      })

      if (!existing) {
        return res.status(404).json({ error: "Cover letter not found." })
      }

      const wasPrimary = existing.isPrimary

      await prisma.cover.delete({
        where: { id: coverId },
      })

      if (wasPrimary) {
        const remaining = await prisma.cover.findMany({
          where: { userId },
          orderBy: [{ updatedAt: "desc" }],
        })

        const hasPrimary = remaining.some((c) => c.isPrimary)

        if (!hasPrimary && remaining.length > 0) {
          await prisma.cover.update({
            where: { id: remaining[0].id },
            data: { isPrimary: true },
          })
        }
      }

      const covers = await prisma.cover.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      })
      const primary = covers.find((c) => c.isPrimary) || covers[0] || null

      return res.status(200).json({ success: true, covers, primary })
    } catch (err) {
      console.error("DELETE /api/profile/cover", err)
      return res.status(500).json({ error: "Failed to delete cover letter" })
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
