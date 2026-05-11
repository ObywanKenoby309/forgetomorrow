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

  "customer support manager": [
    "customer support",
    "support manager",
    "technical support manager",
    "client services manager",
    "service delivery manager",
    "customer success",
    "client success",
    "customer operations",
    "support delivery",
  ],

"customer service manager": [
  "customer service",
  "customer support",
  "support manager",
  "customer operations",
  "client services manager",
  "service delivery manager",
  "customer success",
  "client success",
  "escalation management",
  "support delivery",
],

  "project manager": [
    "program manager",
    "delivery manager",
    "technical project manager",
    "implementation manager",
  ],
};

const CAPABILITY_CLUSTERS = {
  desktopSupport: [
    "active directory",
    "sccm",
    "intune",
    "jamf",
    "okta",
    "office 365",
    "microsoft 365",
    "vpn",
    "windows",
    "endpoint",
    "servicenow",
    "meraki",
  ],

  networking: [
    "cisco",
    "meraki",
    "fortinet",
    "palo alto",
    "vpn",
    "tcp/ip",
  ],

  customerSupport: [
    "zendesk",
    "customer support",
    "ticketing",
    "sla",
    "client support",
    "customer operations",
    "client services",
    "service delivery",
    "escalation management",
    "support delivery",
    "technical support",
    "incident management",
    "itil",
    "retention",
    "onboarding",
    "knowledge management",
    "servicenow",
    "salesforce",
    "team leadership",
  ],
  
    cybersecurity: [
    "siem",
    "splunk",
    "sentinel",
    "crowdstrike",
    "defender",
    "edr",
    "soc",
    "incident response",
    "threat hunting",
    "vulnerability management",
    "firewall",
    "iam",
    "okta",
    "mfa",
    "zero trust",
    "phishing",
    "security operations",
  ],

  cloudInfrastructure: [
    "aws",
    "azure",
    "gcp",
    "terraform",
    "kubernetes",
    "docker",
    "linux",
    "windows server",
    "virtualization",
    "vmware",
    "cloud infrastructure",
    "devops",
    "ci/cd",
    "infrastructure as code",
  ],

  softwareEngineering: [
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node.js",
    "python",
    "java",
    "c#",
    ".net",
    "sql",
    "api",
    "full stack",
    "frontend",
    "backend",
    "software architecture",
    "microservices",
    "git",
  ],

  customerSuccess: [
    "customer success",
    "client success",
    "account management",
    "customer onboarding",
    "relationship management",
    "renewals",
    "retention",
    "customer engagement",
    "saas",
    "qbr",
    "stakeholder management",
    "csat",
    "upsell",
    "cross-functional",
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

  const desktopSupportHits =
    CAPABILITY_CLUSTERS.desktopSupport.filter((term) =>
      includesAny(searchableText, [term])
    );

  const networkingHits =
    CAPABILITY_CLUSTERS.networking.filter((term) =>
      includesAny(searchableText, [term])
    );
	
	const cybersecurityHits =
  CAPABILITY_CLUSTERS.cybersecurity.filter((term) =>
    includesAny(searchableText, [term])
  );

const cloudHits =
  CAPABILITY_CLUSTERS.cloudInfrastructure.filter((term) =>
    includesAny(searchableText, [term])
  );

const softwareEngineeringHits =
  CAPABILITY_CLUSTERS.softwareEngineering.filter((term) =>
    includesAny(searchableText, [term])
  );

const customerSuccessHits =
  CAPABILITY_CLUSTERS.customerSuccess.filter((term) =>
    includesAny(searchableText, [term])
  );

const customerSupportHits =
  CAPABILITY_CLUSTERS.customerSupport.filter((term) =>
    includesAny(searchableText, [term])
  );

  // Role / title alignment
  if (intent.jobTitle || intent.q) {
    const roleHits =
      countMatches(c.headline, intent.roleTerms) +
      countMatches(c.experienceText, intent.roleTerms);

    if (roleHits > 0) {
      const exactTitleHit = includesAny(c.headline, intent.roleTerms);

      const points = exactTitleHit
        ? 45
        : Math.min(35, 15 + roleHits * 8);

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
        c.skills.some(
          (candidateSkill) =>
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

  // Capability cluster scoring
  const isDesktopSupportIntent = intent.roleTerms.some((term) =>
    ["desktop support", "desktop technician", "desktop tech","it support", "technical support", "help desk", "service desk", "endpoint support"].includes(lower(term))
  );
	
const isCybersecurityIntent = intent.roleTerms.some((term) =>
  ["cybersecurity", "security analyst", "soc analyst", "incident response", "security engineer"].includes(lower(term))
);

const isCloudIntent = intent.roleTerms.some((term) =>
  ["cloud engineer", "cloud infrastructure", "devops", "systems engineer", "infrastructure engineer"].includes(lower(term))
);

const isSoftwareIntent = intent.roleTerms.some((term) =>
  ["software engineer", "software developer", "full stack developer", "frontend developer", "backend developer", "web developer"].includes(lower(term))
);

const isCustomerSuccessIntent = intent.roleTerms.some((term) =>
  ["customer success", "client success", "customer success manager", "account manager", "customer experience"].includes(lower(term))
);

const isCustomerSupportIntent = intent.roleTerms.some((term) =>
  [
    "customer service",
    "customer service manager",
    "customer support",
    "customer support manager",
    "support manager",
    "technical support manager",
    "client services manager",
    "service delivery manager",
    "technical support",
    "help desk manager",
    "service desk manager",
  ].includes(lower(term))
);

  if (isDesktopSupportIntent && !isCybersecurityIntent && desktopSupportHits.length) {
    const points = Math.min(30, desktopSupportHits.length * 4);

    score += points;

    reasons.push(
      "Desktop support capability ecosystem aligns with recruiter intent."
    );

    evidence.push({
      type: "desktopSupportCluster",
      label: "Desktop support ecosystem",
      text: desktopSupportHits.join(", "),
      points,
    });
  }

  if (networkingHits.length >= 2) {
    const points = 10;

    score += points;

    reasons.push("Networking environment exposure detected.");

    evidence.push({
      type: "networkingCluster",
      label: "Networking ecosystem",
      text: networkingHits.join(", "),
      points,
    });
  }

if (isCybersecurityIntent && cybersecurityHits.length >= 3) {
  const points = Math.min(30, cybersecurityHits.length * 4);

  score += points;

  reasons.push("Cybersecurity ecosystem alignment detected.");

  evidence.push({
    type: "cybersecurityCluster",
    label: "Cybersecurity ecosystem",
    text: cybersecurityHits.join(", "),
    points,
  });
}

if (isCloudIntent && cloudHits.length >= 3) {
  const points = Math.min(25, cloudHits.length * 4);

  score += points;

  reasons.push("Cloud infrastructure ecosystem detected.");

  evidence.push({
    type: "cloudCluster",
    label: "Cloud infrastructure ecosystem",
    text: cloudHits.join(", "),
    points,
  });
}

if (isSoftwareIntent && !isCloudIntent && softwareEngineeringHits.length >= 3) {
  const points = Math.min(25, softwareEngineeringHits.length * 4);

  score += points;

  reasons.push("Software engineering ecosystem detected.");

  evidence.push({
    type: "softwareEngineeringCluster",
    label: "Software engineering ecosystem",
    text: softwareEngineeringHits.join(", "),
    points,
  });
}

if (isCustomerSuccessIntent && !isCustomerSupportIntent && customerSuccessHits.length >= 3) {
  const points = Math.min(20, customerSuccessHits.length * 4);

  score += points;

  reasons.push("Customer success ecosystem detected.");

  evidence.push({
    type: "customerSuccessCluster",
    label: "Customer success ecosystem",
    text: customerSuccessHits.join(", "),
    points,
  });
}

if (isCustomerSupportIntent && customerSupportHits.length >= 3) {
  const points = Math.min(30, customerSupportHits.length * 4);

  score += points;

  reasons.push("Customer support leadership ecosystem detected.");

  evidence.push({
    type: "customerSupportCluster",
    label: "Customer support ecosystem",
    text: customerSupportHits.join(", "),
    points,
  });

  if (score < 55) {
    score = 55;
  }
}

  // Profile completeness confidence
  if (c.summary) score += 3;
  if (c.resumeId) score += 3;
  if (c.skills.length >= 5) score += 5;
  if (c.experience.length >= 1) score += 5;

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
