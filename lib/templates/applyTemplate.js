// lib/templates/applyTemplate.js
import { getResumeTemplateById } from './resumeTemplates';

export function applyResumeTemplate(templateId, profile = {}) {
  const tpl = getResumeTemplateById(String(templateId)) || getResumeTemplateById('reverse');

  const base = tpl ?? {
    id: 'reverse',
    name: 'Reverse (Default)',
    layout: 'one-column',
    theme: { font: 'Inter', accent: '#FF7043' },
    sectionOrder: ['summary','experience','education','skills','languages'],
    defaults: {},
  };

  const summary =
    profile.summary ||
    base.defaults.summary ||
    'Add a short 2–3 sentence summary that highlights outcomes.';

  const skills =
    (profile.skills && profile.skills.length ? profile.skills : base.defaults.skills) || [];

  const experience     = Array.isArray(profile.experience) ? profile.experience : [];
  const education      = Array.isArray(profile.education) ? profile.education : [];
  const projects       = Array.isArray(profile.projects) ? profile.projects : [];
  const certifications = Array.isArray(profile.certifications)
    ? profile.certifications
    : (base.defaults.certifications || []);
  const languages      = Array.isArray(profile.languages)
    ? profile.languages
    : (base.defaults.languages || []);
  const links =
    Array.isArray(base.defaults.links) ? base.defaults.links : (profile.links || []);

  return {
    meta: {
      templateId: base.id,
      templateName: base.name,
      layout: base.layout,
      theme: base.theme,
      createdAt: new Date().toISOString(),
    },
    sectionOrder: base.sectionOrder,
    sections: {
      summary:        { visible: true,                  data:  { text: summary } },
      experience:     { visible: true,                  items: experience },
      education:      { visible: true,                  items: education },
      skills:         { visible: skills.length > 0,     items: skills },
      projects:       { visible: projects.length > 0,   items: projects },
      certifications: { visible: certifications.length > 0, items: certifications },
      languages:      { visible: languages.length > 0,  items: languages },
      links:          { visible: links.length > 0,      items: links },
      highlights:     { visible: Array.isArray(base.defaults.highlights), items: base.defaults.highlights || [] },
      achievements:   { visible: Array.isArray(base.defaults.achievements), items: base.defaults.achievements || [] },
      activities:     { visible: false, items: [] },
      custom:         { visible: false, items: [] },
    },
  };
}
