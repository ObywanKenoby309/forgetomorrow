// lib/templates/coverTemplates.js

export const COVER_TEMPLATES = [
  {
    id: "concise",
    name: "Concise",
    tone: "short, to-the-point",
    defaults: {
      greeting: "Hi there,",
      opening:
        "Quick note to introduce myself and share a few relevant highlights.",
      body: [
        "Improved onboarding throughput by 25% QoQ.",
        "Owned 96% logo retention over the past year.",
        "Collaborated with sales and product to close feedback loops.",
      ],
      valueProp:
        "I can help you hit goals faster with clear playbooks and dependable execution.",
      closing: "Thanks for your time—happy to share more detail if helpful.",
      signoff: "Best,",
    },
  },
  {
    id: "narrative",
    name: "Narrative",
    tone: "story-driven",
    defaults: {
      greeting: "Dear [Team/Name],",
      opening:
        "When I launched my first customer onboarding, I realized great experiences come from clear stories and systems.",
      body: [
        "Turned scattered steps into a journey with milestones and outcomes.",
        "Earned trust by making promises explicit—and then delivering.",
        "Scaled the approach to new products and complex accounts.",
      ],
      valueProp:
        "I bring narrative clarity plus operational discipline to move people from ‘trying’ to ‘thriving.’",
      closing:
        "I’d love to learn your story and where you want it to go next.",
      signoff: "With appreciation,",
    },
  },
  {
    id: "achievement",
    name: "Achievement",
    tone: "metric-focused, results driven",
    defaults: {
      greeting: "Dear Hiring Manager,",
      opening:
        "I bridge customers and engineering, translating goals into reliable systems.",
      body: [
        "Collaborated with SEs on API integrations and authentication.",
        "Instrumented onboarding metrics to monitor TTV and risk.",
        "Created runbooks for troubleshooting and handoffs.",
      ],
      valueProp:
        "I’d help your teams reduce incident frequency and accelerate value with better observability and playbooks.",
      closing:
        "Thank you for your consideration—I look forward to discussing impact.",
      signoff: "Regards,",
    },
  },
];

export function getCoverTemplateById(id) {
  return COVER_TEMPLATES.find(t => t.id === id) || null;
}
