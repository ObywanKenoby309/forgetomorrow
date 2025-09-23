// components/resume-form/AtsDepthPanel.js
import { useMemo, useState } from 'react';

/* =========================
   Tokenizing / Normalizing
   ========================= */
const STOPWORDS = new Set([
  'the','and','or','to','of','in','for','on','with','a','an','by','as','at',
  'is','are','be','you','we','our','your','their','from','that','this','will',
  'can','including','etc','etc.','using','use','used','over','under','within',
  'across','per','into','out','about','it','its','role','type','responsibilities',
  'requirements','preferred','benefits','compensation','full-time','part-time',
  'intern','internship','remote','hybrid','onsite','company','team','teams',
  'department','manager','support'
]);

// Low-signal words we never want as “keywords” (for unigrams, not phrases)
const GENERIC_LOW = new Set([
  'support','team','teams','stakeholders','communication','organized','detail','detailed',
  'passion','motivated','self','starter','work','working','environment','fast','paced',
  'manage','managed','managing','coordinate','coordinator','coordinating',
  'help','execute','assist','related','ideal','candidate','able','projects','simultaneously',
  'report','metrics','website','traffic','rates','ensure','consistent','brand','messaging',
  'shows','years','experience','strong','written','verbal','skills','familiarity','tools',
  'such','ability','independently','meet','deadlines','field','plan','planning','plans','planner'
]);

// Verbs — if a bigram contains these (and it's not curated), drop it
const VERBS = new Set([
  'lead','led','build','built','implement','implemented','optimize','optimized','improve','improved',
  'streamline','streamlined','design','designed','analyze','analyzed','analyzing',
  'track','tracked','tracking','report','reported','reporting','collaborate','collaborated',
  'coordinate','coordinated','own','owned','owning','manage','managed','managing','execute','executed',
  'drive','driven','driving','develop','developed','launch','launched','maintain','maintained','assist','plan','planned','planning'
]);

// Phrases we explicitly like (marketing-ish)
const CURATED_PHRASES = new Set([
  'social media','paid ads','paid social','content calendar','brand messaging',
  'conversion rates','website traffic','email marketing','campaign management',
  'marketing automation','a/b testing','campaign analytics','event logistics','trade shows',
  'marketing communications','digital marketing','search engine optimization','search engine marketing',
  'event planning'
]);

// New: soft skills we want to treat explicitly (don’t filter these out)
const SOFT_SKILLS = new Set([
  'detail-oriented','detail oriented','creative','manage multiple projects','multiple projects',
  'work independently','independently','meet deadlines','written and verbal communication',
  'strong communication','communication skills'
]);

// Phrases to drop outright
const DROP_PHRASES = new Set([
  'publishing track','track analyze','key marketing','roi collaborate','email social','offline channels'
]);

function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9\s\-\+\/\.\&,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSentence(text = '') {
  const raw = text.match(/[a-z0-9][a-z0-9\-\+\/\.&]*/g) || [];
  return raw.map(t => t.replace(/[.,;:]+$/g, '')).filter(Boolean);
}

function tokenize(text = '') {
  const n = normalize(text);
  return n.match(/[a-z0-9][a-z0-9\-\+\/\.&]*/g) || [];
}

function segment(text = '') {
  return text.split(/[.,]+/).map(s => s.trim()).filter(Boolean);
}

function bigrams(tokens = []) {
  const out = [];
  for (let i = 0; i < tokens.length - 1; i++) out.push(`${tokens[i]} ${tokens[i+1]}`);
  return out;
}

function flatResumeText({ summary = '', skills = [], experiences = [], education = [] }) {
  const ex = (experiences || [])
    .map(e => [
      e?.title, e?.jobTitle, e?.company, e?.location,
      (e?.bullets || e?.highlights || []).join(' '),
      e?.description || ''
    ].join(' '))
    .join(' ');

  const ed = (education || [])
    .map(ed => [ed?.degree, ed?.program || ed?.field, ed?.description, ed?.school].filter(Boolean).join(' '))
    .join(' ');

  return normalize([summary, (skills || []).join(' '), ex, ed].join(' '));
}

