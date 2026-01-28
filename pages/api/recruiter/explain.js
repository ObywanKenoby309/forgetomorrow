// pages/api/recruiter/explain.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

/**
 * Deterministic (non-LLM) explainability v1.5 (capability-first, human-readable):
 * - Capabilities (signals) are the primary unit of truth; skills are supporting only
 * - Required capabilities are inferred from the JD (without self-scoring the candidate)
 * - Candidate capability matching is against RESUME only
 * - Variant-aware matching (SOP/SOPs, QBR/QBRs, pluralization, light inflection)
 * - Suppresses tool-inventory plus double-penalty behavior
 * - Fixes language: "gaps" => "Not yet demonstrated" (backward-compatible arrays retained)
 * - Style/context traits are never penalized and never shown as gaps
 * - Always surfaces transferable strengths when Tier A coverage is strong enough
 * - Evidence ranking avoids contact/header and prefers action/metrics; 1–2 best sentences per capability
 * - Best-effort persist to RecruiterExplainRun (only if model exists + migration applied)
 */

const SPEC = {
  signal_config_version: "v1",
  tiers: {
    A: { weight: 8, description: "core outcomes + lifecycle + tools" },
    B: { weight: 4, description: "supporting responsibilities" },
    C: { weight: 0.5, description: "generic tokens (mostly ignore)" },
  },
  signals: [
    {
      id: "crm_tools",
      tier: "A",
      label: "CRM / CS tools",
      patterns: ["crm", "salesforce", "hubspot", "gainsight", "zendesk", "freshdesk", "dynamics", "pipedrive"],
    },
    {
      id: "onboarding_training",
      tier: "A",
      label: "Onboarding & training",
      patterns: ["onboarding", "implement*", "training", "enablement", "rollout", "go-live"],
    },
    {
      id: "retention_churn",
      tier: "A",
      label: "Retention / churn reduction",
      patterns: ["retention", "renewal*", "churn", "reduce* churn", "renewal discussions", "save at risk", "winback"],
    },
    {
      id: "qbrs",
      tier: "A",
      label: "QBRs / executive reviews",
      patterns: ["qbr", "quarterly business review", "business reviews", "executive review", "ebrs"],
    },
    {
      id: "adoption_health",
      tier: "A",
      label: "Adoption / health scoring",
      patterns: ["adoption", "usage metrics", "engagement", "health score", "product usage", "product-led", "activation"],
    },
    {
      id: "expansion_upsell",
      tier: "A",
      label: "Expansion / upsell",
      patterns: ["expansion", "upsell", "cross-sell", "growth opportunities", "increase arr", "add seats"],
    },
    {
      id: "portfolio_management",
      tier: "A",
      label: "Customer portfolio ownership",
      patterns: ["portfolio", "book of business", "managed * customers", "owned accounts", "account coverage", "caseload"],
    },
    {
      id: "saas_b2b",
      tier: "A",
      label: "B2B SaaS experience",
      patterns: ["saas", "b2b", "subscription", "arr", "mrr", "product-led saas"],
    },

    {
      id: "stakeholder_management",
      tier: "B",
      label: "Stakeholder management",
      patterns: ["stakeholder", "cross-functional", "partnered with", "product", "engineering", "sales", "support"],
    },
    {
      id: "escalations_support",
      tier: "B",
      label: "Escalations / support",
      patterns: ["escalation", "escalations", "support", "incident", "issue resolution", "ticket"],
    },
    {
      id: "data_reporting",
      tier: "B",
      label: "Data analysis / reporting",
      patterns: ["data", "analy*", "report*", "dashboards", "kpis", "metrics"],
    },

    {
      id: "generic_keywords",
      tier: "C",
      label: "Generic words (down-weight)",
      patterns: ["role", "manager", "customer", "customers", "success"],
    },
  ],

  scoring: {
    // Capability-first scoring (required capabilities in JD define the denominator)
    tier_weights: { A: 8, B: 4, C: 0.5 },
    match_strength: {
      exact_phrase: 1.0,
      synonym_phrase: 0.9,
      tool_implies_category: 0.85,
      single_token_only: 0.4,
    },
    cap_generic_token_contribution: 3,

    // Grade thresholds (directional guidance)
    score_bands: {
      strong_min: 70,
      moderate_min: 50,
    },

    // Tier A coverage rule (prevents “Strong” with shallow coverage)
    tierA_coverage_for_strong: 0.6,
    tierA_min_hits_for_strong_floor: 2,

    // Skills are supporting only
    skills_floor_for_summary: 6,
    skills_cap_for_ui: 14,
  },

  evidence_ranking: {
    max_snippets_per_signal: 2,
    max_chars_per_snippet: 180,
    sentence_scoring: {
      contains_signal_or_synonym: 5,
      contains_action_verb: 2,
      contains_metric_number: 3,
      contains_tool_name: 2,
      is_in_experience_section: 3,
      is_in_summary_section: 1,
      is_in_contact_section: -10,
    },
    action_verbs: [
      "managed",
      "led",
      "reduced",
      "increased",
      "owned",
      "partnered",
      "conducted",
      "built",
      "improved",
      "trained",
      "monitored",
      "launched",
      "delivered",
      "implemented",
      "coordinated",
      "resolved",
      "drove",
    ],
  },

  hard_excludes_sections: ["name", "email", "phone", "address", "linkedin", "contact", "header"],

  // Style/context traits are preferences, not capabilities. Never penalize.
  style_context_terms: [
    "fast-paced",
    "fast paced",
    "high volume",
    "high-growth",
    "high growth",
    "startup",
    "start-up",
    "culture",
    "cultural",
    "collaborative",
    "self-starter",
    "self starter",
    "thrives",
    "dynamic",
    "ambiguity",
    "ambiguous",
    "wears many hats",
    "work hard play hard",
    "time zone",
    "timezone",
    "remote",
    "hybrid",
    "on-site",
    "onsite",
    "in office",
    "office",
  ],
};

