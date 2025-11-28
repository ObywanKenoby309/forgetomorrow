// pages/api/recruiter/ats-builder.js
// Heuristic ATS-style evaluation for job descriptions.
// No external API calls – safe mock that produces rich, structured feedback.

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, title = '', company = '' } = req.body || {};

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Description is required.' });
  }

  const raw = String(description);
  const text = raw.replace(/\s+/g, ' ').trim();

  // ─────────────────────────────────────────────────────
  // Simple signals / heuristics
  // ─────────────────────────────────────────────────────
  const length = text.length;
  const hasBullets = /(\n|^)[\-\•\*]/.test(raw);
  const hasResponsibilities = /responsibilit(y|ies)/i.test(raw);
  const hasRequirements = /(requirements|qualifications|must\-have)/i.test(raw);
  const hasNiceToHave = /(nice to have|bonus|preferred)/i.test(raw);
  const mentionsRemote = /remote/i.test(raw);
  const mentionsHybrid = /hybrid/i.test(raw);
  const mentionsOnsite = /(on[- ]?site|on site)/i.test(raw);
  const hasComp = /(salary|\$|compensation|pay|rate)/i.test(raw);
  const hasSeniority = /(senior|lead|principal|junior|mid[- ]level)/i.test(raw);
  const hasTechKeywords = /(javascript|react|python|node|java|sql|cloud|aws|azure|gcp|docker|kubernetes)/i.test(raw);
  const hasMethodology = /(agile|scrum|kanban|ci\/cd|devops)/i.test(raw);

  // Rough score out of 100
  let score = 60;

  if (hasBullets) score += 8;
  if (hasResponsibilities) score += 5;
  if (hasRequirements) score += 5;
  if (hasNiceToHave) score += 3;
  if (hasComp) score += 4;
  if (hasSeniority) score += 4;
  if (hasTechKeywords) score += 6;
  if (hasMethodology) score += 3;

  // Penalize super short or mega wall-of-text
  if (length < 400) score -= 10;
  if (length < 250) score -= 10;
  if (length > 2200 && !hasBullets) score -= 10;

  // Clamp
  score = Math.max(10, Math.min(98, score));

  // ─────────────────────────────────────────────────────
  // Strengths / issues / suggestions
  // ─────────────────────────────────────────────────────
  const strengths = [];
  const issues = [];
  const suggestions = [];

  if (hasBullets) {
    strengths.push('Uses bullet points so resumes and hiring managers can scan quickly.');
  } else {
    issues.push('Description is mostly a wall of text, which is hard for humans and ATS to scan.');
    suggestions.push('Break responsibilities and requirements into short bullet points.');
  }

  if (hasResponsibilities) {
    strengths.push('Responsibilities section makes the day-to-day work more concrete.');
  } else {
    issues.push('Responsibilities are not clearly separated or labeled.');
    suggestions.push('Add a **Responsibilities** section with 5–8 action-led bullet points.');
  }

  if (hasRequirements) {
    strengths.push('Requirements or qualifications are called out explicitly.');
  } else {
    issues.push('Requirements are not clearly grouped, which can confuse candidates and ATS parsers.');
    suggestions.push('Add a **Requirements / Must-have** section listing skills, experience, and tools.');
  }

  if (!hasNiceToHave) {
    suggestions.push('Add a short **Nice-to-have** section so stronger candidates know how to stand out.');
  }

  if (mentionsRemote || mentionsHybrid || mentionsOnsite) {
    strengths.push('Worksite (Remote / Hybrid / Onsite) is mentioned somewhere in the text.');
  } else {
    issues.push('Worksite (Remote / Hybrid / Onsite) is not clearly stated.');
    suggestions.push('Add a line at the top like **Location: Remote (US)** or **Location: Hybrid — City, Country**.');
  }

  if (!hasComp) {
    suggestions.push(
      'Consider including at least a rough salary band or rate to improve applies and pay transparency.'
    );
  }

  if (!hasTechKeywords) {
    suggestions.push(
      'Include 5–10 specific tools, frameworks, or platforms candidates should know (e.g., React, Node, SQL, AWS).'
    );
  }

  if (!hasMethodology) {
    suggestions.push(
      'Mention methodologies or practices your team uses (Agile, Scrum, CI/CD, DevOps) if applicable.'
    );
  }

  if (!hasSeniority && title) {
    suggestions.push(
      'If this role has a clear seniority level, reflect it consistently in the title and description (e.g., Senior, Lead, Principal).'
    );
  }

  // ─────────────────────────────────────────────────────
  // Naive keyword extraction (top-ish tokens)
  // ─────────────────────────────────────────────────────
  const words = raw
    .toLowerCase()
    .replace(/[^a-z0-9\+\.# ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const stopwords = new Set([
    'this', 'that', 'with', 'will', 'have', 'from', 'your', 'they', 'their',
    'such', 'into', 'over', 'under', 'about', 'after', 'before', 'other',
    'team', 'role', 'work', 'you', 'would', 'which', 'also', 'been', 'than',
    'within', 'across', 'able', 'including', 'using', 'required', 'preferred'
  ]);

  const counts = {};
  for (const w of words) {
    if (stopwords.has(w)) continue;
    counts[w] = (counts[w] || 0) + 1;
  }

  const keywords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);

  // ─────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────
  const roleLabel = title || 'this role';
  let summary;
  if (score >= 80) {
    summary = `Strong ATS foundation. ${roleLabel} is described with enough structure and keywords that most parsers and candidates should understand it quickly. Focus on fine-tuning clarity and compensation transparency.`;
  } else if (score >= 60) {
    summary = `Solid starting point. ${roleLabel} includes useful detail but would benefit from clearer sections, more specific keywords, and a sharper top summary.`;
  } else {
    summary = `Needs structure. ${roleLabel} will be hard for ATS and candidates to scan in its current form. Breaking it into clear sections and adding concrete skills will help a lot.`;
  }

  return res.status(200).json({
    score,
    summary,
    strengths,
    issues,
    suggestions,
    keywords,
    meta: {
      length,
      hasBullets,
      hasResponsibilities,
      hasRequirements,
      hasNiceToHave,
      mentionsRemote,
      mentionsHybrid,
      mentionsOnsite,
      hasComp,
      hasSeniority,
      hasTechKeywords,
      hasMethodology,
      title,
      company,
    },
  });
}
