// lib/jd/keywords.js
// Lightweight, LLM-free keyword/phrase extractor tuned for job descriptions.

const BASE_STOP = new Set([
  'the','and','or','to','of','in','for','on','with','a','an','by','as','at','is','are','be',
  'you','we','our','your','their','from','that','this','will','can','including','etc','etc.',
  'using','use','used','within','across','per','into','out','about','it','its','role','type',
  'full-time','part-time','contract','benefits','compensation','responsibilities','requirements',
  'preferred','about-us','about','company','team','join','seeking','looking','ideal','candidate',
  'position','title','summary','job','apply','today','equal','opportunity','employer'
]);

// Common junky partials / OCR fragments you showed (we'll nuke these)
const JUNK = new Set([
  'acros','plann','relat','coordinat','orient','detail-orient', // broken stems
  'coordinator will','will market','seek','grow','will', // hollow glue
]);

// Short domain acronyms we DO want to keep even though they’re short
const SHORT_KEEP = new Set(['roi','kpi','sql','seo','sem','crm','sap','etl','aws','api','qa','csat','nps']);

// Allowlist helps keep domain terms even if low frequency
const BASE_ALLOW = new Set([
  // General business/marketing
  'marketing','coordinator','campaign','digital','offline','channel','content','calendar','newsletter',
  'social media','paid ads','email marketing','brand','branding','copywriting','editorial','go-to-market',
  'lead generation','lead gen','lifecycle','crm','automation','segmentation','ab testing','a/b testing',
  'analytics','reporting','google analytics','ga4','hubspot','mailchimp','marketo','salesforce',
  'conversion rate','ctr','cpc','cpa','cpl','roi','kpi','seo','sem',
  'events','webinars','trade shows',
]);

// Extra stopwords to block as standalone keywords
const EXTRA_STOP = new Set(['company','detail','oriented','creative','projects','project','grow','growth']);

// Quick ASCII fold + punctuation strip
function normalize(raw) {
  return (raw || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')      // diacritics
    .replace(/[“”„"‘’`´']/g, "'")         // unify quotes
    .replace(/[^\w\s\-&/+\.%]/g, ' ')     // strip emoji/symbols
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text = '') {
  const norm = normalize(text.toLowerCase());
  // allow hyphenated and slashed words, dots for ga4, numbers
  return norm.match(/[a-z0-9][a-z0-9\-\/\.+%]*/g) || [];
}

// Very light stemmer to collapse plurals/-ing/-ed
function stem(s) {
  if (SHORT_KEEP.has(s)) return s; // don't touch acronyms
  if (s.endsWith('ies') && s.length > 4) return s.slice(0, -3) + 'y';
  if (s.endsWith('sses')) return s.slice(0, -2); // classes -> class
  if (s.endsWith('s') && s.length > 3 && !s.endsWith('ss')) return s.slice(0, -1);
  if (s.endsWith('ing') && s.length > 5) return s.slice(0, -3);
  if (s.endsWith('ed') && s.length > 4) return s.slice(0, -2);
  return s;
}

function isGoodToken(tok) {
  if (!tok) return false;
  if (BASE_STOP.has(tok) || EXTRA_STOP.has(tok) || JUNK.has(tok)) return false;
  if (/^\d+$/.test(tok)) return false;              // pure numbers
  if (tok.length < 3 && !SHORT_KEEP.has(tok)) return false;
  // must have at least one letter unless short-keep
  if (!/[a-z]/.test(tok) && !SHORT_KEEP.has(tok)) return false;
  return true;
}

function buildUnigrams(tokens) {
  const freq = new Map();
  for (const t of tokens) {
    const s = stem(t);
    if (!isGoodToken(s)) continue;
    freq.set(s, (freq.get(s) || 0) + 1);
  }
  return freq;
}

function buildBigrams(tokens) {
  const freq = new Map();
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = stem(tokens[i]);
    const b = stem(tokens[i + 1]);
    if (!isGoodToken(a) || !isGoodToken(b)) continue;
    if (BASE_STOP.has(a) || BASE_STOP.has(b)) continue; // avoid stopwords at edges
    const phrase = `${a} ${b}`;
    if (JUNK.has(phrase)) continue;
    freq.set(phrase, (freq.get(phrase) || 0) + 1);
  }
  return freq;
}

function boostScore(term) {
  // Bigram boost; slight boost for allowlist/short-keeps
  const isBigram = term.includes(' ');
  let bonus = isBigram ? 1.25 : 1.0;
  const base = term.replace(/[-/]/g, ' ');
  if (BASE_ALLOW.has(base)) bonus += 0.25;
  if (SHORT_KEEP.has(term)) bonus += 0.25;
  return bonus;
}

function rankAndClean(unigrams, bigrams, { minCount = 2, limit = 80 } = {}) {
  // Merge with weighting
  const score = new Map();
  for (const [t, c] of unigrams) {
    if (c < minCount && !BASE_ALLOW.has(t) && !SHORT_KEEP.has(t)) continue;
    score.set(t, (score.get(t) || 0) + c * boostScore(t));
  }
  for (const [t, c] of bigrams) {
    if (c < minCount && !BASE_ALLOW.has(t)) continue;
    score.set(t, (score.get(t) || 0) + c * boostScore(t));
  }

  // Sort by score desc
  let items = [...score.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);

  // Drop near-duplicates: prefer bigrams over their parts; collapse hyphen/space variants
  const seen = new Set();
  const out = [];
  for (const term of items) {
    const key = term.replace(/-/g, ' ').trim();
    if (seen.has(key)) continue;
    if (!term.includes(' ')) {
      // If both "social media" and "social" exist, keep the bigram and skip the unigram
      const hasPhrase = items.some(p => p.includes(' ') && p.includes(term));
      if (hasPhrase) continue;
    }
    seen.add(key);
    out.push(term);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * suggestMissingKeywords(jdText, resumeTextLower, limit?)
 * - Extracts clean, ranked unigrams/bigrams from the JD.
 * - Removes anything already present in the resume text (string match).
 */
export function suggestMissingKeywords(jdText = '', resumeTextLower = '', limit = 80) {
  const tokens = tokenize(jdText);
  const uni = buildUnigrams(tokens);
  const bi  = buildBigrams(tokens);
  const ranked = rankAndClean(uni, bi, { minCount: 2, limit: limit * 2 });

  const lowerResume = (resumeTextLower || '').toLowerCase();
  const missing = [];
  for (const k of ranked) {
    const needle = k.toLowerCase();
    if (lowerResume.includes(needle)) continue;
    missing.push(k);
    if (missing.length >= limit) break;
  }
  return missing;
}
