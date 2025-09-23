// lib/templates/index.js
// Single registry for Resume + Cover templates + helpers

// ---- Resume templates shown in the UI (ATS-safe only) ----
export const resumeTemplates = [
  { id: 'reverse', name: 'Reverse (Default)' },
  { id: 'hybrid',  name: 'Hybrid (Combination)' },
];

// ---- Cover templates (unchanged) ----
export const coverTemplates = [
  { id: 'concise',     name: 'Concise',     strengths: ['tech', 'support', 'analyst'], style: 'tight' },
  { id: 'narrative',   name: 'Narrative',   strengths: ['nonprofit', 'education', 'creative'], style: 'story' },
  { id: 'achievement', name: 'Achievement', strengths: ['sales', 'ops', 'leadership'], style: 'bullets' },
];

// ---- Lazy component loader (keeps imports tidy) ----
export async function getResumeTemplateComponent(id) {
  switch (id) {
    case 'reverse':
      return (await import('@/components/resume-form/templates/ReverseResumeTemplate')).default;
    case 'hybrid':
      return (await import('@/components/resume-form/templates/HybridResumeTemplate')).default;
    case 'classic':
      return (await import('@/components/templates/resume/Classic')).default;
    case 'formal':
      return (await import('@/components/templates/resume/Formal')).default;
    case 'impact':
      return (await import('@/components/templates/resume/Impact')).default;
    case 'modern':
    default:
      return (await import('@/components/templates/resume/Modern')).default;
  }
}

// ---- Cover components (keep your existing ones) ----
export async function getCoverTemplateComponent(id) {
  switch (id) {
    case 'narrative':   return (await import('@/components/templates/cover/Narrative')).default;
    case 'achievement': return (await import('@/components/templates/cover/Achievement')).default;
    case 'concise':
    default:            return (await import('@/components/templates/cover/Concise')).default;
  }
}

// ---- Fallback pickers (updated to return the two IDs only) ----
export function pickResumeTemplateFallback(jobText = '') {
  const txt = jobText.toLowerCase();
  // Skills-first roles → hybrid; otherwise reverse.
  if (/\b(analyst|support|coordinator|specialist|multidisciplinary|generalist)\b/.test(txt)) return 'hybrid';
  return 'reverse';
}

export function pickCoverTemplateFallback(jobText = '') {
  const txt = jobText.toLowerCase();
  if (/\b(sales|quota|target|kpi)\b/.test(txt)) return 'achievement';
  if (/\b(nonprofit|foundation|community|mission|impact)\b/.test(txt)) return 'narrative';
  return 'concise';
}
