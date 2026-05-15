// lib/intelligence/forgeJobMatchEngine.js
// ForgeTomorrow Job Match Engine
// Shared seeker-side job search and job automation signal engine.
//
// Purpose:
// Job search should not be simple keyword lookup. This engine converts seeker
// search intent + job evidence into explainable, ranked job signal results.

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

    const key = lower(text);
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(text);
  }

  return out;
}

export function normalizeLocationQuery(value) {
  return safe(value)
    .replace(/\bgreater\b/gi, "")
    .replace(/\barea\b/gi, "")
    .replace(/\bmetro\b/gi, "")
    .replace(/\bregion\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, terms) {
  const haystack = lower(text);
  if (!haystack) return false;

  return toArray(terms).some((term) => {
    const needle = lower(term);
    return needle && haystack.includes(needle);
  });
}

function countMatches(text, terms) {
  const haystack = lower(text);
  if (!haystack) return 0;

  return toArray(terms).filter((term) => {
    const needle = lower(term);
    return needle && haystack.includes(needle);
  }).length;
}

function extractYearsSignals(text) {
  const matches = String(text || "").match(/(\d+)\+?\s*(year|years|yr|yrs)/gi);

  if (!matches) return 0;

  return matches.reduce((sum, match) => {
    const num = parseInt(match, 10);
    return Number.isFinite(num) ? sum + num : sum;
  }, 0);
}

function countEvidenceSignals(text, terms) {
  const haystack = lower(text);

  if (!haystack) return 0;

  return unique(terms).reduce((count, term) => {
    const needle = lower(term);
    if (!needle) return count;

    return haystack.includes(needle) ? count + 1 : count;
  }, 0);
}

function calculateDepthScore({
  matchedSkills = [],
  experienceText = "",
  projectText = "",
  certificationText = "",
  seekerHeadline = "",
}) {
  let score = 0;

  const evidenceText = [
    experienceText,
    projectText,
    certificationText,
    seekerHeadline,
  ]
    .filter(Boolean)
    .join(" ");

  const yearsSignals = extractYearsSignals(evidenceText);

  if (yearsSignals >= 10) score += 12;
  else if (yearsSignals >= 5) score += 8;
  else if (yearsSignals >= 2) score += 4;

  if (matchedSkills.length >= 10) score += 16;
  else if (matchedSkills.length >= 6) score += 12;
  else if (matchedSkills.length >= 3) score += 8;
  else if (matchedSkills.length >= 1) score += 4;

  const leadershipSignals = [
    "director",
    "head",
    "lead",
    "manager",
    "executive",
    "chief",
    "founder",
    "vp",
    "vice president",
    "team leadership",
    "organizational scaling",
  ];

  const leadershipHits = countEvidenceSignals(evidenceText, leadershipSignals);

  score += Math.min(12, leadershipHits * 2);

  return Math.min(30, score);
}

function inferLocationType(location) {
  const text = lower(location);
  if (!text) return "";
  if (text.includes("remote")) return "Remote";
  if (text.includes("hybrid")) return "Hybrid";
  return "On-site";
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

  "customer success manager": [
    "customer success",
    "client success",
    "account management",
    "customer onboarding",
    "renewals",
    "retention",
    "customer engagement",
  ],

  "software engineer": [
    "software developer",
    "full stack developer",
    "backend developer",
    "frontend developer",
    "web developer",
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
    "help desk",
    "service desk",
    "desktop support",
    "technical support",
  ],

  customerSupport: [
    "zendesk",
    "customer service",
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

  executiveLeadership: [
    "founder",
    "chief executive officer",
    "ceo",
    "company strategy",
    "product strategy",
    "business model",
    "go-to-market",
    "fundraising",
    "investor",
    "ip strategy",
    "platform architecture",
    "organizational scaling",
    "p&l",
    "partnerships",
    "roadmap",
    "market positioning",
  ],
};

function expandTerms(terms) {
  const expanded = new Set();

  for (const raw of toArray(terms)) {
    const original = safe(raw);
    const term = lower(original);
    if (!term) continue;

    expanded.add(original);

    const aliases = TERM_ALIASES[term];
    if (Array.isArray(aliases)) {
      for (const alias of aliases) expanded.add(alias);
    }
  }

  return Array.from(expanded);
}

function normalizeJob(job) {
  const j = job || {};

  return {
    raw: j,
    id: j.id || "",
    title: safe(j.title),
    company: safe(j.company),
    location: safe(j.location),
    description: safe(j.description),
    tags: safe(j.tags),
    source: safe(j.source || j.origin),
    salary: safe(j.salary || j.compensation),
    publishedat: j.publishedat || j.publishedAt || j.createdAt || null,
  };
}

function buildIntent(filters = {}) {
  const keyword = safe(filters.keyword || filters.q);
  const role = safe(filters.jobTitle || filters.role || keyword);
  const company = safe(filters.company || filters.companyFilter);
  const location = safe(filters.location || filters.locationFilter);
  const locationType = safe(filters.locationType || filters.locationTypeFilter);
  const source = safe(filters.source || filters.sourceFilter);
  const skills = toArray(filters.skills);

  const roleTerms = expandTerms(unique([role, keyword].filter(Boolean)));
  const keywordTerms = expandTerms(unique([keyword, ...skills].filter(Boolean)));
  const locationTerms = unique([location, normalizeLocationQuery(location)].filter(Boolean));

  return {
    keyword,
    role,
    company,
    location,
    locationType,
    source,
    skills,
    roleTerms,
    keywordTerms,
    locationTerms,
    hasIntent: Boolean(keyword || company || location || locationType || source || skills.length),
  };
}

function scoreJob(job, filters = {}) {
  const j = normalizeJob(job);
  const intent = buildIntent(filters);

  let score = 0;
  const reasons = [];
  const evidence = [];
  const gaps = [];

  const searchableText = [
    j.title,
    j.company,
    j.location,
    j.description,
    j.tags,
    j.salary,
  ]
    .filter(Boolean)
    .join(" ");

  if (intent.roleTerms.length) {
    const titleHits = countMatches(j.title, intent.roleTerms);
    const bodyHits = countMatches([j.description, j.tags].join(" "), intent.roleTerms);

    if (titleHits > 0 || bodyHits > 0) {
      const points = titleHits > 0 ? Math.min(45, 25 + titleHits * 10) : Math.min(22, bodyHits * 6);
      score += points;
      reasons.push("Role intent aligns with this job.");
      evidence.push({ label: "Role alignment", text: j.title || "Role language found in job posting.", points });
    }
  }

  if (intent.keywordTerms.length) {
    const keywordHits = countMatches(searchableText, intent.keywordTerms);
    if (keywordHits > 0) {
      const points = Math.min(22, keywordHits * 4);
      score += points;
      reasons.push("Job contains search-intent language.");
      evidence.push({ label: "Search language", text: `${keywordHits} job signal${keywordHits === 1 ? "" : "s"} found.`, points });
    }
  }

  if (intent.company && lower(j.company).includes(lower(intent.company))) {
    score += 12;
    reasons.push("Company matches search intent.");
    evidence.push({ label: "Company", text: j.company, points: 12 });
  }

  if (intent.locationTerms.length && includesAny(j.location, intent.locationTerms)) {
    score += 12;
    reasons.push("Location matches search intent.");
    evidence.push({ label: "Location", text: j.location, points: 12 });
  }

  if (intent.locationType && inferLocationType(j.location) === intent.locationType) {
    score += 8;
    reasons.push("Work location type aligns.");
    evidence.push({ label: "Location type", text: intent.locationType, points: 8 });
  }

  const clusterResults = Object.entries(CAPABILITY_CLUSTERS)
    .map(([key, terms]) => {
      const hits = terms.filter((term) => includesAny(searchableText, [term]));
      return { key, hits };
    })
    .filter((result) => result.hits.length >= 2)
    .sort((a, b) => b.hits.length - a.hits.length);

  const primaryCluster = clusterResults[0];
  if (primaryCluster) {
    const points = Math.min(28, primaryCluster.hits.length * 4);
    score += points;
    reasons.push(`${primaryCluster.key} ecosystem detected.`);
    evidence.push({
      label: "Capability ecosystem",
      text: primaryCluster.hits.slice(0, 8).join(", "),
      points,
    });
  }

  if (!intent.hasIntent) score += 1;

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    job: job || {},
    score: finalScore,
    tier:
      finalScore >= 80
        ? "Strong Match"
        : finalScore >= 60
        ? "Good Match"
        : finalScore >= 40
        ? "Adjacent Match"
        : finalScore > 0
        ? "Weak Signal"
        : "No Signal",
    reasons,
    evidence,
    gaps,
  };
}

function scoreJobAlignment(job, seeker = {}) {
  const j = normalizeJob(job);

  const seekerHeadline = safe(seeker.headline);
  const seekerSummary = safe(seeker.summary);
  const resumeSummary = safe(seeker?.resume?.summary);

  const seekerSkills = unique([
    ...toArray(seeker.skills),
    ...toArray(seeker?.resume?.skills),
  ]);

  const seekerExperience = Array.isArray(seeker?.resume?.experience)
    ? seeker.resume.experience
    : [];

  const experienceText = seekerExperience
    .map((exp) => {
      if (!exp || typeof exp !== "object") return "";

      return [
        exp.title,
        exp.company,
        exp.description,
        exp.details,
        Array.isArray(exp.highlights) ? exp.highlights.join(" ") : "",
        Array.isArray(exp.bullets) ? exp.bullets.join(" ") : "",
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join(" ");

  const seekerRoleTerms = expandTerms(
    unique([
      seekerHeadline,
      ...seekerExperience.map((exp) => exp?.title || exp?.role || exp?.jobTitle || ""),
    ])
  );

const projectText = Array.isArray(seeker?.resume?.projects)
  ? seeker.resume.projects
      .map((project) => {
        if (!project || typeof project !== "object") return "";

        return [
          project.title,
          project.name,
          project.description,
          project.summary,
          project.technologies,
          project.tools,
        ]
          .filter(Boolean)
          .join(" ");
      })
      .join(" ")
  : "";

const certificationText = Array.isArray(seeker?.resume?.certifications)
  ? seeker.resume.certifications
      .map((cert) => {
        if (!cert || typeof cert !== "object") return "";

        return [
          cert.name,
          cert.title,
          cert.organization,
          cert.issuer,
        ]
          .filter(Boolean)
          .join(" ");
      })
      .join(" ")
  : "";

  const searchableSeekerText = [
    seekerHeadline,
    seekerSummary,
    resumeSummary,
    seekerSkills.join(" "),
    experienceText,
	projectText,
    certificationText,
  ]
    .filter(Boolean)
    .join(" ");

  const searchableJobText = [
    j.title,
    j.company,
    j.location,
    j.description,
    j.tags,
  ]
    .filter(Boolean)
    .join(" ");

  let score = 0;

  const reasons = [];
  const evidence = [];
  const gaps = [];

  // 1) Career / role trajectory alignment
const roleHits =
  countMatches(j.title, seekerRoleTerms) +
  countMatches(j.description, seekerRoleTerms);

const adjacentRoleHits = seekerRoleTerms.filter((term) => {
  const aliases = TERM_ALIASES[lower(term)] || [];

  return aliases.some((alias) =>
    includesAny(searchableJobText, [alias])
  );
}).length;

  if (roleHits > 0 || adjacentRoleHits > 0) {
  const points = Math.min(
    32,
    12 + roleHits * 4 + adjacentRoleHits * 2
  );

    score += points;

    reasons.push("Career trajectory shows alignment with this opportunity.");

    evidence.push({
      label: "Career alignment",
      text: seekerHeadline || seekerRoleTerms.slice(0, 4).join(", "),
      points,
    });
  }

  // 2) Direct skill alignment
  const matchedSkills = seekerSkills.filter((skill) =>
    includesAny(searchableJobText, [skill])
  );

  if (matchedSkills.length > 0) {
    const points = Math.min(36, matchedSkills.length * 4);

    score += points;

    reasons.push("Profile and primary resume skills align with the job.");

    evidence.push({
      label: "Skill alignment",
      text: matchedSkills.slice(0, 12).join(", "),
      points,
    });
  }

// 2b) Experience depth scoring
const depthScore = calculateDepthScore({
  matchedSkills,
  experienceText,
  projectText,
  certificationText,
  seekerHeadline,
});

if (depthScore > 0) {
  score += depthScore;

  reasons.push("Depth and execution evidence strengthen alignment.");

  evidence.push({
    label: "Execution depth",
    text: "Resume, project, leadership, and operational evidence increase confidence.",
    points: depthScore,
  });
}

  // 3) Capability ecosystem alignment
  const clusterResults = Object.entries(CAPABILITY_CLUSTERS)
    .map(([key, terms]) => {
      const seekerHits = terms.filter((term) =>
        includesAny(searchableSeekerText, [term])
      );

      const jobHits = terms.filter((term) =>
        includesAny(searchableJobText, [term])
      );

      const exactOverlap = seekerHits.filter((term) => jobHits.includes(term));

      return {
        key,
        seekerHits,
        jobHits,
        exactOverlap,
        hasSharedCluster: seekerHits.length >= 2 && jobHits.length >= 2,
      };
    })
    .filter((result) => result.hasSharedCluster)
    .sort((a, b) => {
      const aStrength = a.exactOverlap.length * 2 + Math.min(a.seekerHits.length, a.jobHits.length);
      const bStrength = b.exactOverlap.length * 2 + Math.min(b.seekerHits.length, b.jobHits.length);
      return bStrength - aStrength;
    });

  const primaryCluster = clusterResults[0];

  if (primaryCluster) {
  const sharedStrength =
    primaryCluster.exactOverlap.length > 0
      ? primaryCluster.exactOverlap.length
      : Math.min(primaryCluster.seekerHits.length, primaryCluster.jobHits.length);

  const clusterBreadth =
    primaryCluster.seekerHits.length +
    primaryCluster.jobHits.length;

  const leadershipSignals = [
    "lead",
    "manager",
    "director",
    "head",
    "chief",
    "founder",
    "vp",
    "vice president",
    "executive",
    "supervisor",
    "team leadership",
    "organizational scaling",
  ];

  const leadershipEvidence = leadershipSignals.filter((term) =>
    includesAny(searchableSeekerText, [term])
  );

  const sameDomainLeadershipBonus =
    leadershipEvidence.length > 0
      ? Math.min(14, leadershipEvidence.length * 2)
      : 0;

  const points = Math.min(
    48,
    16 +
      sharedStrength * 5 +
      Math.min(10, clusterBreadth) +
      sameDomainLeadershipBonus
  );

  score += points;

  reasons.push(
    `${primaryCluster.key} capability ecosystem shows transferable alignment.`
  );

  if (sameDomainLeadershipBonus > 0) {
    reasons.push(
      "Leadership and operational experience strengthen role-readiness."
    );
  }

  evidence.push({
    label: "Capability ecosystem",
    text:
      primaryCluster.exactOverlap.length > 0
        ? primaryCluster.exactOverlap.slice(0, 10).join(", ")
        : `Your signals: ${primaryCluster.seekerHits
            .slice(0, 6)
            .join(", ")} | Job signals: ${primaryCluster.jobHits
            .slice(0, 6)
            .join(", ")}`,
    points,
  });

  if (sameDomainLeadershipBonus > 0) {
    evidence.push({
      label: "Leadership transferability",
      text:
        leadershipEvidence.slice(0, 8).join(", "),
      points: sameDomainLeadershipBonus,
    });
  }
}

  // 4) Location / preference alignment
  const preferredLocations = unique([
    seeker.location,
    ...toArray(seeker?.workPreferences?.preferredLocations),
    ...toArray(seeker?.workPreferences?.locations),
    ...toArray(seeker?.workPreferences?.locationPreferences),
  ]);

  if (preferredLocations.length && includesAny(j.location, preferredLocations)) {
    score += 8;

    reasons.push("Location or preference signals align.");

    evidence.push({
      label: "Location preference",
      text: j.location,
      points: 8,
    });
  }

  // 5) Profile/resume completeness confidence
  if (seekerHeadline || seekerSummary) score += 3;
  if (seeker?.resume?.resumeId) score += 4;
  if (seekerSkills.length >= 5) score += 4;
  if (seekerExperience.length >= 1) score += 4;

    const missingSignals = [];

  if (
  roleHits <= 0 &&
  !primaryCluster &&
  matchedSkills.length < 2
) {
  missingSignals.push("direct role trajectory");
}

  if (matchedSkills.length < 2 && !primaryCluster) {
    missingSignals.push("required technical stack depth");
  }

if (!primaryCluster && matchedSkills.length < 2) {
  missingSignals.push("shared capability ecosystem");
}

  const aiTerms = [
    "openai",
    "llm",
    "ai sdk",
    "prompt engineering",
    "claude",
    "copilot",
    "cursor",
    "artificial intelligence",
  ];

  const hasAiSignals = aiTerms.some((term) =>
    includesAny(searchableSeekerText, [term])
  );

  const jobRequiresAiSignals = aiTerms.some((term) =>
    includesAny(searchableJobText, [term])
  );

  if (jobRequiresAiSignals && !hasAiSignals) {
    missingSignals.push("demonstrated AI / LLM product experience");
  }

  if (missingSignals.length > 0) {
    gaps.push(
      `${missingSignals.slice(0, 2).join(" and ")}.`
    );
  }

  let normalizedScore = score;

// Penalize low-information profiles slightly
if (seekerSkills.length <= 2) normalizedScore -= 8;
if (seekerExperience.length === 0) normalizedScore -= 10;
if (!projectText) normalizedScore -= 4;

// Reward evidence-rich profiles
if (projectText) normalizedScore += 5;
if (certificationText) normalizedScore += 3;
if (experienceText.length > 500) normalizedScore += 6;

const finalScore = Math.max(
  0,
  Math.min(100, Math.round(normalizedScore))
);

  return {
    ...job,
    match: finalScore,
    matchSource: "profile",
    matchTier:
      finalScore >= 80
        ? "Strong Alignment"
        : finalScore >= 60
        ? "Good Alignment"
        : finalScore >= 40
        ? "Adjacent Alignment"
        : finalScore > 0
        ? "Weak Alignment"
        : "No Alignment",

    alignmentReasons: reasons,
    alignmentEvidence: evidence,
    alignmentGaps: gaps,
  };
}

export function rankJobsBySeekerAlignment(
  jobs = [],
  seeker = {}
) {
  return (Array.isArray(jobs) ? jobs : [])
    .map((job) => scoreJobAlignment(job, seeker))
    .sort((a, b) => (b.match || 0) - (a.match || 0));
}

export function rankJobsBySignalRelevance(jobs = [], filters = {}, options = {}) {
  const intent = buildIntent(filters);
  const minScore = typeof options.minScore === "number" ? options.minScore : intent.hasIntent ? 1 : 0;

  return (Array.isArray(jobs) ? jobs : [])
    .map((job) => scoreJob(job, filters))
    .filter((result) => result.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .map((result) => ({
      ...result.job,
      jobMatch: result.score,
      jobMatchTier: result.tier,
      jobMatchReasons: result.reasons,
      jobMatchEvidence: result.evidence,
      jobMatchGaps: result.gaps,
    }));
}

export function explainJobMatch(job = {}, filters = {}) {
  const result = scoreJob(job, filters);
  return {
    score: result.score,
    tier: result.tier,
    summary: result.reasons[0] || "No strong job signal was detected for this search.",
    reasons: result.evidence,
    gaps: result.gaps,
  };
}

export default {
  rankJobsBySignalRelevance,
  explainJobMatch,
  normalizeLocationQuery,
};
