// pages/api/coach/suggestions.ts
// Simple "coach brain" endpoint for resume improvement suggestions.
// v1 is heuristic only — can be swapped to Grok/OpenAI later without changing the UI.

import type { NextApiRequest, NextApiResponse } from 'next';

type CoachSuggestionsRequest = {
  jd?: string;
  resume?: {
    summary?: string;
    skills?: string[];
    experiences?: {
      title?: string;
      company?: string;
      bullets?: string[];
      highlights?: string[];
      description?: string;
    }[];
  };
  // Optional: missing keywords from the heuristic matcher
  missing?: {
    high?: string[];
    tools?: string[];
    soft?: string[];
    edu?: string[];
    other?: string[];
  };
};

type CoachSuggestionsResponse = {
  summarySuggestions: string[];
  bulletSuggestions: string[];
  skillSuggestions: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CoachSuggestionsResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body || {}) as CoachSuggestionsRequest;
  const jd = (body.jd || '').toString();
  const resume = body.resume || {};
  const missing = body.missing || {};

  const missingHigh = Array.isArray(missing.high) ? missing.high : [];
  const missingTools = Array.isArray(missing.tools) ? missing.tools : [];
  const missingSoft = Array.isArray(missing.soft) ? missing.soft : [];
  const missingEdu = Array.isArray(missing.edu) ? missing.edu : [];

  // ——————————————————————————
  // 1. SUMMARY SUGGESTIONS
  // ——————————————————————————
  const summarySuggestions: string[] = [];

  if (missingHigh.length) {
    summarySuggestions.push(
      `Add 1–2 sentences in your summary that mention your experience with: ${missingHigh
        .slice(0, 4)
        .join(', ')}.`
    );
  }

  if (missingTools.length) {
    summarySuggestions.push(
      `Include a short phrase like "Hands-on with ${missingTools
        .slice(0, 4)
        .join(', ')}" in your summary so it’s clear you use those tools.`
    );
  }

  if (missingSoft.length) {
    summarySuggestions.push(
      `If it fits you, weave in soft skills like ${missingSoft
        .slice(0, 3)
        .join(', ')} using real outcomes (e.g., "Improved X by Y% by doing Z").`
    );
  }

  if (missingEdu.length) {
    summarySuggestions.push(
      `If you meet the education requirements (${missingEdu.join(
        ', '
      )}) but it’s not clearly visible, make sure your highest degree is easy to spot near the top of your resume.`
    );
  }

  if (!summarySuggestions.length) {
    summarySuggestions.push(
      'Your summary already looks well aligned. Focus your edits on specific bullets and skills instead.'
    );
  }

  // ——————————————————————————
  // 2. BULLET SUGGESTIONS
  // ——————————————————————————
  const bulletSuggestions: string[] = [];

  const primaryHigh = missingHigh.slice(0, 3);
  if (primaryHigh.length) {
    primaryHigh.forEach((term) => {
      bulletSuggestions.push(
        `Add a bullet like: "Led ${term} initiatives that delivered measurable results (e.g., increased KPI or reduced cost)."`.replace(
          /\s+/g,
          ' '
        )
      );
    });
  }

  const primaryTools = missingTools.slice(0, 3);
  if (primaryTools.length) {
    primaryTools.forEach((tool) => {
      bulletSuggestions.push(
        `Add a bullet like: "Used ${tool} to monitor, analyze, and optimize performance for key projects or campaigns."`
      );
    });
  }

  if (!bulletSuggestions.length && jd) {
    bulletSuggestions.push(
      'Scan the job description for its top 3 responsibilities and mirror each one in a bullet that includes a verb, what you did, and a measurable outcome.'
    );
  }

  // ——————————————————————————
  // 3. SKILL SUGGESTIONS
  // ——————————————————————————
  const skillSuggestionsSet = new Set<string>();

  missingHigh.forEach((t) => skillSuggestionsSet.add(t));
  missingTools.forEach((t) => skillSuggestionsSet.add(t));

  const skillSuggestions = Array.from(skillSuggestionsSet);

  if (!skillSuggestions.length && jd) {
    skillSuggestions.push(
      'Your skills appear broadly aligned. Double-check that every key technical term in the job description is present in your Skills section.'
    );
  }

  const payload: CoachSuggestionsResponse = {
    summarySuggestions,
    bulletSuggestions,
    skillSuggestions,
  };

  return res.status(200).json(payload);
}
