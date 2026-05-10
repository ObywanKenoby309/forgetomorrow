// lib/intelligence/forgeSearchEngine.js
// ForgeTomorrow Search Engine
// Central signal-ranking engine for recruiter search, public profile search,
// automation feeds, and future job/candidate matching.
//
// Purpose:
// Boolean search is allowed as an input style, but it is NOT the intelligence.
// This engine ranks candidates by profile + resume + preference signals.

function safe(value) {
  return String(value || "").trim();
}

function lower(value) {
  return safe(value).toLowerCase();
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => safe(v)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,|]/g)
      .map((v) => safe(v))
      .filter(Boolean);
  }
  return [];
}

function unique(values) {
  const out = [];
  const seen = new Set();

  for (const value of Array.isArray(values) ? values : []) {
    const text = safe(value);
    if (!text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(text);
  }

  return out;
}

const TERM_ALIASES = {
  "desktop technician": [
    "desktop support",
    "desktop tech",
    "it support",
    "technical support",
    "help desk",
    "service desk",
    "endpoint support",
  ],
  "software engineer": [
    "software developer",
    "full stack developer",
    "backend developer",
    "frontend developer",
    "web developer",
  ],
  "customer success": [
    "client success",
    "account management",
    "customer support",
    "customer experience",
  ],
  "project manager": [
    "program manager",
    "delivery manager",
    "technical project manager",
    "implementation manager",
  ],
};

function includesAny(text, terms) {
  const haystack = lower(text);
  if (!haystack) return false;

  return toArray(terms).some((term) => {
    const needle = lower(term);
    return needle && haystack.includes(needle);
  });
}

function expandTerms(terms) {
  const expanded = new Set();

  for (const raw of toArray(terms)) {
    const original = safe(raw);
    const term = lower(original);
    if (!term) continue;

    expanded.add(original);

    const aliases = TERM_ALIASES[term];
    if (Array.isArray(aliases)) {
      for (const alias of aliases) {
        expanded.add(alias);
      }
    }
  }

  return Array.from(expanded);
}

function countMatches(text, terms) {
  const haystack = lower(text);
  if (!haystack) return 0;

  return toArray(terms).filter((term) => {
    const needle = lower(term);
    return needle && haystack.includes(needle);
  }).length;
}

function normalizeWorkType(value) {
  const v = lower(value);
  if (!v) return "";

  if (["remote-only", "remote only", "remote"].includes(v)) return "remote";
  if (["hybrid"].includes(v)) return "hybrid";
  if (["on-site", "onsite", "on site"].includes(v)) return "on-site";
  if (["full time", "full-time"].includes(v)) return "full-time";
  if (["part time", "part-time"].includes(v)) return "part-time";

  return v;
}

function normalizeRelocate(value) {
  if (typeof value === "boolean") return value ? "yes" : "no";

  const v = lower(value);
  if (!v) return "";

  if (["yes", "true", "y", "open"].includes(v)) return "yes";
  if (["no", "false", "n"].includes(v)) return "no";
  if (["maybe", "possible"].includes(v)) return "maybe";

  return v;
}

function normalizeCandidate(candidate) {
  const c = candidate || {};

  const profileSkills = toArray(c.skillsProfile || c.profileSkills || c.skills);
  const resumeSkills = toArray(c.skillsResume || c.resumeSkills);
  const recruiterSkills = toArray(c.skillsRecruiter || c.recruiterSkills);

  const skills = unique([
    ...profileSkills,
    ...resumeSkills,
    ...recruiterSkills,
    ...toArray(c.skills),
  ]);

  const education = unique(
    toArray(c.education).flatMap((edu) => {
      if (typeof edu === "string") return [edu];
      if (!edu || typeof edu !== "object") return [];

      return [
        edu.degree,
        edu.field,
        edu.school,
        edu.institution,
        edu.endYear,
      ];
    })
  );

  const experience = Array.isArray(c.experience) ? c.experience : [];

  const experienceText = experience
    .map((exp) => {
      const highlights = Array.isArray(exp.highlights)
        ? exp.highlights.join(" ")
        : "";

      return [
        exp.title,
        exp.company,
        exp.range,
        highlights,
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join(" ");

  const workPreferences =
    c.workPreferences && typeof c.workPreferences === "object"
      ? c.workPreferences
      : {};

  const preferredLocations = unique([
    ...toArray(c.preferredLocations),
    ...toArray(workPreferences.locations),
    ...toArray(workPreferences.preferredLocations),
    c.location,
  ]);

  return {
    raw: c,
    id: c.id || c.userId || "",
    name: safe(c.name),
    headline: safe(c.title || c.currentTitle || c.role || c.headline),
    summary: safe(c.summary || c.aboutMe),
    location: safe(c.location),
    preferredLocations,
    workStatus: safe(c.workStatus || workPreferences.workStatus),
    preferredWorkType: safe(c.preferredWorkType || workPreferences.workType),
    willingToRelocate:
      c.willingToRelocate ?? workPreferences.willingToRelocate ?? "",
    skills,
    education,
    languages: unique(toArray(c.languages)),
    experience,
    experienceText,
    resumeId: c.resumeId || null,
  };
}

function buildIntent(filters = {}) {
  const q = safe(filters.q);
  const bool = safe(filters.bool);
  const summaryKeywords = safe(filters.summaryKeywords);
  const jobTitle = safe(filters.jobTitle);
  const location = safe(filters.location);
  const workStatus = safe(filters.workStatus);
  const preferredWorkType = safe(filters.preferredWorkType);
  const relocate = safe(filters.relocate || filters.willingToRelocate);
  const skills = toArray(filters.skills);
  const languages = toArray(filters.languages);
  const education = toArray(filters.education);

  const roleTerms = expandTerms(unique([q, jobTitle].filter(Boolean)));
  const keywordTerms = expandTerms(unique([q, bool, summaryKeywords].filter(Boolean)));
  const skillTerms = unique(skills);
  const educationTerms = unique(education);
  const languageTerms = unique(languages);

  return {
    q,
    bool,
    summaryKeywords,
    jobTitle,
    location,
    workStatus,
    preferredWorkType,
    relocate,
    roleTerms,
    keywordTerms,
    skillTerms,
    educationTerms,
    languageTerms,
    hasIntent: Boolean(
      q ||
        bool ||
        summaryKeywords ||
        jobTitle ||
        location ||
        workStatus ||
        preferredWorkType ||
        relocate ||
        skillTerms.length ||
        educationTerms.length ||
        languageTerms.length
    ),
  };
}

function scoreCandidate(candidate, filters = {}) {
  const c = normalizeCandidate(candidate);
  const intent = buildIntent(filters);

  let score = 0;
  const reasons = [];
  const evidence = [];
  const gaps = [];

  const searchableText = [
    c.name,
    c.headline,
    c.summary,
    c.location,
    c.skills.join(" "),
    c.education.join(" "),
    c.languages.join(" "),
    c.experienceText,
  ]
    .filter(Boolean)
    .join(" ");

  // Role / title alignment
  if (intent.jobTitle || intent.q) {
    const roleHits =
      countMatches(c.headline, intent.roleTerms) +
      countMatches(c.experienceText, intent.roleTerms);

    if (roleHits > 0) {
      const points = Math.min(25, 10 + roleHits * 5);
      score += points;
      reasons.push("Role/title signal aligns with recruiter intent.");
      evidence.push({
        type: "role",
        label: "Role alignment",
        text: c.headline || "Role evidence found in profile or resume history.",
        points,
      });
    } else if (intent.jobTitle) {
      gaps.push(`No direct title signal for "${intent.jobTitle}".`);
    }
  }

  // Keyword / boolean-style alignment
  if (intent.keywordTerms.length) {
    const keywordHits = countMatches(searchableText, intent.keywordTerms);

    if (keywordHits > 0) {
      const points = Math.min(20, keywordHits * 5);
      score += points;
      reasons.push("Profile or resume contains search-intent language.");
      evidence.push({
        type: "keyword",
        label: "Search language",
        text: `${keywordHits} search-intent signal${keywordHits === 1 ? "" : "s"} found.`,
        points,
      });
    }
  }

  // Skills alignment
  if (intent.skillTerms.length) {
    const candidateSkillLower = c.skills.map((s) => lower(s));
    const matchedSkills = intent.skillTerms.filter((skill) =>
      candidateSkillLower.includes(lower(skill))
    );

    const adjacentSkills = intent.skillTerms.filter((skill) => {
      const skillLower = lower(skill);
      return (
        !candidateSkillLower.includes(skillLower) &&
        c.skills.some((candidateSkill) =>
          lower(candidateSkill).includes(skillLower) ||
          skillLower.includes(lower(candidateSkill))
        )
      );
    });

    if (matchedSkills.length) {
      const points = Math.min(30, matchedSkills.length * 8);
      score += points;
      reasons.push("Direct skill overlap found.");
      evidence.push({
        type: "skills",
        label: "Matched skills",
        text: matchedSkills.join(", "),
        points,
      });
    }

    if (adjacentSkills.length) {
      const points = Math.min(12, adjacentSkills.length * 4);
      score += points;
      reasons.push("Adjacent skill signal found.");
      evidence.push({
        type: "adjacentSkills",
        label: "Adjacent skills",
        text: adjacentSkills.join(", "),
        points,
      });
    }

    const missingSkills = intent.skillTerms.filter(
      (skill) =>
        !matchedSkills.map(lower).includes(lower(skill)) &&
        !adjacentSkills.map(lower).includes(lower(skill))
    );

    if (missingSkills.length) {
      gaps.push(`Missing direct skill signal: ${missingSkills.join(", ")}.`);
    }
  }

  // Education alignment
  if (intent.educationTerms.length) {
    const educationText = c.education.join(" ");

    if (includesAny(educationText, intent.educationTerms)) {
      const points = 12;
      score += points;
      reasons.push("Education signal aligns with recruiter filter.");
      evidence.push({
        type: "education",
        label: "Education alignment",
        text: c.education.join(", "),
        points,
      });
    } else {
      gaps.push(`No visible education match for: ${intent.educationTerms.join(", ")}.`);
    }
  }

  // Language alignment
  if (intent.languageTerms.length) {
    const candidateLanguages = c.languages.map(lower);
    const matchedLanguages = intent.languageTerms.filter((lang) =>
      candidateLanguages.includes(lower(lang))
    );

    if (matchedLanguages.length) {
      const points = Math.min(10, matchedLanguages.length * 5);
      score += points;
      reasons.push("Language requirement aligns.");
      evidence.push({
        type: "languages",
        label: "Language alignment",
        text: matchedLanguages.join(", "),
        points,
      });
    } else {
      gaps.push(`No visible language match for: ${intent.languageTerms.join(", ")}.`);
    }
  }

  // Location alignment
  if (intent.location) {
    const locationText = [
      c.location,
      c.preferredLocations.join(" "),
    ].join(" ");

    if (includesAny(locationText, [intent.location])) {
      const points = 10;
      score += points;
      reasons.push("Location or preferred location aligns.");
      evidence.push({
        type: "location",
        label: "Location fit",
        text: c.preferredLocations.join(", ") || c.location,
        points,
      });
    } else {
      gaps.push(`No visible location match for "${intent.location}".`);
    }
  }

  // Work type alignment
  if (intent.preferredWorkType) {
    const candidateType = normalizeWorkType(c.preferredWorkType);
    const targetType = normalizeWorkType(intent.preferredWorkType);

    if (candidateType && candidateType === targetType) {
      const points = 8;
      score += points;
      reasons.push("Preferred work type aligns.");
      evidence.push({
        type: "workType",
        label: "Work type fit",
        text: c.preferredWorkType,
        points,
      });
    } else {
      gaps.push(`Preferred work type does not clearly match "${intent.preferredWorkType}".`);
    }
  }

  // Relocation alignment
  if (intent.relocate) {
    const candidateRelocate = normalizeRelocate(c.willingToRelocate);
    const targetRelocate = normalizeRelocate(intent.relocate);

    if (candidateRelocate && candidateRelocate === targetRelocate) {
      const points = 6;
      score += points;
      reasons.push("Relocation preference aligns.");
      evidence.push({
        type: "relocation",
        label: "Relocation fit",
        text: String(c.willingToRelocate),
        points,
      });
    }
  }

  // Profile completeness confidence
  if (c.summary) score += 4;
  if (c.resumeId) score += 4;
  if (c.skills.length >= 5) score += 4;
  if (c.experience.length >= 1) score += 4;

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    candidate: candidate || {},
    score: finalScore,
    reasons,
    evidence,
    gaps,
    matched: finalScore > 0 || !intent.hasIntent,
    signalTier:
      finalScore >= 80
        ? "Strong Match"
        : finalScore >= 60
        ? "Good Match"
        : finalScore >= 40
        ? "Adjacent Match"
        : finalScore > 0
        ? "Weak Signal"
        : "No Signal",
  };
}

export function rankCandidates(candidates = [], filters = {}, options = {}) {
  const minScore =
    typeof options.minScore === "number"
      ? options.minScore
      : buildIntent(filters).hasIntent
      ? 1
      : 0;

  const ranked = (Array.isArray(candidates) ? candidates : [])
    .map((candidate) => scoreCandidate(candidate, filters))
    .filter((result) => result.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return ranked.map((result) => ({
    ...result.candidate,
    match: result.score,
    matchTier: result.signalTier,
    matchReasons: result.reasons,
    matchEvidence: result.evidence,
    matchGaps: result.gaps,
  }));
}

export function explainCandidate(candidate = {}, filters = {}) {
  const result = scoreCandidate(candidate, filters);

  return {
    score: result.score,
    tier: result.signalTier,
    summary:
      result.reasons.length > 0
        ? result.reasons[0]
        : "No strong signal was detected for the current recruiter search.",
    reasons: result.evidence.map((item) => ({
      requirement: item.label,
      evidence: [
        {
          text: item.text,
          source: item.type,
        },
      ],
      points: item.points,
    })),
    gaps: result.gaps,
  };
}

export const orderCandidatesBySignalRelevance = rankCandidates;

export default {
  rankCandidates,
  orderCandidatesBySignalRelevance,
  explainCandidate,
};