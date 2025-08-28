// /components/resume-form/AtsDepthPanel.jsx
import React, { useMemo } from 'react';

// Tiny stopword list; we’ll extend later
const STOP = new Set([
  'the','a','an','and','or','for','with','to','of','in','on','by','at','as','is','are','be',
  'this','that','these','those','it','its','your','you','we','our','from','over','under',
  'will','can','must','should','have','has','had',
]);

// Lightweight synonyms/aliases map to improve “presence” detection
const SYNONYMS = {
  'customer success': ['cs', 'client success', 'customer experience'],
  'salesforce': ['sf', 'sfdc', 'sales force'],
  'javascript': ['js'],
  'typescript': ['ts'],
  'excel': ['spreadsheets'],
  'python': ['py'],
  'kpis': ['metrics', 'key performance indicators'],
  'stakeholder': ['partner'],
  'cross-functional': ['xfn', 'cross functional'],
};

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+/#&.\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function topTermsFromJD(jdText, max = 30) {
  const toks = tokenize(jdText).filter(t => t.length > 2 && !STOP.has(t));
  const freq = new Map();
  for (const t of toks) freq.set(t, (freq.get(t) || 0) + 1);
  const terms = Array.from(freq.entries())
    .sort((a,b) => b[1]-a[1])
    .map(([t]) => t)
    .slice(0, max);

  // Also extract a few bigrams that appear often
  const words = toks;
  const bigrams = new Map();
  for (let i=0;i<words.length-1;i++) {
    const bg = `${words[i]} ${words[i+1]}`;
    if (bg.split(' ').some(w => STOP.has(w))) continue;
    bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
  }
  const topBigrams = Array.from(bigrams.entries())
    .sort((a,b)=>b[1]-a[1])
    .slice(0, 10)
    .map(([bg]) => bg);

  // Prefer bigrams (skills like "customer success", "project management")
  const merged = [...topBigrams, ...terms].filter((t, i, arr) => arr.indexOf(t) === i);
  return merged;
}

function buildResumeCorpus({ summary, skills, experiences }) {
  const bullets = (experiences || []).flatMap(exp => Array.isArray(exp?.bullets) ? exp.bullets : []);
  const raw = [
    summary || '',
    ...(Array.isArray(skills) ? skills : []),
    ...bullets,
  ].join(' \n ');
  const tokens = new Set(tokenize(raw));

  // Expand tokens with synonyms so we count matches more generously
  const expanded = new Set(tokens);
  for (const [key, alts] of Object.entries(SYNONYMS)) {
    if (tokens.has(key) || alts.some(a => tokens.has(a))) {
      expanded.add(key);
      for (const a of alts) expanded.add(a);
    }
  }
  return expanded;
}

function scoreTermPresence(term, tokenSet) {
  // If term is a bigram, require both tokens present (loose)
  if (term.includes(' ')) {
    const parts = term.split(' ');
    return parts.every(p => tokenSet.has(p));
  }
  return tokenSet.has(term);
}

/**
 * props:
 *  - jdText: string
 *  - summary: string
 *  - skills: string[]
 *  - experiences: [{ bullets: string[] }, ...]
 *  - onAddSkill(term: string)
 *  - onAddSummary(phrase: string)
 *  - onAddBullet(phrase: string)  // adds to current/first role
 */
export default function AtsDepthPanel({
  jdText,
  summary,
  skills,
  experiences,
  onAddSkill,
  onAddSummary,
  onAddBullet,
  limit = 15,
}) {
  const tokenSet = useMemo(
    () => buildResumeCorpus({ summary, skills, experiences }),
    [summary, skills, experiences]
  );

  const rankedMissing = useMemo(() => {
    if (!jdText) return [];
    const candidates = topTermsFromJD(jdText, 60);
    const missing = candidates.filter(term => !scoreTermPresence(term, tokenSet));
    return missing.slice(0, limit);
  }, [jdText, tokenSet, limit]);

  if (!jdText?.trim()) {
    return (
      <div style={{ color: '#607D8B', fontSize: 13 }}>
        Paste or import a job description to see targeted, ATS-focused suggestions.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontWeight: 800, color: '#37474F' }}>
        Missing keywords (suggested adds)
      </div>
      {!rankedMissing.length && (
        <div style={{ color: '#2E7D32', fontWeight: 700 }}>Nice — no obvious gaps detected.</div>
      )}
      {rankedMissing.map((term) => (
        <div key={term}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto',
            gap: 8,
            alignItems: 'center',
            border: '1px solid #eee',
            borderRadius: 10,
            padding: '8px 10px',
            background: 'white',
          }}
        >
          <div style={{ fontWeight: 700 }}>{term}</div>
          <button
            type="button"
            onClick={() => onAddSkill(term)}
            style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}
          >
            + Skill
          </button>
          <button
            type="button"
            onClick={() => onAddSummary(term)}
            style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}
          >
            + Summary
          </button>
          <button
            type="button"
            onClick={() => onAddBullet(`Applied ${term} to achieve measurable outcomes.`)}
            style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}
          >
            + Bullet
          </button>
        </div>
      ))}
      <div style={{ fontSize: 12, color: '#90A4AE' }}>
        Synonym-aware: e.g., “Salesforce” ≈ “SFDC”. We’ll tune per-role later.
      </div>
    </div>
  );
}
