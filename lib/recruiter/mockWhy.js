// lib/recruiter/mockWhy.js
export const mockWhy = {
  score: 87,
  summary: "Strong technical fit with modern JavaScript and cloud stack.",
  reasons: [
    {
      requirement: "Proficiency in modern JavaScript frameworks",
      evidence: [
        { text: "Built complex React/Next.js dashboards", source: "Resume" },
        { text: "4+ years React experience", source: "Profile" }
      ]
    },
    {
      requirement: "Cloud deployment experience",
      evidence: [
        { text: "Worked extensively with AWS (Lambda, EC2, S3)", source: "Resume" }
      ]
    }
  ],
  skills: {
    matched: ["React", "Node.js", "AWS"],
    gaps: ["GraphQL", "Docker"],
    transferable: ["TypeScript", "CI/CD"]
  },
  trajectory: [
    {
      title: "Full-Stack Engineer",
      company: "Globex Corp",
      from: "2019",
      to: "2024"
    },
    {
      title: "Frontend Engineer",
      company: "Initech",
      from: "2016",
      to: "2019"
    }
  ],
  filters_triggered: ["Remote OK", "Full Stack", "US Work Eligibility"]
};
