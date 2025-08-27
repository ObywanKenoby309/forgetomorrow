// lib/templates/index.js
// Single registry for Resume + Cover templates + helpers

// ---- Template metadata (display + matching hints) ----
export const resumeTemplates = [
  { id: 'modern',  name: 'Modern',  strengths: ['tech', 'saas', 'startups'], vibe: 'clean',    density: 'medium' },
  { id: 'classic', name: 'Classic', strengths: ['ops', 'admin', 'education'], vibe: 'traditional', density: 'low' },
  { id: 'formal',  name: 'Formal',  strengths: ['finance', 'healthcare', 'regulated'], vibe: 'conservative', density: 'low' },
  { id: 'impact',  name: 'Impact',  strengths: ['leadership', 'sales', 'exec'], vibe: 'bold',    density: 'high' },
];

export const coverTemplates = [
  { id: 'concise',     name: 'Concise',     strengths: ['tech', 'support', 'analyst'], style: 'tight' },
  { id: 'narrative',   name: 'Narrative',   strengths: ['nonprofit', 'education', 'creative'], style: 'story' },
  { id: 'achievement', name: 'Achievement', strengths: ['sales', 'ops', 'leadership'], style: 'bullets' },
];

// ---- Lazy component loader (keeps imports tidy) ----
export async function getResumeTemplateComponent(id) {
  switch (id) {
    case 'classic': return (await import('@/components/templates/resume/Classic')).default;
    case 'formal':  return (await import('@/components/templates/resume/Formal')).default;
    case 'impact':  return (await import('@/components/templates/resume/Impact')).default;
    case 'modern':
    default:        return (await import('@/components/templates/resume/Modern')).default;
  }
}

export async function getCoverTemplateComponent(id) {
  switch (id) {
    case 'narrative':   return (await import('@/components/templates/cover/Narrative')).default;
    case 'achievement': return (await import('@/components/templates/cover/Achievement')).default;
    case 'concise':
    default:            return (await import('@/components/templates/cover/Concise')).default;
  }
}

// ---- Simple, deterministic fallback pickers (used if AI unavailable) ----
export function pickResumeTemplateFallback(jobText = '') {
  const txt = jobText.toLowerCase();
  if (/\b(cfo|compliance|hipaa|sox|clinical|healthcare|bank|finance)\b/.test(txt)) return 'formal';
  if (/\b(sales|quota|pipeline|revenue|vp|director|leader|executive)\b/.test(txt)) return 'impact';
  if (/\b(teacher|school|admin|assistant|coordinator)\b/.test(txt)) return 'classic';
  if (/\b(engineer|developer|product|saas|cloud|support)\b/.test(txt)) return 'modern';
  return 'modern';
}

export function pickCoverTemplateFallback(jobText = '') {
  const txt = jobText.toLowerCase();
  if (/\b(sales|quota|target|kpi)\b/.test(txt)) return 'achievement';
  if (/\b(nonprofit|foundation|community|mission|impact)\b/.test(txt)) return 'narrative';
  return 'concise';
}