/* =========================
   Keyword Extraction (JD)
   ========================= */
function extractCandidates(jdText = '', limitUni = 120, limitBi = 80) {
  const n = normalize(jdText);
  const uniFreq = new Map();
  const biFreq = new Map();

  for (const sent of segment(n)) {
    const toks = tokenizeSentence(sent);

    // unigrams
    for (const w of toks) {
      if (w.length < 3) continue;
      if (STOPWORDS.has(w)) continue;
      uniFreq.set(w, (uniFreq.get(w) || 0) + 1);
    }

    // bigrams (stay within the segment)
    for (const p of bigrams(toks)) {
      const [a,b] = p.split(' ');
      if (!a || !b) continue;
      if (STOPWORDS.has(a) || STOPWORDS.has(b)) continue;
      if (GENERIC_LOW.has(a) || GENERIC_LOW.has(b)) {
        // allow soft skills phrases even if they include low-signal words
        if (!SOFT_SKILLS.has(p)) continue;
      }
      biFreq.set(p, (biFreq.get(p) || 0) + 1);
    }
  }

  const unis = [...uniFreq.entries()].sort((a,b)=>b[1]-a[1]).map(([w])=>w).slice(0, limitUni);
  const bisTop = [...biFreq.entries()].sort((a,b)=>b[1]-a[1]).map(([w])=>w).slice(0, limitBi);

  return { unis, bis: bisTop };
}

/* =========================
   Heuristics / Buckets
   ========================= */
const HARD_SKILL_RX = [
  /\b(sql|excel|sheets|python|r|javascript|typescript|react|node|java|c\+\+|aws|gcp|azure|docker|kubernetes|tableau|powerbi|seo|sem|crm|salesforce|hubspot|mailchimp|figma|jira|confluence|postgre?s|mysql|nosql|graphql|git|ga4|google-analytics|adwords|meta-ads|snowflake|look(er|ml))\b/
];

const TOOL_RX = [
  /\b(google[-\s]?analytics|ga4|hubspot|salesforce|mailchimp|adobe|marketo|mixpanel|segment|amplitude|tableau|powerbi|jira|figma|notion|asana|trello)\b/
];

function bucketize({ unis, bis }) {
  const high = new Set();
  const tools = new Set();
  const soft = new Set();
  const otherPhrases = new Set();
  const otherUnis = new Set();

  // Unigrams
  unis.forEach(t => {
    const s = t.toLowerCase();

    // explicit soft skills (single token like "creative" or hyphenated "detail-oriented")
    if (SOFT_SKILLS.has(s)) { soft.add(s); return; }

    if (HARD_SKILL_RX.some(rx => rx.test(s))) { high.add(s); return; }
    if (TOOL_RX.some(rx => rx.test(s))) { tools.add(s); return; }

    if (!GENERIC_LOW.has(s) && !STOPWORDS.has(s) && s.length >= 5) otherUnis.add(s);
  });

  // Bigrams
  bis.forEach(p => {
    const s = p.toLowerCase();
    if (DROP_PHRASES.has(s)) return;

    if (SOFT_SKILLS.has(s)) { soft.add(s); return; }
    if (HARD_SKILL_RX.some(rx => rx.test(s))) { high.add(s); return; }
    if (TOOL_RX.some(rx => rx.test(s))) { tools.add(s); return; }

    const [a, b] = s.split(' ');
    if (!CURATED_PHRASES.has(s) && (VERBS.has(a) || VERBS.has(b))) return;

    if (CURATED_PHRASES.has(s) || s.includes('-') || /\b([a-z]{3,})\s([a-z]{3,})\b/.test(s)) {
      otherPhrases.add(s);
    }
  });

  // “Other” remains truly miscellaneous (marketing phrases, etc.)
  const other = (otherPhrases.size ? [...otherPhrases] : [...otherUnis]).filter(Boolean);

  return { high: [...high], tools: [...tools], soft: [...soft], other };
}

/* =========================
   Education (structured)
   ========================= */
