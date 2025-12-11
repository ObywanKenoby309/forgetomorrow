// pages/api/recruiter/job-postings.js

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

async function requireRecruiterSession(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email || !session.user.id) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  const role = (session.user /** as any */)?.role || "SEEKER";
  if (!["RECRUITER", "ADMIN"].includes(String(role))) {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }

  return session;
}

export default async function handler(req, res) {
  const session = await requireRecruiterSession(req, res);
  if (!session) return;

  const userId = session.user.id;
  const accountKey = (session.user /** as any */).accountKey || null;

  try {
    if (req.method === "GET") {
      const jobs = await prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const rows = jobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        worksite: job.worksite,
        location: job.location,
        type: job.type,
        compensation: job.compensation,
        description: job.description,
        status: job.status,
        urgent: job.urgent,
        views: job.viewsCount,
        applications: job.applicationsCount,
        accountKey: job.accountKey,
        createdAt: job.createdAt,
      }));

      return res.status(200).json({ jobs: rows });
    }

    if (req.method === "POST") {
      const {
        title,
        company,
        worksite,
        location,
        type,
        compensation,
        description,
        status = "Draft",
        urgent = false,
      } = req.body || {};

      if (!title || !company || !worksite || !location || !description) {
        return res.status(400).json({
          error:
            "Missing required fields (title, company, worksite, location, description).",
        });
      }

      const job = await prisma.job.create({
        data: {
          title,
          company,
          worksite,
          location,
          type: type || null,
          compensation: compensation || null,
          description,
          status,
          urgent: Boolean(urgent),
          userId,
          accountKey,
        },
      });

      return res.status(201).json({
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          worksite: job.worksite,
          location: job.location,
          type: job.type,
          compensation: job.compensation,
          description: job.description,
          status: job.status,
          urgent: job.urgent,
          views: job.viewsCount,
          applications: job.applicationsCount,
          accountKey: job.accountKey,
          createdAt: job.createdAt,
        },
      });
    }

    if (req.method === "PATCH") {
      const {
        id,
        title,
        company,
        worksite,
        location,
        type,
        compensation,
        description,
        status,
        urgent,
      } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: "Job id is required." });
      }

      const existing = await prisma.job.findFirst({
        where: { id: Number(id), userId },
      });

      if (!existing) {
        return res
          .status(404)
          .json({ error: "Job not found or not owned by this recruiter." });
      }

      const updated = await prisma.job.update({
        where: { id: existing.id },
        data: {
          title: typeof title !== "undefined" ? title : existing.title,
          company: typeof company !== "undefined" ? company : existing.company,
          worksite: typeof worksite !== "undefined" ? worksite : existing.worksite,
          location: typeof location !== "undefined" ? location : existing.location,
          type: typeof type !== "undefined" ? type : existing.type,
          compensation:
            typeof compensation !== "undefined"
              ? compensation
              : existing.compensation,
          description:
            typeof description !== "undefined"
              ? description
              : existing.description,
          status: typeof status !== "undefined" ? status : existing.status,
          urgent:
            typeof urgent === "boolean" ? urgent : existing.urgent,
        },
      });

      return res.status(200).json({
        job: {
          id: updated.id,
          title: updated.title,
          company: updated.company,
          worksite: updated.worksite,
          location: updated.location,
          type: updated.type,
          compensation: updated.compensation,
          description: updated.description,
          status: updated.status,
          urgent: updated.urgent,
          views: updated.viewsCount,
          applications: updated.applicationsCount,
          accountKey: updated.accountKey,
          createdAt: updated.createdAt,
        },
      });
    }

    res.setHeader("Allow", "GET,POST,PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[api/recruiter/job-postings] error:", err);
    return res.status(500).json({
      error: "Unexpected error while handling recruiter job postings.",
    });
  }
}