function normalizeText(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}
function safeLower(s) {
  return normalizeText(s).toLowerCase();
}
function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// -----------------------------
// Variant-aware helpers
// -----------------------------
function normalizeTerm(term) {
  return String(term || "")
    .trim()
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ");
}

function looksAcronymLike(term) {
  const t = normalizeTerm(term).replace(/[^a-z]/g, "");
  return t.length >= 2 && t.length <= 6;
}

function buildVariantRegex(term) {
  const raw = normalizeTerm(term);
  if (!raw) return null;

  const tokens = raw.split(" ").filter(Boolean);
  const isPhrase = tokens.length > 1;

  const pluralSuffix = (w) => {
    const word = String(w || "");
    if (word.length < 3) return word;
    if (word.endsWith("y")) return `${word.slice(0, -1)}(?:y|ies)`;
    if (word.endsWith("s")) return `${word}(?:es)?`;
    return `${word}s?`;
  };

  if (!isPhrase) {
    const t = raw.replace(/\./g, "");
    const cleaned = t.replace(/[^a-z0-9+#./-]/g, "");
    if (!cleaned) return null;

    if (looksAcronymLike(cleaned) && /^[a-z]{2,6}$/.test(cleaned)) {
      return new RegExp(`\\b${escapeRegex(cleaned)}s?\\b`, "i");
    }

    if (/^[a-z]{3,}$/.test(cleaned)) {
      return new RegExp(`\\b${pluralSuffix(escapeRegex(cleaned))}\\b`, "i");
    }

    return new RegExp(`(?:^|[^a-z0-9])${escapeRegex(cleaned)}(?:$|[^a-z0-9])`, "i");
  }

  const head = tokens.slice(0, -1).map((t) => escapeRegex(t));
  const last = tokens[tokens.length - 1];
  const lastRe = pluralSuffix(escapeRegex(last));

  const sep = `[\\s\\-_/]+`;
  const phraseRe = [...head, lastRe].join(sep);

  return new RegExp(`\\b${phraseRe}\\b`, "i");
}

function patternToRegex(pattern) {
  const p = String(pattern || "").trim();
  if (!p) return null;

  if (p.includes(" * ")) {
    const parts = p.split(" * ").map((x) => x.trim()).filter(Boolean);
    const reParts = parts.map((x) => escapeRegex(x).replace(/\\\*/g, "\\w*"));
    return new RegExp(`\\b${reParts.join("\\b[\\s\\S]{0,60}\\b")}\\b`, "i");
  }

  if (p.includes("*")) {
    const re = escapeRegex(p).replace(/\\\*/g, "\\w*");
    return new RegExp(`\\b${re}\\b`, "i");
  }

  return buildVariantRegex(p) || new RegExp(`\\b${escapeRegex(p)}\\b`, "i");
}

// -----------------------------
// Section detection (evidence safety)
// -----------------------------
function looksLikeEmail(line) {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line || "");
}
function looksLikePhone(line) {
  return /(\+?\d[\d\s().-]{7,}\d)/.test(line || "");
}

function detectSection(line, current) {
  const l = safeLower(line);
  if (!l) return current;

  if (looksLikeEmail(line) || looksLikePhone(line)) return "contact";
  if (l.includes("linkedin.com") || l.startsWith("linkedin")) return "contact";
  if (l.startsWith("email") || l.startsWith("phone") || l.startsWith("address")) return "contact";

  if (/\b(summary|professional summary|profile)\b/.test(l)) return "summary";
  if (/\b(experience|work experience|employment|professional experience)\b/.test(l)) return "experience";
  if (/\b(education)\b/.test(l)) return "education";
  if (/\b(skills|technical skills|core skills)\b/.test(l)) return "skills";
  if (/\b(certifications|certificates)\b/.test(l)) return "certifications";

  return current;
}

function splitIntoRankableSentences(resumeText) {
  const raw = String(resumeText || "");
  const lines = raw.split(/\r?\n/);

  let section = "body";
  const items = [];

  const labeledLines = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] || "";
    section = detectSection(line, section);
    labeledLines.push({ line, section });
  }

  let buffer = "";
  let bufferSection = "body";

  function flushBuffer() {
    const text = normalizeText(buffer);
    if (!text) return;

    const parts = text
      .split(/(?<=[.!?])\s+|\n+/g)
      .map((x) => x.trim())
      .filter(Boolean);

    for (const p of parts) {
      items.push({
        text: p,
        section: bufferSection,
        lower: p.toLowerCase(),
      });
    }
    buffer = "";
  }

  for (const { line, section: s } of labeledLines) {
    const trimmed = String(line || "").trim();
    if (!trimmed) {
      flushBuffer();
      continue;
    }

    if (s !== bufferSection && buffer) flushBuffer();

    bufferSection = s;
    buffer += (buffer ? " " : "") + trimmed;
  }
  flushBuffer();

  return items;
}

