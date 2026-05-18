// lib/intelligence/whyEngine.js — built May 18 2026
//
// ForgeTomorrow WHY Engine — shared capability-first alignment intelligence
// Extracted from pages/api/recruiter/explain.js
//
// This is the single source of truth for resume vs JD alignment scoring.
// No React. No HTTP. No Prisma. Pure functions only.
//
// Used by:
//   - pages/api/recruiter/explain.js (recruiter packet + External Compare)
//   - pages/api/jobs/check-fit.js (seeker Check My Alignment)
//
// Do NOT add HTTP handlers, Prisma calls, or Next.js dependencies here.

import { UNIVERSAL_SIGNALS } from "@/lib/intelligence/whyTaxonomy";

const SPEC = {
  signals: UNIVERSAL_SIGNALS,
  tiers: {
    A: { weight: 8, description: "core outcomes + lifecycle + tools" },
    B: { weight: 4, description: "supporting responsibilities" },
    C: { weight: 0.5, description: "generic tokens (mostly ignore)" },
  },
  
  scoring: {
    tier_weights: { A: 8, B: 4, C: 0.5 },
    match_strength: {
      exact_phrase: 1.0,
      synonym_phrase: 0.9,
      tool_implies_category: 0.85,
      single_token_only: 0.4,
    },
    cap_generic_token_contribution: 3,
    score_bands: { strong_min: 70, moderate_min: 50 },
    tierA_coverage_for_strong: 0.6,
    tierA_min_hits_for_strong_floor: 2,
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
      "managed", "led", "reduced", "increased", "owned", "partnered",
      "conducted", "built", "improved", "trained", "monitored", "launched",
      "delivered", "implemented", "coordinated", "resolved", "drove",
    ],
  },
  hard_excludes_sections: ["name", "email", "phone", "address", "externalurl", "contact", "header"],
  style_context_terms: [
    "fast-paced", "fast paced", "high volume", "high-growth", "high growth",
    "startup", "start-up", "culture", "cultural", "collaborative", "self-starter",
    "self starter", "thrives", "dynamic", "ambiguity", "ambiguous", "wears many hats",
    "work hard play hard", "time zone", "timezone", "remote", "hybrid", "on-site",
    "onsite", "in office", "office",
  ],
};

// ─── Text helpers ─────────────────────────────────────────────────────────────

function normalizeText(input) {
  return String(input || "").replace(/\s+/g, " ").trim();
}

function safeLower(input) {
  return normalizeText(input).toLowerCase();
}

