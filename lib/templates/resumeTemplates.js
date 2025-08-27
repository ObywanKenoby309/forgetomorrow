// lib/templates/resumeTemplates.js
export const RESUME_TEMPLATES = [
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
  {
    id: "minimal",
    name: "Minimal",
    layout: "one-column",
    theme: { font: "Inter", accent: "#64748B" },
    sectionOrder: ["summary","experience","skills","education","links"],
    defaults: {},
  },
  {
    id: "executive",
    name: "Executive",
    layout: "one-column",
    theme: { font: "Inter", accent: "#111827" },
    sectionOrder: ["summary","highlights","experience","boards","education","certifications"],
    defaults: {
      highlights: [
        "Scaled org from 12 → 85 FTEs",
        "$28M P&L ownership",
        "NPS +24 pts in 12 months",
      ],
    },
  },
  {
    id: "pm",
    name: "Product Manager",
    layout: "two-column",
    theme: { font: "Inter", accent: "#1D4ED8" },
    sectionOrder: ["summary","experience","skills","projects","education"],
    defaults: { skills: ["Discovery","Roadmaps","A/B Testing","SQL","JIRA"] },
  },
  {
    id: "engineering",
    name: "Engineering",
    layout: "two-column",
    theme: { font: "Inter", accent: "#2563EB" },
    sectionOrder: ["summary","skills","experience","projects","education"],
    defaults: { skills: ["React","Node","TypeScript","Postgres","AWS"] },
  },
  {
    id: "design",
    name: "Design",
    layout: "two-column",
    theme: { font: "Inter", accent: "#8B5CF6" },
    sectionOrder: ["summary","projects","experience","skills","education","links"],
    defaults: { links: [{ label: "Portfolio", url: "https://yourdomain.com" }] },
  },
  {
    id: "cs_sales",
    name: "CS / Sales Hybrid",
    layout: "two-column",
    theme: { font: "Inter", accent: "#10B981" },
    sectionOrder: ["summary","experience","skills","achievements","education"],
    defaults: { achievements: ["Quota 132% FY24","Logo retention 96%"] },
  },
  {
    id: "operations",
    name: "Operations",
    layout: "one-column",
    theme: { font: "Inter", accent: "#0EA5E9" },
    sectionOrder: ["summary","experience","skills","projects","education","certifications"],
    defaults: { skills: ["Process","Excel/Sheets","SQL","Cross-functional"] },
  },
  {
    id: "graduate",
    name: "Recent Grad",
    layout: "one-column",
    theme: { font: "Inter", accent: "#F59E0B" },
    sectionOrder: ["summary","education","projects","experience","skills","activities"],
    defaults: { summary: "Early-career candidate with hands-on project experience." },
  },
];

export function getResumeTemplateById(id) {
  return RESUME_TEMPLATES.find(t => t.id === id) || null;
}
