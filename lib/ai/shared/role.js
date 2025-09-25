// lib/ai/shared/role.js

function normalize(text = '') {
  return String(text)
    .replace(/[“”]/g, '"')
    .replace(/[’‘`]/g, "'")
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// only trim on clausey gerunds; keep “Support”, “Help” when they’re part of titles
const TRAILING_CLAUSE_RX =
  /\b(to|for|that|who|and|with|supporting|helping|growing|at|in|on|across|by)\b.*$/i;

// Keep punctuation that is common in titles (/, -, &, (), +)
function cleanTitlePunctuation(s) {
  return s.replace(/[,;:|]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

export function cleanRoleTitle(raw = '') {
  const s = cleanTitlePunctuation(normalize(raw));
  if (!s) return '';
  const base = s.replace(TRAILING_CLAUSE_RX, '').trim();
  const cleaned = base.replace(/\b(role|position)\b/gi, '').replace(/\s{2,}/g, ' ').trim();
  const parts = cleaned.split(' ').filter(Boolean);
  return parts.slice(0, 10).join(' ');
}

// Same “guessRole” idea you had in resume: look for labeled title or first line.
function detectRoleFromJDLikeResume(jd = '') {
  const n = normalize(jd);
  const m = n.match(/\b(title|role|position)\s*[:\-]\s*([^\n,]+)/i);
  if (m?.[2]) return cleanRoleTitle(m[2]);

  const first = (jd.split('\n').find(l => l.trim()) || '').trim();
  if (first) {
    // If first line includes “for a/an …”, take the part after the article.
    const viaArticle = first.match(/\b(?:as|for|a|an)\s+(.{3,80})/i);
    const candidate = viaArticle?.[1] || first;
    const cleaned = cleanRoleTitle(candidate);
    if (cleaned) return cleaned;
  }
  return '';
}

// Tiny, stable fallback for titles that appear as short, nouny capitalized chunks.
function detectRoleFallback(jd = '') {
  const lines = jd.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean).slice(0, 10);
  for (const ln of lines) {
    // A simple capitalized chunk without sentence punctuation at end
    const m = ln.match(/^([A-Z][A-Za-z0-9\/&() +\-]{3,100})(?!.*[.!?]\s*$)/);
    if (m?.[1]) {
      const cand = cleanRoleTitle(m[1]);
      if (cand) return cand;
    }
  }
  return '';
}

/**
 * extractRole
 * Priority order:
 * 1) Resume (formData.role -> headline)
 * 2) JD (same heuristics the resume page uses)
 * 3) Minimal fallback
 */
export function extractRole({ jobText = '', resume = {} } = {}) {
  const fromResume =
    resume?.formData?.role ||
    resume?.headline ||
    '';
  if (fromResume) {
    const cleaned = cleanRoleTitle(fromResume);
    if (cleaned) return cleaned;
  }

  const fromJD = detectRoleFromJDLikeResume(jobText);
  if (fromJD) return fromJD;

  const fallback = detectRoleFallback(jobText);
  if (fallback) return fallback;

  return '';
}