const DEGREE_LEVELS = [
  { key: 'doctorate',  rx: /\b(ph\.?d\.?|doctorate|doctoral|md|jd)\b/ },
  { key: 'masters',    rx: /\b(masters?|m\.?s\.?|m\.?sc|mba)\b/ },
  { key: 'bachelors',  rx: /\b(bachelors?|b\.?s\.?|b\.?sc|b\.?a)\b/ },
  { key: 'associates', rx: /\b(associates?|a\.?a\.?|a\.?s\.?)\b/ },
];
const DEGREE_WORD = /\b(degree|diploma)\b/;

const KNOWN_FIELDS = new Set([
  'marketing','business','communications','computer science','information systems','data science',
  'engineering','finance','accounting','design','psychology','statistics','economics',
  'english','mathematics','math','software engineering','it','information technology'
]);

function canonicalLevel(text='') {
  const n = normalize(text);
  for (const { key, rx } of DEGREE_LEVELS) if (rx.test(n)) return key;
  return null;
}
function levelLabel(key) {
  if (key === 'bachelors') return "Bachelor's degree";
  if (key === 'masters')   return "Master's degree";
  if (key === 'doctorate') return 'PhD / Doctorate';
  if (key === 'associates')return "Associate's degree";
  return 'Degree';
}
function extractFieldAfter(text, anchor = 'in', knownOnly = false) {
  const n = normalize(text);
  const m = n.match(new RegExp(`${anchor}\\s+([a-z0-9\\s]{2,40})`));
  if (!m) return null;
  let chunk = m[1].trim();
  chunk = chunk.split(/[,.;]| and | or /)[0].trim();
  if (KNOWN_FIELDS.has(chunk)) return chunk;
  if (knownOnly) return null;
  const tokens = chunk.split(/\s+/).slice(0,3).join(' ').trim();
  return tokens || null;
}

function parseEduFromJD(jdText='') {
  const n = normalize(jdText);
  let level = null;
  let field = null;

  for (const { key, rx } of DEGREE_LEVELS) {
    const r1 = new RegExp(`\\b${rx.source}\\b[^.]{0,80}?${DEGREE_WORD.source}`, 'i');
    const r2 = new RegExp(`${DEGREE_WORD.source}[^.]{0,80}?\\b${rx.source}\\b`, 'i');
    const m = n.match(r1) || n.match(r2);
    if (m) {
      level = key;
      const start = Math.max(0, (m.index ?? 0) - 50);
      const end   = Math.min(n.length, (m.index ?? 0) + m[0].length + 80);
      const windowTxt = n.slice(start, end);
      field = extractFieldAfter(windowTxt, 'in', /* knownOnly */ true);
      break;
    }
  }

  if (!level && DEGREE_WORD.test(n)) {
    const m = n.match(new RegExp(DEGREE_WORD.source, 'i'));
    if (m) {
      const start = Math.max(0, (m.index ?? 0) - 20);
      const end   = Math.min(n.length, (m.index ?? 0) + 120);
      const windowTxt = n.slice(start, end);
      field = extractFieldAfter(windowTxt, 'in', /* knownOnly */ true);
    }
  }

  if (!level && !field && !DEGREE_WORD.test(n)) return null;
  return { level, field };
}

function detectKnownFieldAnywhere(n) {
  for (const f of KNOWN_FIELDS) {
    if (n.includes(f)) return f;
  }
  const tail = n.match(/\b([a-z][a-z\s]{1,40})\s(marketing|engineering|statistics|economics|psychology|design|finance|accounting|mathematics|math|communications)\b/);
  if (tail) return tail[2];
  return null;
}

function parseEduFromResume(education = []) {
  const out = [];
  (education || []).forEach(ed => {
    const joined = normalize(
      [ed?.degree, ed?.program || ed?.field, ed?.description, ed?.school]
        .filter(Boolean)
        .join(' ')
    );

    const level = canonicalLevel(joined);
    let field = extractFieldAfter(joined, 'in') || ed?.program || ed?.field || null;
    if (!field) {
      const loose = detectKnownFieldAnywhere(joined);
      if (loose) field = loose;
    }

    out.push({ level: level || null, field: field ? normalize(field) : null, raw: joined });
  });
  return out;
}