function escapeRegex(input) {
  return String(input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTerm(term) {
  return String(term || "")
    .trim()
    .toLowerCase()
    .replace(/[\u201C\u201D\u2018\u2019"']/g, "")
    .replace(/\s+/g, " ");
}

function looksAcronymLike(term) {
  const cleaned = normalizeTerm(term).replace(/[^a-z]/g, "");
  return cleaned.length >= 2 && cleaned.length <= 6;
}

function buildVariantRegex(term) {
  const raw = normalizeTerm(term);
  if (!raw) return null;
  const tokens = raw.split(" ").filter(Boolean);
  const isPhrase = tokens.length > 1;

  const pluralSuffix = (word) => {
    const wordStr = String(word || "");
    if (wordStr.length < 3) return wordStr;
    if (wordStr.endsWith("y")) return `${wordStr.slice(0, -1)}(?:y|ies)`;
    if (wordStr.endsWith("s")) return `${wordStr}(?:es)?`;
    return `${wordStr}s?`;
  };

  if (!isPhrase) {
    const rawNoDots = raw.replace(/\./g, "");
    const cleaned = rawNoDots.replace(/[^a-z0-9+#./-]/g, "");
    if (!cleaned) return null;
    if (looksAcronymLike(cleaned) && /^[a-z]{2,6}$/.test(cleaned)) {
      return new RegExp(`\\b${escapeRegex(cleaned)}s?\\b`, "i");
    }
    if (/^[a-z]{3,}$/.test(cleaned)) {
      return new RegExp(`\\b${pluralSuffix(escapeRegex(cleaned))}\\b`, "i");
    }
    return new RegExp(`(?:^|[^a-z0-9])${escapeRegex(cleaned)}(?:$|[^a-z0-9])`, "i");
  }

  const headTokens = tokens.slice(0, -1).map((tok) => escapeRegex(tok));
  const lastToken = tokens[tokens.length - 1];
  const lastRe = pluralSuffix(escapeRegex(lastToken));
  const sep = "[\\s\\-_/]+";
  const phraseRe = [...headTokens, lastRe].join(sep);
  return new RegExp(`\\b${phraseRe}\\b`, "i");
}

function patternToRegex(pattern) {
  const pat = String(pattern || "").trim();
  if (!pat) return null;
  if (pat.includes(" * ")) {
    const parts = pat.split(" * ").map((part) => part.trim()).filter(Boolean);
    const reParts = parts.map((part) => escapeRegex(part).replace(/\\\*/g, "\\w*"));
    return new RegExp(`\\b${reParts.join("\\b[\\s\\S]{0,60}\\b")}\\b`, "i");
  }
  if (pat.includes("*")) {
    const reStr = escapeRegex(pat).replace(/\\\*/g, "\\w*");
    return new RegExp(`\\b${reStr}\\b`, "i");
  }
  return buildVariantRegex(pat) || new RegExp(`\\b${escapeRegex(pat)}\\b`, "i");
}

// ─── Section detection ────────────────────────────────────────────────────────

function looksLikeEmail(line) {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line || "");
}

function looksLikePhone(line) {
  return /(\+?\d[\d\s().-]{7,}\d)/.test(line || "");
}

function detectSection(line, currentSection) {
  const lower = safeLower(line);
  if (!lower) return currentSection;
  if (looksLikeEmail(line) || looksLikePhone(line)) return "contact";
  if (lower.includes("linkedin.com") || lower.startsWith("linkedin")) return "contact";
  if (lower.startsWith("email") || lower.startsWith("phone") || lower.startsWith("address")) return "contact";
  if (/\b(summary|professional summary|profile)\b/.test(lower)) return "summary";
  if (/\b(experience|work experience|employment|professional experience)\b/.test(lower)) return "experience";
  if (/\b(education)\b/.test(lower)) return "education";
  if (/\b(skills|technical skills|core skills)\b/.test(lower)) return "skills";
  if (/\b(certifications|certificates)\b/.test(lower)) return "certifications";
  return currentSection;
}

function splitIntoRankableSentences(resumeText) {
  const rawText = String(resumeText || "");
  const lines = rawText.split(/\r?\n/);
  let currentSection = "body";
  const sentenceItems = [];
  const labeledLines = [];

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx] || "";
    currentSection = detectSection(line, currentSection);
    labeledLines.push({ line, section: currentSection });
  }

  let buffer = "";
  let bufferSection = "body";

  function flushBuffer() {
    const text = normalizeText(buffer);
    if (!text) return;
    const parts = text
      .split(/(?<=[.!?])\s+|\n+/g)
      .map((part) => part.trim())
      .filter(Boolean);
    for (const part of parts) {
      sentenceItems.push({ text: part, section: bufferSection, lower: part.toLowerCase() });
    }
    buffer = "";
  }

  for (const { line, section: lineSection } of labeledLines) {
    const trimmed = String(line || "").trim();
    if (!trimmed) { flushBuffer(); continue; }
    if (lineSection !== bufferSection && buffer) flushBuffer();
    bufferSection = lineSection;
    buffer += (buffer ? " " : "") + trimmed;
  }
  flushBuffer();
  return sentenceItems;
}

// ─── Signal matching ──────────────────────────────────────────────────────────

function classifyMatchType(signalId, pattern) {
  const pat = String(pattern || "").trim();
  const isSingleToken = !pat.includes(" ");
  const hasWildcard = pat.includes("*");
  if (signalId === "crm_tools") {
    return { match_type: "tool_implies_category", strength: SPEC.scoring.match_strength.tool_implies_category };
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
      const regex = patternToRegex(pat);
      if (!regex) continue;
      if (regex.test(textLower)) {
        const matchType = classifyMatchType(sig.id, pat);
        const patStr = String(pat || "").trim();
        const hasWildcard = patStr.includes("*");
        const isSingleToken = !patStr.includes(" ");
        let matchTypeFinal = matchType.match_type;
        let strengthFinal = matchType.strength;
        if (!hasWildcard && !isSingleToken && sig.id !== "crm_tools") {
          matchTypeFinal = "exact_phrase";
          strengthFinal = SPEC.scoring.match_strength.exact_phrase;
        }
        const candidate = {
          signal_id: sig.id,
          label: sig.label,
          tier: sig.tier,
          strength: strengthFinal,
          match_type: matchTypeFinal,
          matched_pattern: patStr,
        };
        if (!best || candidate.strength > best.strength) best = candidate;
      }
    }
    if (best) matches.push(best);
  }
  return matches;
}

function scoreSentence(sentenceItem, signalMatch, allToolNames) {
  const sentenceScoring = SPEC.evidence_ranking.sentence_scoring;
  const actionVerbs = SPEC.evidence_ranking.action_verbs;
  let score = 0;

  if (sentenceItem.section === "experience") score += sentenceScoring.is_in_experience_section;
  else if (sentenceItem.section === "summary") score += sentenceScoring.is_in_summary_section;
  else if (sentenceItem.section === "contact" || sentenceItem.section === "header") score += sentenceScoring.is_in_contact_section;

  const regex = patternToRegex(signalMatch.matched_pattern);
  if (regex && regex.test(sentenceItem.text)) score += sentenceScoring.contains_signal_or_synonym;

  for (const verb of actionVerbs) {
    if (sentenceItem.lower.includes(verb)) { score += sentenceScoring.contains_action_verb; break; }
  }

  if (/\b\d+(\.\d+)?%?\b/.test(sentenceItem.text)) score += sentenceScoring.contains_metric_number;

  for (const toolName of allToolNames) {
    if (toolName && sentenceItem.lower.includes(toolName)) { score += sentenceScoring.contains_tool_name; break; }
  }

  return score;
}

function isBoilerplateEvidence(text) {
  const normalizedText = normalizeTerm(text);
  if (!normalizedText) return true;
  const tooShort = normalizedText.length < 25;
  const looksHeaderish =
    /^[a-z0-9\s]+:$/.test(normalizedText) ||
    normalizedText.startsWith("professional summary") ||
    normalizedText.startsWith("skills") ||
    normalizedText.startsWith("education") ||
    normalizedText.startsWith("certifications");
  return tooShort || looksHeaderish;
}

function pickEvidenceForSignal(signalMatch, sentenceItems) {
  const maxSnips = SPEC.evidence_ranking.max_snippets_per_signal;
  const maxChars = SPEC.evidence_ranking.max_chars_per_snippet;
  const eligible = sentenceItems.filter((item) => item.section !== "contact" && item.section !== "header");
  const crmSignal = SPEC.signals.find((sig) => sig.id === "crm_tools");
  const allToolNames = crmSignal?.patterns?.map((pat) => String(pat || "").toLowerCase()) || [];

  const ranked = eligible
    .map((item) => ({ item, score: scoreSentence(item, signalMatch, allToolNames) }))
    .filter((entry) => entry.score > 0)
    .sort((entryA, entryB) => entryB.score - entryA.score);

  const snippets = [];
  const seen = new Set();

  for (const entry of ranked) {
    const rawText = entry.item.text || "";
    const text = rawText.length > maxChars ? `${rawText.slice(0, Math.max(0, maxChars - 1))}…` : rawText;
    const key = normalizeTerm(text);
    if (!text) continue;
    if (seen.has(key)) continue;
    if (isBoilerplateEvidence(text)) continue;
    const hasNumber = /\b\d+(\.\d+)?%?\b/.test(text);
    const hasVerb = SPEC.evidence_ranking.action_verbs.some((verb) => normalizeTerm(text).includes(verb));
    const inExperience = entry.item.section === "experience";
    if (!hasVerb && !hasNumber && !inExperience) continue;
    seen.add(key);
    snippets.push({
      text,
      source: "Resume",
      section: entry.item.section === "experience" ? "Experience" : entry.item.section === "summary" ? "Summary" : "Other",
      confidence: Math.max(0, Math.min(1, (entry.score || 0) / 10)),
    });
    if (snippets.length >= maxSnips) break;
  }

  if (!snippets.length) {
    return [{ text: `Matched: ${signalMatch.label}`, source: "Resume", section: "Other", confidence: 0.5 }];
  }
  return snippets;
}

// ─── JD analysis ─────────────────────────────────────────────────────────────

function requiredSignalsFromJD(jdLower) {
  const jdSignals = findSignalMatches(jdLower, SPEC.signals).filter((match) => match.tier === "A" || match.tier === "B");
  const ids = new Set(jdSignals.map((match) => match.signal_id));
  const required =
    ids.size > 0
      ? SPEC.signals.filter((sig) => (sig.tier === "A" || sig.tier === "B") && ids.has(sig.id))
      : SPEC.signals.filter((sig) => sig.tier === "A" || sig.tier === "B");
  required.sort((sigA, sigB) => {
    const rankA = sigA.tier === "A" ? 0 : 1;
    const rankB = sigB.tier === "A" ? 0 : 1;
    if (rankA !== rankB) return rankA - rankB;
    return String(sigA.label).localeCompare(String(sigB.label));
  });
  return required;
}

function jdSufficiency(jdText, jdLower) {
  const jd = String(jdText || "").trim();
  const lower = String(jdLower || "").trim();
  const charCount = jd.length;
  const wordCount = (lower.match(/\b[a-z0-9]+\b/g) || []).length;
  const abMatches = findSignalMatches(lower, SPEC.signals).filter((match) => match.tier === "A" || match.tier === "B");
  const abMatchCount = abMatches.length;
  const looksPlaceholder =
    /\b(sample job description|not a real job posting|lorem ipsum|tbd|to be determined|placeholder)\b/i.test(jd);
  const hasEnoughText = charCount >= 240 && wordCount >= 35;
  const hasEnoughSignals = abMatchCount >= 2;
  const sufficient = !looksPlaceholder && (hasEnoughText || hasEnoughSignals);
  return { sufficient, looksPlaceholder, charCount, wordCount, abMatchCount };
}

function computeCapabilityCoverageScore(requiredSignals, matchedSignals) {
  const weights = SPEC.scoring.tier_weights;
  const required = Array.isArray(requiredSignals) ? requiredSignals : [];
  const matched = Array.isArray(matchedSignals) ? matchedSignals : [];
  const requiredIds = new Set(required.map((sig) => sig.id));
  const requiredTierA = required.filter((sig) => sig.tier === "A");
  const requiredTierB = required.filter((sig) => sig.tier === "B");
  const denom = required.reduce((sum, sig) => sum + (weights[sig.tier] || 0), 0);
  let numerAB = 0;
  let numerC = 0;

  for (const match of matched) {
    if (!requiredIds.has(match.signal_id)) continue;
    const weight = weights[match.tier] || 0;
    const strength = typeof match.strength === "number" ? match.strength : 0;
    const contrib = weight * strength;
    if (match.tier === "C") numerC += contrib;
    else numerAB += contrib;
  }

  const cappedC = Math.min(numerC, SPEC.scoring.cap_generic_token_contribution);
  const raw = denom > 0 ? (100 * (numerAB + cappedC)) / denom : 0;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const tierAHit = matched.filter((match) => match.tier === "A" && requiredIds.has(match.signal_id)).length;
  const tierBHit = matched.filter((match) => match.tier === "B" && requiredIds.has(match.signal_id)).length;
  const tierATotal = requiredTierA.length;
  const tierBTotal = requiredTierB.length;
  const tierARequiredForStrong = Math.max(
    SPEC.scoring.tierA_min_hits_for_strong_floor,
    Math.ceil((tierATotal || 0) * SPEC.scoring.tierA_coverage_for_strong)
  );
  return { score, tierAHit, tierBHit, tierATotal, tierBTotal, tierARequiredForStrong };
}

function gradeFrom(score, tierAHit, tierARequiredForStrong) {
  if (tierAHit >= tierARequiredForStrong && score >= SPEC.scoring.score_bands.strong_min) return "Strong";
  if (score >= SPEC.scoring.score_bands.moderate_min) return "Partial";
  return "Emerging";
}

function buildSummary({ grade, score, tierAHit, tierATotal, tierBHit, tierBTotal, skillsLine }) {
  const parts = [];
  parts.push(`${grade} alignment (${score}%).`);
  parts.push(`Capability coverage: matched ${tierAHit}/${tierATotal} core (Tier A) and ${tierBHit}/${tierBTotal} supporting (Tier B).`);
  if (skillsLine) parts.push(skillsLine);
  return parts.join(" ");
}

// ─── Skills helpers ───────────────────────────────────────────────────────────

function isStyleContextTerm(term) {
  const termNorm = normalizeTerm(term);
  if (!termNorm) return false;
  for (const styleTerm of SPEC.style_context_terms) {
    const styleNorm = normalizeTerm(styleTerm);
    if (!styleNorm) continue;
    if (termNorm === styleNorm) return true;
    if (termNorm.includes(styleNorm)) return true;
  }
  return false;
}

function extractJDSkills(jobDescriptionText) {
  const jdRaw = String(jobDescriptionText || "");
  const jdLower = safeLower(jdRaw);
  const rawTokens = jdLower.match(/[a-z0-9+#./-]{2,}/g) || [];

  const stopWords = new Set([
    "and","or","the","a","an","to","for","of","in","on","with","as","at","by","from","into",
    "experience","preferred","requirements","responsible","responsibilities","ability","skills",
    "skill","years","year","role","team","teams","work","working","knowledge","strong","excellent",
    "including","within","across","will","must","should","may","plus",
  ]);

  const allowList = new Set([
    "salesforce","gainsight","hubspot","zendesk","freshdesk","dynamics","pipedrive","crm",
    "servicenow","jira","confluence","sql","python","javascript","typescript","react","node",
    "aws","azure","gcp","excel","powerbi","tableau","snowflake","postgres","postgresql",
    "mongodb","redis","intune","jamf","okta","sso","scim","api","apis","rest","graphql",
    "kpi","kpis","qbr","qbrs","sop","sops","mrr","arr",
  ]);

  const acronyms = [];
  const uppercaseMatches = jdRaw.match(/\b[A-Z]{2,6}s?\b/g) || [];
  for (const acronym of uppercaseMatches) {
    const acronymStr = String(acronym || "").trim();
    if (!acronymStr) continue;
    const acronymLower = acronymStr.toLowerCase();
    if (/^[a-z]{2,6}s?$/.test(acronymLower)) acronyms.push(acronymLower);
  }

  const singles = [];
  for (const rawToken of rawTokens) {
    const tok = rawToken.toLowerCase().replace(/^[^\w+#]+|[^\w+#]+$/g, "");
    if (!tok) continue;
    if (stopWords.has(tok)) continue;
    if (allowList.has(tok)) { singles.push(tok); continue; }
    const isTechLike =
      tok.length >= 3 && /[a-z]/.test(tok) &&
      (tok.includes("#") || tok.includes("+") || tok.includes(".") || tok.includes("-") || tok.includes("/"));
    if (isTechLike) singles.push(tok);
  }

  const phrases = [];
  const phrasePatterns = [
    "customer success","account management","project management","stakeholder management",
    "data analysis","business analysis","change management","client success","customer onboarding",
    "health score","quarterly business review","qbr",
  ];
  for (const phrase of phrasePatterns) {
    if (jdLower.includes(phrase)) phrases.push(phrase);
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
  const termNorm = normalizeTerm(skillTerm);
  if (!termNorm) return null;
  for (const sig of SPEC.signals) {
    if (sig.tier !== "A" && sig.tier !== "B") continue;
    for (const pat of sig.patterns || []) {
      const patClean = normalizeTerm(String(pat || "").replace(/\*/g, ""));
      if (!patClean) continue;
      if (termNorm === patClean) return sig.id;
      if (termNorm.includes(patClean) || patClean.includes(termNorm)) return sig.id;
      const regex = buildVariantRegex(patClean);
      if (regex && regex.test(termNorm)) return sig.id;
    }
  }
  return null;
}

function clusterKeyForSkill(skillTerm) {
  const termNorm = normalizeTerm(skillTerm);
  if (!termNorm) return null;
  const capId = mapSkillToCapabilityId(termNorm);
  if (capId) return `cap:${capId}`;
  if (/\bqbrs?\b/.test(termNorm) || termNorm.includes("quarterly business review") || termNorm.includes("business review") || termNorm.includes("executive review")) return "cluster:qbrs";
  if (termNorm.includes("health score") || termNorm.includes("usage metrics") || termNorm.includes("product usage") || termNorm.includes("adoption") || termNorm.includes("engagement")) return "cluster:adoption_health";
  if (termNorm.includes("onboarding") || termNorm.includes("enablement") || termNorm.includes("rollout") || termNorm.includes("go-live") || termNorm.includes("implementation") || termNorm.includes("implement")) return "cluster:onboarding_training";
  if (termNorm.includes("renewal") || termNorm.includes("retention") || termNorm.includes("churn") || termNorm.includes("winback") || termNorm.includes("save at risk")) return "cluster:retention_churn";
  if (termNorm.includes("upsell") || termNorm.includes("cross-sell") || termNorm.includes("expansion") || termNorm.includes("increase arr") || termNorm.includes("add seats")) return "cluster:expansion_upsell";
  if (termNorm.includes("portfolio") || termNorm.includes("book of business") || termNorm.includes("owned accounts") || termNorm.includes("caseload") || termNorm.includes("managed")) return "cluster:portfolio_management";
  const crmSignal = SPEC.signals.find((sig) => sig.id === "crm_tools");
  const crmPatterns = crmSignal?.patterns || [];
  for (const crmPat of crmPatterns) {
    const regex = buildVariantRegex(crmPat);
    if (regex && regex.test(termNorm)) return "cluster:crm_tools";
  }
  if (/\bkpis?\b/.test(termNorm) || termNorm.includes("dashboard") || termNorm.includes("metrics") || termNorm.includes("report") || termNorm.includes("data analysis") || termNorm.includes("analytics")) return "cluster:data_reporting";
  return `term:${termNorm}`;
}

function computeSkillsChips(jdSkills, resumeLower, matchedSignalIds) {
  const list = Array.isArray(jdSkills) ? jdSkills : [];
  const matched = [];
  const notYet = [];
  const crmMatched = matchedSignalIds.has("crm_tools");
  const crmSignal = SPEC.signals.find((sig) => sig.id === "crm_tools");
  const crmPatterns = crmSignal?.patterns || [];

  for (const skillItem of list) {
    const skill = normalizeTerm(skillItem);
    if (!skill) continue;
    const capId = mapSkillToCapabilityId(skill);
    if (capId && matchedSignalIds.has(capId)) { matched.push(skill); continue; }
    if (crmMatched) {
      const isCRMLike = crmPatterns.some((crmPat) => {
        const regex = buildVariantRegex(crmPat);
        return regex ? regex.test(skill) : false;
      });
      if (isCRMLike) { matched.push(skill); continue; }
    }
    const regex = buildVariantRegex(skill);
    if (regex && regex.test(resumeLower)) matched.push(skill);
    else notYet.push(skill);
  }

  const matchedClusters = new Set(matched.map((skill) => clusterKeyForSkill(skill)).filter(Boolean));
  const suppressedNotYet = [];

  for (const gapSkill of notYet) {
    const clusterKey = clusterKeyForSkill(gapSkill);
    if (!clusterKey) continue;
    if (matchedClusters.has(clusterKey)) continue;
    const capId = mapSkillToCapabilityId(gapSkill);
    if (capId && matchedSignalIds.has(capId)) continue;
    if (crmMatched && clusterKey === "cluster:crm_tools") continue;
    suppressedNotYet.push(gapSkill);
  }

  const matchedUnique = Array.from(new Set(matched)).slice(0, SPEC.scoring.skills_cap_for_ui);
  const notYetUnique = Array.from(new Set(suppressedNotYet)).slice(0, SPEC.scoring.skills_cap_for_ui);
  const matchedClusterCount = new Set(matchedUnique.map((skill) => clusterKeyForSkill(skill)).filter(Boolean)).size;
  const totalClusterCount = new Set(list.map((skill) => clusterKeyForSkill(skill)).filter(Boolean)).size;

  return {
    matched: matchedUnique,
    notYet: notYetUnique,
    clusterMatched: matchedClusterCount,
    clusterTotal: totalClusterCount,
    total: Math.min(list.length, 999),
  };
}

// ─── Transferable strengths ───────────────────────────────────────────────────

function buildTransferableStrengths(matchedSignals, tierAHit, tierATotal) {
  const signalIds = new Set((matchedSignals || []).map((match) => match.signal_id));
  const transferables = [];
  if (signalIds.has("portfolio_management")) transferables.push("Account ownership discipline translates well to CS lifecycle management.");
  if (signalIds.has("data_reporting")) transferables.push("Data fluency supports adoption, health scoring, and executive storytelling.");
  if (signalIds.has("stakeholder_management")) transferables.push("Cross-functional partnership supports durable renewals and expansion.");
  if (signalIds.has("escalations_support")) transferables.push("High-stakes issue resolution improves retention and customer trust.");
  if (signalIds.has("onboarding_training")) transferables.push("Enablement experience accelerates time-to-value for new customers.");
  if (signalIds.has("crm_tools")) transferables.push("Customer systems fluency supports scalable process and consistent execution.");
  const tierACoverage = tierATotal > 0 ? tierAHit / tierATotal : 0;
  if (transferables.length === 0 && tierACoverage >= SPEC.scoring.tierA_coverage_for_strong) {
    transferables.push("Demonstrated core lifecycle ownership and likely to ramp quickly even when tools or process differ.");
  }
  return transferables.slice(0, 3);
}

// ─── Main exported function ───────────────────────────────────────────────────

export function buildExplain(resumeText, jobDescription) {
  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);
  const resumeLower = resume.toLowerCase();
  const jdLower = jd.toLowerCase();
  const sentenceItems = splitIntoRankableSentences(resume);

  const jdGate = jdSufficiency(jd, jdLower);

  const requiredSignals = requiredSignalsFromJD(jdLower);

const requiredSignalIds = new Set(
  requiredSignals.map((sig) => sig.id)
);

const jdScopedSignals = SPEC.signals.filter((sig) =>
  requiredSignalIds.has(sig.id)
);

const matchedSignalsAll = findSignalMatches(resumeLower, jdScopedSignals);
const matchedSignals = matchedSignalsAll.filter((match) => match.tier === "A" || match.tier === "B");
const matchedSignalIds = new Set(matchedSignals.map((match) => match.signal_id));

  const jdExtracted = extractJDSkills(jd);
  const jdSkills = Array.isArray(jdExtracted?.skills) ? jdExtracted.skills : [];
  const contextNotYet = Array.isArray(jdExtracted?.context) ? jdExtracted.context : [];
  const skillsChips = computeSkillsChips(jdSkills, resumeLower, matchedSignalIds);

  const tierAMatched = matchedSignals.filter((match) => match.tier === "A");
  const transferable = buildTransferableStrengths(matchedSignals, tierAMatched.length, tierAMatched.length);

  if (!jdGate.sufficient) {
    const disclaimer = "WHY provides directional guidance to support recruiter judgment. This evaluation requires a sufficiently detailed job description to determine role requirements.";
    const summary = "Needs job description detail. Add responsibilities, required tools/processes, and outcomes to run an evidence-based comparison.";
    return {
      score: null,
      grade: "Needs JD",
      summary,
      disclaimer,
      reasons: [],
      skills: { matched: skillsChips.matched, gaps: [], transferable },
      strengths: matchedSignals.map((match) => match.label).slice(0, 12),
      gaps: [],
      interviewQuestions: {
        behavioral: [
          "Tell me about a time you handled competing priorities under a tight deadline. What did you prioritize and why?",
          "Describe a process you improved. What changed and what was the impact?",
          "How do you communicate when expectations shift or a customer's needs change midstream?",
        ],
        occupational: [
          "Share an example of delivering outcomes in a similar role. What was your ownership and what changed as a result?",
          "What tools or workflows do you typically use to manage customer lifecycle work?",
        ],
      },
      _debug: { jd_sufficiency: jdGate, context_not_yet_demonstrated: contextNotYet },
      match: { score: null, grade: "Needs JD", summary, disclaimer },
      signals: {
        required: [],
        matched: matchedSignals.map((match) => ({
          signal_id: match.signal_id,
          label: match.label,
          tier: match.tier,
          strength: match.strength,
          match_type: match.match_type,
          evidence: pickEvidenceForSignal(match, sentenceItems),
        })),
        not_yet_demonstrated: [],
        context_not_yet_demonstrated: contextNotYet,
        transferable,
      },
    };
  }

const matchedRequiredSignals = matchedSignals.filter((match) =>
  requiredSignalIds.has(match.signal_id)
);

  const cov = computeCapabilityCoverageScore(requiredSignals, matchedSignals);
  const grade = gradeFrom(cov.score, cov.tierAHit, cov.tierARequiredForStrong);

  const notYetDemonstratedSignals = requiredSignals
    .filter((sig) => !matchedSignalIds.has(sig.id))
    .map((sig) => ({
      signal_id: sig.id,
      label: sig.label,
      tier: sig.tier,
      why_missing: "Not yet demonstrated in the provided resume text.",
    }));

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

  const disclaimer = "WHY provides directional guidance to support recruiter judgment. It does not make hiring decisions, and it may miss context if the resume text is incomplete.";

  const reasons = matchedRequiredSignals
    .slice()
    .sort((matchA, matchB) => {
      const weightA = SPEC.scoring.tier_weights[matchA.tier] || 0;
      const weightB = SPEC.scoring.tier_weights[matchB.tier] || 0;
      if (weightB !== weightA) return weightB - weightA;
      return (matchB.strength || 0) - (matchA.strength || 0);
    })
    .slice(0, 10)
    .map((match) => ({
      requirement: match.label,
      evidence: pickEvidenceForSignal(match, sentenceItems),
    }));

  const behavioral = [
    "Tell me about a time you handled competing priorities under a tight deadline. What did you prioritize and why?",
    "Describe a process you improved. What changed and what was the impact?",
    "How do you communicate when expectations shift or a customer's needs change midstream?",
  ];

  const occupational = []
    .concat(
      matchedSignals.slice(0, 3).map((match) => `Walk me through a real example where you delivered outcomes in ${match.label}.`),
      notYetDemonstratedSignals.slice(0, 2).map((gap) => `If this role needs ${gap.label}, how would you ramp quickly and demonstrate results in the first 30–60 days?`)
    )
    .slice(0, 6);

  const strengths = matchedRequiredSignals.map((match) => match.seekerLabel || match.label).slice(0, 12);
  const gapsLabels = notYetDemonstratedSignals.map((gap) => gap.label).slice(0, 12);
  const skills = { matched: skillsChips.matched, gaps: skillsChips.notYet, transferable };

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
    _debug: {
      jd_sufficiency: jdGate,
      requiredSignals: requiredSignals.map((sig) => ({ id: sig.id, tier: sig.tier, label: sig.label })),
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
    match: { score: cov.score, grade, summary, disclaimer },
    signals: {
      required: requiredSignals.map((sig) => ({ signal_id: sig.id, label: sig.label, tier: sig.tier })),
      matched: matchedRequiredSignals.map((match) => ({
  signal_id: match.signal_id,
  label: match.label,
  seekerLabel: match.seekerLabel || match.label,
  tier: match.tier,
  strength: match.strength,
  match_type: match.match_type,
  evidence: pickEvidenceForSignal(match, sentenceItems),
})),
      not_yet_demonstrated: notYetDemonstratedSignals,
      context_not_yet_demonstrated: contextNotYet,
      transferable,
    },
  };
}

export { SPEC };