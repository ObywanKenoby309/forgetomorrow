// lib/templates/resumeTemplates.js
export const RESUME_TEMPLATES = [
  {
    id: 'reverse',
    name: 'Reverse (Default)',
    layout: 'one-column',
    theme: { font: 'Inter', accent: '#FF7043' },
    sectionOrder: ['summary','experience','projects','education','skills','certifications','languages'],
    defaults: {
      summary: 'Professional with measurable outcomes and clear impact.',
      skills: ['Communication','Problem Solving','Microsoft Office','Coaching'],
      certifications: [],
      languages: [], // [{ language, proficiency, years }]
    },
  },
  {
    id: 'hybrid',
    name: 'Hybrid (Combination)',
    layout: 'two-column',
    theme: { font: 'Inter', accent: '#FF7043' },
    sectionOrder: ['summary','skills','experience','projects','education','certifications','languages'],
    defaults: {
      summary: 'Skills-forward professional with proven results.',
      skills: ['Leadership','Cross-functional','Stakeholder Management'],
      certifications: [],
      languages: [],
    },
  },
];

export function getResumeTemplateById(id) {
  return RESUME_TEMPLATES.find(t => t.id === id) || null;
}
