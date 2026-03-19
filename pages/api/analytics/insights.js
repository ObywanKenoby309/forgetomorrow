// pages/api/analytics/insights.js
// Forge Insights — dynamic, server-computed insight strings.
//
// Returns: { insights: Array<{ type: "live"|"attention"|"roadmap", title: string, body: string }> }
//
// Mirrors the same filter/auth pattern as /api/analytics/recruiter.js.
// All logic is derived from live Prisma data — no hardcoded strings.

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers (duplicated from recruiter.js to keep this endpoint self-contained)
// ─────────────────────────────────────────────────────────────────────────────

function getQueryValue(value, fallback = "") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  if (typeof value === "string") return value;
  return fallback;
}

function parseRange(range, fromStr, toStr) {
  const now = new Date();
  let from = null;
  let to = now;

  if (range === "custom" && fromStr && toStr) {
    const f = new Date(fromStr);
    const t = new Date(toStr);
    if (!Number.isNaN(f.getTime()) && !Number.isNaN(t.getTime())) {
      f.setHours(0, 0, 0, 0);
      t.setHours(23, 59, 59, 999);
      from = f;
      to = t;
    }
  } else {
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
    to = now;
  }

  if (!from) {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
  }

  if (from > to) { const tmp = from; from = to; to = tmp; }

  return { from, to };
}

const msPerDay = 24 * 60 * 60 * 1000;

// Benchmark: roles open longer than this are flagged.
const TIME_TO_FILL_BENCHMARK_DAYS = 45;

// Minimum hires before QoH is considered promotable to a primary KPI.
const QOH_HIRE_THRESHOLD = 5;

