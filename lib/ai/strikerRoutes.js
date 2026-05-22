// lib/ai/strikerRoutes.js
// ForgeTomorrow Striker operational router.
// Updated to use the repo-wide Striker maps:
// - strikerSiteMap.js
// - strikerToolMap.js
// - strikerWorkflowMap.js
//
// Goal: Striker answers from ForgeTomorrow operational truth first,
// then lets the LLM handle open-ended language only after the route/map layer.

import { getSurfacePlaybook } from "@/lib/ai/strikerSiteMap";
import {
  getToolPlaybook,
  TOOLS,
} from "@/lib/ai/strikerToolMap";
import {
  ROLE_IDENTITY,
  GUARD_RAILS,
  PLATFORM_PRINCIPLES,
  FORGE_GLOSSARY,
  detectHandoff as detectWorkflowHandoff,
  buildGuardRailBlock,
  getRoleWorkflows,
} from "@/lib/ai/strikerWorkflowMap";

function textOf(value) {
  return String(value || "").toLowerCase();
}

function includesAny(text, phrases = []) {
  const t = textOf(text);
  return phrases.some((p) => t.includes(String(p || "").toLowerCase()));
}

function normalizeMode(mode = "") {
  const m = String(mode || "").trim().toUpperCase();
  if (m === "SEEKER") return "SEEKER";
  if (m === "COACH") return "COACH";
  if (m === "RECRUITER") return "RECRUITER";
  return "";
}

function compactList(items = [], limit = 6) {
  return Array.isArray(items) ? items.filter(Boolean).slice(0, limit) : [];
}

function getGlossaryLine(term) {
  try {
    return FORGE_GLOSSARY?.[term] || "";
  } catch {
    return "";
  }
}

function surfaceText(surface = "") {
  return String(surface || "").replace(/_/g, " ");
}

export function detectStrikerIntent({ message = "", mode = "", context = {} } = {}) {
  const text = textOf(message);
  const surface = String(context?.surface || "").toLowerCase();

  if ((text.includes("discovery match") || text.includes("discover match")) && text.includes("targeting match")) {
    return "explain_discovery_vs_targeting";
  }

  if (includesAny(text, ["post a job", "create a job", "job posting", "job listing", "publish a job", "add a job", "new job"])) {
    return "recruiter_job_posting";
  }

  if (
    includesAny(text, [
      "evaluate this candidate",
      "review this candidate",
      "assess this candidate",
      "should we interview",
      "should i interview",
      "shortlist",
      "move forward",
      "advance this candidate",
      "reject this candidate",
      "candidate next action",
      "what do you think of this candidate",
    ])
  ) {
    return "candidate_evaluation";
  }

  if (
    includesAny(text, [
      "refine my search",
      "fix my search",
      "better search",
      "targeting filters",
      "find candidates",
      "why are results",
      "search results",
      "candidate search",
    ]) ||
    (surface === "internal_candidate_search" && includesAny(text, ["search", "filter", "targeting", "results", "find"]))
  ) {
    return "recruiter_search_guidance";
  }

  if (
    includesAny(text, [
      "clean up this jd",
      "rewrite this jd",
      "improve this job description",
      "standardize this job description",
      "job description",
      "jd cleanup",
      "jd optimizer",
      "optimize jd",
    ])
  ) {
    return "jd_optimizer";
  }

  if (
    includesAny(text, [
      "improve my resume",
      "fix my resume",
      "resume section",
      "tailor my resume",
      "ats score",
      "hammer",
      "alignment score",
      "forge hammer",
    ])
  ) {
    return "resume_hammer_guidance";
  }

  if (includesAny(text, ["what should i do next", "next step", "guide me", "walk me through", "help me finish", "where am i", "what page am i on"])) {
    return "workflow_next_step";
  }

  if (
    includesAny(text, [
      "set up a client",
      "add a client",
      "coaching client",
      "client setup",
      "mentor",
      "session plan",
      "appointment request",
    ])
  ) {
    return "coach_client_setup";
  }

  if (
    includesAny(text, [
      "external candidate",
      "external record",
      "invite them",
      "become a member",
      "convert to member",
    ])
  ) {
    return "external_candidate_to_member";
  }

  if (surface && surface !== "general_workspace") {
    return "surface_guidance";
  }

  return "general_guidance";
}

