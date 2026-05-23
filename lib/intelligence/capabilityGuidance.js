// lib/intelligence/capabilityGuidance.js
//
// ForgeTomorrow capability guidance.
// Shared interpretation layer for translating raw capability labels into:
// - likely interview validation
// - bridge strategy
// - confidence framing
// - story prompts
// - question coaching
//
// Keep this file broad and reusable. Do not turn feature APIs into giant
// hardcoded industry maps. Feature APIs should import this layer and translate
// the result into their own user-facing payload shape.

function safe(value = "") {
  return String(value || "").trim();
}

function safeLower(value = "") {
  return safe(value).toLowerCase();
}

export function includesAny(text, terms = []) {
  const t = safeLower(text);
  return terms.some((term) => t.includes(String(term || "").toLowerCase()));
}

const LEAD_PATTERNS = [
  "Lead with examples that show",
  "Anchor the conversation with examples that demonstrate",
  "Use early proof that shows",
  "Establish credibility early by highlighting",
];

const STORY_PATTERNS = [
  "Prepare a story where",
  "Be ready to discuss a situation where",
  "Have an example ready that shows how",
  "Think through a real example where",
];

const BRIDGE_PATTERNS = [
  "The goal is not to overclaim — it is to make the connection obvious.",
  "Do not apologize for adjacent experience. Translate it clearly.",
  "The interviewer should not have to infer the connection themselves.",
  "Frame the overlap directly instead of assuming it will be noticed.",
];

function pick(arr = [], seed = "") {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const s = String(seed || "");
  let total = 0;
  for (let i = 0; i < s.length; i++) total += s.charCodeAt(i);
  return arr[total % arr.length];
}

const CONFIDENCE_CLOSE_PATTERNS = [
  "Use this early so the conversation starts from proven capability, not only from what still needs explaining.",
  "This can anchor the interview around demonstrated strength before the conversation moves into weaker or adjacent areas.",
  "Bring this forward early to establish credibility and reduce concern about ramp-up risk.",
  "This helps position you as immediately useful before the interviewer focuses on validation gaps.",
  "Use this as a proof point that shows how you already create value in work that resembles this role.",
];



