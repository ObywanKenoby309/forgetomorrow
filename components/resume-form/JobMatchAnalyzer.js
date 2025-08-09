// components/resume-form/JobMatchAnalyzer.js
import { useMemo, useState } from 'react';

// Very light stopword list to keep results meaningful
const STOPWORDS = new Set([
  'the','and','or','to','of','in','for','on','with','a','an','by','as','at','is','are','be','you',
  'we','our','your','their','from','that','this','will','can','ability','including','etc','etc.',
  'using','use','used','over','under','within','across','per','per-','into','out','about','it','its'
]);

function tokenize(text='') {
  return (text || '')
    .toLowerCase()
    // keep words & hyphenated terms
    .match(/[a-z0-9][a-z0-9\-]+/g) || [];
}

function extractKeywords(jdText='') {
  const words = tokenize(jdText);
  // frequency map
  const freq = new Map();
  for (const w of words) {
    if (w.length < 3) continue;
    if (STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  // keep top ~80 unique tokens but biased to frequency
  const sorted = [...freq.entries()].sort((a,b) => b[1]-a[1]).map(([w]) => w);
  return sorted.slice(0, 80);
}

function flatResumeText(data) {
  const {
    formData={}, summary='',
    experiences=[], projects=[],
    volunteerExperiences=[], educationList=[],
    certifications=[], languages=[], skills=[],
    achievements=[], customSections=[]
  } = data || {};

  const joinItems = (arr, fields) =>
    (arr||[]).map(it => fields.map(f => it?.[f] || '').join(' ')).join(' ');

  return [
    formData.fullName, formData.location, formData.portfolio, formData.forgeUrl,
    summary,
    joinItems(experiences, ['title','company','location','description','impact','outcomes','bullets']),
    joinItems(projects, ['name','description','outcomes']),
    joinItems(volunteerExperiences, ['organization','role','description']),
    joinItems(educationList, ['school','degree','field','notes']),
    joinItems(certifications, ['name','issuer','location','description']),
    (languages||[]).join(' '),
    (skills||[]).join(' '),
    (achievements||[]).join(' '),
    (customSections||[]).map(s => s?.title + ' ' + (s?.content || '')).join(' ')
  ].join(' ').toLowerCase();
}

export default function JobMatchAnalyzer(props) {
  const [jd, setJd] = useState('');
  const resumeText = useMemo(() => flatResumeText(props.data), [props.data]);
  const jdKeywords = useMemo(() => extractKeywords(jd), [jd]);

  const matched = useMemo(() => {
    const hits = new Set();
    const missing = new Set();
    for (const k of jdKeywords) {
      if (!k) continue;
      if (resumeText.includes(k)) hits.add(k);
      else missing.add(k);
    }
    return { hits: [...hits], missing: [...missing] };
  }, [jdKeywords, resumeText]);

  const score = useMemo(() => {
    const total = jdKeywords.length || 1;
    return Math.round((matched.hits.length / total) * 100);
  }, [jdKeywords.length, matched.hits.length]);

  return (
    <section className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-lg font-semibold text-[#FF7043]">Job Match Analyzer</h2>
        <div className="text-sm">
          <span className="inline-block px-3 py-1 rounded-full bg-[#ECEFF1] text-[#212121] font-medium">
            Match Score: <span className="text-[#FF7043]">{score}%</span>
          </span>
        </div>
      </div>

      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste the Job Description here..."
        className="w-full border border-gray-300 rounded p-3 h-40 mb-4"
      />

      {jdKeywords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Matched Keywords ({matched.hits.length})</h3>
            <div className="flex flex-wrap gap-2">
              {matched.hits.map((k) => (
                <span key={k} className="text-sm px-2 py-1 rounded bg-green-100 text-green-800 border border-green-200">
                  {k}
                </span>
              ))}
              {matched.hits.length === 0 && <div className="text-sm text-gray-500">None yet.</div>}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Missing Keywords ({matched.missing.length})</h3>
            <div className="flex flex-wrap gap-2">
              {matched.missing.map((k) => (
                <span key={k} className="text-sm px-2 py-1 rounded bg-red-100 text-red-800 border border-red-200">
                  {k}
                </span>
              ))}
              {matched.missing.length === 0 && <div className="text-sm text-gray-500">None — great coverage.</div>}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Tip: Add genuinely relevant keywords into your bullets (don’t keyword-stuff). This helps ATS parsing and recruiter skims.
      </p>
    </section>
  );
}
