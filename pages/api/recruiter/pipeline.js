// pages/api/recruiter/pipeline.js
// Returns candidate pipeline grouped by CandidateGroup (canonical truth).
// Also returns talentPoolGroups for the recruiter messaging center.
// Scoped to the recruiter's org (accountKey) — all recruiters see the same groups.
// Individual conversation threads are per-recruiter (not shared).

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

function readCookie(req, name) {
  try {
    const raw = req.headers?.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "=")) {
        return decodeURIComponent(p.slice(name.length + 1));
      }
    }
    return "";
  } catch {
    return "";
  }
}

function norm(v) {
  return String(v || "").trim();
}

function normLower(v) {
  return norm(v).toLowerCase();
}

function jsonSafe(value) {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === "bigint") return value.toString();
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (t === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = jsonSafe(v);
    return out;
  }
  return value;
}

function includesText(haystack, needle) {
  if (!needle) return true;
  return normLower(haystack).includes(normLower(needle));
}

function parseBoolTerms(raw) {
  const s = norm(raw);
  if (!s) return [];
  return s
    .replace(/[()"]/g, " ")
    .split(/\bAND\b|\bOR\b|,|\|/i)
    .map((x) => x.trim())
    .filter(Boolean);
}

async function resolveEffectiveRecruiter(req, session) {
  const sessionEmail = String(session?.user?.email || "").trim().toLowerCase();
  if (!sessionEmail) return null;

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;
  let effectiveUserId = null;

  if (isPlatformAdmin) {
    const imp = readCookie(req, "ft_imp");
    if (imp) {
      try {
        const decoded = jwt.verify(imp, JWT_SECRET);
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
      select: { id: true, email: true, role: true, accountKey: true },
    });
    return u?.id ? u : null;
  }

  const u = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, email: true, role: true, accountKey: true },
  });
  return u?.id ? u : null;
}

async function requireRecruiterSession(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  const role = String(session.user?.role || "SEEKER");
  const isPlatformAdmin = !!session.user?.isPlatformAdmin;

  if (!isPlatformAdmin && !["RECRUITER", "ADMIN"].includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }

  return session;
}

function buildCandidateSearchBlob(candidate) {
  return [
    candidate.name,
    candidate.email,
    candidate.title,
    candidate.currentTitle,
    candidate.headline,
    candidate.summary,
    candidate.location,
    candidate.role,
    candidate.jobGroupName,
    ...(Array.isArray(candidate.skills) ? candidate.skills : []),
    ...(Array.isArray(candidate.languages) ? candidate.languages : []),
    ...(Array.isArray(candidate.education) ? candidate.education : []),
  ]
    .filter(Boolean)
    .join(" ");
}

function matchesFilters(candidate, reqQuery) {
  const q = norm(reqQuery?.q);
  const location = norm(reqQuery?.location);
  const boolRaw = norm(reqQuery?.bool);
  const summaryKeywords = norm(reqQuery?.summaryKeywords);
  const jobTitle = norm(reqQuery?.jobTitle);
  const skills = norm(reqQuery?.skills);
  const languages = norm(reqQuery?.languages);
  const education = norm(reqQuery?.education);

  const searchBlob = buildCandidateSearchBlob(candidate);

  if (q && !includesText(searchBlob, q)) return false;

  if (location) {
    const locationBlob = [
      candidate.location,
      candidate.preferredLocation,
      candidate.jobGroupName,
    ]
      .filter(Boolean)
      .join(" ");
    if (!includesText(locationBlob, location)) return false;
  }

  if (summaryKeywords && !includesText(candidate.summary || candidate.headline || "", summaryKeywords)) {
    return false;
  }

  if (jobTitle) {
    const roleBlob = [candidate.title, candidate.currentTitle, candidate.role]
      .filter(Boolean)
      .join(" ");
    if (!includesText(roleBlob, jobTitle)) return false;
  }

  if (skills) {
    const skillTerms = skills.split(/[,|]/g).map((x) => x.trim()).filter(Boolean);
    const skillBlob = (candidate.skills || []).join(" ");
    if (skillTerms.length && !skillTerms.some((term) => includesText(skillBlob, term))) {
      return false;
    }
  }

  if (languages) {
    const languageTerms = languages.split(/[,|]/g).map((x) => x.trim()).filter(Boolean);
    const langBlob = (candidate.languages || []).join(" ");
    if (languageTerms.length && !languageTerms.some((term) => includesText(langBlob, term))) {
      return false;
    }
  }

  if (education) {
    const eduTerms = education.split(/[,|]/g).map((x) => x.trim()).filter(Boolean);
    const eduBlob = (candidate.education || []).join(" ");
    if (eduTerms.length && !eduTerms.some((term) => includesText(eduBlob, term))) {
      return false;
    }
  }

  if (boolRaw) {
    const boolTerms = parseBoolTerms(boolRaw);
    if (boolTerms.length && !boolTerms.every((term) => includesText(searchBlob, term))) {
      return false;
    }
  }

  return true;
}

