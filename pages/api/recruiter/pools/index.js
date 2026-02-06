// pages/api/recruiter/pools/index.js
// Talent Pools — DB-backed (org scoped), impersonation-aware (Platform Admin only)

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
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
        const decoded = jwt.verify(imp, process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production");
        if (decoded && typeof decoded === "object" && decoded.targetUserId) {
          effectiveUserId = String(decoded.targetUserId);
        }
      } catch {
        // ignore invalid/expired cookie
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

export default async function handler(req, res) {
  const prisma = getPrisma();

  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[recruiter/pools] session error:", err);
  }

  if (!session?.user?.email) return res.status(401).json({ error: "Not authenticated" });

  const recruiter = await resolveEffectiveRecruiter(prisma, req, session);
  if (!recruiter?.id) return res.status(404).json({ error: "User not found" });
  if (!recruiter.accountKey) return res.status(404).json({ error: "accountKey not found" });

  const accountKey = recruiter.accountKey;
  const recruiterUserId = recruiter.id;

  if (req.method === "GET") {
    try {
      const pools = await prisma.talentPool.findMany({
        where: { accountKey },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          purpose: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { entries: true } },
        },
      });

      const out = pools.map((p) => ({
        id: p.id,
        name: p.name,
        purpose: p.purpose || "",
        tags: toStringArray(p.tags),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        count: p._count?.entries || 0,
      }));

      return res.status(200).json({ pools: out });
    } catch (err) {
      console.error("[recruiter/pools] GET error:", err);
      return res.status(500).json({ error: "Failed to load pools." });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const name = String(body.name || "").trim();
      const purpose = String(body.purpose || "").trim();
      const tags = Array.isArray(body.tags) ? body.tags.map((t) => String(t || "").trim()).filter(Boolean) : [];

      if (!name) return res.status(400).json({ error: "Missing name" });
      if (name.length > 64) return res.status(400).json({ error: "Name too long (max 64)." });

      const created = await prisma.talentPool.create({
        data: {
          accountKey,
          createdByUserId: recruiterUserId,
          name,
          purpose: purpose || null,
          tags: tags.length ? tags : null,
        },
        select: {
          id: true,
          name: true,
          purpose: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(201).json({
        pool: {
          id: created.id,
          name: created.name,
          purpose: created.purpose || "",
          tags: toStringArray(created.tags),
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          count: 0,
        },
      });
    } catch (err) {
      console.error("[recruiter/pools] POST error:", err);
      return res.status(500).json({ error: "Failed to create pool." });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
