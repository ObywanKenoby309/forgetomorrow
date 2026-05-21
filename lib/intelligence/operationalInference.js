// lib/intelligence/operationalInference.js
// Shared operational inference layer for recruiter surfaces and application packets.
// Uses universalTaxonomy as vocabulary/relationship layer, with accuracy guardrails.
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

function includesPhrase(text, phrase) {
  const clean = normalize(text);
  const p = normalize(phrase).trim();
  if (!p) return false;

  // Single-token phrases must be whole-word matches to avoid "service" => "food service"
  // style bleed and other substring false positives.
  if (!/\s/.test(p)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(p)}([^a-z0-9]|$)`, "i").test(clean);
  }

  return clean.includes(p);
}

function includesAny(text, patterns = []) {
  return patterns.some((pattern) => pattern.test(text));
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

// Capabilities that are too easy to trigger accidentally from generic words
// like "software", "installation", "service", "training", or "support".
const CAPABILITY_GUARDS = {
  software_engineering: {
    requireAny: [
      /software engineering|software development|developer|full stack|frontend|backend|react|next\.js|node\.js|typescript|javascript|python|java|c#|\.net|api development|microservices|git/i,
    ],
    rejectIfOnly: [/software installation|installation and troubleshooting of software|software troubleshooting|installing software/i],
  },
  construction_trades: {
    requireAny: [
      /construction|skilled trades|maintenance technician|electrical|plumbing|hvac|carpentry|blueprints|site safety|osha|preventive maintenance/i,
    ],
    rejectIfOnly: [/hardware troubleshooting|hardware triage|software\/hardware|device repair|installation of software|installation and troubleshooting/i],
  },
  food_service_operations: {
    requireAny: [
      /food service|restaurant|kitchen|servsafe|front of house|back of house|menu|server\b|serving\b|shift management|labor scheduling/i,
    ],
    rejectIfOnly: [/customer service|technical support|support services|sales of services|service desk|service delivery|training/i],
  },
  clinical_operations: {
    requireAny: [/clinical operations|clinic|patient|provider|medical office|ehr|emr|hipaa|care coordination/i],
  },
  healthcare_administration: {
    requireAny: [/healthcare|medical office|patient|clinical|medical records|emr|ehr|hipaa|insurance verification|billing|claims/i],
  },
  sales_business_development: {
    // Allow retail/service sales, but keep it from outranking operational support
    // unless stronger sales-process terms appear.
    requireAny: [/sales|selling|sold|product sales|service sales|prospecting|lead generation|pipeline|quota|closing|crm|salesforce|hubspot/i],
    soft: true,
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
]);

function passesCapabilityGuard(capability, text, matchedTerms = []) {
  const guard = CAPABILITY_GUARDS[capability.id];
  if (!guard) return true;

  const clean = normalize(text);

  if (Array.isArray(guard.rejectIfOnly) && guard.rejectIfOnly.some((rx) => rx.test(clean))) {
    const hasStrongRequired = Array.isArray(guard.requireAny) && guard.requireAny.some((rx) => rx.test(clean));
    if (!hasStrongRequired) return false;
  }

  if (Array.isArray(guard.requireAny) && !guard.requireAny.some((rx) => rx.test(clean))) {
    return false;
  }

  return true;
}

function capabilityMatchScore(capability, text) {
  const haystack = normalize(text);
  let score = 0;
  const matchedTerms = [];
  let strongMatches = 0;

  for (const alias of capability.aliases || []) {
    if (includesPhrase(haystack, alias)) {
      const generic = GENERIC_TERMS.has(normalize(alias));
      score += generic ? 1 : 5;
      if (!generic) strongMatches += 1;
      matchedTerms.push(alias);
    }
  }

  for (const pattern of capability.patterns || []) {
    if (includesPhrase(haystack, pattern)) {
      const generic = GENERIC_TERMS.has(normalize(pattern));
      score += generic ? 1 : 3;
      if (!generic) strongMatches += 1;
      matchedTerms.push(pattern);
    }
  }

  const cleaned = unique(matchedTerms, 8);

  if (!passesCapabilityGuard(capability, haystack, cleaned)) {
    return { capability, score: 0, matchedTerms: [], strongMatches: 0 };
  }

  // Broad capabilities need either one strong phrase or two weaker phrase hits.
  if (score > 0 && strongMatches === 0 && cleaned.length < 2) {
    score = 0;
  }

  // Downweight soft sales exposure so it does not dominate operational support roles.
  if (CAPABILITY_GUARDS[capability.id]?.soft && strongMatches <= 1) {
    score = Math.min(score, 3);
  }

  return {
    capability,
    score,
    matchedTerms: cleaned,
    strongMatches,
  };
}

export function detectCapabilityMatches(source = {}, options = {}) {
  const text = textOf(source);
  const minScore = Number.isFinite(options.minScore) ? options.minScore : 4;

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
