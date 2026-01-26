// pages/api/apply/template.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";

function getCookie(req, name) {
  try {
    const raw = req.headers?.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "=")) {
        return decodeURIComponent(p.slice(name.length + 1));
      }
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeEmail(v) {
  const s = String(v || "").toLowerCase().trim();
  return s || null;
}

async function getAuthedEmail(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const sessionEmail = normalizeEmail(session?.user?.email);
  if (sessionEmail) return sessionEmail;

  const token = getCookie(req, "auth");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return normalizeEmail(decoded?.email);
  } catch {
    return null;
  }
}

// Keep job-level screening questions safe + consistent
function normalizeJobQuestions(list) {
  if (!Array.isArray(list)) return null;

  const cleaned = list
    .map((q) => {
      const key = String(q?.key || "").trim();
      const label = String(q?.label || "").trim();
      const helpText = String(q?.helpText || "").trim();

      return {
        key: key || null,
        label: label || "",
        type: "TEXT", // ✅ align with apply UI expectations
        required: Boolean(q?.required),
        helpText: helpText || "",
      };
    })
    .filter((q) => q.label) // must have a prompt
    .slice(0, 6);

  return cleaned.length ? cleaned : null;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const email = await getAuthedEmail(req, res);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    const jobId = Number(req.query?.jobId);
    if (!jobId) return res.status(400).json({ error: "Missing jobId" });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, accountKey: true, additionalQuestions: true },
    });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const accountKey = job.accountKey;
    if (!accountKey)
      return res.status(400).json({ error: "Job missing accountKey" });

    // ✅ Always include job-level screening questions (even if no active template exists)
    const jobQuestions = normalizeJobQuestions(job.additionalQuestions);

    const tpl = await prisma.applicationTemplate.findFirst({
      where: { accountKey, isActive: true },
      orderBy: { updatedAt: "desc" },
      include: {
        steps: {
          orderBy: { order: "asc" },
          include: {
            questions: { orderBy: { key: "asc" } },
          },
        },
      },
    });

    // ✅ CHANGE: return 200 with empty template if none exists (so UI still has questions)
    if (!tpl) {
      return res.status(200).json({
        id: null,
        accountKey,
        isActive: false,
        steps: [],
        jobQuestions,
      });
    }

    // Backward compatible: template stays at root; we only add `jobQuestions`
    return res.status(200).json({
      ...tpl,
      jobQuestions,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
