// pages/api/recruiter/candidates/[id].js
// Load one recruiter candidate from Prisma (main DB) — LIVE from User table
// + recruiter-specific metadata from RecruiterCandidate
// + best resume-derived experience/skills
// ✅ Impersonation-aware: resolves effective recruiter via ft_imp cookie (Platform Admin only)

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import jwt from "jsonwebtoken";

function toStringArray(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
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

function toArrayJson(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
}

function dedupeCaseInsensitive(arr) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(arr) ? arr : []) {
    const t = String(raw || "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

async function resolveEffectiveRecruiter(prismaClient, req, session) {
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
        // ignore invalid/expired cookie
      }
    }
  }

  if (effectiveUserId) {
    const u = await prismaClient.user.findUnique({
      where: { id: effectiveUserId },
      select: { id: true, email: true, accountKey: true },
    });
    return u?.id ? u : null;
  }

  const u = await prismaClient.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, email: true, accountKey: true },
  });
  return u?.id ? u : null;
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function extractExperienceFromResumeContent(contentStr) {
  const parsed = typeof contentStr === "string" ? safeJsonParse(contentStr) : null;
  if (!parsed || typeof parsed !== "object") return [];

  const root = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;

  const list =
    (Array.isArray(root.workExperiences) && root.workExperiences) ||
    (Array.isArray(root.experiences) && root.experiences) ||
    (Array.isArray(root.experience) && root.experience) ||
    [];

  if (!Array.isArray(list)) return [];

  return list
    .map((exp) => {
      const title = exp?.title || exp?.jobTitle || exp?.role || "";
      const company = exp?.company || "";
      const start = exp?.startDate || exp?.start || "";
      const end = exp?.endDate || exp?.end || "";
      const range = [start, end].filter(Boolean).join(" - ") || exp?.range || "";

      const highlightsRaw =
        exp?.highlights ||
        exp?.bullets ||
        exp?.description ||
        exp?.details ||
        [];

      let highlights = [];
      if (Array.isArray(highlightsRaw)) {
        highlights = highlightsRaw.map((x) => String(x || "").trim()).filter(Boolean);
      } else if (typeof highlightsRaw === "string") {
        const s = highlightsRaw.trim();
        highlights = s
          ? s.split("\n").map((x) => String(x || "").trim()).filter(Boolean)
          : [];
      }

      return {
        title: String(title || "").trim(),
        company: String(company || "").trim(),
        range: String(range || "").trim(),
        highlights,
      };
    })
    .filter((e) => e.title || e.company || e.range || (e.highlights && e.highlights.length));
}

function extractSkillsFromResumeContent(contentStr) {
  const parsed = typeof contentStr === "string" ? safeJsonParse(contentStr) : null;
  if (!parsed || typeof parsed !== "object") return [];

  const root = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
  const skills = Array.isArray(root.skills) ? root.skills : [];
  return dedupeCaseInsensitive(skills.map((s) => String(s || "").trim()).filter(Boolean));
}

function toEducationObjects(v) {
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (!x || typeof x !== "object") return null;
        return {
          id: x.id ? String(x.id) : null,
          school: x.school ? String(x.school) : "",
          degree: x.degree ? String(x.degree) : "",
          field: x.field ? String(x.field) : "",
          startYear: x.startYear ? String(x.startYear) : "",
          endYear: x.endYear ? String(x.endYear) : "",
        };
      })
      .filter(Boolean);
  }

  if (typeof v === "string") {
    const parsed = safeJsonParse(v);
    if (Array.isArray(parsed)) return toEducationObjects(parsed);
  }

  return [];
}

function getWorkPreferencesObject(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) return v;
  return {};
}

function getPreferredLocationsFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);

  const raw =
    prefs.preferredLocations ??
    prefs.locations ??
    prefs.locationPreferences ??
    prefs.preferredLocation ??
    prefs.location ??
    [];

  if (Array.isArray(raw)) {
    return dedupeCaseInsensitive(
      raw.map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object") {
          return x.label || x.name || x.value || x.location || "";
        }
        return "";
      })
    );
  }

  if (typeof raw === "string") {
    return dedupeCaseInsensitive(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  return [];
}

function getWorkStatusFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.workStatus || prefs.currentWorkStatus || prefs.status || "";
}

function getPreferredWorkTypeFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.preferredWorkType || prefs.workType || prefs.employmentType || "";
}

function getRelocateFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.willingToRelocate ?? prefs.relocate ?? prefs.relocation ?? "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[recruiter/candidates/[id]] session error:", err);
  }

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const recruiter = await resolveEffectiveRecruiter(prisma, req, session);
  if (!recruiter?.id) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!recruiter.accountKey) {
    return res.status(404).json({ error: "accountKey not found" });
  }

  const recruiterUserId = recruiter.id;
  const recruiterAccountKey = recruiter.accountKey;
  const candidateId = String(req.query?.id || "").trim();

  if (!candidateId) {
    return res.status(400).json({ error: "Candidate id is required." });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: candidateId,
        deletedAt: null,
        OR: [
          { profileVisibility: { in: ["PUBLIC", "RECRUITERS_ONLY"] } },
          {
            AND: [
              { isProfilePublic: true },
              { profileVisibility: { not: "PRIVATE" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        headline: true,
        aboutMe: true,
        location: true,
        workPreferences: true,
        skillsJson: true,
        languagesJson: true,
        educationJson: true,
        createdAt: true,
        slug: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    const meta = await prisma.recruiterCandidate.findFirst({
      where: {
        recruiterUserId,
        accountKey: recruiterAccountKey,
        candidateUserId: candidateId,
      },
      select: {
        candidateUserId: true,
        tags: true,
        skills: true,
        notes: true,
        pipelineStage: true,
        lastContacted: true,
        lastSeen: true,
      },
    });

    const resumes = await prisma.resume.findMany({
      where: { userId: candidateId },
      select: { id: true, userId: true, content: true, updatedAt: true, isPrimary: true },
      orderBy: { updatedAt: "desc" },
    });

    let bestResume = null;
    for (const r of resumes) {
      if (!bestResume) {
        bestResume = r;
        continue;
      }
      if (!bestResume.isPrimary && r.isPrimary) {
        bestResume = r;
        continue;
      }
      const a = bestResume?.updatedAt ? new Date(bestResume.updatedAt).getTime() : 0;
      const b = r?.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      if (b > a) bestResume = r;
    }

    const profileSkillsArr = dedupeCaseInsensitive(toArrayJson(user.skillsJson));
    const resumeSkillsArr = bestResume?.content
      ? extractSkillsFromResumeContent(bestResume.content)
      : [];
    const baselineSkillsArr = profileSkillsArr.length > 0 ? profileSkillsArr : resumeSkillsArr;

    const recruiterSkillsArr = meta?.skills ? toStringArray(meta.skills) : [];
    const effectiveSkillsArr =
      recruiterSkillsArr.length > 0 ? recruiterSkillsArr : baselineSkillsArr;

    const workPreferencesObj = getWorkPreferencesObject(user.workPreferences);
    const preferredLocations = getPreferredLocationsFromWorkPreferences(workPreferencesObj);
    const resolvedWorkStatus = getWorkStatusFromWorkPreferences(workPreferencesObj);
    const resolvedPreferredWorkType = getPreferredWorkTypeFromWorkPreferences(workPreferencesObj);
    const resolvedRelocate = getRelocateFromWorkPreferences(workPreferencesObj);

    const candidate = {
      id: user.id,
      userId: user.id,
      name: user.name || "Unnamed",
      email: user.email || null,
      title: user.headline || "",
      currentTitle: user.headline || "",
      role: user.headline || "",
      summary: user.aboutMe || "",
      headline: user.headline || "",
      about: user.aboutMe || "",
      location: user.location || "",
      slug: user.slug || "",

      workPreferences: workPreferencesObj,
      preferredLocations,
      workStatus: resolvedWorkStatus || "",
      preferredWorkType: resolvedPreferredWorkType || "",
      willingToRelocate: resolvedRelocate,

      skills: effectiveSkillsArr,
      recruiterSkills: recruiterSkillsArr,
      skillsBaseline: baselineSkillsArr,
      skillsProfile: profileSkillsArr,
      skillsResume: resumeSkillsArr,
      skillsSource:
        recruiterSkillsArr.length > 0
          ? "recruiter"
          : profileSkillsArr.length > 0
          ? "profile"
          : resumeSkillsArr.length > 0
          ? "resume"
          : "none",

      education: toEducationObjects(user.educationJson),
      languages: toArrayJson(user.languagesJson),
      experience: bestResume?.content ? extractExperienceFromResumeContent(bestResume.content) : [],

      tags: meta?.tags ? toStringArray(meta.tags) : [],
      notes: typeof meta?.notes === "string" ? meta.notes : "",
      pipelineStage: meta?.pipelineStage || null,
      lastContacted: meta?.lastContacted || null,
      lastSeen: meta?.lastSeen || null,
      resumeId: bestResume?.id || null,

      activity: [],
      journey: [],
      match: null,
    };

    return res.status(200).json({ candidate });
  } catch (err) {
    console.error("[recruiter/candidates/[id]] query error:", err);
    return res.status(500).json({ error: "Failed to load candidate from the database." });
  }
}