function hitEducation(jdReq, resumeEduList = []) {
  if (!jdReq) return { levelHit: false, fieldHit: false };
  const wantLevel = jdReq.level || null;
  const wantField = jdReq.field ? normalize(jdReq.field) : null;

  let levelHit = false, fieldHit = false;

  for (const e of resumeEduList) {
    const lvl = e.level || null;
    const fld = e.field ? normalize(e.field) : null;

    if (wantLevel && lvl === wantLevel) levelHit = true;
    if (wantField && fld && fld.includes(wantField)) fieldHit = true;

    if ((wantLevel ? levelHit : true) && (wantField ? fieldHit : true)) break;
  }
  return { levelHit, fieldHit };
}

/* =========================
   Scoring
   ========================= */
function coverage(matchedCount, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(1, matchedCount / total));
}

function containsWordBoundary(haystack, needle) {
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (/\s/.test(needle)) return haystack.includes(needle);
  const rx = new RegExp(`\\b${esc}\\b`, 'i');
  return rx.test(haystack);
}

function guessRole(jd = '') {
  const n = normalize(jd);
  const m = n.match(/\b(title|role|position)\s*[:\-]\s*([^\n,]+)/i);
  if (m?.[2]) return m[2].trim();
  const first = (jd.split('\n')[0] || '').trim();
  return first.slice(0, 72);
}

function computeMatchScore(jdText, resumeData) {
  const rolePhrase = guessRole(jdText);
  const roleTokens = tokenize(rolePhrase).filter(t => !STOPWORDS.has(t));

  const candidates = extractCandidates(jdText, 120, 80);
  const buckets = bucketize(candidates);

  const jdEduReq = parseEduFromJD(jdText);
  const resumeEduList = parseEduFromResume(resumeData.education || []);
  const { levelHit, fieldHit } = hitEducation(jdEduReq, resumeEduList);

  const resumeNorm = flatResumeText(resumeData);

  let titleHit = 0;
  if (roleTokens.length) {
    const phrase = roleTokens.join(' ');
    const exactish = phrase && resumeNorm.includes(phrase);
    const tokenHits = roleTokens.filter(t => containsWordBoundary(resumeNorm, t)).length;
    titleHit = exactish ? 1 : coverage(tokenHits, roleTokens.length);
  }

  const inResume = (k) => containsWordBoundary(resumeNorm, k);
  const highHits  = buckets.high.filter(inResume);
  const toolHits  = buckets.tools.filter(inResume);
  const softHits  = buckets.soft.filter(inResume);

  // Education coverage (active only if JD asked for it)
  const needLevel = Boolean(jdEduReq?.level);
  const needField = Boolean(jdEduReq?.field);
  const eduCov = (!needLevel && !needField)
    ? 0
    : (() => {
        const levelWeight = needLevel ? 0.60 : 0;
        const fieldWeight = needField ? 0.40 : 0;
        const denom = (levelWeight + fieldWeight) || 1;
        return (
          (needLevel ? (levelHit ? levelWeight : 0) : 0) +
          (needField ? (fieldHit ? fieldWeight : 0) : 0)
        ) / denom;
      })();

  const wordHit = (word) => {
    const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`\\b${esc}\\b`, 'i');
    return rx.test(resumeNorm);
  };
  const phraseHit = (phrase) => resumeNorm.includes(phrase);
  const strictOtherHit = (k) => (k.includes(' ') ? phraseHit(k) : wordHit(k));
  const otherHits = buckets.other.filter(strictOtherHit);

  // Weights: shift 5 pts specifically to soft skills, “other” now informational only
  const w = { title: 15, high: 45, tools: 20, edu: 15, soft: 5, other: 0 };

  const bucketCoverage = (have, total) => {
    if (total === 0) return 0;          // inactive bucket
    if (have >= total) return 1;
    const denom = Math.max(total, 4);   // soft floor to avoid tiny-bucket inflation
    return Math.max(0, Math.min(1, have / denom));
  };

  const cov = {
    title: roleTokens.length ? titleHit : 0,
    high:  bucketCoverage(highHits.length,  buckets.high.length),
    tools: bucketCoverage(toolHits.length,  buckets.tools.length),
    edu:   eduCov,
    soft:  bucketCoverage(softHits.length,  buckets.soft.length),
    other: bucketCoverage(otherHits.length, buckets.other.length) // not scored
  };

  const active = {
    title: roleTokens.length > 0,
    high:  buckets.high.length > 0,
    tools: buckets.tools.length > 0,
    edu:   needLevel || needField,
    soft:  buckets.soft.length > 0,
    other: false // excluded from scoring
  };

  const activeWeight =
    (active.title ? w.title : 0) +
    (active.high  ? w.high  : 0) +
    (active.tools ? w.tools : 0) +
    (active.edu   ? w.edu   : 0) +
    (active.soft  ? w.soft  : 0);

  const normFactor = activeWeight ? (100 / activeWeight) : 0;

  const titleScore = cov.title * w.title * normFactor;
  const highScore  = cov.high  * w.high  * normFactor;
  const toolScore  = cov.tools * w.tools * normFactor;
  const eduScore   = cov.edu   * w.edu   * normFactor;
  const softScore  = cov.soft  * w.soft  * normFactor;
  const otherScore = 0; // intentionally excluded

  const total = Math.round(titleScore + highScore + toolScore + eduScore + softScore + otherScore);

  const eduMissing = [];
  if (needLevel || needField) {
    if (needLevel && !levelHit) eduMissing.push(levelLabel(jdEduReq.level));
    if (needField && !fieldHit) eduMissing.push(jdEduReq.field);
  }

  return {
    score: total,
    breakdown: {
      title: { score: Math.round(titleScore), have: Math.round(cov.title * (roleTokens.length || 0)), total: roleTokens.length, rolePhrase },
      high:  { score: Math.round(highScore),  have: highHits.length,  total: buckets.high.length },
      tools: { score: Math.round(toolScore),  have: toolHits.length,  total: buckets.tools.length },
      edu:   {
        score: Math.round(eduScore),
        have: (needLevel && levelHit ? 1 : 0) + (needField && fieldHit ? 1 : 0),
        total: (needLevel ? 1 : 0) + (needField ? 1 : 0)
      },
      soft:  { score: Math.round(softScore), have: softHits.length,  total: buckets.soft.length },
      other: { score: 0,                     have: otherHits.length, total: buckets.other.length },
    },
    buckets,
    missing: {
      high:  buckets.high.filter(k => !inResume(k)),
      tools: buckets.tools.filter(k => !inResume(k)),
      edu:   eduMissing,
      soft:  buckets.soft.filter(k => !inResume(k)),   // <-- real soft skills
      other: [] // excluded from UX prompts
    }
  };
}

