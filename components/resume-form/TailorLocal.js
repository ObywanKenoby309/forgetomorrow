// components/resume-form/TailorLocal.js
import { useContext, useEffect, useMemo, useState } from 'react';
import { ResumeContext } from '@/context/ResumeContext';

/* ---------------- constants ---------------- */
const ACTION_VERBS = [
  'Led','Built','Implemented','Optimized','Developed','Launched','Improved','Streamlined',
  'Automated','Designed','Analyzed','Migrated','Reduced','Increased','Owned','Collaborated',
  'Coordinated','Delivered','Executed','Enhanced','Maintained','Monitored','Supported'
];

const STOPWORDS = new Set([
  'the','and','or','to','of','in','for','on','with','a','an','by','as','at','is','are','be',
  'your','our','their','from','that','this','will','can','including','etc','etc.','using','use','used',
  'over','under','within','across','per','into','out','about','it','its','we','you','they','them'
]);

/* ---------------- tiny utils ---------------- */
const titleCase = (s='') => s.replace(/\b([a-z])/g, m => m.toUpperCase());
const sentenceCase = (s='') => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const tokenize = (t='') => (t || '').toLowerCase().match(/[a-z0-9][a-z0-9\-]+/g) || [];

function topKeywords(jd, limit=24){
  const f = new Map();
  for(const w of tokenize(jd)){
    if(w.length < 3 || STOPWORDS.has(w)) continue;
    f.set(w, (f.get(w) || 0) + 1);
  }
  return [...f.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([w])=>w);
}

function guessRole(jd=''){
  const m = jd.match(/\b(title|role|position)\s*[:\-]\s*([^\n,]+)/i);
  if (m?.[2]) return m[2].trim();
  const head = (jd.split('\n')[0]||'').trim();
  return head.replace(/^we\s+are\s+(seeking|hiring)\s+/i,'').slice(0,80) || 'the role';
}

function pickMetricKeyword(jd=''){
  const s = jd.toLowerCase();
  if(/conversion|cvr|leads|mql|sql\b/.test(s)) return 'conversion/lead quality';
  if(/retention|churn|renewal/.test(s)) return 'retention';
  if(/pipeline|revenue|quota|arr|mrr|sales/.test(s)) return 'pipeline/revenue';
  if(/nps|csat|satisfaction|support|ticket/.test(s)) return 'customer satisfaction';
  if(/throughput|sla|latency|uptime|efficien|utiliz/.test(s)) return 'throughput/efficiency';
  return 'impact';
}

function detectTools(keywords=[]){
  const tools = [
    'hubspot','salesforce','mailchimp','marketo','ga4','google analytics','adwords','meta ads',
    'tableau','power bi','excel','sql','figma','canva','jira','zendesk','intercom'
  ];
  const set = new Set(keywords);
  return tools.filter(t => set.has(t) || set.has(t.replace(/\s+/g,'-')));
}

function topPhrases(keywords=[]){
  const multi = keywords.filter(k => k.includes('-') || k.includes(' '));
  const singles = keywords
    .filter(k => !multi.includes(k))
    .filter(k => !/(assistant|associate|coordinator|specialist|manager|engineer|developer)/i.test(k));
  return [...multi.slice(0,4), ...singles.slice(0,2)].map(k => k.replace(/-/g,' '));
}

/* ----------- responsibilities → bullets ----------- */
function normalizeClause(s=''){
  let x = (s||'').trim();
  x = x.replace(/^[-•*]\s*/,'');
  x = x.replace(/^we\s+are\s+(seeking|hiring)\b.*?\bto\b\s*/i,'');
  x = x.replace(/^(responsibilit(y|ies)|duties)[:\-]\s*/i,'');
  x = x.replace(/^(in|on|with|for|to|the|a|an)\b[\s,]*/i,'');
  x = x.replace(/\s{2,}/g,' ').replace(/[.;:,]\s*$/,'');
  x = x.replace(/\bmanages?\b/i,'manage')
       .replace(/\bcoordinates?\b/i,'coordinate')
       .replace(/\bleads?\b/i,'lead')
       .replace(/\bimplements?\b/i,'implement')
       .replace(/\boptimizes?\b/i,'optimize')
       .replace(/\bdevelops?\b/i,'develop');
  return x;
}

function extractResponsibilities(jd=''){
  const lines = jd.split('\n').map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => /^[-•*]/.test(l));

  const cueBlocks = [];
  let capture = false, buf = [];
  for(const l of lines){
    if(/\b(responsibilit|dutie|you will|you’ll|what you’ll do)\b/i.test(l)) capture = true;
    if(capture) buf.push(l);
    if(capture && /^\s*$/.test(l)) { cueBlocks.push(...buf); buf = []; capture=false; }
  }
  const raw = [...bullets, ...cueBlocks];
  return raw.map(normalizeClause).filter(Boolean).filter(x => x.length > 3);
}

/* ----------- fallback bullets when no responsibilities found ----------- */
function keywordBullets(keywords=[], metric='impact', count=7){
  const base = keywords.map(k => k.replace(/-/g,' ')).slice(0, 14);
  const out = [];
  for(let i=0;i<count;i++){
    const v = ACTION_VERBS[(i*2)%ACTION_VERBS.length];
    const k1 = base[(i*2)%base.length] || '';
    const k2 = base[(i*2+1)%base.length] || '';
    const tail = [k1,k2].filter(Boolean).join(' & ');
    out.push(`${v} initiatives using ${tail || 'role-aligned tools'} — improving ${metric} (add your metric).`);
  }
  return out;
}

