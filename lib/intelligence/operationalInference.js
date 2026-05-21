// lib/intelligence/operationalInference.js
// Shared operational inference layer for recruiter surfaces and application packets.
// Uses universalTaxonomy as the vocabulary/relationship layer.
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

function safeStr(value = "") {
  if (value === null || value === undefined) return "";
  return String(value || "").trim();
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

function includesPattern(text, pattern) {
  const clean = normalize(text);
  const p = normalize(pattern);
  if (!p) return false;

  // Phrase-aware matching without requiring exact punctuation.
  if (clean.includes(p)) return true;

  const tokens = p.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) return false;

  return tokens.every((token) => clean.includes(token));
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

function capabilityMatchScore(capability, text) {
  const haystack = normalize(text);
  let score = 0;
  const matchedTerms = [];

  for (const alias of capability.aliases || []) {
    if (includesPattern(haystack, alias)) {
      score += 4;
      matchedTerms.push(alias);
    }
  }

  for (const pattern of capability.patterns || []) {
    if (includesPattern(haystack, pattern)) {
      score += 3;
      matchedTerms.push(pattern);
    }
  }

  return {
    capability,
    score,
    matchedTerms: unique(matchedTerms, 8),
  };
}

export function detectCapabilityMatches(source = {}, options = {}) {
  const text = textOf(source);
  const minScore = Number.isFinite(options.minScore) ? options.minScore : 3;

  return UNIVERSAL_CAPABILITIES.map((capability) => capabilityMatchScore(capability, text))
    .filter((item) => item.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((a.capability.tier || "B") !== (b.capability.tier || "B")) {
        return a.capability.tier === "A" ? -1 : 1;
      }
      return String(a.capability.label).localeCompare(String(b.capability.label));
    })
    .slice(0, options.limit || 12);
}

export function detectBehavioralSignals(source = {}) {
  const text = normalize(textOf(source));

  return Object.entries(UNIVERSAL_BEHAVIORAL_SIGNALS || {})
    .map(([key, terms]) => {
      const matchedTerms = safeArr(terms).filter((term) => includesPattern(text, term));
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
  const labels = topCapabilityLabels(matches, 5);
  const behaviorLabels = behaviors.map((b) => b.label.toLowerCase()).slice(0, 4);

  if (!labels.length) {
    return "Role evidence is limited. Recruiter should validate scope, systems, ownership, and outcomes.";
  }

  const family = roleFamiliesForCapabilities(matches)?.[0]?.family || "";
  const related = relatedCapabilityLabels(matches, 4);

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
  const behaviorLabels = behaviors.map((b) => b.label.toLowerCase()).slice(0, 4);

  if (!labels.length) {
    return "Use interview discussion to confirm what the candidate owned, supported, improved, or delivered.";
  }

  const related = relatedCapabilityLabels(matches, 4);
  const progression = progressionCapabilityLabels(matches, 3);

  const pieces = [];
  pieces.push(`Recruiter should read this as evidence of ${sentenceList(labels)}.`);
  if (behaviorLabels.length) pieces.push(`Behavioral signals suggest ${sentenceList(behaviorLabels)}.`);
  if (related.length) pieces.push(`Adjacent capability areas include ${sentenceList(related)}.`);
  if (progression.length) pieces.push(`Potential growth paths may include ${sentenceList(progression)}.`);

  return pieces.join(" ");
}

function inferValidationPrompt(matches = [], behaviors = [], evidenceBasis = []) {
  const labels = topCapabilityLabels(matches, 3);
  const behaviorKeys = behaviors.map((b) => b.key);

  if (!labels.length) {
    return "Walk me through the scope of this role, the systems involved, and one example of work you owned from issue to outcome.";
  }

  if (behaviorKeys.includes("analytical_reasoning")) {
    return `Ask for one example where ${labels[0]} work required analysis, decision-making, and a measurable result.`;
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

  return `Ask for one concrete example showing scope, ownership, tools used, and outcome for ${sentenceList(labels)}.`;
}

export function detectOperationalSignals(source = {}) {
  return topCapabilityLabels(detectCapabilityMatches(source), 8);
}

export function inferOperationalConclusion(source = {}) {
  const capabilityMatches = detectCapabilityMatches(source, { limit: 12 });
  const behavioralSignals = detectBehavioralSignals(source);
  const evidenceBasis = evidenceBasisFromSource(source);

  const conclusion = inferCapabilityConclusion(capabilityMatches, behavioralSignals);
  const recruiterMeaning = inferRecruiterMeaning(capabilityMatches, behavioralSignals);
  const validationPrompt = inferValidationPrompt(capabilityMatches, behavioralSignals, evidenceBasis);

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
