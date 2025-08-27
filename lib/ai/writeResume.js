// lib/ai/writeResume.js
import { matchTemplate } from '@/lib/ai/matchTemplate'; // not used directly here but kept parallel to cover
const STOP = new Set(['with','from','that','this','your','have','will','team','work','role','and','the','for','into','over','plus','such','you','our','are','is','as','on','of','to','in','a','an','be','by','or','we','they','their','them','us']);

function topKeywords(text, limit = 18) {
  const words = (text.toLowerCase().match(/\b[a-z][a-z\-]{3,}\b/g) || [])
    .filter(w => !STOP.has(w));
  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([w])=>w);
}
function guessTitle(text){ const m=text.match(/\b(we\s+are\s+looking\s+for|seeking|hire|hiring)\s+(an?\s+)?([A-Z][A-Za-z0-9\/\-\s]{2,60})/i); return m?m[3].trim().replace(/\s+at\s+.*/i,''):''; }
function guessCompany(text){ const at=text.match(/\bat\s+([A-Z][A-Za-z0-9&\.\-\s]{2,60})/); const comp=at?at[1].trim():''; return comp; }

export async function writeResume({ jobText = '', resume = {}, style = 'modern' }) {
  const kw = topKeywords(jobText, 18);
  const title = guessTitle(jobText);
  const company = guessCompany(jobText);

  // base fields
  const formData = {
    ...(resume.formData || {}),
    headline: resume?.formData?.headline || title || (resume?.formData?.headline ?? ''),
  };

  // summary
  const summary = [
    `Candidate for ${title || 'the role'}${company ? ` at ${company}` : ''}.`,
    `Brings ${[(resume.skills || []).slice(0,3), kw.slice(0,3)].flat().filter(Boolean).slice(0,4).join(', ')}`,
    `with a track record of delivery and collaboration.`,
  ].join(' ');

  // experiences: prefer existing, enrich bullets toward JD; else create one "Relevant Experience"
  const existing = Array.isArray(resume.experiences) ? resume.experiences : [];
  let experiences = existing.slice(0, 3).map(xp => {
    const b = (xp.bullets || []).slice(0, 6);
    // nudge in top keywords not already present
    const used = new Set(b.join(' ').toLowerCase().match(/\b[a-z][a-z\-]{3,}\b/g) || []);
    for (const k of kw) {
      if (b.length >= 6) break;
      if (!used.has(k)) b.push(`Applied ${k} to drive outcomes in ${xp.company || 'role'}.`);
    }
    return { ...xp, bullets: b };
  });
  if (!experiences.length) {
    experiences = [{
      title: title || 'Relevant Experience',
      company: company || '',
      bullets: kw.slice(0, 6).map(k => `Hands-on experience with ${k}; ready to apply it on day one.`),
    }];
  }

  // skills: merge current + top keywords, keep unique/short
  const skills = Array.from(new Set([...(resume.skills || []), ...kw])).slice(0, 24);

  // keep other sections if present
  const seed = {
    formData,
    summary,
    experiences,
    projects: resume.projects || [],
    volunteerExperiences: resume.volunteerExperiences || [],
    educationList: resume.educationList || [],
    certifications: resume.certifications || [],
    languages: resume.languages || [],
    skills,
    achievements: resume.achievements || [],
    customSections: resume.customSections || [],
  };

  return { seed, keywords: kw };
}
