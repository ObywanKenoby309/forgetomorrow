// lib/ai/prompts.js

export const PROMPTS = {
  // 1. Generate a fresh job description from title
  jobDescription: (title) => `
Write a compelling 3-4 sentence job description for a **${title}** role.
- Professional, concise, and appealing to top talent
- Use standard section headers (Responsibilities, Requirements, Benefits)
- Include remote work if applicable
- ATS-friendly: no tables, no images, plain text
- Under 400 words
Return in clean markdown.
  `.trim(),

  // 2. OPTIMIZE an existing draft (ATS + engagement)
  optimizeJD: (draft, title = '') => `
You are an expert recruiter and ATS optimization specialist.

Rewrite this job description draft to:
- Be 100% ATS-friendly (standard headers, no tables/images)
- Include high-impact keywords for **${title || 'the role'}**
- Maintain engaging, professional tone
- Keep under 500 words
- Structure with markdown headers (## Responsibilities, ## Requirements, etc.)

Draft:
"""${draft}"""

Return ONLY the optimized job description in clean markdown.
  `.trim(),

  // 3. Resume Builder
  resume: ({ jobTitle, years, currentResume = '' }) => `
Rewrite this resume for a **${jobTitle}** role. Candidate has **${years} years** of experience.
- ATS-optimized: standard headers, keywords, no tables
- Achievement-focused, quantified results
- 1-page max
- Return in clean markdown

${currentResume ? `Current resume:\n"""${currentResume}"""\n\nUse this as base.` : 'Generate from scratch.'}
  `.trim(),

  // 4. Cover Letter
  cover: ({ jobTitle, company, top3 }) => `
Write a 3-paragraph cover letter for a **${jobTitle}** at **${company}**.
- Highlight: ${top3}
- Show enthusiasm and fit
- Professional, warm tone
- Return in clean markdown
  `.trim(),

  // 5. 30/60/90 Day Roadmap
  roadmap: (role, startDate) => `
Create a 30/60/90 day success plan for a new **${role}** starting **${startDate}**.
Include:
- Goals
- Key deliverables
- Learning milestones
- Stakeholder check-ins
Use markdown with ## 30 Days, ## 60 Days, etc.
  `.trim(),

  // 6. Salary Negotiation Script
  negotiation: (current, target) => `
Salary negotiation script:
- Current: $${current}
- Target: $${target}
Include:
1. Opening with gratitude + data
2. Justified ask with market rates
3. Fallback (bonus, equity, PTO)
Return in 3 numbered steps, concise.
  `.trim(),

  // 7. Job Match Score
  matchScore: (resume, jd) => `
Compare this resume to the job description.
Return JSON only:
{
  "score": 0-100,
  "strengths": ["3 bullet points"],
  "gaps": ["3 missing skills/experiences"]
}

Resume:
"""${resume}"""

Job Description:
"""${jd}"""
  `.trim(),
};