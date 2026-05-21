// lib/intelligence/operationalInference.js
// Shared operational inference layer for recruiter surfaces and application packets.
// Uses universalTaxonomy as vocabulary, then applies contextual bundles so generic words
// like "service", "support", "operations", or "training" do not create false capability matches.
// Pure functions only. No React imports.

import {
  UNIVERSAL_CAPABILITIES,
  UNIVERSAL_CAPABILITY_RELATIONSHIPS,
  UNIVERSAL_BEHAVIORAL_SIGNALS,
  UNIVERSAL_ROLE_FAMILIES,
} from "@/lib/intelligence/universalTaxonomy";

function safeArr(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    return s
      .split(/\r?\n|,/g)
      .map((x) => String(x || "").trim())
      .filter(Boolean);
  }
  return [];
}

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textOf).join(" ");
  if (typeof value === "object") return Object.values(value).map(textOf).join(" ");
  return String(value || "");
}

function normalize(text = "") {
  return String(text || "").toLowerCase();
}

function unique(items = [], limit = 10) {
  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(items) ? items : []) {
    const clean = String(item || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= limit) break;
  }

  return out;
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseRegex(phrase = "") {
  const p = normalize(phrase).trim();
  if (!p) return null;

  // Whole phrase with non-alphanumeric boundaries.
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(p)}([^a-z0-9]|$)`, "i");
}

function includesPhrase(text, phrase) {
  const clean = normalize(text);
  const rx = phraseRegex(phrase);
  return rx ? rx.test(clean) : false;
}

function countPhraseHits(text, terms = []) {
  const clean = normalize(text);
  return safeArr(terms).filter((term) => includesPhrase(clean, term));
}

function evidenceBasisFromSource(source = {}) {
  const raw = [
    ...safeArr(source?.highlights),
    ...safeArr(source?.bullets),
    ...safeArr(source?.description),
    ...safeArr(source?.details),
  ];

  if (raw.length) return unique(raw, 8);

  const text = textOf(source);
  return unique(
    text
      .split(/\r?\n/g)
      .map((x) => x.trim())
      .filter((x) => x.length >= 8),
    8
  );
}

// Context bundle design:
// - anchors are domain-specific terms that must be present for a capability family.
// - support terms help confidence only after anchors exist.
// - reject terms prevent broad/generic matches from crossing into the wrong industry.
const CONTEXT_BUNDLES = {
  desktop_technical_support: {
    anchors: [
      "desktop support",
      "desktop technician",
      "help desk",
      "service desk",
      "technical support",
      "tier 1",
      "tier 2",
      "tier ii",
      "troubleshooting",
      "end-user",
      "end user",
      "ticketing",
      "windows support",
      "hardware troubleshooting",
      "software troubleshooting",
      "user support",
      "public tech support",
    ],
    support: ["support", "service", "customer", "client", "issue resolution", "remote troubleshooting"],
  },

  endpoint_management: {
    anchors: [
      "intune",
      "sccm",
      "mecm",
      "jamf",
      "endpoint",
      "device management",
      "imaging",
      "workstation",
      "autopilot",
      "mdm",
      "hardware triage",
      "device repair",
      "software deployment",
      "hardware deployment",
    ],
    support: ["hardware", "software", "deployment", "troubleshooting", "devices", "repair"],
  },

  identity_access_management: {
    anchors: [
      "active directory",
      "azure ad",
      "entra",
      "okta",
      "iam",
      "identity",
      "access management",
      "sso",
      "mfa",
      "rbac",
      "user provisioning",
      "permissions",
      "global protect",
      "vpn",
    ],
    support: ["access", "account", "password", "security", "connectivity"],
  },

  networking_infrastructure: {
    anchors: [
      "cisco",
      "meraki",
      "routing",
      "switching",
      "network infrastructure",
      "tcp/ip",
      "dns",
      "dhcp",
      "vpn",
      "firewall",
      "wan",
      "lan",
      "connectivity",
    ],
    support: ["network", "infrastructure", "access", "troubleshooting"],
  },

  systems_administration: {
    anchors: [
      "windows server",
      "linux",
      "server administration",
      "azure servers",
      "local servers",
      "server troubleshooting",
      "powershell",
      "bash",
      "vmware",
      "hyper-v",
      "patching",
      "backup",
    ],
    support: ["server", "administration", "infrastructure", "troubleshooting"],
  },

  cloud_infrastructure: {
    anchors: [
      "azure",
      "aws",
      "gcp",
      "cloud infrastructure",
      "cloud migration",
      "terraform",
      "kubernetes",
      "docker",
      "devops",
      "ci/cd",
      "serverless",
    ],
    support: ["cloud", "infrastructure", "deployment", "server"],
  },

  cybersecurity_operations: {
    anchors: [
      "cybersecurity",
      "security operations",
      "soc",
      "siem",
      "splunk",
      "sentinel",
      "incident response",
      "vulnerability",
      "edr",
      "crowdstrike",
      "defender",
      "quarantine",
      "infected devices",
      "threat",
    ],
    support: ["security", "risk", "incident", "vulnerable", "response"],
  },

  it_service_management: {
    anchors: [
      "itil",
      "itsm",
      "incident management",
      "problem management",
      "change advisory",
      "cab",
      "service request",
      "knowledge base",
      "sla",
      "service level",
      "p1",
      "p2",
      "bridge calls",
    ],
    support: ["service", "incident", "knowledge", "process", "support"],
  },

  content_communications: {
    anchors: [
      "knowledgebase articles",
      "knowledge base articles",
      "technical writing",
      "documentation",
      "communications",
      "copywriting",
      "editorial",
      "internal communications",
      "knowledge articles",
    ],
    support: ["writing", "training", "process", "content"],
  },

  customer_service_support: {
    anchors: [
      "customer service",
      "customer support",
      "customer care",
      "client support",
      "call center",
      "contact center",
      "customer inquiries",
      "case management",
      "public tech support",
      "general public tech support",
    ],
    support: ["support", "customer", "client", "inbound", "outbound", "issue resolution"],
  },

  sales_business_development: {
    anchors: [
      "sales",
      "sold",
      "selling",
      "product sales",
      "service sales",
      "sales of services",
      "sales of best buy product",
      "prospecting",
      "lead generation",
      "pipeline",
      "quota",
      "closing",
      "crm",
    ],
    support: ["customer", "client", "product", "service"],
  },

  data_analytics_bi: {
    anchors: [
      "data analysis",
      "analytics",
      "business intelligence",
      "sql",
      "power bi",
      "tableau",
      "dashboard",
      "reporting",
      "metrics",
      "kpi",
      "forecasting",
      "data visualization",
    ],
    support: ["weekly meeting", "customer", "analysis", "reporting"],
  },

  training_enablement: {
    anchors: [
      "training",
      "enablement",
      "onboarding",
      "curriculum",
      "knowledge transfer",
      "facilitation",
      "training materials",
      "trained",
      "training of new",
    ],
    support: ["documentation", "coaching", "process", "knowledge"],
  },

  food_service_operations: {
    anchors: [
      "food service",
      "restaurant",
      "kitchen",
      "servsafe",
      "menu",
      "front of house",
      "back of house",
      "food safety",
      "server",
      "serving",
      "waiter",
      "waitress",
      "chef",
      "cook",
      "dishwasher",
      "catering",
    ],
    support: ["guest", "shift", "service", "customer", "labor scheduling"],
    rejectIfDomainAnchorsAbsent: true,
  },

  hospitality_guest_experience: {
    anchors: [
      "hospitality",
      "guest experience",
      "front desk",
      "hotel",
      "reservations",
      "guest services",
      "event coordination",
      "service recovery",
      "guest satisfaction",
    ],
    support: ["guest", "customer", "service"],
    rejectIfDomainAnchorsAbsent: true,
  },

  retail_store_operations: {
    anchors: [
      "retail",
      "store operations",
      "merchandising",
      "point of sale",
      "pos",
      "inventory",
      "loss prevention",
      "visual merchandising",
      "cash handling",
      "sales floor",
      "store manager",
      "best buy product",
      "best buy",
      "geek squad",
    ],
    support: ["sales", "customer", "product", "service"],
  },

  construction_trades: {
    anchors: [
      "construction",
      "skilled trades",
      "maintenance technician",
      "electrical",
      "plumbing",
      "hvac",
      "carpentry",
      "blueprints",
      "site safety",
      "osha",
      "preventive maintenance",
    ],
    support: ["repair", "installation", "maintenance", "safety"],
    rejectIfDomainAnchorsAbsent: true,
  },

  software_engineering: {
    anchors: [
      "software engineering",
      "software development",
      "developer",
      "full stack",
      "frontend",
      "backend",
      "react",
      "next.js",
      "node.js",
      "typescript",
      "javascript",
      "java",
      "c#",
      ".net",
      "api development",
      "microservices",
      "git",
    ],
    support: ["software", "development", "code", "application"],
    rejectIfDomainAnchorsAbsent: true,
  },
};

const GENERIC_TERMS = new Set([
  "support",
  "service",
  "training",
  "documentation",
  "software",
  "hardware",
  "installation",
  "operations",
  "process",
  "customer",
  "client",
  "communication",
  "repair",
  "deployment",
]);

function getBundleForCapability(capabilityId) {
  return CONTEXT_BUNDLES[capabilityId] || null;
}

function bundleScore(capability, text) {
  const bundle = getBundleForCapability(capability.id);
  if (!bundle) return null;

  const anchorHits = countPhraseHits(text, bundle.anchors || []);
  const supportHits = countPhraseHits(text, bundle.support || []);

  if (!anchorHits.length) {
    return {
      allowed: false,
      score: 0,
      anchorHits,
      supportHits,
      reason: "missing-domain-anchor",
    };
  }

  const score = anchorHits.length * 6 + supportHits.length * 2;

  return {
    allowed: true,
    score,
    anchorHits: unique(anchorHits, 8),
    supportHits: unique(supportHits, 6),
    reason: "context-bundle",
  };
}

function taxonomyScore(capability, text) {
  let score = 0;
  const matchedTerms = [];
  let strongMatches = 0;

  for (const alias of capability.aliases || []) {
    if (includesPhrase(text, alias)) {
      const generic = GENERIC_TERMS.has(normalize(alias));
      score += generic ? 1 : 4;
      if (!generic) strongMatches += 1;
      matchedTerms.push(alias);
    }
  }

  for (const pattern of capability.patterns || []) {
    if (includesPhrase(text, pattern)) {
      const generic = GENERIC_TERMS.has(normalize(pattern));
      score += generic ? 1 : 3;
      if (!generic) strongMatches += 1;
      matchedTerms.push(pattern);
    }
  }

  return {
    score,
    matchedTerms: unique(matchedTerms, 8),
    strongMatches,
  };
}

function capabilityMatchScore(capability, sourceText) {
  const text = normalize(sourceText);
  const bundle = bundleScore(capability, text);
  const tax = taxonomyScore(capability, text);

  if (bundle && !bundle.allowed) {
    return {
      capability,
      score: 0,
      matchedTerms: [],
      anchorHits: [],
      supportHits: [],
      strongMatches: 0,
      source: bundle.reason,
    };
  }

  if (bundle && bundle.allowed) {
    return {
      capability,
      score: Math.max(bundle.score, tax.score),
      matchedTerms: unique([...bundle.anchorHits, ...bundle.supportHits, ...tax.matchedTerms], 10),
      anchorHits: bundle.anchorHits,
      supportHits: bundle.supportHits,
      strongMatches: bundle.anchorHits.length + tax.strongMatches,
      source: "context-bundle",
    };
  }

  // No bundle exists: fall back to taxonomy, but require stronger evidence.
  if (tax.strongMatches === 0 && tax.matchedTerms.length < 2) {
    tax.score = 0;
  }

  return {
    capability,
    score: tax.score,
    matchedTerms: tax.matchedTerms,
    anchorHits: [],
    supportHits: [],
    strongMatches: tax.strongMatches,
    source: "taxonomy",
  };
}

export function detectCapabilityMatches(source = {}, options = {}) {
  const text = textOf(source);
  const minScore = Number.isFinite(options.minScore) ? options.minScore : 6;

  return UNIVERSAL_CAPABILITIES.map((capability) => capabilityMatchScore(capability, text))
    .filter((item) => item.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((a.capability.tier || "B") !== (b.capability.tier || "B")) {
        return a.capability.tier === "A" ? -1 : 1;
      }
      return String(a.capability.label).localeCompare(String(b.capability.label));
    })
    .slice(0, options.limit || 10);
}

export function detectBehavioralSignals(source = {}) {
  const text = normalize(textOf(source));

  return Object.entries(UNIVERSAL_BEHAVIORAL_SIGNALS || {})
    .map(([key, terms]) => {
      const matchedTerms = safeArr(terms).filter((term) => includesPhrase(text, term));
      return {
        key,
        label: key
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        matchedTerms: unique(matchedTerms, 6),
      };
    })
    .filter((item) => item.matchedTerms.length)
    .slice(0, 8);
}

function roleFamiliesForCapabilities(matches = []) {
  const ids = matches.map((m) => m.capability?.id).filter(Boolean);
  const out = [];

  for (const [family, capabilityIds] of Object.entries(UNIVERSAL_ROLE_FAMILIES || {})) {
    const count = safeArr(capabilityIds).filter((id) => ids.includes(id)).length;
    if (count) {
      out.push({
        family,
        count,
        capabilityIds: safeArr(capabilityIds).filter((id) => ids.includes(id)),
      });
    }
  }

  return out.sort((a, b) => b.count - a.count);
}

function relatedCapabilityLabels(matches = [], limit = 5) {
  const ids = matches.map((m) => m.capability?.id).filter(Boolean);
  const relatedIds = [];

  for (const id of ids) {
    const rel = UNIVERSAL_CAPABILITY_RELATIONSHIPS?.[id]?.related || [];
    relatedIds.push(...rel);
  }

  const labels = unique(relatedIds, 12)
    .filter((id) => !ids.includes(id))
    .map((id) => UNIVERSAL_CAPABILITIES.find((cap) => cap.id === id)?.label)
    .filter(Boolean);

  return unique(labels, limit);
}

function progressionCapabilityLabels(matches = [], limit = 5) {
  const ids = matches.map((m) => m.capability?.id).filter(Boolean);
  const progressionIds = [];

  for (const id of ids) {
    const rel = UNIVERSAL_CAPABILITY_RELATIONSHIPS?.[id]?.progressionTo || [];
    progressionIds.push(...rel);
  }

  const labels = unique(progressionIds, 12)
    .filter((id) => !ids.includes(id))
    .map((id) => UNIVERSAL_CAPABILITIES.find((cap) => cap.id === id)?.label || id)
    .filter(Boolean);

  return unique(labels, limit);
}

function topCapabilityLabels(matches = [], limit = 5) {
  return unique(
    matches
      .slice(0, limit)
      .map((m) => m.capability?.label)
      .filter(Boolean),
    limit
  );
}

function sentenceList(items = []) {
  const arr = unique(items, 6);
  if (!arr.length) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

function inferCapabilityConclusion(matches = [], behaviors = []) {
  const labels = topCapabilityLabels(matches, 4);
  const behaviorLabels = behaviors.map((b) => b.label.toLowerCase()).slice(0, 3);

  if (!labels.length) {
    return "Role evidence is limited. Recruiter should validate scope, systems, ownership, and outcomes.";
  }

  const family = roleFamiliesForCapabilities(matches)?.[0]?.family || "";
  const related = relatedCapabilityLabels(matches, 3);

  if (family === "technology") {
    return `Experience indicates technology operations exposure across ${sentenceList(labels)}${related.length ? `, with adjacent signals around ${sentenceList(related.slice(0, 2))}` : ""}.`;
  }

  if (family === "customer_revenue") {
    return `Experience indicates customer-facing operational capability across ${sentenceList(labels)}${behaviorLabels.length ? ` with visible ${sentenceList(behaviorLabels)}` : ""}.`;
  }

  if (family === "operations_supply_chain") {
    return `Experience indicates operational execution capability across ${sentenceList(labels)}${behaviorLabels.length ? ` with visible ${sentenceList(behaviorLabels)}` : ""}.`;
  }

  if (family === "executive") {
    return `Experience indicates leadership and strategy exposure across ${sentenceList(labels)}${behaviorLabels.length ? ` with visible ${sentenceList(behaviorLabels)}` : ""}.`;
  }

  if (family === "data_ai") {
    return `Experience indicates analytical or data capability across ${sentenceList(labels)}${behaviorLabels.length ? ` with visible ${sentenceList(behaviorLabels)}` : ""}.`;
  }

  return `Experience indicates recruiter-visible capability across ${sentenceList(labels)}${behaviorLabels.length ? ` with visible ${sentenceList(behaviorLabels)}` : ""}.`;
}

function inferRecruiterMeaning(matches = [], behaviors = []) {
  const labels = topCapabilityLabels(matches, 4);
  const behaviorLabels = behaviors.map((b) => b.label.toLowerCase()).slice(0, 3);

  if (!labels.length) {
    return "Use interview discussion to confirm what the candidate owned, supported, improved, or delivered.";
  }

  const related = relatedCapabilityLabels(matches, 3);
  const progression = progressionCapabilityLabels(matches, 3);

  const pieces = [];
  pieces.push(`Recruiter should read this as evidence of ${sentenceList(labels)}.`);
  if (behaviorLabels.length) pieces.push(`Behavioral signals suggest ${sentenceList(behaviorLabels)}.`);
  if (related.length) pieces.push(`Adjacent capability areas include ${sentenceList(related)}.`);
  if (progression.length) pieces.push(`Potential growth paths may include ${sentenceList(progression)}.`);

  return pieces.join(" ");
}

function inferValidationPrompt(matches = [], behaviors = []) {
  const labels = topCapabilityLabels(matches, 3);
  const behaviorKeys = behaviors.map((b) => b.key);

  if (!labels.length) {
    return "Walk me through the scope of this role, the systems involved, and one example of work you owned from issue to outcome.";
  }

  if (behaviorKeys.includes("risk_discipline")) {
    return `Ask for one example where ${labels[0]} work involved risk, controls, escalation, compliance, security, or safety judgment.`;
  }

  if (behaviorKeys.includes("customer_communication")) {
    return `Ask for one example where ${labels[0]} required communication with users, customers, stakeholders, or non-technical audiences.`;
  }

  if (behaviorKeys.includes("operational_rigor")) {
    return `Ask for one example where ${labels[0]} required process discipline, documentation, workflow control, or repeatable execution.`;
  }

  if (behaviorKeys.includes("analytical_reasoning")) {
    return `Ask for one example where ${labels[0]} work required analysis, decision-making, and a measurable result.`;
  }

  return `Ask for one concrete example showing scope, ownership, tools used, and outcome for ${sentenceList(labels)}.`;
}

export function detectOperationalSignals(source = {}) {
  return topCapabilityLabels(detectCapabilityMatches(source), 8);
}

export function inferOperationalConclusion(source = {}) {
  const capabilityMatches = detectCapabilityMatches(source, { limit: 10 });
  const behavioralSignals = detectBehavioralSignals(source);
  const evidenceBasis = evidenceBasisFromSource(source);

  const conclusion = inferCapabilityConclusion(capabilityMatches, behavioralSignals);
  const recruiterMeaning = inferRecruiterMeaning(capabilityMatches, behavioralSignals);
  const validationPrompt = inferValidationPrompt(capabilityMatches, behavioralSignals);

  return {
    signals: topCapabilityLabels(capabilityMatches, 10),
    capabilityMatches: capabilityMatches.map((m) => ({
      id: m.capability.id,
      label: m.capability.label,
      domain: m.capability.domain,
      tier: m.capability.tier,
      score: m.score,
      matchedTerms: m.matchedTerms,
      anchorHits: m.anchorHits,
      supportHits: m.supportHits,
      source: m.source,
    })),
    behavioralSignals,
    relatedCapabilities: relatedCapabilityLabels(capabilityMatches, 6),
    progressionCapabilities: progressionCapabilityLabels(capabilityMatches, 5),
    conclusion,
    recruiterMeaning,
    evidenceBasis,
    validationPrompt,
  };
}

export function inferCandidateOperationalProfile({
  experience = [],
  skills = [],
  projects = [],
  hasResume = false,
} = {}) {
  const experienceList = safeArr(experience);
  const projectList = safeArr(projects);
  const skillList = safeArr(skills);

  const roleInferences = experienceList.map((exp) => inferOperationalConclusion(exp));

  const combinedSource = {
    experience: experienceList,
    skills: skillList,
    projects: projectList,
  };

  const combinedInference = inferOperationalConclusion(combinedSource);
  const projectInference = projectList.length ? inferOperationalConclusion({ projects: projectList }) : null;

  const allSignals = unique(
    [
      ...combinedInference.signals,
      ...roleInferences.flatMap((item) => item.signals || []),
      ...(projectInference?.signals || []),
    ],
    14
  );

  const validationFocus = unique(
    [
      !projectList.length ? "Validate project/work examples because structured portfolio projects are not yet visible." : "",
      !hasResume ? "Confirm resume source evidence before final evaluation." : "",
      combinedInference.validationPrompt,
      ...roleInferences.slice(0, 2).map((item) => item.validationPrompt),
    ],
    5
  );

  return {
    overallConclusion: combinedInference.conclusion,
    recruiterMeaning: combinedInference.recruiterMeaning,
    signals: allSignals,
    capabilityMatches: combinedInference.capabilityMatches,
    behavioralSignals: combinedInference.behavioralSignals,
    relatedCapabilities: combinedInference.relatedCapabilities,
    progressionCapabilities: combinedInference.progressionCapabilities,
    roleInferences,
    projectInference,
    validationFocus,
  };
}
