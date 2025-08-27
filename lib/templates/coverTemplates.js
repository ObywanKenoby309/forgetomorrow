// lib/templates/coverTemplates.js

export const COVER_TEMPLATES = [
  {
    id: "impact",
    name: "Impact",
    tone: "results-first, concise",
    defaults: {
      greeting: "Dear Hiring Manager,",
      opening:
        "I’m excited to apply for the role and bring a track record of measurable results.",
      body: [
        "Led cross-functional initiative that cut time-to-value by 32%.",
        "Owned KPIs across onboarding and retention; exceeded targets three quarters in a row.",
        "Built playbooks that scaled onboarding to enterprise accounts.",
      ],
      valueProp:
        "I’d contribute immediately by applying my playbook-driven approach to accelerate outcomes for your customers.",
      closing:
        "Thank you for your time—I’d love to share relevant wins and discuss where I can help most.",
      signoff: "Sincerely,",
    },
  },
  {
    id: "formal",
    name: "Formal",
    tone: "professional, traditional",
    defaults: {
      greeting: "To the Hiring Committee,",
      opening:
        "Please accept my application for the posted position. I bring experience aligned with your requirements.",
      body: [
        "Managed complex stakeholder relationships across enterprise accounts.",
        "Developed repeatable processes that improved team consistency.",
        "Communicated clearly with executives and technical teams alike.",
      ],
      valueProp:
        "I aim to support your organization’s objectives with structured execution and dependable collaboration.",
      closing:
        "I appreciate your consideration and look forward to the opportunity to speak.",
      signoff: "Respectfully,",
    },
  },
  {
    id: "warm",
    name: "Warm",
    tone: "personable, values-forward",
    defaults: {
      greeting: "Hello [Team/Name],",
      opening:
        "Your mission resonates with me. I care deeply about helping people succeed and feel confident at work.",
      body: [
        "Built onboarding journeys that emphasize empathy and clarity.",
        "Coached teammates; created shared resources to lift the whole team.",
        "Turned feedback into action, improving NPS and retention.",
      ],
      valueProp:
        "I’d bring a caring, practical approach that helps customers feel supported and successful.",
      closing:
        "Thanks for reading—excited by the chance to contribute to your mission.",
      signoff: "Warmly,",
    },
  },
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
    id: "technical",
    name: "Technical",
    tone: "precise, systems",
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
  {
    id: "entry",
    name: "Entry Level",
    tone: "early-career, coachable",
    defaults: {
      greeting: "Hello Hiring Team,",
      opening:
        "I’m eager to begin my career contributing to a team where I can grow and deliver real value.",
      body: [
        "Completed projects that mirror real-world workflows.",
        "Took initiative to document processes for classmates.",
        "Sought mentorship and applied feedback consistently.",
      ],
      valueProp:
        "I’ll bring energy, follow-through, and a willingness to learn quickly.",
      closing: "Thank you for your time.",
      signoff: "Sincerely,",
    },
  },
  {
    id: "switcher",
    name: "Career Switch",
    tone: "transferable skills",
    defaults: {
      greeting: "Dear Hiring Manager,",
      opening:
        "I’m transitioning from an adjacent field with skills that map directly to your needs.",
      body: [
        "Led client communications and expectation management.",
        "Documented processes; reduced cycle time in prior role.",
        "Coordinated cross-functional deliverables reliably.",
      ],
      valueProp:
        "I’ll ramp quickly and contribute with strong communication and systems thinking.",
      closing:
        "I appreciate your consideration and welcome a conversation.",
      signoff: "Best regards,",
    },
  },
  {
    id: "operations",
    name: "Operations",
    tone: "process, metrics",
    defaults: {
      greeting: "To the Hiring Team,",
      opening:
        "I specialize in turning goals into measurable processes that ship on time.",
      body: [
        "Built dashboards to track SLAs and throughput.",
        "Owned continuous improvement cycles across teams.",
        "Reduced manual work with automation and templates.",
      ],
      valueProp:
        "I’ll help create visibility and momentum toward your operational targets.",
      closing: "Thank you for your consideration.",
      signoff: "Respectfully,",
    },
  },
  {
    id: "design",
    name: "Design",
    tone: "empathetic, portfolio-forward",
    defaults: {
      greeting: "Hello [Team/Name],",
      opening:
        "I design with empathy and clarity, focusing on outcomes and accessibility.",
      body: [
        "Partnered with PM/Eng to ship research-backed improvements.",
        "Presented rationale clearly; influenced decision-making.",
        "Built components that improved consistency and speed.",
      ],
      valueProp:
        "I’d bring systems thinking and attention to detail to your product.",
      closing:
        "Portfolio attached—happy to walk through relevant case studies.",
      signoff: "Thanks so much,",
    },
  },
];

export function getCoverTemplateById(id) {
  return COVER_TEMPLATES.find(t => t.id === id) || null;
}
