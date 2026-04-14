// lib/coaching/clientProfileHelpers.js
// Pure utility functions and constants for the coaching client profile page.
// No React, no side effects — safe to import anywhere.

export function toSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return trimmed.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

export function toStringArray(value) {
  return toSafeArray(value)
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return String(item.label || item.name || item.value || item.title || '').trim();
      }
      return String(item || '').trim();
    })
    .filter(Boolean);
}

export function toEducationObjects(value) {
  return toSafeArray(value)
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      return {
        school: String(item.school || item.name || '').trim(),
        degree: String(item.degree || '').trim(),
        field: String(item.field || item.study || '').trim(),
        startYear: String(item.startYear || '').trim(),
        endYear: String(item.endYear || '').trim(),
      };
    })
    .filter(Boolean);
}

export function getExperienceList(value) {
  return toSafeArray(value)
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const highlights = toStringArray(
        item.highlights || item.bullets || item.description || item.details || []
      );
      return {
        title: String(item.title || item.role || item.jobTitle || '').trim(),
        company: String(item.company || item.employer || '').trim(),
        range: String(
          item.range ||
            [item.startDate || item.start || item.from, item.endDate || item.end || item.to]
              .filter(Boolean)
              .join(' - ')
        ).trim(),
        highlights,
      };
    })
    .filter(Boolean);
}

export function avatarColor(name = '') {
  const palette = [
    ['#FF7043', '#BF360C'],
    ['#1E88E5', '#0D47A1'],
    ['#43A047', '#1B5E20'],
    ['#8E24AA', '#4A148C'],
    ['#00ACC1', '#006064'],
    ['#3949AB', '#1A237E'],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function toDateInputValue(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

export function buildTargetStrategy(targetCompanies = '', strategyBackground = '') {
  const companyText = String(targetCompanies || '').trim();
  const backgroundText = String(strategyBackground || '').trim();
  const combined = `${companyText}\n${backgroundText}`.toLowerCase();

  if (!companyText) {
    return {
      error: 'Add at least one target company or category before generating strategy.',
      themes: [],
      roles: [],
      nextStep: '',
    };
  }

  const themeRules = [
    { label: 'Health / Wellness', terms: ['health', 'wellness', 'medicine', 'medical', 'nutrition', 'vitamin', 'supplement'] },
    { label: 'Faith-based', terms: ['church', 'faith', 'christian', 'ministry', 'gospel', 'bible', 'evangel', 'life.church', 'youversion'] },
    { label: 'Veteran Support', terms: ['veteran', 'warrior', 'heroes', 'military', 'honor'] },
    { label: 'Education', terms: ['school', 'education', 'curriculum', 'college', 'university', 'homeschool', 'classical'] },
    { label: 'Media / Communications', terms: ['media', 'broadcast', 'radio', 'news', 'wire', 'blaze', 'signal', 'studios'] },
    { label: 'Local / Immediate Search', terms: ['san antonio', 'available immediately', 'immediately'] },
  ];

  const detectedThemes = themeRules
    .filter((rule) => rule.terms.some((term) => combined.includes(term)))
    .map((rule) => rule.label);

  const themes = detectedThemes.length > 0 ? detectedThemes : ['Mission / values alignment needs review'];

  const roleSet = new Set();
  if (combined.includes('media') || combined.includes('broadcast') || combined.includes('radio') || combined.includes('communications')) {
    roleSet.add('Content / Communications');
  }
  if (combined.includes('community') || combined.includes('mission') || combined.includes('church') || combined.includes('faith') || combined.includes('veteran')) {
    roleSet.add('Community / Outreach');
  }
  if (combined.includes('health') || combined.includes('wellness') || combined.includes('customer') || combined.includes('member')) {
    roleSet.add('Customer Success / Support');
  }
  roleSet.add('Operations / Coordination');

  const roles = Array.from(roleSet);

  let nextStep = 'Focus on 10–15 best-fit companies and align outreach to these role lanes.';
  if (themes.includes('Local / Immediate Search')) {
    nextStep = 'Prioritize the fastest local or remote opportunities first, then narrow outreach to 10–15 best-fit companies.';
  }

  return { error: '', themes, roles, nextStep };
}

export const STATUS = {
  Active:       { bg: '#E8F5E9', color: '#2E7D32', ring: '#43A047' },
  'At Risk':    { bg: '#FFF3E0', color: '#E65100', ring: '#FF7043' },
  'New Intake': { bg: '#E3F2FD', color: '#1565C0', ring: '#1E88E5' },
};

export const defaultStatus = { bg: '#F5F5F5', color: '#546E7A', ring: '#90A4AE' };

export const shimmerCSS = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;