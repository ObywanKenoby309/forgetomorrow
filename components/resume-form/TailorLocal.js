import { useContext, useEffect, useMemo, useState } from 'react';
import { ResumeContext } from '@/context/ResumeContext';

const ACTION_VERBS = [
  'Led','Built','Implemented','Optimized','Developed','Launched','Improved','Streamlined',
  'Automated','Designed','Analyzed','Migrated','Reduced','Increased','Owned','Collaborated'
];

const STOPWORDS = new Set([
  'the','and','or','to','of','in','for','on','with','a','an','by','as','at','is','are','be','your',
  'our','their','from','that','this','will','can','including','etc','etc.','using','use','used',
  'over','under','within','across','per','into','out','about','it','its','we','you'
]);

function tokenize(text='') {
  return (text || '').toLowerCase().match(/[a-z0-9][a-z0-9\-]+/g) || [];
}

function topKeywords(jd, limit=12) {
  const freq = new Map();
  for (const w of tokenize(jd)) {
    if (w.length < 3) continue;
    if (STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([w])=>w);
}

function guessRole(jd='') {
  // crude role guess from common patterns
  const m = jd.match(/\b(title|role|position)\s*[:\-]\s*([^\n,]+)/i);
  if (m?.[2]) return m[2].trim();
  const head = jd.split('\n')[0] || '';
  return head.slice(0, 80);
}

function craftSummary(role, keywords) {
  const top = keywords.slice(0, 6);
  const list = top.map(k => k.replace(/-/g,' ')).join(', ');
  return `Candidate for ${role || 'the role'} with hands-on experience in ${list}.`
    + ` Focused on delivering measurable outcomes, collaborating across teams, and ramping quickly.`;
}

function craftBullets(keywords, count=5) {
  const ks = keywords.slice(0, 12);
  const bullets = [];
  for (let i=0; i<count; i++) {
    const verb = ACTION_VERBS[i % ACTION_VERBS.length];
    const k1 = ks[(i*2) % ks.length] || '';
    const k2 = ks[(i*2+1) % ks.length] || '';
    const tail = [k1,k2].filter(Boolean).map(k=>k.replace(/-/g,' ')).join(' & ');
    bullets.push(`${verb} initiatives using ${tail} to drive impact and align with team goals.`);
  }
  return bullets;
}

export default function TailorLocal({ jdText = '' }) {
  const {
    summary, setSummary,
    experiences, setExperiences,
  } = useContext(ResumeContext);

  // local JD (seeded from parent, but still editable)
  const [jd, setJd] = useState(jdText || '');
  useEffect(() => { setJd(jdText || ''); }, [jdText]);

  const [outSummary, setOutSummary] = useState('');
  const [outBullets, setOutBullets] = useState([]);

  const canGenerate = useMemo(() => (jd || '').trim().length > 0, [jd]);

  function generate() {
    if (!canGenerate) return;
    const kws = topKeywords(jd, 16);
    const role = guessRole(jd);
    setOutSummary(craftSummary(role, kws));
    setOutBullets(craftBullets(kws, 5));
  }

  function insertSummary() {
    const sep = summary?.trim() ? ' ' : '';
    setSummary((summary || '') + sep + (outSummary || ''));
  }

  function insertBullets() {
    const list = outBullets.filter(Boolean);
    if (!list.length) return;

    const exps = Array.isArray(experiences) ? [...experiences] : [];
    if (!exps.length) {
      exps.push({ title: 'Target Role', company: '', bullets: list });
    } else {
      const first = { ...(exps[0] || {}) };
      const b = Array.isArray(first.bullets) ? [...first.bullets] : [];
      exps[0] = { ...first, bullets: [...b, ...list] };
    }
    setExperiences(exps);
  }

  return (
    <section className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-lg font-semibold text-[#FF7043]">Tailor (Local)</h2>
        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate}
          className="px-3 py-2 rounded bg-[#FF7043] text-white font-bold disabled:opacity-60"
        >
          Generate from JD
        </button>
      </div>

      <textarea
        value={jd}
        onChange={(e)=>setJd(e.target.value)}
        placeholder="Your JD text (auto-filled from the main builder)…"
        className="w-full border border-gray-300 rounded p-3 h-36 mb-4"
      />

      {outSummary || outBullets.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Suggested Summary</h3>
            <textarea
              className="w-full border border-gray-300 rounded p-3 h-32"
              value={outSummary}
              onChange={(e)=>setOutSummary(e.target.value)}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={insertSummary}
                className="px-3 py-2 rounded border border-gray-300 font-semibold"
              >
                Insert into Summary
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Suggested Bullets</h3>
            <div className="space-y-2">
              {outBullets.map((b, i)=>(
                <textarea
                  key={i}
                  className="w-full border border-gray-300 rounded p-2"
                  value={b}
                  onChange={(e)=>{
                    const next=[...outBullets]; next[i]=e.target.value; setOutBullets(next);
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={insertBullets}
                className="px-3 py-2 rounded border border-gray-300 font-semibold"
              >
                Add bullets to top experience
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Paste or edit the JD above, then click <em>Generate from JD</em>.</p>
      )}
    </section>
  );
}
