// scripts/seedCandidates.js
// Seed Candidate records from User profiles (profile-first, resume fallback)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function buildDisplayName(user) {
  if (user.name && user.name.trim().length > 0) return user.name.trim();

  const parts = [];
  if (user.firstName) parts.push(user.firstName.trim());
  if (user.lastName) parts.push(user.lastName.trim());
  if (parts.length > 0) return parts.join(" ");

  return "Anonymous Seeker";
}

function extractWorkPrefs(workPreferences) {
  if (!workPreferences || typeof workPreferences !== "object") {
    return {
      workStatus: null,
      preferredWorkType: null,
      willingToRelocate: null,
    };
  }

  // Based on the comment in schema:
  // // { workType, locations[], startDate, relocate, workStatus }
  const workStatus = workPreferences.workStatus || null;
  const preferredWorkType = workPreferences.workType || null;
  const willingToRelocate = workPreferences.relocate || null;

  return { workStatus, preferredWorkType, willingToRelocate };
}

function flattenSkills(skillsJson) {
  if (!skillsJson) return null;
  if (Array.isArray(skillsJson)) {
    return skillsJson
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean)
      .join(", ");
  }
  try {
    return JSON.stringify(skillsJson);
  } catch {
    return null;
  }
}

function flattenLanguages(languagesJson) {
  if (!languagesJson) return null;
  if (Array.isArray(languagesJson)) {
    const names = languagesJson
      .map((l) => {
        if (!l) return "";
        if (typeof l === "string") return l.trim();
        if (typeof l === "object" && l.name) return String(l.name).trim();
        return "";
      })
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }
  try {
    return JSON.stringify(languagesJson);
  } catch {
    return null;
  }
}

async function getPrimaryResumeSummary(userId) {
  const resume = await prisma.resume.findFirst({
    where: {
      userId,
      isPrimary: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!resume || !resume.content) return null;

  const raw = resume.content;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.summary === "string") {
      return parsed.summary.trim();
    }
    if (parsed.basics && typeof parsed.basics.summary === "string") {
      return parsed.basics.summary.trim();
    }
  } catch {
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim().slice(0, 1000);
    }
  }

  return null;
}

async function main() {
  console.log("🔍 Seeding Candidate records from User profiles...");

  const seekers = await prisma.user.findMany({
    where: {
      role: "SEEKER",
      deletedAt: null,
    },
  });

  console.log(`Found ${seekers.length} seeker accounts.`);

  let created = 0;
  let updated = 0;

  for (const user of seekers) {
    const name = buildDisplayName(user);
    const email = user.email || null;
    const headline = user.headline || null;
    const location = user.location || null;

    const { workStatus, preferredWorkType, willingToRelocate } =
      extractWorkPrefs(user.workPreferences);

    const skills = flattenSkills(user.skillsJson);
    const languages = flattenLanguages(user.languagesJson);

    let summary = (user.aboutMe || "").trim() || null;
    if (!summary) {
      summary = await getPrimaryResumeSummary(user.id);
    }

    const role = headline || user.status || null;
    const title = role;
    const currentTitle = role;

    const existing = await prisma.candidate.findFirst({
      where: { userId: user.id },
    });

    if (existing) {
      await prisma.candidate.update({
        where: { id: existing.id },
        data: {
          name,
          email,
          headline,
          summary,
          location,
          role,
          title,
          currentTitle,
          workStatus,
          preferredWorkType,
          willingToRelocate,
          skills,
          languages,
          lastSeen: new Date(),
        },
      });
      updated += 1;
    } else {
      await prisma.candidate.create({
        data: {
          userId: user.id,
          name,
          email,
          headline,
          summary,
          location,
          role,
          title,
          currentTitle,
          workStatus,
          preferredWorkType,
          willingToRelocate,
          skills,
          languages,
          source: "Forge",
          pipelineStage: "new",
          match: null,
          lastSeen: new Date(),
        },
      });
      created += 1;
    }
  }

  console.log(`✅ Candidate seeding complete. Created: ${created}, Updated: ${updated}`);
}

main()
  .catch((err) => {
    console.error("❌ Error seeding candidates:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error("⚠️ prisma.$disconnect() failed:", e);
    }
  });