export function getForgeDefinitions() {
  return [
    getGlossaryLine("Discovery Match") ||
      "Discovery Match = broader internal candidate discovery using semantic relevance, adjacent-role logic, profile/portfolio signal, resume support, skills, and preferences.",
    getGlossaryLine("Targeting Match") ||
      "Targeting Match = stricter internal qualification against explicit recruiter criteria and saved targeting rules.",
    getGlossaryLine("External Compare") ||
      "External Compare = separate recruiter workflow for pasted/uploaded external resumes and job descriptions.",
  ].join("\n");
}

function formatContextBrief(context = {}) {
  const lines = [];
  if (context?.surface) lines.push(`Current workspace: ${surfaceText(context.surface)}`);
  if (context?.activeCandidate?.name) {
    lines.push(`Active candidate: ${context.activeCandidate.name}${context.activeCandidate.title ? ` — ${context.activeCandidate.title}` : ""}`);
  }
  if (context?.activeJob?.title) lines.push(`Active job: ${context.activeJob.title}`);
  if (context?.activeSearch?.query) lines.push(`Active search: ${context.activeSearch.query}`);
  if (context?.activeWhy?.score != null) lines.push(`WHY score: ${context.activeWhy.score}`);
  if (context?.activeTool?.name) lines.push(`Active tool: ${context.activeTool.name}`);
  return lines.length ? lines.join("\n") : "";
}

