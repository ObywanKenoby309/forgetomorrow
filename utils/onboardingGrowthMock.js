// utils/onboardingGrowthMock.js

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * generateOnboardingPlan(resume)
 * Mock AI: returns a structured 30/60/90 plan + growth recs.
 * - Accepts a "resume" object (from your ResumeContext list)
 * - Returns an object you can render immediately on the results page
 */
export async function generateOnboardingPlan(resume) {
  // Simulate latency so the UI can show a spinner
  await sleep(900);

  const fullName =
    resume?.fullName ||
    resume?.formData?.fullName ||
    resume?.title ||
    'You';

  const headline = (resume?.summary || '').slice(0, 160);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      candidate: fullName,
      headline: headline || 'Personalized onboarding & growth roadmap',
    },
    day30: {
      objectives: [
        'Align on role scope, KPIs, and success measures with manager.',
        'Audit current tools, workflow, and key customer touchpoints.',
        'Build relationships with cross‑functional partners.',
      ],
      actions: [
        'Schedule 1:1s with manager, peers, and critical stakeholders.',
        'Shadow top performers; document repeatable behaviors.',
        'Review ticket/CS data (SLAs, CSAT/NPS, backlog, top drivers).',
      ],
      metrics: [
        'Documented charter + KPI baseline established.',
        'Relationship map created (owners, SLAs, escalation paths).',
        'Quick‑win backlog identified and prioritized.',
      ],
      quickWins: [
        'Triage template or macro that removes one common blocker.',
        'Revive a dormant dashboard and share in weekly sync.',
      ],
      risks: [
        'Unclear ownership across teams; propose RACI by end of week 4.',
      ],
    },
    day60: {
      objectives: [
        'Implement 2–3 quick wins and pilot 1 deeper improvement.',
        'Standardize reporting cadence for KPIs.',
        'Begin tightening process handoffs with partners.',
      ],
      actions: [
        'Roll out a light SOP + checklist for a high‑volume workflow.',
        'Stand up a weekly KPI review (15 min) with visuals.',
        'Draft a lightweight training module for new team members.',
      ],
      metrics: [
        'Backlog down 10–15% vs baseline; SLA adherence up 5–8 pts.',
        'Week‑over‑week KPI trend shared with stakeholders.',
      ],
      risks: [
        'Change fatigue; mitigate via short pilots and visible wins.',
      ],
    },
    day90: {
      objectives: [
        'Lock in tooling/process improvements with documentation.',
        'Propose quarter‑ahead roadmap tied to KPIs and ROI.',
        'Mentor/coach to scale performance.',
      ],
      actions: [
        'Finalize SOPs, playbooks, and role expectations.',
        'Publish a Q2 roadmap with estimates and owners.',
        'Create a simple enablement plan (micro‑trainings, office hours).',
      ],
      metrics: [
        'SLA/CSAT/NPS improved vs baseline; variance reduced.',
        'Team onboarding time reduced by 15–25%.',
      ],
      presentation: 'Deliver a 10‑slide summary: baseline → actions → outcomes → next‑quarter plan.',
    },
    growthRecommendations: [
      'Deepen analytics: build a “Top Drivers” weekly one‑pager.',
      'Automate low‑variance tasks (macros, forms, routing rules).',
      'Establish a feedback loop with Product for recurring defects.',
      'Document a hiring plan aligned to volume & seasonality.',
    ],
    skillsFocus: [
      'Stakeholder management & narrative reporting',
      'Process mapping (SIPOC) and RACI definition',
      'Tooling hygiene (e.g., queues, tags, views, alerts)',
      'Coaching via metric‑linked 1:1s',
    ],
  };
}
