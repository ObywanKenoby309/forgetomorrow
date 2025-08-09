// components/resume-form/TailorLocal.js
import { useContext, useMemo, useState } from 'react';
import { ResumeContext } from '../../context/ResumeContext';

// Light stopword list to keep keywords meaningful
const STOP = new Set([
  'the','and','or','to','of','in','for','on','with','a','an','by','as','at','is','are','be','you',
  'we','our','your','their','from','that','this','will','can','including','etc','etc.','using','use',
  'used','over','under','within','across','per','into','out','about','it','its','they','them','i'
]);

function tokenize(text='') {
  return (text || '').toLowerCase().match(/[a-z0-9][a-z0-9\-]+/g) || [];
}

function topKeywords(text, limit = 40) {
  const freq = new Map();
  for (const w of tokenize(text)) {
    if (w.length < 3) continue;
    if (STOP.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a,b) => b[1]-a[1]).slice(0, limit).map(([w]) => w);
}

function guessTitle(text='') {
  // Try to find likely title words (first line bias)
  const firstLine = (text.split('\n')[0] || '').trim();
  if (firstLine && firstLine.length < 120) return firstLine;
  // fallback: common title tokens by presence
  const hints = ['director','manager','lead','leader','analyst','specialist','engineer','consultant','coordinator','administrator','head','owner','founder','executive'];
  const kws = topKeywords(text, 80);
  const hit = kws.find(k => hints.includes(k));
  return hit ? hit.charAt(0).toUpperCase() + hit.slice(1) : 'Role';
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
    (arr||[]).map(it => fields.map(f => (it?.[f] ?? '')).join(' ')).join(' ');

  return [
    formData.fullName, formData.location, formData.portfolio, formData.forgeUrl,
    summary,
    joinItems(experiences, ['title','company','location','description','bullets','impact','outcomes']),
    joinItems(projects, ['name','description','outcomes']),
    joinItems(volunteerExperiences, ['organization','role','description']),
    joinItems(educationList, ['school','degree','field','notes']),
    joinItems(certifications, ['name','issuer','location','description']),
    (languages||[]).join(' '),
    (skills||[]).join(' '),
    (achievements||[]).join(' '),
    (customSections||[]).map(s => (s?.title || '') + ' ' + (s?.content || '')).join(' ')
  ].join(' ').toLowerCase();
}

function uniqueMerge(a=[], b=[]) {
  const set = new Set([...(a||[]), ...(b||[])]);
  return [...set];
}

