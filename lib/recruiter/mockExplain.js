// lib/recruiter/mockExplain.js
export function getMockExplain() {
  return {
    score: 86,
    summary: "Strong SaaS CSM background with onboarding leadership; minor gap on HubSpot.",
    reasons: [
      {
        requirement: "3+ years in SaaS Customer Success",
        evidence: [
          { text: "CSM at Acme SaaS (2019–2023)", source: "resume" },
          { text: "Managed 120+ SMB accounts; 94% NRR", source: "profile" }
        ]
      },
      {
        requirement: "Experience leading onboarding",
        evidence: [{ text: "Onboarding Lead at Nimbus (2023–2024)", source: "resume" }]
      },
      {
        requirement: "Familiarity with HealthTech domain",
        evidence: [{ text: "Worked with HIPAA-aligned integrations", source: "resume" }]
      }
    ],
    skills: {
      matched: ["Salesforce", "Onboarding", "HealthTech"],
      gaps: ["HubSpot"],
      transferable: ["Process Improvement", "Client Education"]
    },
    trajectory: [
      { title: "Onboarding Lead", company: "Nimbus", from: "2023-03", to: "2024-07" },
      { title: "Customer Success Manager", company: "Acme SaaS", from: "2019-05", to: "2023-02" }
    ],
    filters_triggered: ["Title: CSM", "Industry: SaaS", "Region: US Remote"]
  };
}
