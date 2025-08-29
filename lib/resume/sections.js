// lib/resume/sections.js
export const SECTIONS = [
  { key: 'contact', label: 'Contact Information', required: true },
  { key: 'experience', label: 'Work Experience', required: true },
  { key: 'education', label: 'Education', required: true },
  { key: 'skills', label: 'Skills / Keywords', required: true },
  { key: 'summary', label: 'Professional Summary', required: false },
  { key: 'projects', label: 'Projects', required: false },
  { key: 'volunteer', label: 'Volunteer Experience', required: false },
  { key: 'certs', label: 'Certifications / Training', required: false },
  { key: 'languages', label: 'Languages', required: false },
  { key: 'achievements', label: 'Achievements / Awards', required: false },
  { key: 'custom', label: 'Custom Sections', required: false },
];

export function getCompletion(data) {
  const errs = [];
  // contact
  const emailOk = /\S+@\S+\.\S+/.test(data?.formData?.email || '');
  if (!(data?.formData?.fullName && emailOk)) errs.push({ key:'contact', msg:'Add name and a valid email.' });

  // experience
  const exp = Array.isArray(data?.experiences) ? data.experiences : [];
  const expOk = exp.some(e => e?.title && e?.company && (e?.startDate || e?.start) );
  if (!expOk) errs.push({ key:'experience', msg:'Add at least one role with title, company, and dates.' });

  // education
  const edu = Array.isArray(data?.educationList) ? data.educationList : [];
  const eduOk = edu.some(e => e?.school && (e?.degree || e?.credential));
  if (!eduOk) errs.push({ key:'education', msg:'Add a school and degree/credential.' });

  // skills
  const skillsOk = (data?.skills || []).filter(Boolean).length >= 6;
  if (!skillsOk) errs.push({ key:'skills', msg:'Add at least 6 skills/keywords.' });

  const requiredKeys = SECTIONS.filter(s => s.required).map(s => s.key);
  const done = requiredKeys.length - errs.length;
  return { requiredDone: done, requiredTotal: requiredKeys.length, errs };
}
