// pages/api/recruiter/candidates.js
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
  const sessionEmail = String(session?.user?.email || "")
    .trim()
    .toLowerCase();

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
    const skillTerms = skills
      .split(/[,|]/g)
      .map((x) => x.trim())
      .filter(Boolean);
    const skillBlob = (candidate.skills || []).join(" ");
    if (skillTerms.length && !skillTerms.some((term) => includesText(skillBlob, term))) {
      return false;
    }
  }

  if (languages) {
    const languageTerms = languages
      .split(/[,|]/g)
      .map((x) => x.trim())
      .filter(Boolean);
    const langBlob = (candidate.languages || []).join(" ");
    if (languageTerms.length && !languageTerms.some((term) => includesText(langBlob, term))) {
      return false;
    }
  }

  if (education) {
    const eduTerms = education
      .split(/[,|]/g)
      .map((x) => x.trim())
      .filter(Boolean);
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
    const recruiterOrgMember = await prisma.organizationMember.findFirst({
      where: {
        accountKey,
        userId: recruiterUserId,
      },
      select: { id: true },
    });

    if (!recruiterOrgMember?.id) {
      return res.status(403).json({ error: "Recruiter is not part of this organization" });
    }

    const parentCategory = await prisma.contactCategory.findFirst({
      where: {
        userId: recruiterUserId,
        accountKey,
        name: "Candidates",
        parentCategoryId: null,
      },
      select: { id: true, name: true },
    });

    if (!parentCategory?.id) {
      return res.status(200).json(
        jsonSafe({
          candidates: [],
          candidatesFlat: [],
          jobGroups: [],
        })
      );
    }

    const recruiterConversations = await prisma.conversationParticipant.findMany({
      where: {
        userId: recruiterUserId,
        conversation: {
          channel: "recruiter",
        },
      },
      include: {
        conversation: {
          include: {
            participants: {
              select: {
                userId: true,
              },
            },
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

    const childCategories = await prisma.contactCategory.findMany({
      where: {
        userId: recruiterUserId,
        accountKey,
        parentCategoryId: parentCategory.id,
      },
      select: {
        id: true,
        name: true,
        parentCategoryId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const categoryNames = childCategories.map((c) => c.name).filter(Boolean);

    const candidateGroups = categoryNames.length
      ? await prisma.candidateGroup.findMany({
          where: {
            accountKey,
            name: { in: categoryNames },
          },
          select: {
            id: true,
            name: true,
            status: true,
            jobId: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : [];

    const candidateGroupByName = new Map(
      candidateGroups.map((g) => [String(g.name), g])
    );

    const eligibleCategories = childCategories.filter((cat) => {
      const group = candidateGroupByName.get(String(cat.name));
      if (!group) return includeArchived;
      return includeArchived ? true : String(group.status || "active") === "active";
    });

    if (!eligibleCategories.length) {
      return res.status(200).json(
        jsonSafe({
          candidates: [],
          candidatesFlat: [],
          jobGroups: [],
        })
      );
    }

    const assignments = await prisma.contactCategoryAssignment.findMany({
      where: {
        userId: recruiterUserId,
        categoryId: {
          in: eligibleCategories.map((c) => c.id),
        },
      },
      select: {
        id: true,
        categoryId: true,
        contactId: true,
      },
    });

    const contactIds = [...new Set(assignments.map((a) => a.contactId).filter(Boolean))];

    const contacts = contactIds.length
      ? await prisma.contact.findMany({
          where: {
            id: { in: contactIds },
            userId: recruiterUserId,
          },
          select: {
            id: true,
            contactUserId: true,
          },
        })
      : [];

    const contactById = new Map(contacts.map((c) => [String(c.id), c]));

    const candidateUserIds = [
      ...new Set(
        contacts.map((c) => String(c.contactUserId || "")).filter(Boolean)
      ),
    ];

    const candidateUsers = candidateUserIds.length
      ? await prisma.user.findMany({
          where: {
            id: { in: candidateUserIds },
          },
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
            role: true,
          },
        })
      : [];

    const candidateUserById = new Map(candidateUsers.map((u) => [String(u.id), u]));

    const recruiterCandidates = candidateUserIds.length
      ? await prisma.recruiterCandidate.findMany({
          where: {
            recruiterUserId,
            accountKey,
            candidateUserId: { in: candidateUserIds },
          },
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
        })
      : [];

    const recruiterCandidateByUserId = new Map(
      recruiterCandidates.map((rc) => [String(rc.candidateUserId), rc])
    );

    const categoriesById = new Map(eligibleCategories.map((c) => [String(c.id), c]));

    const seenFlat = new Set();
    const candidatesFlat = [];
    const jobGroups = eligibleCategories.map((category) => {
      const groupMeta = candidateGroupByName.get(String(category.name)) || null;
      const members = assignments.filter(
        (a) => String(a.categoryId || "") === String(category.id)
      );

      const candidates = [];

      for (const assignment of members) {
        const contact = contactById.get(String(assignment.contactId || ""));
        if (!contact?.contactUserId) continue;

        const user = candidateUserById.get(String(contact.contactUserId));
        if (!user?.id) continue;

        const rc = recruiterCandidateByUserId.get(String(user.id)) || null;
        const displayName =
          user.name ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.email ||
          "Candidate";

        const location =
          user.location ||
          [user.city, user.region].filter(Boolean).join(", ") ||
          "";

        const candidatePayload = {
          id: String(user.id),
          userId: String(user.id),
          contactId: String(contact.id),
          recruiterCandidateId: rc?.id || null,
          name: displayName,
          email: user.email || null,
          title: user.title || user.headline || "",
          currentTitle: user.title || "",
          headline: user.headline || "",
          summary: user.summary || "",
          role: user.role || "",
          avatarUrl: user.avatarUrl || null,
          location,
          preferredLocation: location,
          skills: Array.isArray(rc?.skills) ? rc.skills : [],
          languages: [],
          education: [],
          tags: rc?.tags || [],
          notes: rc?.notes || "",
          pipelineStage: rc?.pipelineStage || null,
          lastContacted: rc?.lastContacted || null,
          lastSeen: rc?.lastSeen || null,
          conversationId:
            conversationByOtherUserId.get(String(user.id)) || null,
          jobGroupId: groupMeta?.id || null,
          jobGroupName: category.name,
          jobId: groupMeta?.jobId || null,
          groupStatus: groupMeta?.status || "active",
          match: null,
        };

        candidates.push(candidatePayload);

        if (!seenFlat.has(String(user.id))) {
          seenFlat.add(String(user.id));
          candidatesFlat.push(candidatePayload);
        }
      }

      return {
        id: groupMeta?.id || `category-${category.id}`,
        categoryId: category.id,
        name: category.name,
        status: groupMeta?.status || "active",
        jobId: groupMeta?.jobId || null,
        candidateCount: candidates.length,
        candidates,
      };
    });

    const filteredJobGroups = jobGroups
      .map((group) => ({
        ...group,
        candidates: group.candidates.filter((candidate) =>
          matchesFilters(candidate, req.query)
        ),
      }))
      .filter((group) => group.candidates.length > 0 || !Object.keys(req.query || {}).length);

    const filteredCandidatesFlat = candidatesFlat.filter((candidate) =>
      matchesFilters(candidate, req.query)
    );

    return res.status(200).json(
      jsonSafe({
        candidates: filteredCandidatesFlat,
        candidatesFlat: filteredCandidatesFlat,
        jobGroups: filteredJobGroups,
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