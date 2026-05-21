// lib/intelligence/operationalInference.js
// Shared operational inference layer for recruiter surfaces and application packets.
// Pure functions only. No React imports.

function safeArr(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    return s.split(/\r?\n|,/g).map((x) => String(x || "").trim()).filter(Boolean);
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

function unique(items = [], limit = 8) {
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

function includesAny(text, patterns = []) {
  return patterns.some((pattern) => pattern.test(text));
}

export function detectOperationalSignals(source = {}) {
  const text = textOf(source).toLowerCase();

  const signals = [];

  if (includesAny(text, [/tier\s*1|tier\s*2|help\s*desk|service\s*desk|desktop|end[-\s]?user|troubleshoot|incident|ticket|user support/])) {
    signals.push("Support delivery");
  }

  if (includesAny(text, [/sccm|intune|jamf|imaging|endpoint|workstation|device|hardware|software deployment|deployment|patch|mac os|windows|ubuntu|linux/])) {
    signals.push("Endpoint operations");
  }

  if (includesAny(text, [/active directory|entra|okta|access|password|identity|global protect|vpn|permission|account/])) {
    signals.push("Identity/access support");
  }

  if (includesAny(text, [/p1|p2|priority|bridge call|escalation|executive|vip|on call|vulnerable|infected|quarantine|incident response/])) {
    signals.push("Escalation response");
  }

  if (includesAny(text, [/azure server|local server|server|meraki|connectivity|network|infrastructure|a\/v|conference room|smart hand|higher tier/])) {
    signals.push("Infrastructure coordination");
  }

  if (includesAny(text, [/knowledge|sop|documentation|training|sme|process|procedure|standardized|playbook/])) {
    signals.push("Knowledge/process ownership");
  }

  if (includesAny(text, [/vendor|stakeholder|client|customer|communication|non-technical|collecting information|executive level/])) {
    signals.push("Client/stakeholder communication");
  }

  if (includesAny(text, [/\d+%|\$\d+|saved|improved|reduced|increased|implemented|deployed|launched|automated|standardized|streamlined|owned|managed|led|delivered/])) {
    signals.push("Outcome evidence");
  }

  return unique(signals, 8);
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

export function inferOperationalConclusion(source = {}) {
  const signals = detectOperationalSignals(source);
  const evidenceBasis = evidenceBasisFromSource(source);

  if (!signals.length) {
    return {
      signals,
      conclusion:
        "Role details provide limited operational inference. Recruiter should validate scope, systems, and delivery ownership.",
      recruiterMeaning:
        "Use interview discussion to confirm what the candidate owned, supported, improved, or delivered.",
      evidenceBasis,
      validationPrompt:
        "Walk me through the scope of this role, the systems involved, and one example of work you owned from issue to outcome.",
    };
  }

  const hasEndpoint = signals.includes("Endpoint operations");
  const hasSupport = signals.includes("Support delivery");
  const hasIdentity = signals.includes("Identity/access support");
  const hasEscalation = signals.includes("Escalation response");
  const hasInfra = signals.includes("Infrastructure coordination");
  const hasProcess = signals.includes("Knowledge/process ownership");
  const hasStakeholder = signals.includes("Client/stakeholder communication");
  const hasOutcome = signals.includes("Outcome evidence");

  let conclusion = "Experience indicates operational exposure in structured support environments.";

  if (hasSupport && hasEndpoint && hasIdentity && hasEscalation) {
    conclusion =
      "Experience indicates enterprise support capability across endpoint management, user-impact troubleshooting, identity/access workflows, and escalation response.";
  } else if (hasSupport && hasEndpoint && hasInfra) {
    conclusion =
      "Experience indicates enterprise IT support exposure spanning endpoint operations, infrastructure coordination, and user-facing troubleshooting.";
  } else if (hasSupport && hasProcess && hasStakeholder) {
    conclusion =
      "Experience indicates support operations maturity with documentation, stakeholder communication, and process ownership signals.";
  } else if (hasSupport && hasEndpoint) {
    conclusion =
      "Experience indicates practical desktop support capability with endpoint troubleshooting and user support responsibilities.";
  } else if (hasSupport && hasStakeholder) {
    conclusion =
      "Experience indicates client-facing support capability with direct user communication and issue resolution exposure.";
  }

  const meaningParts = [];
  if (hasSupport) meaningParts.push("user-impact support delivery");
  if (hasEndpoint) meaningParts.push("endpoint lifecycle and device troubleshooting");
  if (hasIdentity) meaningParts.push("access and identity workflow support");
  if (hasEscalation) meaningParts.push("escalation or incident response readiness");
  if (hasInfra) meaningParts.push("infrastructure coordination");
  if (hasProcess) meaningParts.push("documentation/process ownership");
  if (hasStakeholder) meaningParts.push("stakeholder communication");
  if (hasOutcome) meaningParts.push("outcome-oriented execution");

  const recruiterMeaning = meaningParts.length
    ? `Recruiter should read this as evidence of ${meaningParts.slice(0, 5).join(", ")}.`
    : "Recruiter should validate scope, systems, and ownership during discussion.";

  const validationPrompt = hasOutcome
    ? "Ask for one example showing scope, ownership, measurable result, and what changed after the work."
    : "Ask for one concrete example with scope, systems involved, ownership level, and outcome.";

  return {
    signals,
    conclusion,
    recruiterMeaning,
    evidenceBasis,
    validationPrompt,
  };
}

export function inferCandidateOperationalProfile({ experience = [], skills = [], projects = [], hasResume = false } = {}) {
  const experienceList = safeArr(experience);
  const projectList = safeArr(projects);
  const skillText = safeArr(skills).join(" ");

  const roleInferences = experienceList.map((exp) => inferOperationalConclusion(exp));
  const allSignals = unique(roleInferences.flatMap((item) => item.signals), 12);
  const projectSignals = projectList.length ? ["Project evidence present"] : [];

  const profileText = `${textOf(experienceList)} ${skillText} ${textOf(projectList)}`.toLowerCase();

  let overallConclusion = "Operational capability requires recruiter validation from available evidence.";

  if (/desktop|endpoint|intune|sccm|active directory|okta|tier\s*1|tier\s*2|vip|p1|p2|incident/.test(profileText)) {
    overallConclusion =
      "Candidate shows credible enterprise support operations exposure with endpoint, access, troubleshooting, and escalation indicators.";
  } else if (/support|customer|client|troubleshoot|ticket|service/.test(profileText)) {
    overallConclusion =
      "Candidate shows support delivery exposure with recruiter validation needed for environment complexity and ownership depth.";
  }

  const validationFocus = unique(
    [
      !projectList.length ? "Validate project/work examples because structured portfolio projects are not yet visible." : "",
      !hasResume ? "Confirm resume source evidence before final evaluation." : "",
      allSignals.includes("Escalation response") ? "Ask for a real escalation or incident response example." : "",
      allSignals.includes("Endpoint operations") ? "Ask for endpoint deployment, imaging, or troubleshooting examples." : "",
      allSignals.includes("Identity/access support") ? "Clarify identity/access administration scope and boundaries." : "",
      allSignals.includes("Outcome evidence") ? "Ask for measurable results and business impact." : "",
    ],
    5
  );

  return {
    overallConclusion,
    signals: [...allSignals, ...projectSignals],
    roleInferences,
    validationFocus,
  };
}