/* =========================
   UI Component
   ========================= */
export default function AtsDepthPanel({
  jdText = '',
  summary = '',
  skills = [],
  experiences = [],
  education = [],
  onAddSkill,
  onAddSummary,
  onAddBullet,
  collapsedDefault = true,
  maxChips = 12,
}) {
  const [collapsed, setCollapsed] = useState(collapsedDefault);
  const [showAll, setShowAll] = useState({ high:false, tools:false, edu:false, soft:false });
  const [added, setAdded] = useState({});

  const resumeData = useMemo(
    () => ({ summary, skills, experiences, education }),
    [summary, skills, experiences, education]
  );

  const { score, breakdown, missing } = useMemo(
    () => computeMatchScore(jdText, resumeData),
    [jdText, resumeData]
  );

  const empty = !jdText?.trim();

  const markAdded = (k, kind) => {
    const key = `${k}:${kind}`;
    setAdded(a => ({ ...a, [key]: true }));
    setTimeout(() => setAdded(a => {
      const copy = { ...a }; delete copy[key]; return copy;
    }), 900);
  };

  const barColor = score >= 85 ? '#2E7D32' : score >= 70 ? '#F59E0B' : '#C62828';
  const hint = score >= 85 ? 'Great fit' : score >= 70 ? 'Close — add a few high-impact terms' : 'Low — add more high-impact terms';

  function openEducationSection() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ft-open-education'));
      const el = document.getElementById('education-section');
      if (el?.scrollIntoView) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      }
    }
  }

  function Group({ id, title, items }) {
    const list = showAll[id] ? items : items.slice(0, maxChips);
    const moreCount = Math.max(items.length - list.length, 0);

    return (
      <div style={{ border: '1px solid #E0E0E0', borderRadius: 10, padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, color: '#37474F' }}>
            {title} {items.length ? <span style={{ color: '#78909C', fontWeight: 600 }}>{`· ${items.length}`}</span> : null}
          </div>
          {moreCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(s => ({ ...s, [id]: !s[id] }))}
              style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}
            >
              {showAll[id] ? 'Show fewer' : `Show ${moreCount} more`}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ fontSize: 12, color: '#2E7D32' }}>No missing keywords here — nice!</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {list.map((k) => (
              <div
                key={k}
                style={{
                  background: '#FAFAFA',
                  border: '1px solid #E0E0E0',
                  borderRadius: 10,
                  padding: 10,
                  display: 'grid',
                  gridTemplateColumns: id === 'edu' ? '1fr auto' : '1fr auto auto auto',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ color: '#263238' }}>{k}</div>

                {id === 'edu' ? (
                  <button
                    type="button"
                    onClick={openEducationSection}
                    style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Open Education
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { onAddSkill?.(k); markAdded(k, 'skill'); }}
                      style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {added[`${k}:skill`] ? 'Added ✓' : '+ Skill'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { onAddSummary?.(k); markAdded(k, 'summary'); }}
                      style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {added[`${k}:summary`] ? 'Added ✓' : '+ Summary'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { onAddBullet?.(`• ${k}`); markAdded(k, 'bullet'); }}
                      style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {added[`${k}:bullet`] ? 'Added ✓' : '+ Bullet'}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E0E0E0',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        aria-expanded={!collapsed}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          background: 'transparent',
          border: 'none',
          padding: '6px 4px',
          cursor: 'pointer'
        }}
      >
        <div style={{ fontWeight: 700, color: '#37474F' }}>ATS Match</div>
        <span style={{ color: '#607D8B', fontSize: 14 }}>{collapsed ? '▸' : '▾'}</span>
      </button>

      {/* Score + bar */}
      {!empty && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: barColor }}>{score}%</div>
            <div style={{ fontSize: 12, color: '#607D8B' }}>{hint} (aim ≥85%)</div>
          </div>
          <div style={{ height: 10, background: '#ECEFF1', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ width: `${Math.min(score,100)}%`, height: '100%', background: barColor }} />
          </div>

          {!collapsed && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginTop: 10 }}>
              {[
                ['Title/Role', breakdown.title?.score, breakdown.title?.have, breakdown.title?.total],
                ['Hard skills', breakdown.high?.score, breakdown.high?.have, breakdown.high?.total],
                ['Tools', breakdown.tools?.score, breakdown.tools?.have, breakdown.tools?.total],
                ['Education', breakdown.edu?.score, breakdown.edu?.have, breakdown.edu?.total],
                ['Soft skills', breakdown.soft?.score, breakdown.soft?.have, breakdown.soft?.total],
              ].map(([label, s, have, total]) => (
                <div key={label} style={{ border: '1px solid #EEE', borderRadius: 8, padding: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#37474F' }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#607D8B' }}>
                    {typeof have === 'number' && typeof total === 'number' ? `${have}/${total} matched` : '—'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#455A64', marginTop: 4 }}>{s ?? 0} pts</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {empty && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#90A4AE' }}>
          Paste or import a job description to see your ATS match score and grouped missing keywords.
        </div>
      )}

      {/* Grouped Missing Keywords */}
      {!empty && !collapsed && (
        <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          <Group id="high"  title="High-impact hard skills" items={missing.high} />
          <Group id="tools" title="Tools / Platforms"       items={missing.tools} />
          <Group id="edu"   title="Education"               items={missing.edu} />
          <Group id="soft"  title="Soft skills"             items={missing.soft} />
        </div>
      )}
    </div>
  );
}