function responsibilitiesToBullets(responsibilities=[], metric='impact', count=7){
  const src = responsibilities.map(normalizeClause).filter(Boolean);
  if(!src.length) return [];
  const out=[];
  for(let i=0; i<src.length && out.length<count; i++){
    const base = sentenceCase(src[i]);
    const startsVerbish = /^[A-Z][a-z]+(\s|$)/.test(base);
    const verb = ACTION_VERBS[(i*3)%ACTION_VERBS.length];
    const line = startsVerbish ? base : `${verb} ${base}`;
    out.push(`${line} — improving ${metric} (add your metric).`);
  }
  let j = 0;
  while(out.length < count){
    const base = sentenceCase(src[j % src.length]);
    const verb = ACTION_VERBS[(out.length*5)%ACTION_VERBS.length];
    out.push(`${verb} ${base} — improving ${metric} (add your metric).`);
    j++;
  }
  return out.filter((v,i,a)=>a.indexOf(v)===i).slice(0,count);
}

/* ---------------- summary synthesis ---------------- */
function synthSummary({ role, keywords, jd }){
  const phrases = topPhrases(keywords||[]);
  const focus = pickMetricKeyword(jd);
  const tools = detectTools(keywords||[]);
  const skillList = phrases.length ? phrases.join(', ') : 'core channels and tools';
  const toolLine = tools.length ? ` Tools: ${tools.map(t=>titleCase(t)).join(', ')}.` : '';
  const who = role ? titleCase(role) : 'Candidate';
  const s1 = `${who} with hands-on experience in ${skillList}.`;
  const s2 = `Drives measurable ${focus} through ownership, clear communication, and bias to action.`;
  return [s1, s2].join(' ') + toolLine;
}

/* ---------------- component ---------------- */
export default function TailorLocal({ jdText = '' }) {
  const { summary, setSummary, experiences, setExperiences } = useContext(ResumeContext);

  // local JD (editable)
  const [localJd, setLocalJd] = useState(jdText || '');
  useEffect(() => { setLocalJd(jdText || ''); }, [jdText]);

  const [outSummary, setOutSummary] = useState('');
  const [outBullets, setOutBullets] = useState([]);
  const [note, setNote] = useState('');

  const canGenerate = useMemo(() => {
    const ls = (typeof window !== 'undefined' && localStorage.getItem('ft_last_job_text')) || '';
    return !!(localJd?.trim() || jdText?.trim() || ls.trim());
  }, [localJd, jdText]);

  function getSourceJD(){
    const first = (localJd || '').trim();
    if (first) return first;
    const second = (jdText || '').trim();
    if (second) return second;
    const third = (typeof window !== 'undefined' && localStorage.getItem('ft_last_job_text')) || '';
    return (third || '').trim();
  }

  function generate(){
    const jd = getSourceJD();
    if (!jd) {
      setNote('Paste a job description first.');
      setOutSummary('');
      setOutBullets([]);
      return;
    }
    setNote('');

    const kws = topKeywords(jd, 24);
    const role = guessRole(jd);

    // Summary
    setOutSummary(synthSummary({ role, keywords: kws, jd }));

    // Bullets (always 7)
    const metric = pickMetricKeyword(jd);
    const resp = extractResponsibilities(jd);
    let bullets = responsibilitiesToBullets(resp, metric, 7);
    if (!bullets.length) {
      bullets = keywordBullets(kws, metric, 7); // fallback
    }
    setOutBullets(bullets);
  }

  function insertSummary(){
    const sep = summary?.trim() ? ' ' : '';
    setSummary((summary || '') + sep + (outSummary || ''));
  }

  function insertBullets(){
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
          className="px-3 py-2 rounded bg-[#FF7043] text-white font-bold"
          title="Generate a suggested summary and 7 bullets from the JD (no AI required)"
        >
          Generate from JD
        </button>
      </div>

      <textarea
        value={localJd}
        onChange={(e)=>setLocalJd(e.target.value)}
        placeholder="Paste the JD here (we’ll analyze responsibilities and keywords)…"
        className="w-full border border-gray-300 rounded p-3 h-40 mb-2"
      />
      {note ? <div className="text-sm text-red-600 mb-3">{note}</div> : null}

      {outSummary || outBullets.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Suggested Summary */}
          <div>
            <h3 className="font-semibold mb-2">Suggested Summary</h3>
            <textarea
              className="w-full border border-gray-300 rounded p-3 h-40"
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

          {/* Suggested Bullets */}
          <div>
            <h3 className="font-semibold mb-2">Suggested Bullets (7)</h3>
            <div className="space-y-2 max-h-72 overflow-auto pr-1">
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
                title="Appends these bullets to the top Work Experience entry"
              >
                Add bullets to top experience
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Tip: Replace “(add your metric)” with concrete outcomes (e.g., “+18% conversion”, “–12% churn”).
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Paste a JD and click <em>Generate from JD</em>. You can edit the suggestions before inserting.
        </p>
      )}
    </section>
  );
}
