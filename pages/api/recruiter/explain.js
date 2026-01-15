// pages/api/recruiter/explain.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

/**
 * Deterministic (non-LLM) explainability v1.3:
 * - Signals matched against RESUME (not JD) to avoid self-scoring
 * - Variant-aware matching (SOP/SOPs, QBR/QBRs, pluralization, light inflection)
 * - Skills alignment extracted from JD (deterministic) and contributes to score (blended + dampened)
 * - Evidence ranking to avoid quoting contact/header
 * - Returns a WHY-friendly shape (score/summary/reasons/skills) plus a clean signals object
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
    min_required_tierA_matches_for_strong: 4,
    tier_weights: { A: 8, B: 4, C: 0.5 },
    match_strength: {
      exact_phrase: 1.0,
      synonym_phrase: 0.9,
      tool_implies_category: 0.85,
      single_token_only: 0.4,
    },
    cap_generic_token_contribution: 6,

    // score blending (signals dominate; skills supports)
    blend: {
      signals_weight: 0.75,
      skills_weight: 0.25,
    },

    // avoid tiny JD skill lists dominating the score
    skills_min_list_for_full_weight: 8,
    skills_floor_for_summary: 5,
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
    ],
  },
  hard_excludes_sections: ["name", "email", "phone", "address", "linkedin", "contact", "header"],
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
// ✅ NEW: variant-aware helpers
// -----------------------------
function normalizeTerm(term) {
  return String(term || "")
    .trim()
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ");
}

function looksAcronymLike(term) {
  // e.g., qbr, sop, kpi, mrr, arr, sso, scim
  const t = normalizeTerm(term).replace(/[^a-z]/g, "");
  return t.length >= 2 && t.length <= 6;
}

function buildVariantRegex(term) {
  // Handles:
  // - acronyms: qbr -> \bqbrs?\b
  // - simple singular/plural: review -> reviews, policy -> policies (light)
  // - phrases: allow whitespace/hyphen variations, pluralize last token
  const raw = normalizeTerm(term);
  if (!raw) return null;

  // keep original separators for phrases; normalize to tokens
  const tokens = raw.split(" ").filter(Boolean);
  const isPhrase = tokens.length > 1;

  // helper to pluralize lightly (not a full stemmer; just reduces false negatives)
  const pluralSuffix = (w) => {
    const word = String(w || "");
    if (word.length < 3) return word; // don't pluralize tiny tokens
    if (word.endsWith("y")) return `${word.slice(0, -1)}(?:y|ies)`; // policy -> policy/policies
    if (word.endsWith("s")) return `${word}(?:es)?`; // class -> class/classes
    return `${word}s?`; // qbr -> qbr/qbrs, review -> review/reviews
  };

  // If single token and acronym-ish, just allow optional s
  if (!isPhrase) {
    const t = raw.replace(/\./g, ""); // "q.b.r" unlikely but safe
    const cleaned = t.replace(/[^a-z0-9+#./-]/g, "");
    if (!cleaned) return null;

    // acronyms & short tokens: SOP/SOPs, QBR/QBRs
    if (looksAcronymLike(cleaned) && /^[a-z]{2,6}$/.test(cleaned)) {
      return new RegExp(`\\b${escapeRegex(cleaned)}s?\\b`, "i");
    }

    // regular words: allow light pluralization
    if (/^[a-z]{3,}$/.test(cleaned)) {
      return new RegExp(`\\b${pluralSuffix(escapeRegex(cleaned))}\\b`, "i");
    }

    // tech tokens (sql, c#, node.js, power-bi): match as-is with word-ish boundaries
    return new RegExp(`(?:^|[^a-z0-9])${escapeRegex(cleaned)}(?:$|[^a-z0-9])`, "i");
  }

  // Phrase: join tokens with flexible whitespace/hyphen; pluralize last token lightly
  const head = tokens.slice(0, -1).map((t) => escapeRegex(t));
  const last = tokens[tokens.length - 1];
  const lastRe = pluralSuffix(escapeRegex(last));

  const sep = `[\\s\\-_/]+`; // space/hyphen/underscore/slash
  const phraseRe = [...head, lastRe].join(sep);

  return new RegExp(`\\b${phraseRe}\\b`, "i");
}

function patternToRegex(pattern) {
  // Supports "*" wildcard: implement* -> implement\w*
  // Also supports simple spaced wildcards in the middle: managed * customers
  const p = String(pattern || "").trim();
  if (!p) return null;

  // Convert to tokens, allowing "*" to mean "some words" when surrounded by spaces
  if (p.includes(" * ")) {
    const parts = p.split(" * ").map((x) => x.trim()).filter(Boolean);
    const reParts = parts.map((x) => escapeRegex(x).replace(/\\\*/g, "\\w*"));
    return new RegExp(`\\b${reParts.join("\\b[\\s\\S]{0,60}\\b")}\\b`, "i");
  }

  // Single wildcard token like implement*
  if (p.includes("*")) {
    const re = escapeRegex(p).replace(/\\\*/g, "\\w*");
    return new RegExp(`\\b${re}\\b`, "i");
  }

  // ✅ NEW: non-wildcard patterns use variant-aware regex
  return buildVariantRegex(p) || new RegExp(`\\b${escapeRegex(p)}\\b`, "i");
}

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

