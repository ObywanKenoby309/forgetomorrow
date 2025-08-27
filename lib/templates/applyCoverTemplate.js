// lib/templates/applyCoverTemplate.js
import { getCoverTemplateById } from './coverTemplates';

/**
 * Build an initial cover letter state from a template + optional profile hints.
 * Shape is simple so your editor can map it easily.
 */
export function applyCoverTemplate(templateId, profile = {}) {
  const tpl = getCoverTemplateById(String(templateId));
  const base = tpl ?? {
    id: "impact",
    name: "Impact",
    tone: "results-first, concise",
    defaults: {
      greeting: "Dear Hiring Manager,",
      opening: "I’m excited to apply for the role and bring a track record of measurable results.",
      body: [
        "Drove measurable outcomes across key KPIs.",
        "Built repeatable playbooks to scale success.",
      ],
      valueProp: "I can help you hit goals faster with proven systems and execution.",
      closing: "Thanks for your time—I’d love to share more context.",
      signoff: "Sincerely,",
    },
  };

  // Optionally fold profile data in (e.g., name, target role)
  const name = profile.name || "";
  const targetRole = profile.targetRole || "the role";

  return {
    meta: {
      templateId: base.id,
      templateName: base.name,
      tone: base.tone,
      createdAt: new Date().toISOString(),
    },
    fields: {
      recipient: "",               // e.g., "Jane Doe"
      company: "",                 // e.g., "Company XYZ"
      role: targetRole,            // e.g., "Customer Success Lead"
      greeting: base.defaults.greeting,
      opening: base.defaults.opening,
      body: Array.isArray(base.defaults.body) ? base.defaults.body : [],
      valueProp: base.defaults.valueProp || "",
      closing: base.defaults.closing,
      signoff: base.defaults.signoff,
      signatureName: name,         // candidate’s name
      signatureContact: "",        // e.g., "email · phone · linkedin"
    },
  };
}
