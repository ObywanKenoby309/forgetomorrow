// lib/templates/applyTemplate.js
import { getResumeTemplateById } from './resumeTemplates';

/**
 * Build an initial resume document state from a template + optional profile data.
 * The shape maps to your ResumeContext pieces so we can seed fields non-destructively.
 */
export function applyResumeTemplate(templateId, profile = {}) {
  const tpl = getResumeTemplateById(String(templateId));
  const base = tpl ?? {
    id: "default",
    name: "Default",
    layout: "one-column",
    theme: { font: "Inter", accent: "#FF7043" },
    sectionOrder: ["summary","experience","education","skills"],
    defaults: {},
  };

  const summary =
    profile.summary ||
    base.defaults.summary ||
    "Add a short 2–3 sentence summary that highlights outcomes.";

  const skills =
    (profile.skills && profile.skills.length ? profile.skills : base.defaults.skills) || [];

  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const education = Array.isArray(profile.education) ? profile.education : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
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
      summary: { visible: true, data: { text: summary } },
      experience: { visible: true, items: experience },
      education: { visible: true, items: education },
      skills: { visible: true, items: skills },
      projects: { visible: projects.length > 0, items: projects },
      links: { visible: links.length > 0, items: links },
      highlights: { visible: Array.isArray(base.defaults.highlights), items: base.defaults.highlights || [] },
      achievements: { visible: Array.isArray(base.defaults.achievements), items: base.defaults.achievements || [] },
      certifications: { visible: false, items: [] },
      languages: { visible: false, items: [] },
      activities: { visible: false, items: [] },
      custom: { visible: false, items: [] },
    },
  };
}
