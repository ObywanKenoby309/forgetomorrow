// lib/ai/matchTemplate.js
// Stubbed matcher: choose resume+cover template + return rationale/keywords.
// Swap implementation later to real AI; keep the same return shape.

import { pickResumeTemplateFallback, pickCoverTemplateFallback } from '@/lib/templates';

export async function matchTemplate({ jobText = '', profile = {} } = {}) {
  // Heuristic keyword pull (very light; replace with AI later)
  const lower = jobText.toLowerCase();
  const keywords = Array.from(new Set(
    (lower.match(/\b[a-z][a-z\-]{3,}\b/g) || [])
      .filter(w => !['with','from','that','this','your','have','will','team','work','role','and','the','for','into','over','plus','such'].includes(w))
  )).slice(0, 25);

  const resumeId = pickResumeTemplateFallback(jobText);
  const coverId  = pickCoverTemplateFallback(jobText);

  const reasons = {
    resume: {
      id: resumeId,
      why: resumeId === 'formal'
        ? 'Regulated/finance/healthcare signals detected → conservative formatting.'
        : resumeId === 'impact'
        ? 'Leadership/sales keywords detected → bold headings and metrics-forward.'
        : resumeId === 'classic'
        ? 'Administrative/education signals → traditional layout for clarity.'
        : 'Tech/support/product signals or default → clean, modern layout.',
    },
    cover: {
      id: coverId,
      why: coverId === 'achievement'
        ? 'Role emphasizes targets/metrics → bullet-led achievement letter.'
        : coverId === 'narrative'
        ? 'Mission/impact cues → short story-driven letter.'
        : 'General/tech roles → concise professional letter.',
    },
  };

  return { resumeId, coverId, keywords, reasons };
}