function classifyMatchType(signalId, pattern) {
  const p = String(pattern || "").trim();
  const isSingleToken = !p.includes(" ");
  const hasWildcard = p.includes("*");

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

function pickEvidenceForSignal(signalMatch, sentenceItems) {
  const maxSnips = SPEC.evidence_ranking.max_snippets_per_signal;
  const maxChars = SPEC.evidence_ranking.max_chars_per_snippet;

  const eligible = sentenceItems.filter((it) => it.section !== "contact" && it.section !== "header");

  const allToolNames = SPEC.signals
    .find((s) => s.id === "crm_tools")
    ?.patterns?.map((x) => String(x || "").toLowerCase()) || [];

  const ranked = eligible
    .map((it) => ({ it, score: scoreSentence(it, signalMatch, allToolNames) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const snippets = [];
  for (const r of ranked) {
    const text = r.it.text.length > maxChars ? `${r.it.text.slice(0, Math.max(0, maxChars - 1))}…` : r.it.text;
    if (!text) continue;

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

function computeSignalsScore(matchedSignals) {
  const weights = SPEC.scoring.tier_weights;

  const denom = SPEC.signals
    .filter((s) => s.tier !== "C")
    .reduce((sum, s) => sum + (weights[s.tier] || 0), 0);

  let numerAB = 0;
  let numerC = 0;

  for (const m of matchedSignals) {
    const w = weights[m.tier] || 0;
    const contrib = w * (typeof m.strength === "number" ? m.strength : 0);

    if (m.tier === "C") numerC += contrib;
    else numerAB += contrib;
  }

  const cappedC = Math.min(numerC, SPEC.scoring.cap_generic_token_contribution);
  const raw = denom > 0 ? (100 * (numerAB + cappedC)) / denom : 0;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

function gradeFrom(score, tierAMatchCount) {
  if (tierAMatchCount >= SPEC.scoring.min_required_tierA_matches_for_strong && score >= 70) return "Strong";
  if (score >= 50) return "Moderate";
  return "Weak";
}

function buildSummary(tierAHit, tierATotal, tierBHit, tierBTotal, score, grade, skillsLine) {
  const parts = [];
  parts.push(`${grade} match (${score}%).`);
  parts.push(`Matched ${tierAHit}/${tierATotal} core signals (Tier A) and ${tierBHit}/${tierBTotal} supporting signals (Tier B).`);
  if (skillsLine) parts.push(skillsLine);
  return parts.join(" ");
}

/**
 * Deterministic JD skill extraction:
 * - tools/tech tokens (allowlist + tech-looking tokens)
 * - short acronyms from original JD text (QBR, SOP, KPI, SQL, SSO)
 * - a few stable phrases
 */
function extractJDSkills(jobDescriptionText) {
  const jdRaw = String(jobDescriptionText || "");
  const jd = safeLower(jdRaw);

  const rawTokens = jd.match(/[a-z0-9+#./-]{2,}/g) || [];

  const stop = new Set([
    "and","or","the","a","an","to","for","of","in","on","with","as","at","by","from","into",
    "experience","preferred","requirements","responsible","responsibilities","ability","skills","skill",
    "years","year","role","team","teams","work","working","knowledge","strong","excellent",
    "including","within","across","will","must","should","may","plus"
  ]);

  const allow = new Set([
    "salesforce","gainsight","hubspot","zendesk","freshdesk","dynamics","pipedrive","crm",
    "servicenow","jira","confluence","sql","python","javascript","typescript","react","node","aws","azure","gcp",
    "excel","powerbi","tableau","snowflake","postgres","postgresql","mongodb","redis",
    "intune","jamf","okta","sso","scim","api","apis","rest","graphql",
    "kpi","kpis","qbr","qbrs","sop","sops","mrr","arr"
  ]);

  // Acronyms from original JD (case-sensitive scan) -> normalize to lower
  const acronyms = [];
  const ac = jdRaw.match(/\b[A-Z]{2,6}s?\b/g) || [];
  for (const a of ac) {
    const t = String(a || "").trim();
    if (!t) continue;
    const low = t.toLowerCase();
    // keep if it looks like a real acronym and not a random shouting word
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

    // tech-looking tokens: c#, c++, node.js, power-bi, etc.
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
    "qbr"
  ];

  for (const p of phrasePatterns) {
    if (jd.includes(p)) phrases.push(p);
  }

  // Add signal patterns as candidates too (keeps alignment coherent without hardcoding every variant)
  const signalTerms = [];
  for (const s of SPEC.signals || []) {
    for (const p of s.patterns || []) {
      const clean = normalizeTerm(p).replace(/\*/g, "");
      if (clean && clean.length >= 3 && !clean.includes(" * ")) signalTerms.push(clean);
    }
  }

  const combined = Array.from(new Set([...singles, ...phrases, ...acronyms, ...signalTerms]))
    .filter(Boolean)
    .slice(0, 28);

  return combined;
}

/**
 * Skills alignment scoring:
 * - variant-aware presence detection (SOP/SOPs, QBR/QBRs, plural/phrase variants)
 * - skillsScore = % JD skills found (0-100), dampened if JD list is tiny
 */
function computeSkillsAlignment(jdSkills, resumeLower) {
  const list = Array.isArray(jdSkills) ? jdSkills : [];
  if (!list.length) {
    return { matched: [], gaps: [], skillsScore: null, skillsHit: 0, skillsTotal: 0 };
  }

  const matched = [];
  const gaps = [];

  for (const s of list) {
    const skill = normalizeTerm(s);
    if (!skill) continue;

    const re = buildVariantRegex(skill);
    if (re && re.test(resumeLower)) matched.push(skill);
    else gaps.push(skill);
  }

  const skillsTotal = matched.length + gaps.length;
  const skillsHit = matched.length;

  let pct = skillsTotal > 0 ? Math.round((skillsHit / skillsTotal) * 100) : 0;

  const minN = SPEC.scoring.skills_min_list_for_full_weight;
  if (skillsTotal > 0 && skillsTotal < minN) {
    const factor = skillsTotal / minN;
    pct = Math.round(pct * factor);
  }

  return { matched, gaps, skillsScore: pct, skillsHit, skillsTotal };
}

function buildExplain(resumeText, jobDescription) {
  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);

  const resumeLower = resume.toLowerCase();

  const sentenceItems = splitIntoRankableSentences(resume);

  // ✅ FIX: match signals against the resume only (no JD self-counting)
  const matchedSignals = findSignalMatches(resumeLower, SPEC.signals);

  const gaps = SPEC.signals
    .filter((s) => s.tier === "A" || s.tier === "B")
    .filter((s) => !matchedSignals.some((m) => m.signal_id === s.id))
    .map((s) => ({
      signal_id: s.id,
      label: s.label,
      tier: s.tier,
      why_missing: "No strong evidence detected in the provided resume text.",
    }));

  // JD skills + resume alignment
  const jdSkills = extractJDSkills(jd);
  const skillsAlign = computeSkillsAlignment(jdSkills, resumeLower);

  // Score and grade (blend signals + skills)
  const signalsScore = computeSignalsScore(matchedSignals);
  const skillsScore = typeof skillsAlign.skillsScore === "number" ? skillsAlign.skillsScore : null;

  const wSignals = SPEC.scoring.blend.signals_weight;
  const wSkills = SPEC.scoring.blend.skills_weight;

  const blended =
    skillsScore === null
      ? signalsScore
      : Math.round((signalsScore * wSignals) + (skillsScore * wSkills));

  const score = Math.max(0, Math.min(100, blended));

  const tierAHit = matchedSignals.filter((m) => m.tier === "A").length;
  const tierBHit = matchedSignals.filter((m) => m.tier === "B").length;
  const tierATotal = SPEC.signals.filter((s) => s.tier === "A").length;
  const tierBTotal = SPEC.signals.filter((s) => s.tier === "B").length;

  const grade = gradeFrom(score, tierAHit);

  const skillsLine =
    skillsAlign.skillsTotal >= SPEC.scoring.skills_floor_for_summary
      ? `Skill alignment: matched ${skillsAlign.skillsHit}/${skillsAlign.skillsTotal} JD skills.`
      : null;

  const summary = buildSummary(tierAHit, tierATotal, tierBHit, tierBTotal, score, grade, skillsLine);

  const reasons = matchedSignals
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

  const behavioral = [
    "Tell me about a time you had to handle competing priorities under a tight deadline.",
    "Describe a situation where you improved a process or workflow. What was the impact?",
    "How do you approach stakeholder communication when expectations change?",
  ];

  const occupational = []
    .concat(
      matchedSignals.slice(0, 3).map((m) => `Walk me through your hands-on experience with ${m.label}.`),
      gaps.slice(0, 2).map((g) => `How would you ramp up quickly on ${g.label} if needed?`)
    )
    .slice(0, 6);

  const disclaimer =
    "WHY highlights evidence to support recruiter judgment. It does not make hiring decisions, and it may miss context if the resume text is incomplete.";

  const skills = {
    matched: (skillsAlign.matched || []).slice(0, 14),
    gaps: (skillsAlign.gaps || []).slice(0, 14),
    transferable: [],
  };

  return {
    score,
    grade,
    summary,
    disclaimer,

    reasons,
    skills,
    strengths: matchedSignals.filter((m) => m.tier !== "C").map((m) => m.label).slice(0, 12),
    gaps: gaps.map((g) => g.label).slice(0, 12),
    interviewQuestions: { behavioral, occupational },

    _debug: {
      signalsScore,
      skillsScore,
      tierAHit,
      tierBHit,
      skillsHit: skillsAlign.skillsHit,
      skillsTotal: skillsAlign.skillsTotal,
    },

    match: { score, grade, summary, disclaimer },
    signals: {
      matched: matchedSignals.map((m) => ({
        signal_id: m.signal_id,
        label: m.label,
        tier: m.tier,
        strength: m.strength,
        match_type: m.match_type,
        evidence: pickEvidenceForSignal(m, sentenceItems),
      })),
      gaps,
      transferable: [],
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
