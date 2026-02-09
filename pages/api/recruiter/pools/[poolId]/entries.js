// pages/api/recruiter/pools/[poolId]/entries.js
// Pool entries — DB-backed (org scoped), impersonation-aware (Platform Admin only)

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";
import jwt from "jsonwebtoken";

let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

function readCookie(req, name) {
  try {
    const raw = req.headers?.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
    }
    return "";
  } catch {
    return "";
  }
}

async function resolveEffectiveRecruiter(prisma, req, session) {
  const sessionEmail = String(session?.user?.email || "").trim().toLowerCase();
  if (!sessionEmail) return null;

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;

  let effectiveUserId = null;

  if (isPlatformAdmin) {
    const imp = readCookie(req, "ft_imp");
    if (imp) {
      try {
        const decoded = jwt.verify(
          imp,
          process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production"
        );
        if (decoded && typeof decoded === "object" && decoded.targetUserId) {
          effectiveUserId = String(decoded.targetUserId);
        }
      } catch {
        // ignore
      }
    }
  }

  if (effectiveUserId) {
    const u = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: { id: true, email: true, accountKey: true },
    });
    return u?.id ? u : null;
  }

  const u = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, email: true, accountKey: true },
  });
  return u?.id ? u : null;
}

function toStringArray(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
}

function safeIso(d) {
  try {
    if (!d) return "";
    const dt = new Date(d);
    if (!Number.isFinite(dt.getTime())) return "";
    return dt.toISOString();
  } catch {
    return "";
  }
}

function parseDateOrNull(v) {
  try {
    if (!v) return null;
    const dt = new Date(v);
    if (!Number.isFinite(dt.getTime())) return null;
    return dt;
  } catch {
    return null;
  }
}

function pickCandidateShape(e) {
  return {
    id: e.id,
    poolId: e.poolId,

    candidateUserId: e.candidateUserId || null,

    name: e.candidateName || "",
    headline: e.candidateHeadline || "",
    location: e.candidateLocation || "",

    source: e.source || (e.candidateUserId ? "Internal" : "External"),
    status: e.status || "Warm",
    fit: e.fit || "",

    // UI expects a string; DB stores DateTime
    lastTouch: e.lastTouchAt ? safeIso(e.lastTouchAt) : "",

    reasons: toStringArray(e.reasons),
    notes: e.notes || "",

    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

function devDetails(req, err) {
  const debug = String(req?.query?.debug || "") === "1";
  if (!debug) return undefined;

  return {
    name: err?.name ? String(err.name) : undefined,
    code: err?.code ? String(err.code) : undefined,
    message: err?.message ? String(err.message) : String(err),
  };
}

export default async function handler(req, res) {
  const prisma = getPrisma();

  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[recruiter/pools/entries] session error:", err);
  }

  if (!session?.user?.email) return res.status(401).json({ error: "Not authenticated" });

  const recruiter = await resolveEffectiveRecruiter(prisma, req, session);
  if (!recruiter?.id) return res.status(404).json({ error: "User not found" });
  if (!recruiter.accountKey) return res.status(404).json({ error: "accountKey not found" });

  const accountKey = recruiter.accountKey;

  const poolIdRaw = req.query.poolId;
  const poolId = (Array.isArray(poolIdRaw) ? poolIdRaw[0] : poolIdRaw || "").toString().trim();
  if (!poolId) return res.status(400).json({ error: "Missing poolId" });

  // Ensure pool belongs to org
  let pool;
  try {
    pool = await prisma.talentPool.findFirst({
      where: { id: poolId, accountKey },
      select: { id: true },
    });
  } catch (err) {
    console.error("[recruiter/pools/entries] pool lookup error:", err);
    return res.status(500).json({ error: "Failed to validate pool.", details: devDetails(req, err) });
  }

  if (!pool?.id) return res.status(404).json({ error: "Pool not found" });

  if (req.method === "GET") {
    try {
      const entries = await prisma.talentPoolEntry.findMany({
        where: { accountKey, poolId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          poolId: true,
          accountKey: true,
          candidateUserId: true,

          candidateName: true,
          candidateHeadline: true,
          candidateLocation: true,

          source: true,
          status: true,
          fit: true,

          // ✅ schema field
          lastTouchAt: true,

          reasons: true,
          notes: true,

          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({ entries: entries.map(pickCandidateShape) });
    } catch (err) {
      console.error("[recruiter/pools/entries] GET error:", err);
      return res.status(500).json({ error: "Failed to load pool entries.", details: devDetails(req, err) });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};

      const candidateUserIdRaw = body.candidateUserId ? String(body.candidateUserId).trim() : "";
      const candidateUserId = candidateUserIdRaw || null;

      const candidateName = String(body.name || "").trim();
      const candidateHeadline = String(body.headline || "").trim();
      const candidateLocation = String(body.location || "").trim();

      const source = String(body.source || (candidateUserId ? "Internal" : "External")).trim();
      const status = String(body.status || "Warm").trim();
      const fit = String(body.fit || "").trim();

      // UI sends string; DB stores DateTime
      const lastTouchAt = parseDateOrNull(String(body.lastTouch || "").trim());

      const reasons = Array.isArray(body.reasons)
        ? body.reasons.map((r) => String(r || "").trim()).filter(Boolean)
        : [];
      const notes = String(body.notes || "").trim();

      if (!candidateName) return res.status(400).json({ error: "Missing candidate name" });

      // If internal user was provided, ensure it exists (defensive)
      if (candidateUserId) {
        const u = await prisma.user.findUnique({ where: { id: candidateUserId }, select: { id: true } });
        if (!u?.id) return res.status(400).json({ error: "candidateUserId not found" });
      }

      const created = await prisma.talentPoolEntry.create({
        data: {
          accountKey,
          poolId,

          candidateUserId,

          candidateName,
          candidateHeadline: candidateHeadline || null,
          candidateLocation: candidateLocation || null,

          source: source || null,
          status: status || null,
          fit: fit || null,

          // ✅ schema field
          lastTouchAt: lastTouchAt || null,

          reasons: reasons.length ? reasons : null,
          notes: notes || null,
        },
        select: {
          id: true,
          poolId: true,
          accountKey: true,
          candidateUserId: true,

          candidateName: true,
          candidateHeadline: true,
          candidateLocation: true,

          source: true,
          status: true,
          fit: true,
          lastTouchAt: true,

          reasons: true,
          notes: true,

          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(201).json({ entry: pickCandidateShape(created) });
    } catch (err) {
      console.error("[recruiter/pools/entries] POST error:", err);
      return res.status(500).json({ error: "Failed to add entry.", details: devDetails(req, err) });
    }
  }

  if (req.method === "DELETE") {
    try {
      const entryId = String(req.query.entryId || "").trim();
      if (!entryId) return res.status(400).json({ error: "Missing entryId" });

      const existing = await prisma.talentPoolEntry.findFirst({
        where: { id: entryId, accountKey, poolId },
        select: { id: true },
      });
      if (!existing?.id) return res.status(404).json({ error: "Entry not found" });

      await prisma.talentPoolEntry.delete({ where: { id: entryId } });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[recruiter/pools/entries] DELETE error:", err);
      return res.status(500).json({ error: "Failed to remove entry.", details: devDetails(req, err) });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