function formatSurfacePlaybook(context = {}) {
  const surface = context?.surface || "general_workspace";
  const playbook = getSurfacePlaybook?.(surface);
  if (!playbook) return "";

  const actions = compactList(playbook.actions, 5);
  const forwards = compactList(playbook.forwardTo, 4);

  return [
    playbook.outcome ? `Surface goal: ${playbook.outcome}` : "",
    actions.length ? `Available guidance:\n${actions.map((a) => `- ${a}`).join("\n")}` : "",
    forwards.length ? `Useful next places:\n${forwards.map((f) => `- ${f}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
}

function formatToolGuide(toolKey) {
  const tool = getToolPlaybook?.(toolKey);
  if (!tool) return "";

  const steps = compactList(tool.howToGuide || tool.evaluationPath || tool.conversionPath, 7);
  return [
    tool.name ? `Tool: ${tool.name}` : "",
    tool.description ? tool.description : "",
    tool.where ? `Where: ${tool.where}` : "",
    steps.length ? steps.join("\n") : "",
  ].filter(Boolean).join("\n");
}

function formatWorkflow(mode, workflowKey) {
  const workflows = getRoleWorkflows?.(mode) || {};
  const wf = workflows?.[workflowKey];
  if (!wf) return "";

  return [
    wf.goal ? `Goal: ${wf.goal}` : "",
    Array.isArray(wf.steps) && wf.steps.length
      ? `Steps:\n${wf.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
      : "",
    Array.isArray(wf.rules) && wf.rules.length
      ? `Rules:\n${wf.rules.map((r) => `- ${r}`).join("\n")}`
      : "",
  ].filter(Boolean).join("\n\n");
}

export function buildOperationalGuidance({ route, mode = "", context = {}, message = "" } = {}) {
  const normalizedMode = normalizeMode(mode);
  const ctxBrief = formatContextBrief(context);
  const prefix = ctxBrief ? `${ctxBrief}\n\n` : "";

  switch (route) {
    case "explain_discovery_vs_targeting":
      return (
        "On this page, **Discovery Match** is the broader internal candidate discovery score. " +
        "It helps recruiters find people who may fit by using semantic relevance, adjacent-role logic, profile/portfolio signal, primary resume support, skills, preferences, and visible platform evidence.\n\n" +
        "**Targeting Match** is stricter. It supports precision filters, saved automation, and repeatable recruiter workflows, so it weighs explicit criteria more tightly: title, skills, status, location, education, languages, work preferences, and targeting rules.\n\n" +
        "Simple version: **Discovery helps you find possible fits. Targeting helps you qualify precise fits.**"
      );

    case "recruiter_job_posting": {
      const workflow = formatWorkflow("RECRUITER", "post_job");
      const tool = formatToolGuide(TOOLS.JD_OPTIMIZER);
      return [
        "Fastest path:",
        "**Recruiter Dashboard → Recruiter Tools → Job Postings → New**",
        workflow,
        tool ? `JD quality helper:\n${tool}` : "",
      ].filter(Boolean).join("\n\n");
    }

    case "candidate_evaluation": {
      const workflow = formatWorkflow("RECRUITER", "evaluate_candidate");
      const whyTool = formatToolGuide(TOOLS.WHY_ENGINE);

      if (context?.activeCandidate?.name || context?.activeWhy?.score != null) {
        return [
          prefix,
          workflow || "Evaluate the candidate by strongest evidence, biggest validation risk, and next action.",
          whyTool ? `\nWHY guidance:\n${whyTool}` : "",
        ].filter(Boolean).join("\n");
      }

      return (
        "Open the candidate’s WHY or full candidate view first, then ask me again. " +
        "I’ll translate the evidence into: shortlist, screen, keep warm, or skip."
      );
    }

    case "recruiter_search_guidance": {
      const workflow = formatWorkflow("RECRUITER", "find_candidates");
      return [
        prefix,
        workflow || "Start with Discovery Match to explore, then use Targeting Match to qualify.",
      ].filter(Boolean).join("\n");
    }

    case "jd_optimizer": {
      const workflow = formatWorkflow("RECRUITER", "clean_jd");
      const tool = formatToolGuide(TOOLS.JD_OPTIMIZER);
      return [
        workflow || "Clean the JD by separating role work from boilerplate, splitting must-have vs preferred, and removing vague traits.",
        tool,
        "Paste the JD and I’ll help restructure it for clearer candidate alignment and better targeting.",
      ].filter(Boolean).join("\n\n");
    }

    case "resume_hammer_guidance": {
      const workflow = formatWorkflow("SEEKER", "build_resume");
      const tool = formatToolGuide(TOOLS.FORGE_HAMMER);
      return [
        tool || "Use Forge Hammer to compare resume evidence against the target JD.",
        workflow,
      ].filter(Boolean).join("\n\n");
    }

    case "coach_client_setup": {
      const workflow = formatWorkflow("COACH", "onboard_new_client");
      return workflow || (
        "Client setup path:\n" +
        "1. Add the client profile.\n" +
        "2. Capture their goal and current blocker.\n" +
        "3. Add resume/profile evidence if available.\n" +
        "4. Use coaching strategy tools to create the first action plan.\n" +
        "5. End with homework and next-session focus."
      );
    }

    case "external_candidate_to_member": {
      const workflow = formatWorkflow("RECRUITER", "evaluate_external_candidate");
      const tool = formatToolGuide(TOOLS.EXTERNAL_COMPARE);
      return [
        workflow,
        tool,
        "If they’re worth continuing with, invite them to become a ForgeTomorrow member so internal profile/portfolio signal can strengthen the evaluation.",
      ].filter(Boolean).join("\n\n");
    }

    case "workflow_next_step": {
      const surfaceGuide = formatSurfacePlaybook(context);
      if (surfaceGuide) {
        return [
          prefix,
          surfaceGuide,
          "Tell me the outcome you want and I’ll walk it through to completion.",
        ].filter(Boolean).join("\n\n");
      }

      return (
        "Tell me the outcome you want in one sentence — for example: “post a job,” “evaluate this candidate,” “tighten this search,” “fix this resume section,” or “set up this coaching client.” I’ll walk the task to completion."
      );
    }

    case "surface_guidance": {
      const surfaceGuide = formatSurfacePlaybook(context);
      if (surfaceGuide) {
        return [
          prefix,
          surfaceGuide,
          "Best next step: tell me what you want to finish on this page.",
        ].filter(Boolean).join("\n\n");
      }
      return "";
    }

    default:
      return "";
  }
}

export function buildRouteSystemHint({ route, context = {}, mode = "" } = {}) {
  const normalizedMode = normalizeMode(mode || context?.mode);
  const identity = normalizedMode ? ROLE_IDENTITY?.[normalizedMode] : null;
  const surfaceGuide = formatSurfacePlaybook(context);
  const guardrails = normalizedMode ? buildGuardRailBlock?.(normalizedMode) : "";
  const principles = compactList(PLATFORM_PRINCIPLES, 8);

  return [
    `Detected operational route: ${route || "general_guidance"}`,
    normalizedMode && identity?.persona ? `Role identity: ${identity.persona}` : "",
    getForgeDefinitions(),
    surfaceGuide,
    guardrails,
    principles.length ? `Platform principles:\n${principles.map((p) => `- ${p}`).join("\n")}` : "",
    context?.surface ? `Current surface: ${context.surface}` : "",
    context?.activeCandidate?.name ? `Active candidate: ${context.activeCandidate.name}` : "",
    context?.activeJob?.title ? `Active job: ${context.activeJob.title}` : "",
    context?.activeSearch?.query ? `Active search: ${context.activeSearch.query}` : "",
  ].filter(Boolean).join("\n\n");
}

export function detectMappedHandoff({ threadMode, content }) {
  try {
    return detectWorkflowHandoff?.({ threadMode, content }) || null;
  } catch {
    return null;
  }
}