export default async function handler(req, res) {
  const session = await requireRecruiterSession(req, res);
  if (!session) return;

  const effective = await resolveEffectiveRecruiter(req, session);

  if (!effective?.id) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!effective.accountKey) {
    return res.status(404).json({ error: "accountKey not found" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const recruiterUserId = effective.id;
  const accountKey = effective.accountKey;
  const includeArchived =
    String(req.query?.includeArchived || "") === "1" ||
    String(req.query?.includeArchived || "").toLowerCase() === "true";

  try {
    // ── Verify org membership ─────────────────────────────────────────────────
    const recruiterOrgMember = await prisma.organizationMember.findFirst({
      where: { accountKey, userId: recruiterUserId },
      select: { id: true },
    });

    if (!recruiterOrgMember?.id) {
      return res.status(403).json({ error: "Recruiter is not part of this organization" });
    }

    // ── Load CandidateGroups — canonical source of truth ──────────────────────
    const candidateGroups = await prisma.candidateGroup.findMany({
      where: {
        accountKey,
        ...(includeArchived ? {} : { status: "active" }),
      },
      select: {
        id: true,
        name: true,
        status: true,
        jobId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            addedByUserId: true,
            recruiterCandidate: {
              select: {
                id: true,
                candidateUserId: true,
                tags: true,
                notes: true,
                pipelineStage: true,
                lastContacted: true,
                lastSeen: true,
                skills: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Load Talent Pools ─────────────────────────────────────────────────────
    const talentPools = await prisma.talentPool.findMany({
      where: { accountKey },
      select: {
        id: true,
        name: true,
        purpose: true,
        createdAt: true,
        updatedAt: true,
        entries: {
          where: {
            candidateUserId: { not: null },
          },
          select: {
            id: true,
            candidateUserId: true,
            candidateName: true,
            candidateHeadline: true,
            candidateLocation: true,
            status: true,
            source: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Collect all candidate user ids (from both groups and pools) ───────────
    const groupCandidateUserIds = [
      ...new Set(
        candidateGroups.flatMap((g) =>
          g.members
            .map((m) => m.recruiterCandidate?.candidateUserId)
            .filter(Boolean)
            .filter((id) => String(id) !== recruiterUserId) // exclude self-applications
        )
      ),
    ];

    const poolCandidateUserIds = [
      ...new Set(
        talentPools.flatMap((p) =>
          p.entries.map((e) => e.candidateUserId).filter(Boolean)
        )
      ),
    ];

    const allCandidateUserIds = [
      ...new Set([...groupCandidateUserIds, ...poolCandidateUserIds]),
    ];

    if (!candidateGroups.length && !talentPools.length) {
      return res.status(200).json(
        jsonSafe({ candidates: [], candidatesFlat: [], jobGroups: [], talentPoolGroups: [] })
      );
    }

    // ── Load candidate profiles ───────────────────────────────────────────────
    const candidateUsers = allCandidateUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: allCandidateUserIds } },
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
            headline: true,
            avatarUrl: true,
            city: true,
            region: true,
            location: true,
            summary: true,
            aboutMe: true,
            role: true,
            skillsJson: true,
            languagesJson: true,
          },
        })
      : [];

    const candidateUserById = new Map(
      candidateUsers.map((u) => [String(u.id), u])
    );

    // ── Load THIS recruiter's conversations only ───────────────────────────────
    const recruiterConversations = await prisma.conversationParticipant.findMany({
      where: {
        userId: recruiterUserId,
        conversation: { channel: "recruiter" },
      },
      include: {
        conversation: {
          include: {
            participants: { select: { userId: true } },
          },
        },
      },
    });

    const conversationByOtherUserId = new Map();
    for (const part of recruiterConversations) {
      const other = (part.conversation?.participants || []).find(
        (p) => String(p.userId || "") !== recruiterUserId
      );
      if (other?.userId) {
        conversationByOtherUserId.set(String(other.userId), part.conversationId);
      }
    }

    // ── Load org-level contact rows ───────────────────────────────────────────
    const recruiterContacts = allCandidateUserIds.length
      ? await prisma.contact.findMany({
          where: {
            userId: recruiterUserId,
            contactUserId: { in: allCandidateUserIds },
          },
          select: { id: true, contactUserId: true },
        })
      : [];

    const contactIdByUserId = new Map(
      recruiterContacts.map((c) => [String(c.contactUserId), c.id])
    );

    // ── Helper: build a candidate payload from a user record ──────────────────
    function buildCandidatePayload(user, rc, groupMeta) {
      const displayName =
        user.name ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.email ||
        "Candidate";

      const location =
        user.location ||
        [user.city, user.region].filter(Boolean).join(", ") ||
        "";

      const skills = Array.isArray(rc?.skills)
        ? rc.skills
        : Array.isArray(user.skillsJson)
        ? user.skillsJson
        : [];

      const languages = Array.isArray(user.languagesJson)
        ? user.languagesJson
        : [];

      return {
        id: String(user.id),
        userId: String(user.id),
        contactId: contactIdByUserId.get(String(user.id)) || null,
        recruiterCandidateId: rc?.id || null,
        name: displayName,
        email: user.email || null,
        title: user.title || user.headline || "",
        currentTitle: user.title || "",
        headline: user.headline || "",
        summary: user.summary || user.aboutMe || "",
        role: user.role || "",
        avatarUrl: user.avatarUrl || null,
        location,
        preferredLocation: location,
        skills,
        languages,
        education: [],
        tags: Array.isArray(rc?.tags) ? rc.tags : [],
        notes: rc?.notes || "",
        pipelineStage: rc?.pipelineStage || null,
        lastContacted: rc?.lastContacted || null,
        lastSeen: rc?.lastSeen || null,
        conversationId: conversationByOtherUserId.get(String(user.id)) || null,
        jobGroupId: groupMeta?.groupId || null,
        jobGroupName: groupMeta?.groupName || null,
        jobId: groupMeta?.jobId || null,
        groupStatus: groupMeta?.groupStatus || "active",
        poolId: groupMeta?.poolId || null,
        poolName: groupMeta?.poolName || null,
        match: null,
      };
    }

    // ── Build jobGroups from CandidateGroups ──────────────────────────────────
    const seenFlat = new Set();
    const candidatesFlat = [];

    const jobGroups = candidateGroups.map((group) => {
      const candidates = [];

      for (const member of group.members) {
        const rc = member.recruiterCandidate;
        if (!rc?.candidateUserId) continue;

        const user = candidateUserById.get(String(rc.candidateUserId));
        if (!user?.id) continue;

        const candidatePayload = buildCandidatePayload(user, rc, {
          groupId: group.id,
          groupName: group.name,
          jobId: group.jobId || null,
          groupStatus: group.status || "active",
        });

        candidates.push(candidatePayload);

        if (!seenFlat.has(String(user.id))) {
          seenFlat.add(String(user.id));
          candidatesFlat.push(candidatePayload);
        }
      }

      return {
        id: group.id,
        categoryId: null,
        name: group.name,
        status: group.status || "active",
        jobId: group.jobId || null,
        candidateCount: candidates.length,
        candidates,
      };
    });

    // ── Build talentPoolGroups ────────────────────────────────────────────────
    const talentPoolGroups = talentPools.map((pool) => {
      const members = [];

      for (const entry of pool.entries) {
        if (!entry.candidateUserId) continue;

        const user = candidateUserById.get(String(entry.candidateUserId));
        if (!user?.id) continue;

        const memberPayload = buildCandidatePayload(user, null, {
          poolId: pool.id,
          poolName: pool.name,
          groupStatus: "active",
        });

        members.push(memberPayload);
      }

      return {
        id: pool.id,
        name: pool.name,
        purpose: pool.purpose || null,
        memberCount: members.length,
        members,
      };
    });

    // ── Apply search filters ──────────────────────────────────────────────────
    const filteredJobGroups = jobGroups
      .map((group) => ({
        ...group,
        candidates: group.candidates.filter((candidate) =>
          matchesFilters(candidate, req.query)
        ),
      }))
      .filter((group) => group.candidates.length > 0);

    const filteredCandidatesFlat = candidatesFlat.filter((candidate) =>
      matchesFilters(candidate, req.query)
    );

    const filteredTalentPoolGroups = talentPools.length
      ? talentPoolGroups.map((pool) => ({
          ...pool,
          members: pool.members.filter((m) => matchesFilters(m, req.query)),
        }))
      : [];

    return res.status(200).json(
      jsonSafe({
        candidates: filteredCandidatesFlat,
        candidatesFlat: filteredCandidatesFlat,
        jobGroups: filteredJobGroups,
        talentPoolGroups: filteredTalentPoolGroups,
      })
    );
  } catch (err) {
    console.error("[api/recruiter/candidates] error:", err);
    return res.status(500).json(
      jsonSafe({
        error: "Unexpected error while loading recruiter candidates.",
        detail: err?.message || null,
        code: err?.code || null,
        meta: err?.meta || null,
      })
    );
  }
}