export default function TailorLocal({ className }) {
  const ctx = useContext(ResumeContext);
  const data = {
    formData: ctx.formData,
    summary: ctx.summary,
    experiences: ctx.experiences,
    projects: ctx.projects,
    volunteerExperiences: ctx.volunteerExperiences,
    educationList: ctx.educationList,
    certifications: ctx.certifications,
    languages: ctx.languages,
    skills: ctx.skills,
    achievements: ctx.achievements,
    customSections: ctx.customSections,
  };

  const [jd, setJd] = useState('');
  const resumeText = useMemo(() => flatResumeText(data), [JSON.stringify(data)]);
  const jdKeywords = useMemo(() => topKeywords(jd, 60), [jd]);
  const matched = useMemo(() => jdKeywords.filter(k => resumeText.includes(k)), [jdKeywords, resumeText]);
  const missing = useMemo(() => jdKeywords.filter(k => !resumeText.includes(k)), [jdKeywords, resumeText]);
  const score = useMemo(() => Math.round((matched.length / Math.max(jdKeywords.length,1))*100), [matched.length, jdKeywords.length]);

  const titleGuess = useMemo(() => guessTitle(jd), [jd]);

  // Build a tailored summary using existing skills + top JD keywords
  const suggestedSummary = useMemo(() => {
    const name = data.formData?.fullName || '';
    const skillBank = uniqueMerge(data.skills || [], matched).slice(0, 10);
    const focus = missing.slice(0, 5); // lightly nudge the missing ones
    const pieces = [];

    pieces.push(`${name ? name + ' — ' : ''}${titleGuess}–aligned operator with proven delivery across support, operations, and client outcomes.`);
    if (skillBank.length) pieces.push(`Strengths: ${skillBank.join(', ')}.`);
    if (focus.length) pieces.push(`Target focus for this role: ${focus.join(', ')}.`);

    return pieces.join(' ');
  }, [data.formData, data.skills, matched, missing, titleGuess]);

  // Generate suggested bullets per experience (copy-friendly; we won’t overwrite)
  const suggestedBulletsByRole = useMemo(() => {
    const out = [];
    const pinch = (arr) => arr.filter(Boolean).slice(0,3); // use top 3 tokens for each bullet
    const tokenChunks = [
      pinch(missing.slice(0, 3)),
      pinch(missing.slice(3, 6)),
      pinch(missing.slice(6, 9)),
    ].filter(ch => ch.length);

    (data.experiences || []).forEach((exp, idx) => {
      const role = exp?.title || 'Role';
      const company = exp?.company || '';
      const bullets = tokenChunks.map((chunk) =>
        `Drove measurable results in ${chunk.join(', ')} as ${role}${company ? ' at ' + company : ''}; instrumented process improvements and tracked KPIs to validate impact.`
      );
      out.push({ index: idx, role, company, bullets });
    });
    return out;
  }, [data.experiences, missing]);

  const applySummary = () => {
    ctx.setSummaryWithBackup?.(suggestedSummary);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    } catch {
      // fallback: no-op
    }
  };

  const fmt = (iso='') => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch { return iso; }
  };

  return (
    <section className={`bg-white rounded-lg shadow p-4 mb-6 ${className || ''}`}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-lg font-semibold text-[#FF7043]">Tailor (No‑API)</h2>
        <span className="text-sm inline-block px-3 py-1 rounded-full bg-[#ECEFF1] text-[#212121] font-medium">
          JD Match: <span className="text-[#FF7043]">{score}%</span>
        </span>
      </div>

      {/* Backup controls (shared via context) */}
      <div className="mb-3 p-3 border rounded bg-[#FAFAFA]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-sm">
            <span className="font-medium">Temporary Backup:</span>{' '}
            {ctx.summaryBackup?.text
              ? <span className="text-gray-700">
                  Saved {fmt(ctx.summaryBackup?.savedAt)} • {Math.min(ctx.summaryBackup.text.length, 60)} chars preview: “{ctx.summaryBackup.text.slice(0,60)}{ctx.summaryBackup.text.length>60 ? '…' : ''}”
                </span>
              : <span className="text-gray-500">No backup saved yet.</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => ctx.saveSummaryBackup?.()}
              className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm"
            >
              Save Current as Backup
            </button>
            <button
              onClick={() => ctx.revertSummaryBackup?.()}
              disabled={!ctx.summaryBackup?.text}
              className={`px-3 py-2 rounded text-sm ${ctx.summaryBackup?.text ? 'bg-[#37474F] text-white hover:opacity-90' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              Revert to Backup
            </button>
            <button
              onClick={() => ctx.clearSummaryBackup?.()}
              disabled={!ctx.summaryBackup?.text}
              className={`px-3 py-2 rounded text-sm ${ctx.summaryBackup?.text ? 'border border-gray-300 hover:bg-gray-50' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              Clear Backup
            </button>
          </div>
        </div>
      </div>

      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste the Job Description here..."
        className="w-full border border-gray-300 rounded p-3 h-36 mb-4"
      />

      {jd.trim().length > 0 && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Suggested Summary</h3>
            <div className="border rounded p-3 text-sm bg-[#FAFAFA]">
              {suggestedSummary}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={applySummary}
                className="px-3 py-2 rounded bg-[#FF7043] text-white hover:opacity-90"
              >
                Apply to Summary
              </button>
              <button
                onClick={() => copyText(suggestedSummary)}
                className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                Copy Summary
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched / Missing keywords for quick edits */}
            <div>
              <h3 className="font-semibold mb-2">Matched Keywords ({matched.length})</h3>
              <div className="flex flex-wrap gap-2">
                {matched.map(k => (
                  <span key={k} className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 border border-green-200">
                    {k}
                  </span>
                ))}
                {matched.length === 0 && <div className="text-sm text-gray-500">None yet.</div>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Missing Keywords ({missing.length})</h3>
              <div className="flex flex-wrap gap-2">
                {missing.map(k => (
                  <span key={k} className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 border border-red-200">
                    {k}
                  </span>
                ))}
                {missing.length === 0 && <div className="text-sm text-gray-500">None — great coverage.</div>}
              </div>
            </div>
          </div>

          {/* Suggested bullets per role (copy-only to avoid breaking unknown schema) */}
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Suggested Bullets (copy into relevant roles)</h3>
            {suggestedBulletsByRole.length === 0 ? (
              <div className="text-sm text-gray-500">No roles found in your experience section yet.</div>
            ) : (
              suggestedBulletsByRole.map(block => (
                <div key={block.index} className="border rounded p-3 bg-[#FAFAFA]">
                  <div className="font-medium mb-1">
                    {block.role}{block.company ? ` · ${block.company}` : ''}
                  </div>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    {block.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                  <div className="mt-2">
                    <button
                      onClick={() => copyText(block.bullets.join('\n'))}
                      className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm"
                    >
                      Copy Bullets
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Tip: Use the Missing list to weave genuine keywords into your summary and bullets. Avoid stuffing — keep it natural.
      </p>
    </section>
  );
}