// -----------------------------
// Matching plus evidence
// -----------------------------
function classifyMatchType(signalId, pattern) {
  const p = String(pattern || "").trim();
  const isSingleToken = !p.includes(" ");
  const hasWildcard = p.includes("*");

  if (signalId === "crm_tools") {
    return {
      match_type: "tool_implies_category",
      strength: SPEC.scoring.match_strength.tool_implies_category,
    };
  }

  if (!isSingleToken || hasWildcard) {
    return { match_type: "synonym_phrase", strength: SPEC.scoring.match_strength.synonym_phrase };
  }

  return { match_type: "single_token_only", strength: SPEC.scoring.match_strength.single_token_only };
}

function findSignalMatches(textLower, signals) {
  const matches = [];

  for (const sig of signals) {
    let best = null;

    for (const pat of sig.patterns || []) {
      const re = patternToRegex(pat);
      if (!re) continue;

      if (re.test(textLower)) {
        const type = classifyMatchType(sig.id, pat);

        const p = String(pat || "").trim();
        const hasWildcard = p.includes("*");
        const isSingleToken = !p.includes(" ");
        let match_type = type.match_type;
        let strength = type.strength;

        if (!hasWildcard && !isSingleToken && sig.id !== "crm_tools") {
          match_type = "exact_phrase";
          strength = SPEC.scoring.match_strength.exact_phrase;
        }

        const candidate = {
          signal_id: sig.id,
          label: sig.label,
          tier: sig.tier,
          strength,
          match_type,
          matched_pattern: p,
        };

        if (!best || candidate.strength > best.strength) best = candidate;
      }
    }

    if (best) matches.push(best);
  }

  return matches;
}

function scoreSentence(item, signal, allToolNames) {
  const s = SPEC.evidence_ranking.sentence_scoring;
  const verbs = SPEC.evidence_ranking.action_verbs;

  let score = 0;

  if (item.section === "experience") score += s.is_in_experience_section;
  else if (item.section === "summary") score += s.is_in_summary_section;
  else if (item.section === "contact" || item.section === "header") score += s.is_in_contact_section;

  const re = patternToRegex(signal.matched_pattern);
  if (re && re.test(item.text)) score += s.contains_signal_or_synonym;

  for (const v of verbs) {
    if (item.lower.includes(v)) {
      score += s.contains_action_verb;
      break;
    }
  }

  if (/\b\d+(\.\d+)?%?\b/.test(item.text)) score += s.contains_metric_number;

  for (const t of allToolNames) {
    if (t && item.lower.includes(t)) {
      score += s.contains_tool_name;
      break;
    }
  }

  return score;
}

function isBoilerplateEvidence(text) {
  const t = normalizeTerm(text);
  if (!t) return true;

  // Avoid quoting generic fluff that looks like a header or non-action summary
  const tooShort = t.length < 25;
  const looksHeaderish =
    /^[a-z0-9\s]+:$/.test(t) ||
    t.startsWith("professional summary") ||
    t.startsWith("skills") ||
    t.startsWith("education") ||
    t.startsWith("certifications");

  return tooShort || looksHeaderish;
}

