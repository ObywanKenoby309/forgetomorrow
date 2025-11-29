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
    // ["Leadership", "Azure", "React"]
    return skillsJson
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean)
      .join(", ");
  }
  // If someone stored an object or weird shape, just stringify safely
  try {
    return JSON.stringify(skillsJson);
  } catch {
    return null;
  }
}

function flattenLanguages(languagesJson) {
  if (!languagesJson) return null;
  if (Array.isArray(languagesJson)) {
    // [{ name: "English", level: "Native" }]
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

  // content is stored as "JSON/string from builder"
  // We'll try JSON first, then fall back to plain text.
  const raw = resume.content;

  try {
    const parsed = JSON.parse(raw);
    // If your builder saves a field like "summary" at the root:
    if (parsed && typeof parsed.summary === "string") {
      return parsed.summary.trim();
    }
    // If it uses a nested shape (e.g. { basics: { summary: "..." } })
    if (parsed.basics && typeof parsed.basics.summary === "string") {
      return parsed.basics.summary.trim();
    }
  } catch {
    // Not JSON, treat as plain text
    if (typeof raw === "string" && raw.trim().length > 0) {
      // You could attempt to slice a portion, but for now we keep it simple.
      return raw.trim().slice(0, 1000);
    }
  }

  return null;
}

async function main() {
  console.log("🔍 Seeding Candidate records from User profiles...");

  // Pull all SEEKER users (not deleted)
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

    // Profile-first summary, then fallback to primary resume
    let summary = (user.aboutMe || "").trim() || null;
    if (!summary) {
      summary = await getPrimaryResumeSummary(user.id);
    }

    // Use headline/status as a rough role/title when we don't have more structured data yet
    const role = headline || user.status || null;
    const title = role;
    const currentTitle = role;

    // Check if a Candidate already exists for this user
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
          source: "Forge", // initial source
          pipelineStage: "new",
          match: null,
          lastSeen: new Date(),
        },
      });
      created += 1;
    }
  }

  console.log(
    `✅ Candidate seeding complete. Created: ${created}, Updated: ${updated}`
  );
}

// Top-level await is allowed in ES modules
try {
  await main();
} catch (err) {
  console.error("❌ Error seeding candidates:", err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
