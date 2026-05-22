// lib/ai/strikerRoutes.js
// ForgeTomorrow Striker operational router.
// Routes common platform/workflow asks before generic generation so Striker behaves like a Forge-native guide.

function textOf(value) {
  return String(value || "").toLowerCase();
}

function includesAny(text, phrases = []) {
  const t = textOf(text);
  return phrases.some((p) => t.includes(String(p || "").toLowerCase()));
}

export function detectStrikerIntent({ message = "", mode = "", context = {} } = {}) {
  const text = textOf(message);
  const surface = String(context?.surface || "").toLowerCase();

  if ((text.includes("discovery match") || text.includes("discover match")) && text.includes("targeting match")) {
    return "explain_discovery_vs_targeting";
  }

  if (includesAny(text, ["post a job", "create a job", "job posting", "job listing", "publish a job", "add a job"])) {
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
    ])
  ) {
    return "resume_hammer_guidance";
  }

  if (includesAny(text, ["what should i do next", "next step", "guide me", "walk me through", "help me finish"])) {
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

  return "general_guidance";
}

export function getForgeDefinitions() {
  return [
    "Discovery Match = broader internal candidate discovery. It helps recruiters find possible fits using semantic relevance, adjacent-role logic, portfolio/profile signal, primary resume support, skills, preferences, and visible platform evidence.",
    "Targeting Match = stricter qualification. It supports precision filters, saved automation, and repeatable recruiter workflows using explicit criteria like title, skills, status, location, education, languages, work preferences, and targeting rules.",
    "External Compare is separate. It is for pasted/uploaded external resumes and job descriptions.",
  ].join("\n");
}

function formatContextBrief(context = {}) {
  const lines = [];
  if (context?.surface) lines.push(`Current workspace: ${context.surface}`);
  if (context?.activeCandidate?.name) {
    lines.push(`Active candidate: ${context.activeCandidate.name}${context.activeCandidate.title ? ` — ${context.activeCandidate.title}` : ""}`);
  }
  if (context?.activeJob?.title) lines.push(`Active job: ${context.activeJob.title}`);
  if (context?.activeSearch?.query) lines.push(`Active search: ${context.activeSearch.query}`);
  if (context?.activeWhy?.score != null) lines.push(`WHY score: ${context.activeWhy.score}`);
  return lines.length ? lines.join("\n") : "";
}