function pickEvidenceForSignal(signalMatch, sentenceItems) {
  const maxSnips = SPEC.evidence_ranking.max_snippets_per_signal;
  const maxChars = SPEC.evidence_ranking.max_chars_per_snippet;

  const eligible = sentenceItems.filter((it) => it.section !== "contact" && it.section !== "header");

  const allToolNames =
    SPEC.signals.find((s) => s.id === "crm_tools")?.patterns?.map((x) => String(x || "").toLowerCase()) || [];

  const ranked = eligible
    .map((it) => ({ it, score: scoreSentence(it, signalMatch, allToolNames) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const snippets = [];
  const seen = new Set();

  for (const r of ranked) {
    const raw = r.it.text || "";
    const text = raw.length > maxChars ? `${raw.slice(0, Math.max(0, maxChars - 1))}…` : raw;
    const key = normalizeTerm(text);

    if (!text) continue;
    if (seen.has(key)) continue;
    if (isBoilerplateEvidence(text)) continue;

    // Evidence quality: prefer action plus context, metric or ownership when present
    // If it has no verb and no number and not in experience, skip
    const hasNumber = /\b\d+(\.\d+)?%?\b/.test(text);
    const hasVerb = SPEC.evidence_ranking.action_verbs.some((v) => normalizeTerm(text).includes(v));
    const inExperience = r.it.section === "experience";

    if (!hasVerb && !hasNumber && !inExperience) continue;

    seen.add(key);

    snippets.push({
      text,
      source: "Resume",
      section: r.it.section === "experience" ? "Experience" : r.it.section === "summary" ? "Summary" : "Other",
      confidence: Math.max(0, Math.min(1, (r.score || 0) / 10)),
    });

    if (snippets.length >= maxSnips) break;
  }

  if (!snippets.length) {
    return [
      {
        text: `Matched: ${signalMatch.label}`,
        source: "Resume",
        section: "Other",
        confidence: 0.5,
      },
    ];
  }

  return snippets;
}

// -----------------------------
// Capability-first evaluation (JD defines what matters)
// -----------------------------
function requiredSignalsFromJD(jdLower) {
  const jdSignals = findSignalMatches(jdLower, SPEC.signals).filter((m) => m.tier === "A" || m.tier === "B");
  const ids = new Set(jdSignals.map((m) => m.signal_id));

  const required =
    ids.size > 0
      ? SPEC.signals.filter((s) => (s.tier === "A" || s.tier === "B") && ids.has(s.id))
      : SPEC.signals.filter((s) => s.tier === "A" || s.tier === "B");

  required.sort((a, b) => {
    const ta = a.tier === "A" ? 0 : 1;
    const tb = b.tier === "A" ? 0 : 1;
    if (ta !== tb) return ta - tb;
    return String(a.label).localeCompare(String(b.label));
  });

  return required;
}

// ✅ NEW: JD sufficiency gate (prevents scoring on placeholder / empty JDs)
function jdSufficiency(jdText, jdLower) {
  const jd = String(jdText || "").trim();
  const lower = String(jdLower || "").trim();

  const charCount = jd.length;
  const wordCount = (lower.match(/\b[a-z0-9]+\b/g) || []).length;

  const abMatches = findSignalMatches(lower, SPEC.signals).filter((m) => m.tier === "A" || m.tier === "B");
  const abMatchCount = abMatches.length;

  // Placeholder patterns
  const looksPlaceholder =
    /\b(sample job description|not a real job posting|lorem ipsum|tbd|to be determined|placeholder)\b/i.test(jd);

  // Conservative: require some substance OR explicit A/B signal hits
  const hasEnoughText = charCount >= 240 && wordCount >= 35;
  const hasEnoughSignals = abMatchCount >= 2;

  const sufficient = !looksPlaceholder && (hasEnoughText || hasEnoughSignals);

  return {
    sufficient,
    looksPlaceholder,
    charCount,
    wordCount,
    abMatchCount,
  };
}

function computeCapabilityCoverageScore(requiredSignals, matchedSignals) {
  const weights = SPEC.scoring.tier_weights;

  const required = Array.isArray(requiredSignals) ? requiredSignals : [];
  const matched = Array.isArray(matchedSignals) ? matchedSignals : [];

  const requiredIds = new Set(required.map((r) => r.id));
  const requiredTierA = required.filter((r) => r.tier === "A");
  const requiredTierB = required.filter((r) => r.tier === "B");

  const denom = required.reduce((sum, s) => sum + (weights[s.tier] || 0), 0);

  let numerAB = 0;
  let numerC = 0;

  for (const m of matched) {
    if (!requiredIds.has(m.signal_id)) continue;

    const w = weights[m.tier] || 0;
    const strength = typeof m.strength === "number" ? m.strength : 0;

    const contrib = w * strength;
    if (m.tier === "C") numerC += contrib;
    else numerAB += contrib;
  }

  const cappedC = Math.min(numerC, SPEC.scoring.cap_generic_token_contribution);
  const raw = denom > 0 ? (100 * (numerAB + cappedC)) / denom : 0;

  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const tierAHit = matched.filter((m) => m.tier === "A" && requiredIds.has(m.signal_id)).length;
  const tierBHit = matched.filter((m) => m.tier === "B" && requiredIds.has(m.signal_id)).length;

  const tierATotal = requiredTierA.length;
  const tierBTotal = requiredTierB.length;

  const tierARequiredForStrong = Math.max(
    SPEC.scoring.tierA_min_hits_for_strong_floor,
    Math.ceil((tierATotal || 0) * SPEC.scoring.tierA_coverage_for_strong)
  );

  return {
    score,
    tierAHit,
    tierBHit,
    tierATotal,
    tierBTotal,
    tierARequiredForStrong,
  };
}

function gradeFrom(score, tierAHit, tierARequiredForStrong) {
  if (tierAHit >= tierARequiredForStrong && score >= SPEC.scoring.score_bands.strong_min) return "Strong";
  if (score >= SPEC.scoring.score_bands.moderate_min) return "Partial";
  return "Emerging";
}

function buildSummary({ grade, score, tierAHit, tierATotal, tierBHit, tierBTotal, skillsLine }) {
  const parts = [];
  parts.push(`${grade} alignment (${score}%).`);
  parts.push(
    `Capability coverage: matched ${tierAHit}/${tierATotal} core (Tier A) and ${tierBHit}/${tierBTotal} supporting (Tier B).`
  );
  if (skillsLine) parts.push(skillsLine);
  return parts.join(" ");
}

// -----------------------------
// Skills (supporting only) with suppression and clustering
// -----------------------------
function isStyleContextTerm(term) {
  const t = normalizeTerm(term);
  if (!t) return false;

  // Exact or contains check, but keep it conservative
  for (const s of SPEC.style_context_terms) {
    const st = normalizeTerm(s);
    if (!st) continue;
    if (t === st) return true;
    if (t.includes(st)) return true;
  }
  return false;
}

function extractJDSkills(jobDescriptionText) {
  // Deterministic extraction for chips only (supporting scan; not used for punitive gaps)
  // Style/context terms are separated and never become gaps.
  const jdRaw = String(jobDescriptionText || "");
  const jd = safeLower(jdRaw);

  const rawTokens = jd.match(/[a-z0-9+#./-]{2,}/g) || [];

  const stop = new Set([
    "and",
    "or",
    "the",
    "a",
    "an",
    "to",
    "for",
    "of",
    "in",
    "on",
    "with",
    "as",
    "at",
    "by",
    "from",
    "into",
    "experience",
    "preferred",
    "requirements",
    "responsible",
    "responsibilities",
    "ability",
    "skills",
    "skill",
    "years",
    "year",
    "role",
    "team",
    "teams",
    "work",
    "working",
    "knowledge",
    "strong",
    "excellent",
    "including",
    "within",
    "across",
    "will",
    "must",
    "should",
    "may",
    "plus",
  ]);

  const allow = new Set([
    "salesforce",
    "gainsight",
    "hubspot",
    "zendesk",
    "freshdesk",
    "dynamics",
    "pipedrive",
    "crm",
    "servicenow",
    "jira",
    "confluence",
    "sql",
    "python",
    "javascript",
    "typescript",
    "react",
    "node",
    "aws",
    "azure",
    "gcp",
    "excel",
    "powerbi",
    "tableau",
    "snowflake",
    "postgres",
    "postgresql",
    "mongodb",
    "redis",
    "intune",
    "jamf",
    "okta",
    "sso",
    "scim",
    "api",
    "apis",
    "rest",
    "graphql",
    "kpi",
    "kpis",
    "qbr",
    "qbrs",
    "sop",
    "sops",
    "mrr",
    "arr",
  ]);

  const acronyms = [];
  const ac = jdRaw.match(/\b[A-Z]{2,6}s?\b/g) || [];
  for (const a of ac) {
    const t = String(a || "").trim();
    if (!t) continue;
    const low = t.toLowerCase();
    if (/^[a-z]{2,6}s?$/.test(low)) acronyms.push(low);
  }

  const singles = [];
  for (const t of rawTokens) {
    const tok = t.toLowerCase().replace(/^[^\w+#]+|[^\w+#]+$/g, "");
    if (!tok) continue;
    if (stop.has(tok)) continue;

    if (allow.has(tok)) {
      singles.push(tok);
      continue;
    }

    const techy =
      tok.length >= 3 &&
      /[a-z]/.test(tok) &&
      (tok.includes("#") || tok.includes("+") || tok.includes(".") || tok.includes("-") || tok.includes("/"));

    if (techy) singles.push(tok);
  }

  const phrases = [];
  const phrasePatterns = [
    "customer success",
    "account management",
    "project management",
    "stakeholder management",
    "data analysis",
    "business analysis",
    "change management",
    "client success",
    "customer onboarding",
    "health score",
    "quarterly business review",
    "qbr",
  ];
  for (const p of phrasePatterns) {
    if (jd.includes(p)) phrases.push(p);
  }

  const combined = Array.from(new Set([...singles, ...phrases, ...acronyms])).filter(Boolean).slice(0, 28);

  const skills = [];
  const context = [];

  for (const item of combined) {
    if (isStyleContextTerm(item)) context.push(normalizeTerm(item));
    else skills.push(normalizeTerm(item));
  }

  return {
    skills: Array.from(new Set(skills)).filter(Boolean),
    context: Array.from(new Set(context)).filter(Boolean),
  };
}

function mapSkillToCapabilityId(skillTerm) {
  const t = normalizeTerm(skillTerm);
  if (!t) return null;

  for (const s of SPEC.signals) {
    if (s.tier !== "A" && s.tier !== "B") continue;
    for (const p of s.patterns || []) {
      const patClean = normalizeTerm(String(p || "").replace(/\*/g, ""));
      if (!patClean) continue;

      if (t === patClean) return s.id;
      if (t.includes(patClean) || patClean.includes(t)) return s.id;

      const re = buildVariantRegex(patClean);
      if (re && re.test(t)) return s.id;
    }
  }

  return null;
}

function clusterKeyForSkill(skillTerm) {
  // Collapse synonyms, acronyms, tools, and categories into clusters for counting
  // Chips still show original terms, but summary counts are based on clusters.
  const t = normalizeTerm(skillTerm);
  if (!t) return null;

  // Capabilities
  const cap = mapSkillToCapabilityId(t);
  if (cap) return `cap:${cap}`;

  // Explicit clusters
  if (/\bqbrs?\b/.test(t) || t.includes("quarterly business review") || t.includes("business review") || t.includes("executive review")) {
    return "cluster:qbrs";
  }
  if (t.includes("health score") || t.includes("usage metrics") || t.includes("product usage") || t.includes("adoption") || t.includes("engagement")) {
    return "cluster:adoption_health";
  }
  if (t.includes("onboarding") || t.includes("enablement") || t.includes("rollout") || t.includes("go-live") || t.includes("implementation") || t.includes("implement")) {
    return "cluster:onboarding_training";
  }
  if (t.includes("renewal") || t.includes("retention") || t.includes("churn") || t.includes("winback") || t.includes("save at risk")) {
    return "cluster:retention_churn";
  }
  if (t.includes("upsell") || t.includes("cross-sell") || t.includes("expansion") || t.includes("increase arr") || t.includes("add seats")) {
    return "cluster:expansion_upsell";
  }
  if (t.includes("portfolio") || t.includes("book of business") || t.includes("owned accounts") || t.includes("caseload") || t.includes("managed")) {
    return "cluster:portfolio_management";
  }

  // CRM tools collapse to one cluster
  const crmTools = SPEC.signals.find((x) => x.id === "crm_tools")?.patterns || [];
  for (const tool of crmTools) {
    const re = buildVariantRegex(tool);
    if (re && re.test(t)) return "cluster:crm_tools";
  }

  // KPIs and data reporting cluster
  if (/\bkpis?\b/.test(t) || t.includes("dashboard") || t.includes("metrics") || t.includes("report") || t.includes("data analysis") || t.includes("analytics")) {
    return "cluster:data_reporting";
  }

  // Default cluster is the normalized term itself
  return `term:${t}`;
}

function computeSkillsChips(jdSkills, resumeLower, matchedSignalIds) {
  const list = Array.isArray(jdSkills) ? jdSkills : [];
  const matched = [];
  const notYet = [];

  const crmMatched = matchedSignalIds.has("crm_tools");

  for (const s of list) {
    const skill = normalizeTerm(s);
    if (!skill) continue;

    // If the skill maps to a matched capability, never treat it as "not yet"
    const cap = mapSkillToCapabilityId(skill);
    if (cap && matchedSignalIds.has(cap)) {
      matched.push(skill);
      continue;
    }

    // CRM category satisfied, suppress tool inventory "missing tools"
    if (crmMatched) {
      const toolNames = SPEC.signals.find((x) => x.id === "crm_tools")?.patterns || [];
      const isCRMLike = toolNames.some((tn) => {
        const re = buildVariantRegex(tn);
        return re ? re.test(skill) : false;
      });
      if (isCRMLike) {
        matched.push(skill);
        continue;
      }
    }

    const re = buildVariantRegex(skill);
    if (re && re.test(resumeLower)) matched.push(skill);
    else notYet.push(skill);
  }

  // Final suppression pass: if a Tier A or B capability is matched, suppress related skill gaps by cluster
  const matchedClusters = new Set(matched.map((x) => clusterKeyForSkill(x)).filter(Boolean));
  const suppressedNotYet = [];

  for (const g of notYet) {
    const ck = clusterKeyForSkill(g);
    if (!ck) continue;

    // If cluster is already covered, do not list as not yet
    if (matchedClusters.has(ck)) continue;

    // If cluster maps to a matched capability, suppress
    const cap = mapSkillToCapabilityId(g);
    if (cap && matchedSignalIds.has(cap)) continue;

    // If CRM category is matched, suppress any CRM cluster gap
    if (crmMatched && ck === "cluster:crm_tools") continue;

    suppressedNotYet.push(g);
  }

  // Keep chips stable and readable
  const matchedUnique = Array.from(new Set(matched)).slice(0, SPEC.scoring.skills_cap_for_ui);
  const notYetUnique = Array.from(new Set(suppressedNotYet)).slice(0, SPEC.scoring.skills_cap_for_ui);

  // Cluster counts for summary, not for punitive behavior
  const matchedClusterCount = new Set(matchedUnique.map((x) => clusterKeyForSkill(x)).filter(Boolean)).size;
  const totalClusterCount = new Set(list.map((x) => clusterKeyForSkill(x)).filter(Boolean)).size;

  return {
    matched: matchedUnique,
    notYet: notYetUnique,
    clusterMatched: matchedClusterCount,
    clusterTotal: totalClusterCount,
    total: Math.min(list.length, 999),
  };
}

// -----------------------------
// Transferable strengths
// -----------------------------
function buildTransferableStrengths(matchedSignals, tierAHit, tierATotal) {
  const ids = new Set((matchedSignals || []).map((m) => m.signal_id));
  const transferables = [];

  if (ids.has("portfolio_management")) transferables.push("Account ownership discipline translates well to CS lifecycle management.");
  if (ids.has("data_reporting")) transferables.push("Data fluency supports adoption, health scoring, and executive storytelling.");
  if (ids.has("stakeholder_management")) transferables.push("Cross-functional partnership supports durable renewals and expansion.");
  if (ids.has("escalations_support")) transferables.push("High-stakes issue resolution improves retention and customer trust.");
  if (ids.has("onboarding_training")) transferables.push("Enablement experience accelerates time-to-value for new customers.");
  if (ids.has("crm_tools")) transferables.push("Customer systems fluency supports scalable process and consistent execution.");

  const tierACoverage = tierATotal > 0 ? tierAHit / tierATotal : 0;
  if (transferables.length === 0 && tierACoverage >= SPEC.scoring.tierA_coverage_for_strong) {
    transferables.push("Demonstrated core lifecycle ownership and likely to ramp quickly even when tools or process differ.");
  }

  return transferables.slice(0, 3);
}

// -----------------------------
// Main explain builder
// -----------------------------
function buildExplain(resumeText, jobDescription) {
  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);

  const resumeLower = resume.toLowerCase();
  const jdLower = jd.toLowerCase();

  const sentenceItems = splitIntoRankableSentences(resume);

  // ✅ NEW: JD sufficiency check BEFORE we create any “requirements” / “not yet demonstrated”
  const jdGate = jdSufficiency(jd, jdLower);

  // Candidate capabilities matched against resume only (always safe to compute)
  const matchedSignalsAll = findSignalMatches(resumeLower, SPEC.signals);
  const matchedSignals = matchedSignalsAll.filter((m) => m.tier === "A" || m.tier === "B");
  const matchedSignalIds = new Set(matchedSignals.map((m) => m.signal_id));

  // Skills chips (supporting scan) – only meaningful when JD is sufficient, but safe to compute
  const jdExtracted = extractJDSkills(jd);
  const jdSkills = Array.isArray(jdExtracted?.skills) ? jdExtracted.skills : [];
  const contextNotYet = Array.isArray(jdExtracted?.context) ? jdExtracted.context : [];

  const skillsChips = computeSkillsChips(jdSkills, resumeLower, matchedSignalIds);

  // Transferables (resume-only)
  const transferable = buildTransferableStrengths(matchedSignals, matchedSignals.filter((m) => m.tier === "A").length, matchedSignals.filter((m) => m.tier === "A").length);

  // ✅ If JD is insufficient, DO NOT score and DO NOT generate “not yet demonstrated”
  if (!jdGate.sufficient) {
    const disclaimer =
      "WHY provides directional guidance to support recruiter judgment. This evaluation requires a sufficiently detailed job description to determine role requirements.";

    const summary =
      "Needs job description detail. Add responsibilities, required tools/processes, and outcomes to run an evidence-based comparison.";

    return {
      score: null,
      grade: "Needs JD",
      summary,
      disclaimer,

      // Keep these present, but neutral
      reasons: [],
      skills: {
        matched: skillsChips.matched,
        gaps: [], // do not show “gaps” when JD is not sufficient
        transferable,
      },
      strengths: matchedSignals.map((m) => m.label).slice(0, 12),
      gaps: [],

      interviewQuestions: {
        behavioral: [
          "Tell me about a time you handled competing priorities under a tight deadline. What did you prioritize and why?",
          "Describe a process you improved. What changed and what was the impact?",
          "How do you communicate when expectations shift or a customer’s needs change midstream?",
        ],
        occupational: [
          "Share an example of delivering outcomes in a similar role. What was your ownership and what changed as a result?",
          "What tools or workflows do you typically use to manage customer lifecycle work?",
        ],
      },

      _debug: {
        jd_sufficiency: jdGate,
        context_not_yet_demonstrated: contextNotYet,
      },

      match: { score: null, grade: "Needs JD", summary, disclaimer },

      signals: {
        required: [],
        matched: matchedSignals.map((m) => ({
          signal_id: m.signal_id,
          label: m.label,
          tier: m.tier,
          strength: m.strength,
          match_type: m.match_type,
          evidence: pickEvidenceForSignal(m, sentenceItems),
        })),
        not_yet_demonstrated: [],
        context_not_yet_demonstrated: contextNotYet,
        transferable,
      },
    };
  }

  // 1) Determine what matters from JD (ONLY when sufficient)
  const requiredSignals = requiredSignalsFromJD(jdLower);

  // 2) Score on required-only denominator
  const cov = computeCapabilityCoverageScore(requiredSignals, matchedSignals);
  const grade = gradeFrom(cov.score, cov.tierAHit, cov.tierARequiredForStrong);

  // 3) Not yet demonstrated capabilities (ONLY required with no evidence)
  const notYetDemonstratedSignals = requiredSignals
    .filter((s) => !matchedSignalIds.has(s.id))
    .map((s) => ({
      signal_id: s.id,
      label: s.label,
      tier: s.tier,
      why_missing: "Not yet demonstrated in the provided resume text.",
    }));

  // 4) Skill summary line uses cluster normalization and stays non-punitive
  const skillsLine =
    (skillsChips.total >= SPEC.scoring.skills_floor_for_summary || skillsChips.clusterTotal >= SPEC.scoring.skills_floor_for_summary)
      ? `Supporting coverage: ${skillsChips.clusterMatched}/${Math.max(1, skillsChips.clusterTotal)} skill clusters present.`
      : null;

  const summary = buildSummary({
    grade,
    score: cov.score,
    tierAHit: cov.tierAHit,
    tierATotal: cov.tierATotal,
    tierBHit: cov.tierBHit,
    tierBTotal: cov.tierBTotal,
    skillsLine,
  });

  const disclaimer =
    "WHY provides directional guidance to support recruiter judgment. It does not make hiring decisions, and it may miss context if the resume text is incomplete.";

  // 5) Reasons with best evidence
  const reasons = matchedSignals
    .slice()
    .sort((a, b) => {
      const wa = SPEC.scoring.tier_weights[a.tier] || 0;
      const wb = SPEC.scoring.tier_weights[b.tier] || 0;
      if (wb !== wa) return wb - wa;
      return (b.strength || 0) - (a.strength || 0);
    })
    .slice(0, 10)
    .map((m) => ({
      requirement: m.label,
      evidence: pickEvidenceForSignal(m, sentenceItems),
    }));

  // 6) Interview questions
  const behavioral = [
    "Tell me about a time you handled competing priorities under a tight deadline. What did you prioritize and why?",
    "Describe a process you improved. What changed and what was the impact?",
    "How do you communicate when expectations shift or a customer’s needs change midstream?",
  ];

  const occupational = []
    .concat(
      matchedSignals.slice(0, 3).map((m) => `Walk me through a real example where you delivered outcomes in ${m.label}.`),
      notYetDemonstratedSignals
        .slice(0, 2)
        .map((g) => `If this role needs ${g.label}, how would you ramp quickly and demonstrate results in the first 30–60 days?`)
    )
    .slice(0, 6);

  // Backward-compatible fields
  const strengths = matchedSignals.map((m) => m.label).slice(0, 12);
  const gapsLabels = notYetDemonstratedSignals.map((g) => g.label).slice(0, 12);

  const skills = {
    matched: skillsChips.matched,
    gaps: skillsChips.notYet, // backward-compatible key; treated as non-punitive "not yet demonstrated"
    transferable,
  };

  return {
    score: cov.score,
    grade,
    summary,
    disclaimer,

    reasons,
    skills,
    strengths,
    gaps: gapsLabels,
    interviewQuestions: { behavioral, occupational },

    // Debug-friendly
    _debug: {
      jd_sufficiency: jdGate,
      requiredSignals: requiredSignals.map((s) => ({ id: s.id, tier: s.tier, label: s.label })),
      tierARequiredForStrong: cov.tierARequiredForStrong,
      tierAHit: cov.tierAHit,
      tierATotal: cov.tierATotal,
      tierBHit: cov.tierBHit,
      tierBTotal: cov.tierBTotal,
      skillsMatched: skillsChips.matched.length,
      skillsNotYet: skillsChips.notYet.length,
      skillsClusterMatched: skillsChips.clusterMatched,
      skillsClusterTotal: skillsChips.clusterTotal,
      context_not_yet_demonstrated: contextNotYet,
    },

    // Clean schema
    match: { score: cov.score, grade, summary, disclaimer },
    signals: {
      required: requiredSignals.map((s) => ({ signal_id: s.id, label: s.label, tier: s.tier })),
      matched: matchedSignals.map((m) => ({
        signal_id: m.signal_id,
        label: m.label,
        tier: m.tier,
        strength: m.strength,
        match_type: m.match_type,
        evidence: pickEvidenceForSignal(m, sentenceItems),
      })),
      not_yet_demonstrated: notYetDemonstratedSignals,

      // New neutral bucket. Never punitive.
      context_not_yet_demonstrated: contextNotYet,

      transferable,
    },
  };
}

async function bestEffortPersistRun({
  recruiterUserId,
  accountKey,
  jobDescriptionText,
  resumeText,
  result,
  jobId = null,
  applicationId = null,
  candidateUserId = null,
  externalName = null,
  externalEmail = null,
}) {
  if (!prisma || !prisma.recruiterExplainRun) return;

  try {
    await prisma.recruiterExplainRun.create({
      data: {
        recruiterUserId,
        accountKey: accountKey || "UNKNOWN",
        jobId: jobId || null,
        applicationId: applicationId || null,
        candidateUserId: candidateUserId || null,
        externalName: externalName || null,
        externalEmail: externalEmail || null,
        jobDescriptionText,
        resumeText,
        score: typeof result?.score === "number" ? result.score : null,
        summary: result?.summary || null,
        result,
      },
    });
  } catch (e) {
    console.error("[RecruiterExplain] persist failed (safe to ignore pre-migration):", e);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { resumeText, jobDescription, jobId, applicationId, candidateUserId, externalName, externalEmail } =
    req.body || {};

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeText or jobDescription" });
  }

  const recruiterUserId = session?.user?.id;
  if (!recruiterUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let accountKey = session?.user?.accountKey || null;

  if (!accountKey) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: recruiterUserId },
        select: { accountKey: true },
      });
      accountKey = u?.accountKey || null;
    } catch (e) {
      console.error("[RecruiterExplain] accountKey lookup failed:", e);
    }
  }

  const result = buildExplain(resumeText, jobDescription);

  await bestEffortPersistRun({
    recruiterUserId,
    accountKey,
    jobDescriptionText: normalizeText(jobDescription),
    resumeText: normalizeText(resumeText),
    result,
    jobId: jobId ?? null,
    applicationId: applicationId ?? null,
    candidateUserId: candidateUserId ?? null,
    externalName: externalName ?? null,
    externalEmail: externalEmail ?? null,
  });

  return res.status(200).json(result);
}