function capabilityGuidance(label = "") {
  const text = safeLower(label);
  const cleanLabel = safe(label) || "this capability";

  if (includesAny(text, ["customer service", "customer support", "client service", "support", "patron", "service delivery"])) {
    return {
      family: "customer_service",
      validation:
        "The interview is likely to test direct customer-facing issue handling, communication under pressure, de-escalation, and follow-through.",
      bridge:
        "Use an example where you owned a user or customer problem from intake to resolution, especially if expectations were unclear or emotions were high.",
      strength:
        "Lead with support examples that show calm communication, problem ownership, and reliable follow-through—not just task completion.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} someone needed help, the situation carried pressure or frustration, and you stayed accountable until the issue was resolved.`,
      questionTip:
        "Focus on the customer/user problem, how you clarified need, what you communicated, and how you closed the loop.",
    };
  }

  if (includesAny(text, ["desktop", "technical support", "help desk", "service desk", "endpoint", "device", "hardware", "software", "troubleshooting"])) {
    return {
      family: "technical_support",
      validation:
        "The interview is likely to test troubleshooting discipline, user communication, ticket ownership, escalation judgment, and ability to solve without overcomplicating the issue.",
      bridge:
        "Use a real support example that shows how you diagnosed the issue, communicated with the user, escalated only when appropriate, and documented the result.",
      strength:
        "Lead with examples where you combined technical troubleshooting with reliable service delivery and clear communication.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you diagnosed a technical issue, kept the user informed, and drove the issue to resolution or the right escalation path.`,
      questionTip:
        "Be specific about scope, tools, diagnosis steps, escalation judgment, and measurable user or business impact.",
    };
  }

  if (includesAny(text, ["data analytics", "analytics", "bi", "business intelligence", "dashboard", "dashboards", "report", "reporting", "kpi", "metrics", "metric"])) {
    return {
      family: "data_bi",
      validation:
        "The interview is likely to test whether you can turn metrics, dashboards, KPI visibility, or reporting into operational clarity and better decisions.",
      bridge:
        "Use an example where reporting, KPI review, dashboards, or operational metrics helped expose a trend, improve visibility, or guide a business decision.",
      strength:
        "Use examples where metrics, dashboards, reporting, or KPI review directly improved operational visibility or decision-making.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} metrics, dashboards, reporting, or KPI review helped you identify a trend, clarify performance, or influence a decision.`,
      questionTip:
        "Explain the metric or report, what it revealed, who needed the insight, and what decision or operational change followed.",
    };
  }

  if (includesAny(text, ["research", "analysis", "analytical", "investigation", "investigate", "pattern recognition", "root cause", "problem solving"])) {
    return {
      family: "research_analysis",
      validation:
        "The interview is likely to test investigative thinking, pattern recognition, ambiguity handling, and your ability to make sense of incomplete information.",
      bridge:
        "Use an example where you investigated a problem, found patterns or root causes, clarified uncertainty, or helped guide a recommendation.",
      strength:
        "Use examples where investigation, analysis, or pattern recognition clarified a problem and influenced what happened next.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you investigated a confusing problem, found the pattern or root cause, and helped move the work toward a better decision.`,
      questionTip:
        "Explain what was unclear, how you investigated it, what pattern or root cause you found, and how your thinking shaped the next action.",
    };
  }

  if (includesAny(text, ["ux", "ui", "design", "user experience", "interface", "usability", "workflow", "friction"])) {
    return {
      family: "ux_ui",
      validation:
        "The interview may be testing whether you understand user friction, workflow clarity, and how people actually experience a tool or process.",
      bridge:
        "If you have improved a process, trained users, documented workflows, or reduced confusion, frame that as user-experience thinking even if your title was not UX/UI.",
      strength:
        "Lead with examples where you made a tool, process, knowledge base, or workflow easier for others to use.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you noticed friction in a process or tool and made the experience clearer, faster, or easier for users.`,
      questionTip:
        "Talk about the user problem, the friction you saw, the change you made, and how the experience improved.",
    };
  }

  if (includesAny(text, ["sales", "business development", "revenue", "upsell", "product sales", "account"])) {
    return {
      family: "sales",
      validation:
        "The interview is likely to test whether you can recognize need, communicate value, and influence a decision without sounding transactional.",
      bridge:
        "Use an example where you listened first, identified what the person actually needed, and connected them to the right product, service, or next step.",
      strength:
        "Lead with examples that show consultative communication, not just selling activity.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you uncovered a need, explained value clearly, and helped someone choose an appropriate solution.`,
      questionTip:
        "Show how you understood the need, built trust, handled hesitation, and created a useful outcome.",
    };
  }

  if (includesAny(text, ["training", "enablement", "knowledge", "documentation", "manual", "kb", "onboarding", "sme"])) {
    return {
      family: "enablement",
      validation:
        "The interview is likely to test whether you can make knowledge repeatable for others, not just perform the work yourself.",
      bridge:
        "Use an example where you documented a process, trained someone, standardized work, or reduced dependency on tribal knowledge.",
      strength:
        "Lead with examples where your documentation or training helped a team perform more consistently.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you turned your knowledge into a process, guide, training, or resource others could use.`,
      questionTip:
        "Explain the gap, what you built, who used it, and how it improved consistency or speed.",
    };
  }

  if (includesAny(text, ["incident", "security", "risk", "compliance", "governance", "vulnerability", "quarantine", "p1", "p2"])) {
    return {
      family: "risk",
      validation:
        "The interview is likely to test judgment under pressure, risk awareness, escalation discipline, and how you communicate when stakes are high.",
      bridge:
        "Use an example where you followed process, escalated appropriately, protected the environment or customer, and kept the right people informed.",
      strength:
        "Lead with examples that show calm judgment, process discipline, and responsible escalation.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} a situation carried risk, urgency, or potential impact and you handled it responsibly.`,
      questionTip:
        "Focus on what was at risk, what decision you made, who needed to know, and how you protected the outcome.",
    };
  }

  if (includesAny(text, ["project", "deployment", "implementation", "rollout", "lifecycle", "ownership", "delivery"])) {
    return {
      family: "delivery",
      validation:
        "The interview is likely to test whether you can own work through completion, manage moving parts, and keep outcomes on track.",
      bridge:
        "Use an example where you coordinated people, tools, timing, or process details and delivered a completed outcome.",
      strength:
        "Lead with examples that show ownership from planning through execution and follow-through.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you owned a project, rollout, or operational change from start to finish.`,
      questionTip:
        "Clarify scope, your role, what changed, obstacles handled, and the result.",
    };
  }

  return {
    family: "general",
    validation:
      `The interview is likely to test practical evidence of ${cleanLabel}, not just familiarity with the phrase.`,
    bridge:
      `Use your closest real example that proves scope, ownership, actions taken, and result connected to ${cleanLabel}.`,
    strength:
      `Lead with a concrete example that shows how you have applied ${cleanLabel} in real work.`,
    storyPrompt:
      `${pick(STORY_PATTERNS, cleanLabel)} you demonstrated your closest real experience with ${cleanLabel}: what happened, what you owned, what you did, and what changed.`,
    questionTip:
      "Answer with a concrete example: context, responsibility, actions, decisions, and measurable result.",
  };
}

export { LEAD_PATTERNS, STORY_PATTERNS, BRIDGE_PATTERNS, CONFIDENCE_CLOSE_PATTERNS, pick, capabilityGuidance };
