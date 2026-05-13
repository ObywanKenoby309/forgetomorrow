// pages/api/seeker/recommended-jobs.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { rankJobsBySearchRelevance } from "@/lib/intelligence/forgeSearchEngine";

function inferLocationType(location) {
  const text = String(location || "").toLowerCase();

  if (!text) return "";
  if (text.includes("remote")) return "Remote";
  if (text.includes("hybrid")) return "Hybrid";

  return "On-site";
}

function isSearchPreferenceActive(preference) {
  if (!preference) return false;

  return Boolean(
    preference.keyword ||
      preference.company ||
      preference.location ||
      preference.locationType ||
      preference.source ||
      preference.days
  );
}

function buildPreferenceFilters(preference) {
  return {
    keyword: preference?.keyword || "",
    company: preference?.company || "",
    location: preference?.location || "",
    locationType: preference?.locationType || "",
    source: preference?.source || "",
  };
}

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
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = user.id;

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 4;
    const safeLimit = Number.isNaN(limit) || limit < 1 ? 4 : Math.min(limit, 20);

    const preference = await prisma.seekerJobPreference.findUnique({
      where: { userId },
    });

    const appliedJobIds = await prisma.application.findMany({
      where: { userId },
      select: { jobId: true },
    });

    const appliedIds = appliedJobIds
      .map((application) => application.jobId)
      .filter((id) => id != null);

    const whereClause = {
      status: {
        notIn: ["Draft", "Closed", "Expired"],
      },
    };

    if (appliedIds.length > 0) {
      whereClause.id = { notIn: appliedIds };
    }

    if (preference?.company) {
      whereClause.company = {
        contains: preference.company,
        mode: "insensitive",
      };
    }

    if (preference?.days) {
      const since = new Date();
      since.setDate(since.getDate() - preference.days);

      whereClause.createdAt = {
        gte: since,
      };
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        worksite: true,
        compensation: true,
        type: true,
        description: true,
        tags: true,
        source: true,
        salary: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        publishedat: true,
        url: true,
      },
      orderBy: { createdAt: "desc" },
      take: isSearchPreferenceActive(preference) ? 100 : safeLimit,
    });

    let finalJobs = jobs;

    if (isSearchPreferenceActive(preference)) {
      const filters = buildPreferenceFilters(preference);

      finalJobs = rankJobsBySearchRelevance(jobs, filters).filter((job) => {
        if ((job.searchScore || 0) <= 24) return false;

        if (preference.location) {
          const location = String(job.location || "").toLowerCase();
          if (!location.includes(String(preference.location).toLowerCase())) return false;
        }

        if (preference.locationType) {
          if (inferLocationType(job.location) !== preference.locationType) return false;
        }

        if (preference.source) {
          const source = String(job.source || "").toLowerCase();
          const target = String(preference.source || "").toLowerCase();

          if (target && !source.includes(target)) return false;
        }

        return true;
      });
    }

    return res.status(200).json({
      jobs: finalJobs.slice(0, safeLimit).map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        worksite: job.worksite,
        compensation: job.compensation,
        type: job.type,
        createdAt: job.createdAt,
        searchScore: job.searchScore || null,
      })),
      preferenceApplied: isSearchPreferenceActive(preference),
    });
  } catch (err) {
    console.error("[api/seeker/recommended-jobs] error:", err);
    return res.status(500).json({ error: "Failed to load recommended jobs" });
  }
}
