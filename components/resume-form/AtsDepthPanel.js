// components/resume-form/AtsDepthPanel.js
import { useMemo, useState } from 'react';

// Keep the list *tight* so we don’t suggest junky fillers
const STOPWORDS = new Set([
  'the','and','or','to','of','in','for','on','with','a','an','by','as','at',
  'is','are','be','you','we','our','your','their','from','that','this','will',
  'can','ability','including','etc','etc.','using','use','used','over','under',
  'within','across','per','into','out','about','it','its','role','type',
  'full-time','intern','internship','benefits','compensation','responsibilities',
  'requirements','preferred','mostly'
]);

function tokenize(text = '') {
  return (text || '')
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9\-]+/g) || [];
}

function topKeywords(jdText = '', limit = 80) {
  const words = tokenize(jdText);
  const freq = new Map();
  for (const w of words) {
    if (w.length < 3) continue;
    if (STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).map(([w])=>w).slice(0, limit);
}

function flatResumeText({ summary = '', skills = [], experiences = [] }) {
  const ex = (experiences || [])
    .map(e => [e?.title, e?.company, (e?.bullets || []).join(' ')].join(' '))
    .join(' ');
  return [summary, (skills || []).join(' '), ex].join(' ').toLowerCase();
}

export default function AtsDepthPanel({
  jdText = '',
  summary = '',
  skills = [],
  experiences = [],
  onAddSkill,
  onAddSummary,
  onAddBullet,
  collapsedDefault = false,
  maxChips = 12,
}) {
  const [collapsed, setCollapsed] = useState(collapsedDefault);
  const [showAll, setShowAll] = useState(false);
  const [added, setAdded] = useState({}); // { "keyword:kind": true }

  const resumeText = useMemo(
    () => flatResumeText({ summary, skills, experiences }),
    [summary, skills, experiences]
  );
  const keywords = useMemo(() => topKeywords(jdText, 80), [jdText]);

  const { hits, missing } = useMemo(() => {
    const h = [], m = [];
    for (const k of keywords) (resumeText.includes(k) ? h : m).push(k);
    return { hits: h, missing: m };
  }, [keywords, resumeText]);

  const visibleMissing = showAll ? missing : missing.slice(0, maxChips);
  const moreCount = Math.max(missing.length - visibleMissing.length, 0);

  const empty = !jdText?.trim();

  const markAdded = (k, kind) => {
    const key = `${k}:${kind}`;
    setAdded(a => ({ ...a, [key]: true }));
    setTimeout(() => setAdded(a => {
      const copy = { ...a }; delete copy[key]; return copy;
    }), 1200);
  };

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontWeight: 800, color: '#37474F' }}>
          Missing keywords (suggested adds)
          {missing.length ? ` · ${missing.length}` : ''}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'white',
            border: '1px solid #E0E0E0',
            borderRadius: 10,
            padding: '6px 10px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {empty && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#90A4AE' }}>
          Paste or import a job description to see suggested keywords you can add as Skills, Summary phrases, or Bullets.
        </div>
      )}

      {!empty && !collapsed && (
        <>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {visibleMissing.map((k) => (
              <div
                key={k}
                style={{
                  background: '#FAFAFA',
                  border: '1px solid #E0E0E0',
                  borderRadius: 10,
                  padding: 10,
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 700, color: '#263238' }}>{k}</div>
                <button
                  type="button"
                  onClick={() => { onAddSkill?.(k); markAdded(k, 'skill'); }}
                  style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {added[`${k}:skill`] ? 'Added ✓' : '+ Skill'}
                </button>
                <button
                  type="button"
                  onClick={() => { onAddSummary?.(k); markAdded(k, 'summary'); }}
                  style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {added[`${k}:summary`] ? 'Added ✓' : '+ Summary'}
                </button>
                <button
                  type="button"
                  onClick={() => { onAddBullet?.(`• ${k}`); markAdded(k, 'bullet'); }}
                  style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {added[`${k}:bullet`] ? 'Added ✓' : '+ Bullet'}
                </button>
              </div>
            ))}
          </div>

          {moreCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowAll(s => !s)}
                style={{
                  background: 'white',
                  border: '1px solid #E0E0E0',
                  borderRadius: 10,
                  padding: '6px 10px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {showAll ? 'Show fewer' : `Show ${moreCount} more`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