export function buildOperationalGuidance({ route, mode = "", context = {}, message = "" } = {}) {
  const ctxBrief = formatContextBrief(context);
  const prefix = ctxBrief ? `${ctxBrief}\n\n` : "";

  switch (route) {
    case "explain_discovery_vs_targeting":
      return (
        "On this page, **Discovery Match** is the broader internal candidate discovery score. " +
        "It helps recruiters find people who may fit by using semantic relevance, adjacent-role logic, portfolio/profile signal, primary resume support, skills, and visible preferences.\n\n" +
        "**Targeting Match** is stricter. It is used for precision filters, saved automation, and repeatable recruiter workflows, so it weighs explicit criteria more tightly: title, skills, status, location, education, languages, work preferences, and targeting rules.\n\n" +
        "Simple version: **Discovery helps you find possible fits. Targeting helps you qualify precise fits.**"
      );

    case "recruiter_job_posting":
      return (
        "Fastest path:\n" +
        "**Recruiter Dashboard → Recruiter Tools → Job Posting**\n\n" +
        "When you create the post, build it in this order:\n" +
        "1. Clear role title\n" +
        "2. Short role summary\n" +
        "3. Must-have requirements\n" +
        "4. Preferred/nice-to-have signals\n" +
        "5. Core responsibilities\n" +
        "6. Work type, location, compensation/range if available\n" +
        "7. Publish or save draft\n\n" +
        "Recommendation: keep company boilerplate out of the main JD body as much as possible. Heavy boilerplate dilutes candidate alignment quality and makes targeting less precise."
      );

    case "candidate_evaluation": {
      const c = context?.activeCandidate;
      const why = context?.activeWhy;
      if (c?.name || why?.score != null) {
        return (
          prefix +
          "Use this evaluation path:\n" +
          "1. Confirm the strongest evidence: title, skills, portfolio/profile signal, and resume support.\n" +
          "2. Identify the biggest validation risk: missing proof, weak direct title match, limited project evidence, or logistics mismatch.\n" +
          "3. Decide the next action:\n" +
          "   - Strong evidence + low risk → shortlist or message.\n" +
          "   - Strong adjacent evidence → screen/interview with targeted validation questions.\n" +
          "   - Weak evidence + high risk → keep warm or skip.\n\n" +
          "Best next move: ask for one concrete example that proves scope, ownership, tools used, and outcome."
        );
      }

      return (
        "Open the candidate’s WHY or full candidate view first, then ask me again. " +
        "I’ll help translate the evidence into: shortlist, screen, keep warm, or skip."
      );
    }

    case "recruiter_search_guidance":
      return (
        prefix +
        "For internal candidate search, start broad, then tighten.\n\n" +
        "Use **Discovery Match** to find possible-fit and adjacent-fit candidates. Then use **Targeting Match** when you need stricter qualification or saved automation.\n\n" +
        "Best next action:\n" +
        "1. Search by role family first, not one exact title.\n" +
        "2. Add location/work preference only if it truly matters.\n" +
        "3. Use targeting filters after you see the first candidate spread.\n" +
        "4. Open WHY only for candidates you might actually act on."
      );

    case "jd_optimizer":
      return (
        "JD cleanup path:\n" +
        "1. Separate role work from company boilerplate.\n" +
        "2. Split requirements into must-have and preferred.\n" +
        "3. Remove vague traits unless they map to real work.\n" +
        "4. Add measurable responsibilities where possible.\n" +
        "5. Keep EEO/legal language outside the main role requirements when possible.\n\n" +
        "Paste the JD and I’ll help restructure it for clearer candidate alignment and better targeting."
      );

    case "resume_hammer_guidance":
      return (
        "Use Hammer like this:\n" +
        "1. Load or paste the target JD.\n" +
        "2. Run the alignment review.\n" +
        "3. Fix only evidence-backed gaps — do not invent skills.\n" +
        "4. Strengthen Summary, Skills, and Experience bullets around the JD’s actual requirements.\n" +
        "5. Re-run after edits to confirm improvement.\n\n" +
        "Goal: clearer evidence, not keyword stuffing."
      );

    case "coach_client_setup":
      return (
        "Client setup path:\n" +
        "1. Add the client profile.\n" +
        "2. Capture their goal and current blocker.\n" +
        "3. Add resume/profile evidence if available.\n" +
        "4. Use the coaching strategy tools to create the first action plan.\n" +
        "5. End with homework and next-session focus.\n\n" +
        "If this is an external client, start with what you know and fill gaps during the first session."
      );

    case "external_candidate_to_member":
      return (
        "External candidate conversion path:\n" +
        "1. Create or open the external candidate record.\n" +
        "2. Attach/paste resume evidence.\n" +
        "3. Compare against the role or recruiting goal.\n" +
        "4. If they’re worth continuing with, invite them to become a ForgeTomorrow member so their portfolio/profile can strengthen the signal.\n" +
        "5. Once they join, use internal candidate intelligence instead of external-only evaluation."
      );

    case "workflow_next_step":
      return (
        prefix +
        "Best next move: tell me the outcome you want in one sentence — for example, “post a job,” “evaluate this candidate,” “tighten this search,” “fix this resume section,” or “set up this coaching client.” I’ll walk the task to completion."
      );

    default:
      return "";
  }
}

export function buildRouteSystemHint({ route, context = {} } = {}) {
  return [
    `Detected operational route: ${route || "general_guidance"}`,
    getForgeDefinitions(),
    context?.surface ? `Current surface: ${context.surface}` : "",
    context?.activeCandidate?.name ? `Active candidate: ${context.activeCandidate.name}` : "",
    context?.activeJob?.title ? `Active job: ${context.activeJob.title}` : "",
    context?.activeSearch?.query ? `Active search: ${context.activeSearch.query}` : "",
  ].filter(Boolean).join("\n");
}
