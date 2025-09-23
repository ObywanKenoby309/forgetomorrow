// lib/templates/resumeTemplates.js

// ForgeTomorrow Resume Templates (ATS-first)
// Each template defines: layout, theme, section order, and minimal defaults.

export const RESUME_TEMPLATES = [
  {
    id: "reverse",
    name: "Reverse (Default)",
    layout: "one-column",
    theme: { font: "Inter", accent: "#FF7043" },
    sectionOrder: ["summary","experience","skills","education","projects","certifications","achievements"],
    defaults: {
      summary: "Target role + years of experience + 2–3 strengths + 1 metric-driven result.",
      skills: ["Customer Success","Support Ops","Process Improvement","Leadership","Salesforce"],
      experience: [
        {
          company: "Company Name",
          role: "Role Title",
          start: "Jan 2023",
          end: "Present",
          bullets: [
            "Improved KPI by X% through Y.",
            "Led Z team delivering measurable outcomes.",
          ],
        },
      ],
    },
  },
  {
    id: "hybrid",
    name: "Hybrid (Combination)",
    layout: "one-column",
    theme: { font: "Inter", accent: "#455A64" },
    sectionOrder: ["summary","achievements","skills","experience","education","projects","certifications"],
    defaults: {
      summary: "Professional blending hands-on execution with leadership and measurable results.",
      achievements: [
        "Lifted NPS +18 points across 120K+ tickets.",
        "Cut resolution time by 22% through triage revamp.",
      ],
      skills: ["Customer Success","Support Ops","Process Design","Analytics","ServiceNow","Jira"],
      experience: [
        {
          company: "Company Name",
          role: "Role Title",
          start: "2021",
          end: "Present",
          bullets: [
            "Scaled workflows handling X cases/year.",
            "Launched dashboard stack for SLAs/CSAT.",
          ],
        },
      ],
    },
  },

  // Legacy / optional templates (can be hidden from UI if not recommended)
  {
    id: "modern",
    name: "Modern",
    layout: "two-column",
    theme: { font: "Inter", accent: "#FF7043" },
    sectionOrder: ["summary","experience","skills","projects","education","links"],
    defaults: {
      summary: "Customer-obsessed problem solver focused on measurable outcomes.",
      skills: ["Communication","Leadership","SQL","Salesforce"],
    },
  },
  {
    id: "classic",
    name: "Classic",
    layout: "one-column",
    theme: { font: "Inter", accent: "#0F172A" },
    sectionOrder: ["summary","experience","education","skills","projects","certifications"],
    defaults: { summary: "Detail-oriented professional with a track record of reliability." },
  },
  // ... (rest of your existing templates unchanged)
];

export function getResumeTemplateById(id) {
  return RESUME_TEMPLATES.find((t) => t.id === id) || null;
}
