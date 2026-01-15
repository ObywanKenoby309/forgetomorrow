// pages/api/recruiter/explain.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

/**
 * Deterministic (non-LLM) explainability v1.1:
 * - JSON-driven Tier A/B scoring (signals + synonyms) to avoid false negatives
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

  // Normal phrase
  return new RegExp(`\\b${escapeRegex(p)}\\b`, "i");
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

  // Hard contact/header signals
  if (looksLikeEmail(line) || looksLikePhone(line)) return "contact";
  if (l.includes("linkedin.com") || l.startsWith("linkedin")) return "contact";
  if (l.startsWith("email") || l.startsWith("phone") || l.startsWith("address")) return "contact";

  // Common section headers
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

  // First pass: label lines by section
  const labeledLines = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] || "";
    section = detectSection(line, section);
    labeledLines.push({ line, section });
  }

  // Merge to blocks and split to sentences
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

    // If section changes, flush
    if (s !== bufferSection && buffer) flushBuffer();

    bufferSection = s;
    buffer += (buffer ? " " : "") + trimmed;
  }
  flushBuffer();

  return items;
}

function isExcludedSection(section) {
  const s = String(section || "").toLowerCase();
  return SPEC.hard_excludes_sections.includes(s);
}

function classifyMatchType(signalId, pattern) {
  const p = String(pattern || "").trim();
  const isSingleToken = !p.includes(" ");
  const hasWildcard = p.includes("*");

  // CRM tools: tool name implies category
  if (signalId === "crm_tools") {
    return { match_type: "tool_implies_category", strength: SPEC.scoring.match_strength.tool_implies_category };
  }

  // Multiword phrases and wildcard phrases are treated as phrase matches
  if (!isSingleToken || hasWildcard) {
    return { match_type: "synonym_phrase", strength: SPEC.scoring.match_strength.synonym_phrase };
  }

  // Single tokens are weak by default
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

        // Promote to exact_phrase if it is a multiword phrase with no wildcard and found
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

  // section weighting
  if (item.section === "experience") score += s.is_in_experience_section;
  else if (item.section === "summary") score += s.is_in_summary_section;
  else if (item.section === "contact" || item.section === "header") score += s.is_in_contact_section;

  // contains signal pattern
  const re = patternToRegex(signal.matched_pattern);
  if (re && re.test(item.text)) score += s.contains_signal_or_synonym;

  // action verb
  for (const v of verbs) {
    if (item.lower.includes(v)) {
      score += s.contains_action_verb;
      break;
    }
  }

  // metric number
  if (/\b\d+(\.\d+)?%?\b/.test(item.text)) score += s.contains_metric_number;

  // tool name
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

  // Hard reject contact/header evidence
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

  // Fallback if nothing ranked (but still matched)
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

function computeScore(matchedSignals) {
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

function buildSummary(tierAHit, tierATotal, tierBHit, tierBTotal, score, grade) {
  const parts = [];
  parts.push(`${grade} match (${score}%).`);
  parts.push(`Matched ${tierAHit}/${tierATotal} core signals (Tier A) and ${tierBHit}/${tierBTotal} supporting signals (Tier B).`);
  return parts.join(" ");
}

function buildExplain(resumeText, jobDescription) {
  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);

  const resumeLower = resume.toLowerCase();
  const jdLower = jd.toLowerCase();

  // Combine JD + resume for detection (so "requirements" in JD still count as signals)
  const combinedLower = `${jdLower}\n${resumeLower}`;

  const sentenceItems = splitIntoRankableSentences(resume);

  // Match signals (using combined text so JD phrasing is not missed)
  const matchedSignals = findSignalMatches(combinedLower, SPEC.signals);

  // Build gaps (Tier A/B only)
  const gaps = SPEC.signals
    .filter((s) => s.tier === "A" || s.tier === "B")
    .filter((s) => !matchedSignals.some((m) => m.signal_id === s.id))
    .map((s) => ({
      signal_id: s.id,
      label: s.label,
      tier: s.tier,
      why_missing: "No strong evidence detected in the provided resume text.",
    }));

  // Score and grade
  const score = computeScore(matchedSignals);
  const tierAHit = matchedSignals.filter((m) => m.tier === "A").length;
  const tierBHit = matchedSignals.filter((m) => m.tier === "B").length;
  const tierATotal = SPEC.signals.filter((s) => s.tier === "A").length;
  const tierBTotal = SPEC.signals.filter((s) => s.tier === "B").length;
  const grade = gradeFrom(score, tierAHit);

  const summary = buildSummary(tierAHit, tierATotal, tierBHit, tierBTotal, score, grade);

  // Reasons: one card per matched signal with ranked evidence
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

  // Interview questions (deterministic)
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

  // Maintain your prior surface area while also returning the cleaner schema.
  return {
    score,
    grade,
    summary,
    disclaimer,

    // Backward-compatible fields used in some drawers
    reasons,
    strengths: matchedSignals.filter((m) => m.tier !== "C").map((m) => m.label).slice(0, 12),
    gaps: gaps.map((g) => g.label).slice(0, 12),
    interviewQuestions: { behavioral, occupational },

    // Clean output schema for future reuse
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
  // If Prisma client doesn't yet have the model (migration not applied), skip silently.
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
    // Don’t break the endpoint if persistence fails.
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

  // Pull accountKey from session first; fall back to DB lookup (keeps it consistent across pages)
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

  // Build deterministic explainability output (no LLM)
  const result = buildExplain(resumeText, jobDescription);

  // Best-effort persist (won’t break if model/migration not ready)
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
