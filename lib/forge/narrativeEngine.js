// /lib/forge/narrativeEngine.js

function safe(value) {
  return String(value || '').toLowerCase();
}

export function detectNarrativeConflicts(resume = {}) {
  const summary = safe(resume.summary);

  const experiences = Array.isArray(resume.workExperiences)
    ? resume.workExperiences
    : Array.isArray(resume.experiences)
      ? resume.experiences
      : [];

  const experienceText = experiences
    .map((e) => {
      const bullets = Array.isArray(e.bullets) ? e.bullets.join(' ') : '';
      return [e.title, bullets].join(' ');
    })
    .join(' ')
    .toLowerCase();

  const conflicts = [];

  if (
    summary.includes('project manager') &&
    !experienceText.includes('project')
  ) {
    conflicts.push({
      type: 'summary_vs_experience',
      severity: 'high',
      issue: 'Summary claims project management alignment without supporting project evidence.',
    });
  }

  if (
    summary.includes('technical leader') &&
    !experienceText.includes('implementation') &&
    !experienceText.includes('systems')
  ) {
    conflicts.push({
      type: 'technical_alignment_gap',
      severity: 'high',
      issue: 'Technical leadership claim is not supported by visible implementation evidence.',
    });
  }

  return conflicts;
}

export default {
  detectNarrativeConflicts,
};