const SOURCE_LABELS = {
  FORGETOMORROW: "ForgeTomorrow",
  EXTERNAL: "External",
  REFERRAL: "Referral",
  CAREERS: "Careers",
  OTHER: "Other",
};

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = session.user.id;
    const userRole = String(session.user.role || "SEEKER");

    const range      = getQueryValue(req.query?.range, "30d");
    const jobId      = getQueryValue(req.query?.jobId, "all");
    const recruiterId = getQueryValue(req.query?.recruiterId, "all");
    const companyId  = getQueryValue(req.query?.companyId, "all");
    const fromStr    = getQueryValue(req.query?.from, "");
    const toStr      = getQueryValue(req.query?.to, "");

    const { from, to } = parseRange(range, fromStr, toStr);

    // ── Job scope (mirrors recruiter.js exactly) ──────────────────────────────
    const jobWhere = {};
    if (recruiterId !== "all") {
      jobWhere.userId = recruiterId;
    } else if (userRole !== "ADMIN") {
      jobWhere.userId = userId;
    }
    if (companyId !== "all") jobWhere.company = companyId;
    if (jobId !== "all") {
      const parsed = parseInt(jobId, 10);
      if (!Number.isNaN(parsed)) jobWhere.id = parsed;
    }

    const dateFilter = { gte: from, lte: to };

    const jobs = await prisma.job.findMany({
      where: jobWhere,
      select: { id: true, title: true, createdAt: true },
    });

    const jobIds = jobs.map((j) => j.id);

    // No jobs → return a single roadmap insight so the panel is never empty.
    if (!jobIds.length) {
      return res.status(200).json({
        insights: [
          {
            type: "roadmap",
            title: "No active roles in this window",
            body: "Post your first role or broaden the date range to start seeing live insights here.",
          },
        ],
      });
    }

    // ── Parallel data fetch ───────────────────────────────────────────────────
    const [
      sourceGroups,
      allApplications,
      offersAccepted,
      allOffers,
      interviews,
    ] = await Promise.all([
      // Source breakdown
      prisma.application.groupBy({
        by: ["source"],
        where: { jobId: { in: jobIds }, appliedAt: dateFilter },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),

      // All applications (for apply-to-hire and conversion)
      prisma.application.count({
        where: { jobId: { in: jobIds }, appliedAt: dateFilter },
      }),

      // Accepted offers (for hires + QoH signal)
      prisma.offer.findMany({
        where: { jobId: { in: jobIds }, accepted: true, receivedAt: dateFilter },
        select: { jobId: true, receivedAt: true },
      }),

      // All offers (for acceptance rate)
      prisma.offer.count({
        where: { jobId: { in: jobIds }, receivedAt: dateFilter },
      }),

      // Interviews
      prisma.interview.count({
        where: { jobId: { in: jobIds }, scheduledAt: dateFilter },
      }),
    ]);

    const hiresCount  = offersAccepted.length;
    const totalApplies = allApplications;

    // ─────────────────────────────────────────────────────────────────────────
    // Compute insights
    // ─────────────────────────────────────────────────────────────────────────
    const insights = [];

    // ── 1. Source dominance ───────────────────────────────────────────────────
    if (sourceGroups.length > 0) {
      const totalSourced = sourceGroups.reduce((sum, row) => sum + row._count.id, 0);
      const top = sourceGroups[0];
      const topLabel = SOURCE_LABELS[top.source] ?? top.source;
      const topPct = totalSourced > 0
        ? Math.round((top._count.id / totalSourced) * 100)
        : 0;

      if (sourceGroups.length === 1) {
        insights.push({
          type: "live",
          title: "Single active source",
          body: `All ${totalSourced} application${totalSourced !== 1 ? "s" : ""} are coming via ${topLabel}. Consider diversifying channels to reduce concentration risk.`,
        });
      } else {
        const second = sourceGroups[1];
        const secondLabel = SOURCE_LABELS[second.source] ?? second.source;
        insights.push({
          type: "live",
          title: `${topLabel} leading at ${topPct}%`,
          body: `${topLabel} is your top channel (${top._count.id} applies), followed by ${secondLabel} (${second._count.id}). ${topPct >= 70 ? "High concentration — consider spreading spend." : "Source mix looks healthy."}`,
        });
      }
    } else {
      insights.push({
        type: "roadmap",
        title: "Source data building",
        body: "No applications have been tagged in this window yet. Source performance will appear here as candidates come in.",
      });
    }

    // ── 2. Apply-to-hire efficiency ───────────────────────────────────────────
    if (totalApplies > 0) {
      const applyToHirePct = ((hiresCount / totalApplies) * 100).toFixed(1);
      const isStrong = hiresCount / totalApplies >= 0.05; // 5%+ is healthy
      insights.push({
        type: isStrong ? "live" : "attention",
        title: `Apply-to-hire: ${applyToHirePct}%`,
        body: isStrong
          ? `${hiresCount} hire${hiresCount !== 1 ? "s" : ""} from ${totalApplies} application${totalApplies !== 1 ? "s" : ""}. Your funnel is converting efficiently.`
          : `Only ${hiresCount} hire${hiresCount !== 1 ? "s" : ""} from ${totalApplies} application${totalApplies !== 1 ? "s" : ""}. Review where candidates are dropping — screens, interviews, or offers.`,
      });
    }

    // ── 3. Time-to-fill flag ──────────────────────────────────────────────────
    // Find jobs that have accepted offers and check if fill time exceeded benchmark.
    const jobsById = jobs.reduce((acc, j) => { acc[j.id] = j; return acc; }, {});
    const slowRoles = [];

    offersAccepted.forEach((offer) => {
      const job = jobsById[offer.jobId];
      if (!job) return;
      const days = Math.round((offer.receivedAt.getTime() - job.createdAt.getTime()) / msPerDay);
      if (days > TIME_TO_FILL_BENCHMARK_DAYS) {
        slowRoles.push({ title: job.title, days });
      }
    });

    // Also flag open roles (no accepted offer yet) that have been open too long.
    const filledJobIds = new Set(offersAccepted.map((o) => o.jobId));
    const now = new Date();
    const openSlow = jobs.filter((j) => {
      if (filledJobIds.has(j.id)) return false;
      const daysOpen = Math.round((now.getTime() - j.createdAt.getTime()) / msPerDay);
      return daysOpen > TIME_TO_FILL_BENCHMARK_DAYS;
    });

    if (openSlow.length > 0) {
      const names = openSlow.slice(0, 2).map((j) => `"${j.title}"`).join(", ");
      const extra = openSlow.length > 2 ? ` and ${openSlow.length - 2} more` : "";
      insights.push({
        type: "attention",
        title: `${openSlow.length} role${openSlow.length !== 1 ? "s" : ""} past fill benchmark`,
        body: `${names}${extra} ${openSlow.length === 1 ? "has" : "have"} been open more than ${TIME_TO_FILL_BENCHMARK_DAYS} days. Review pipeline health or consider broadening requirements.`,
      });
    } else if (slowRoles.length > 0) {
      const avg = Math.round(slowRoles.reduce((s, r) => s + r.days, 0) / slowRoles.length);
      insights.push({
        type: "attention",
        title: `Recent fills averaged ${avg} days`,
        body: `${slowRoles.length} role${slowRoles.length !== 1 ? "s" : ""} exceeded the ${TIME_TO_FILL_BENCHMARK_DAYS}-day benchmark before closing. Check where time is accumulating — scheduling, approvals, or offer stage.`,
      });
    } else if (hiresCount > 0) {
      const filledOffers = offersAccepted.filter((o) => jobsById[o.jobId]);
      const avgDays = filledOffers.length
        ? Math.round(
            filledOffers.reduce((s, o) => {
              const j = jobsById[o.jobId];
              return s + (o.receivedAt.getTime() - j.createdAt.getTime()) / msPerDay;
            }, 0) / filledOffers.length
          )
        : 0;
      if (avgDays > 0) {
        insights.push({
          type: "live",
          title: `Avg. fill time: ${avgDays} days`,
          body: `All closed roles in this window filled within benchmark. Strong execution — keep monitoring as pipeline volume grows.`,
        });
      }
    }

    // ── 4. Offer acceptance signal ────────────────────────────────────────────
    if (allOffers > 0) {
      const acceptancePct = Math.round((hiresCount / allOffers) * 100);
      if (acceptancePct < 70) {
        insights.push({
          type: "attention",
          title: `Offer acceptance at ${acceptancePct}%`,
          body: `${allOffers - hiresCount} offer${allOffers - hiresCount !== 1 ? "s" : ""} declined this period. Consider revisiting comp benchmarking or closing process.`,
        });
      } else {
        insights.push({
          type: "live",
          title: `Offer acceptance strong at ${acceptancePct}%`,
          body: `Candidates are saying yes. This is a leading indicator of offer quality and comp competitiveness.`,
        });
      }
    }

    // ── 5. QoH promotion signal ───────────────────────────────────────────────
    if (hiresCount >= QOH_HIRE_THRESHOLD) {
      insights.push({
        type: "live",
        title: "Quality of Hire ready to activate",
        body: `You now have ${hiresCount} hires in this window — enough post-hire data to promote QoH to a primary KPI. Enable it in report settings.`,
      });
    } else {
      const remaining = QOH_HIRE_THRESHOLD - hiresCount;
      insights.push({
        type: "roadmap",
        title: `Quality of Hire: ${hiresCount}/${QOH_HIRE_THRESHOLD} hires`,
        body: `${remaining} more hire${remaining !== 1 ? "s" : ""} needed before Quality of Hire has enough signal to surface as a reliable metric.`,
      });
    }

    // ── 6. Interview conversion ───────────────────────────────────────────────
    if (interviews > 0 && totalApplies > 0) {
      const screenPct = Math.round((interviews / totalApplies) * 100);
      if (screenPct < 10) {
        insights.push({
          type: "attention",
          title: `Interview rate low at ${screenPct}%`,
          body: `Only ${interviews} of ${totalApplies} applicants reached an interview. Check screening criteria — you may be filtering too aggressively or losing candidates before contact.`,
        });
      }
    }

    return res.status(200).json({ insights });
  } catch (err) {
    console.error("[analytics/insights] error:", err);
    return res.status(500).json({
      error: "We had trouble loading insights. Please try again shortly.",
    });
  }
}