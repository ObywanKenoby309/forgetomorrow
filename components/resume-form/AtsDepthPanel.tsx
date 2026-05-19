'use client';

// components/resume-form/AtsDepthPanel.tsx
// Unified Match panel – AI score first, keyword coverage as fallback.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import CoachSuggestionsPanel from './CoachSuggestionsPanel';

type Experience = {
  title?: string;
  company?: string;
  bullets?: string[];
};

type Education = {
  school?: string;
  degree?: string;
  field?: string;
  notes?: string;
};

type JobMeta =
  | {
      title?: string;
      company?: string;
      location?: string;
    }
  | null;

type Props = {
  jdText: string;
  summary: string;
  skills: string[];
  experiences: Experience[];
  education: Education[];
  jobMeta?: JobMeta;
  onAddSkill?: (keyword: string) => void;
  onAddSummary?: (snippet: string) => void;
  onAddBullet?: (snippet: string) => void;
};

type CoachContext = {
  section: 'overview' | 'summary' | 'skills' | 'experience' | 'education' | 'certifications' | 'languages';
  keyword?: string | null;
};

type ActivePanel = 'coach' | 'signal' | 'keywords';

const ORANGE = '#FF7043';

const STOP_WORDS = new Set([
  'the','and','for','with','that','this','from','your','you','our','are','was','were',
  'will','shall','would','could','should','into','about','over','under','in','on','of',
  'to','a','an','as','by','or','at','be','is','it','we','they','them','their','there',
  'have','has','had','not','but','can','all','any','one','may','must','than','then',
  'when','also','both','each','such','more','most','other','some','these','those',
  'work','role','team','company','position','candidate','including','required',
  'experience','years','ability','strong','knowledge','using','within','across',
]);

// ─── Hard skill / tech term signals ──────────────────────────────────────────
const HARD_SKILL_PATTERNS = [
  // Programming & data
  'python','javascript','typescript','java','sql','r','scala','golang','rust','c++','c#',
  'react','angular','vue','node','django','flask','spring','kubernetes','docker',
  'aws','azure','gcp','terraform','ansible','linux','bash','git','api','rest','graphql',
  // Business / ops
  'salesforce','tableau','powerbi','power bi','excel','sap','oracle','servicenow',
  'jira','confluence','figma','sketch','zendesk','hubspot','marketo','gainsight',
  // Frameworks / methodologies
  'agile','scrum','kanban','lean','six sigma','pmp','itil','devops','ci/cd',
  'machine learning','deep learning','nlp','llm','ai','ml','data analysis',
  'data science','business intelligence','erp','crm','etl',
  // Finance / legal / compliance
  'gaap','ifrs','sox','gdpr','hipaa','ccpa','aml','kyc','finra','sec',
  // Healthcare / science
  'clinical','ehr','emr','fda','irb','gcp','gmp','cdisc','sas','spss','r studio',
  // Cybersecurity
  'cissp','cism','cisa','soc','siem','endpoint','zero trust','pentest','vulnerability',
  'nist','iso 27001','firewalls','ids','ips',
];

// ─── Tool / platform signals ──────────────────────────────────────────────────
const TOOL_PATTERNS = [
  'microsoft','google','apple','amazon','meta','slack','zoom','teams','outlook',
  'sharepoint','onedrive','dropbox','box','notion','asana','monday','trello',
  'github','gitlab','bitbucket','jenkins','circleci','datadog','splunk','new relic',
  'snowflake','databricks','hadoop','spark','airflow','kafka','elasticsearch',
  'wordpress','shopify','stripe','twilio','sendgrid','intercom','pendo','amplitude',
  'mixpanel','segment','looker','dbt','fivetran','stitch','redshift','bigquery',
];

// ─── Certification signals ────────────────────────────────────────────────────
const CERT_PATTERNS = [
  'pmp','cissp','cism','cisa','aws certified','azure certified','gcp certified',
  'google certified','cpa','cfa','cfp','frm','caia','series 7','series 63','series 65',
  'mba','phd','md','jd','rn','np','pa','do','cpa','cfe','cma','cia',
  'itil','togaf','safe','csm','csp','pmi','six sigma','lean','black belt',
  'comptia','security+','network+','a+','ccna','ccnp','ccie','mcse','rhce',
  'shrm','sphr','phr','chrp','cdp',
  'certification','certified','certificate','licensure','licensed','credential',
];

// ─── Soft skill signals ───────────────────────────────────────────────────────
const SOFT_SKILL_PATTERNS = [
  'leadership','communication','collaboration','problem.solving','critical.thinking',
  'analytical','strategic','creative','innovative','adaptable','flexible',
  'detail.oriented','organized','proactive','self.motivated','entrepreneurial',
  'mentoring','coaching','presenting','negotiating','influencing','persuasion',
  'relationship.building','stakeholder','cross.functional','interpersonal',
  'time.management','prioritization','decision.making','conflict.resolution',
  'emotional.intelligence','empathy','listening','written','verbal',
];

// ─── Language signals ─────────────────────────────────────────────────────────
const LANGUAGE_PATTERNS = [
  'spanish','french','german','mandarin','chinese','japanese','korean','portuguese',
  'arabic','russian','italian','dutch','hindi','swedish','polish','turkish',
  'bilingual','multilingual','fluent','native speaker','proficient',
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchPatterns(jd: string, patterns: string[]): string[] {
  const normalized = jd.toLowerCase();
  return patterns.filter(p => {
    try {
      const escaped = escapeRegex(p).replace(/\\\./, '\\s*');
      const regex = new RegExp(escaped, 'i');
      return regex.test(normalized);
    } catch {
      return normalized.includes(p.toLowerCase());
    }
  });
}

function extractKeyTerms(text: string, max = 8): string[] {
  if (!text) return [];
  const cleaned = text.toLowerCase().replace(/[^a-z0-9+\s]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

// Extract education requirements from JD
function extractEduRequirements(jd: string): string[] {
  const found: string[] = [];
  const normalized = jd.toLowerCase();
  const eduTerms = [
    ["bachelor's degree", "bachelor's"],
    ["master's degree", "master's"],
    ['mba', 'mba'],
    ['phd', 'phd'],
    ['doctorate', 'doctorate'],
    ["associate's degree", "associate's"],
    ['high school diploma', 'high school'],
    ['bootcamp', 'bootcamp'],
  ];
  for (const [pattern, label] of eduTerms) {
    if (normalized.includes(pattern)) found.push(label);
  }
  return found;
}

function countWords(text: string) {
  const t = (text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function jdPreview(text: string, maxChars = 170) {
  const n = (text || '').replace(/\s+/g, ' ').trim();
  if (!n) return '';
  return n.length > maxChars ? `${n.slice(0, maxChars)}…` : n;
}

function cleanJobDescription(input: string = '') {
  return String(input || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/Preview:/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function guessJobTitle(jdText: string) {
  const jd = (jdText || '').trim();
  if (!jd) return '';
  const m1 = jd.match(/(?:^|\n)\s*(?:job\s*title|title|position)\s*[:\-]\s*([^\n]{3,120})/i);
  if (m1 && m1[1]) return m1[1].trim();
  const firstLine = jd.split('\n').map((s) => s.trim()).filter(Boolean)[0] || '';
  if (firstLine && firstLine.length <= 90) {
    if (!/overview|about\s+us|introduction|who\s+we\s+are/i.test(firstLine)) return firstLine;
  }
  return '';
}

export default function AtsDepthPanel({
  jdText,
  summary,
  skills,
  experiences,
  education,
  jobMeta = null,
  onAddSkill,
  onAddSummary,
  onAddBullet,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>('coach');

  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiUpgrade, setAiUpgrade] = useState(false);

  const [coachOpen, setCoachOpen] = useState(false);
  const [coachContext, setCoachContext] = useState<CoachContext>({
    section: 'overview',
    keyword: null,
  });
  const coachRunRef = useRef<{ run: () => void } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cleanJdText = useMemo(() => cleanJobDescription(jdText), [jdText]);

  const resumeText = useMemo(() => {
    const expBits = (experiences || [])
      .map((e) => `${e.title || ''} ${e.company || ''} ${(e.bullets || []).join(' ')}`)
      .join(' ');
    const eduBits = (education || [])
      .map((e) => `${e.degree || ''} ${e.field || ''} ${e.school || ''} ${e.notes || ''}`)
      .join(' ');
    return `${summary || ''} ${(skills || []).join(' ')} ${expBits} ${eduBits}`.toLowerCase();
  }, [summary, skills, experiences, education]);

  const titleKeywords = useMemo(() => extractKeyTerms(cleanJdText, 12), [cleanJdText]);

  const matchedTitleKeywords = useMemo(
    () => titleKeywords.filter((k) => resumeText.includes(k.toLowerCase())),
    [titleKeywords, resumeText]
  );

  // ─── Categorized keyword extraction ────────────────────────────────────────
  const jdHardSkills = useMemo(() => matchPatterns(cleanJdText, HARD_SKILL_PATTERNS), [cleanJdText]);
  const jdTools      = useMemo(() => matchPatterns(cleanJdText, TOOL_PATTERNS), [cleanJdText]);
  const jdCerts      = useMemo(() => matchPatterns(cleanJdText, CERT_PATTERNS), [cleanJdText]);
  const jdSoftSkills = useMemo(() => matchPatterns(cleanJdText, SOFT_SKILL_PATTERNS), [cleanJdText]);
  const jdLanguages  = useMemo(() => matchPatterns(cleanJdText, LANGUAGE_PATTERNS), [cleanJdText]);
  const jdEduReqs    = useMemo(() => extractEduRequirements(cleanJdText), [cleanJdText]);

  const matchedHardSkills = useMemo(() => jdHardSkills.filter(k => resumeText.includes(k.toLowerCase().replace('.', ' '))), [jdHardSkills, resumeText]);
  const matchedTools      = useMemo(() => jdTools.filter(k => resumeText.includes(k.toLowerCase())), [jdTools, resumeText]);
  const matchedCerts      = useMemo(() => jdCerts.filter(k => resumeText.includes(k.toLowerCase().replace('.', ' '))), [jdCerts, resumeText]);
  const matchedSoftSkills = useMemo(() => jdSoftSkills.filter(k => resumeText.includes(k.toLowerCase().replace('.', ' '))), [jdSoftSkills, resumeText]);
  const matchedLanguages  = useMemo(() => jdLanguages.filter(k => resumeText.includes(k.toLowerCase())), [jdLanguages, resumeText]);
  const matchedEduReqs    = useMemo(() => jdEduReqs.filter(k => resumeText.includes(k.toLowerCase())), [jdEduReqs, resumeText]);

  // ─── Missing terms per category ─────────────────────────────────────────────
  const missingTitleKeywords = titleKeywords.filter(k => !matchedTitleKeywords.includes(k));
  const missingHardSkills    = jdHardSkills.filter(k => !matchedHardSkills.includes(k));
  const missingTools         = jdTools.filter(k => !matchedTools.includes(k));
  const missingCerts         = jdCerts.filter(k => !matchedCerts.includes(k));
  const missingSoftSkills    = jdSoftSkills.filter(k => !matchedSoftSkills.includes(k));
  const missingLanguages     = jdLanguages.filter(k => !matchedLanguages.includes(k));

  // ─── Coverage scores per category ───────────────────────────────────────────
  const pct = (matched: number, total: number) =>
    total > 0 ? Math.round((matched / total) * 100) : null;

  const titleCov    = pct(matchedTitleKeywords.length, titleKeywords.length);
  const hardCov     = pct(matchedHardSkills.length, jdHardSkills.length);
  const toolsCov    = pct(matchedTools.length, jdTools.length);
  const certsCov    = pct(matchedCerts.length, jdCerts.length);
  const softCov     = pct(matchedSoftSkills.length, jdSoftSkills.length);
  const langCov     = pct(matchedLanguages.length, jdLanguages.length);
  const eduCov      = pct(matchedEduReqs.length, jdEduReqs.length);

  // ─── Composite keyword score ─────────────────────────────────────────────────
  // Weighted: hard skills 30%, title/role 25%, tools 20%, certs 15%, soft 10%
  // Only include categories that exist in the JD
  const keywordCoverage = useMemo(() => {
    const weights: Array<[number | null, number]> = [
      [titleCov, 25],
      [hardCov, 30],
      [toolsCov, 20],
      [certsCov, 15],
      [softCov, 10],
    ];
    const active = weights.filter(([score]) => score !== null);
    if (!active.length) return 0;
    const totalWeight = active.reduce((sum, [, w]) => sum + w, 0);
    const weighted = active.reduce((sum, [score, w]) => sum + (score! * w), 0);
    return Math.round(weighted / totalWeight);
  }, [titleCov, hardCov, toolsCov, certsCov, softCov]);

  const primaryScore = aiScore !== null ? aiScore : keywordCoverage;

  let statusText = '';
  let barColor = '#C62828';
  if (primaryScore >= 85) { statusText = 'Excellent — ready to apply.'; barColor = '#2E7D32'; }
  else if (primaryScore >= 70) { statusText = 'Good — tighten keywords & metrics to push higher.'; barColor = '#F59E0B'; }
  else if (primaryScore >= 50) { statusText = 'Fair — add more high-impact terms before applying.'; barColor = '#EF6C00'; }
  else { statusText = 'Low — add more high-impact terms (aim ≥85).'; barColor = '#C62828'; }

  // ─── Buckets for the Keywords tab ───────────────────────────────────────────
  const buckets = [
    { key: 'title', label: 'Title / Role', matched: matchedTitleKeywords.length, total: titleKeywords.length, points: titleCov, missing: missingTitleKeywords, section: 'skills' as const },
    { key: 'hard', label: 'Hard Skills', matched: matchedHardSkills.length, total: jdHardSkills.length, points: hardCov, missing: missingHardSkills, section: 'skills' as const },
    { key: 'tools', label: 'Tools & Platforms', matched: matchedTools.length, total: jdTools.length, points: toolsCov, missing: missingTools, section: 'skills' as const },
    { key: 'certs', label: 'Certifications', matched: matchedCerts.length, total: jdCerts.length, points: certsCov, missing: missingCerts, section: 'education' as const },
    { key: 'soft', label: 'Soft Skills', matched: matchedSoftSkills.length, total: jdSoftSkills.length, points: softCov, missing: missingSoftSkills, section: 'summary' as const },
    { key: 'lang', label: 'Languages', matched: matchedLanguages.length, total: jdLanguages.length, points: langCov, missing: missingLanguages, section: 'skills' as const },
    { key: 'edu', label: 'Education', matched: matchedEduReqs.length, total: jdEduReqs.length, points: eduCov, missing: [], section: 'education' as const },
  ].filter(b => b.total > 0); // only show buckets that exist in the JD

  const resumeData = useMemo(
    () => ({ summary, skills, workExperiences: experiences, educationList: education }),
    [summary, skills, experiences, education]
  );

  const guessedTitle = useMemo(() => guessJobTitle(cleanJdText), [cleanJdText]);
  const words = useMemo(() => countWords(cleanJdText), [cleanJdText]);
  const preview = useMemo(() => jdPreview(cleanJdText), [cleanJdText]);

  const loadedTitle = (jobMeta?.title || '').trim() || guessedTitle || 'Job description';
  const loadedCompany = (jobMeta?.company || '').trim();
  const loadedLocation = (jobMeta?.location || '').trim();

  function openCoach(section: CoachContext['section'] = 'overview', keyword: string | null = null) {
    setCoachContext({ section, keyword });
    setCoachOpen(true);
  }

  function openCoachOverview() {
    openCoach('overview', null);
    // Fire the coach immediately — user clicked the button intentionally
    // Small delay so coachOpen state propagates before the panel mounts
    setTimeout(() => {
      coachRunRef.current?.run();
    }, 50);
  }

  async function runAiScan() {
    if (!cleanJdText?.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiUpgrade(false);

    try {
      const resp = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: cleanJdText, resume: resumeData }),
      });

      const data = await resp.json();

      if (data?.upgrade) {
        setAiUpgrade(true);
        setAiScore(null);
        setAiTips(Array.isArray(data?.tips) ? data.tips : []);
        return;
      }

      const s = typeof data?.score === 'number'
        ? Math.max(0, Math.min(100, Math.round(data.score)))
        : null;
      setAiScore(s);
      setAiTips(Array.isArray(data?.tips) ? data.tips : []);
    } catch (e) {
      console.error('[AtsDepthPanel] AI scan failed', e);
      setAiError('AI scan failed - try again.');
      setAiScore(null);
    } finally {
      setAiLoading(false);
    }
  }

  const normalizedTips: string[] = Array.isArray(aiTips)
    ? aiTips.filter((t) => typeof t === 'string' && t.trim().length > 0)
    : [];

  const tabButton = (key: ActivePanel, label: string) => ({
    type: 'button' as const,
    onClick: () => setActivePanel(key),
    style: {
      border: activePanel === key ? `1px solid ${ORANGE}` : '1px solid #E2E8F0',
      background: activePanel === key ? 'rgba(255,112,67,0.10)' : '#FFFFFF',
      color: activePanel === key ? '#C2410C' : '#475569',
      borderRadius: 999,
      padding: '6px 10px',
      fontSize: 11,
      fontWeight: 900,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
    },
    children: label,
  });

  // ── Hydration fix ────────────────────────────────────────────────────────
  // Return a stable empty shell until client mounts.
  // This keeps the server/client tree shape identical and prevents error #418.
  if (!mounted) {
    return <div style={{ marginTop: 0 }} />;
  }

  if (!cleanJdText?.trim()) return null;

  return (
    <div style={{ marginTop: 0 }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.96)',
          borderRadius: 14,
          border: '1px solid rgba(226,232,240,0.95)',
          padding: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Compact header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 950, fontSize: 15, color: '#263238', lineHeight: 1.1 }}>
              Forge Hammer
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: '#607D8B', lineHeight: 1.35 }}>
              Coach. Signal Report. Keywords.
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 950, color: barColor, letterSpacing: -0.5, lineHeight: 1 }}>
              {Number.isFinite(primaryScore) ? primaryScore : 0}
              <span style={{ fontSize: 13, color: '#B0BEC5', marginLeft: 2 }}>/100</span>
            </div>
            <div style={{ marginTop: 3, fontSize: 10, color: '#78909C', fontWeight: 800 }}>
              {'Keyword signal'}
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ height: 7, borderRadius: 999, background: '#ECEFF1', overflow: 'hidden', marginTop: 9 }}>
          <div
            style={{
              width: `${Math.max(0, Math.min(100, primaryScore))}%`,
              height: '100%',
              background: barColor,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <div style={{ marginTop: 6, fontSize: 11, color: '#546E7A', lineHeight: 1.3 }}>
          {statusText}
        </div>

        {/* Loaded job - compact */}
        <details style={{ marginTop: 9 }}>
          <summary
            style={{
              cursor: 'pointer',
              listStyle: 'none',
              borderRadius: 12,
              border: '1px solid #BBDEFB',
              background: '#E3F2FD',
              padding: '9px 10px',
              color: '#0B2A4A',
              fontSize: 12,
              lineHeight: 1.35,
            }}
          >
            <div style={{ fontWeight: 950, color: '#0D47A1', fontSize: 12 }}>Loaded job</div>
            <div style={{ marginTop: 2 }}>
              <strong>{loadedTitle}</strong>
              {loadedCompany ? ` at ${loadedCompany}` : ''}
              {loadedLocation ? ` · ${loadedLocation}` : ''}
              <span style={{ color: '#607D8B' }}> · {words} words</span>
            </div>
          </summary>

          {preview ? (
            <div
              style={{
                marginTop: 6,
                borderRadius: 10,
                border: '1px solid #D7ECFF',
                background: '#F7FBFF',
                padding: 10,
                fontSize: 11,
                color: '#1E3A5F',
                lineHeight: 1.4,
              }}
            >
              <span style={{ fontWeight: 900, color: '#1565C0' }}>Preview: </span>
              {preview}
            </div>
          ) : null}
        </details>

        {/* Module selector */}
        <div
          style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 6,
          }}
        >
          <button {...tabButton('coach', 'Coach')} />
          <button {...tabButton('signal', 'Signal Report')} />
          <button {...tabButton('keywords', 'Keywords')} />
        </div>

        {/* Active module */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: activePanel === 'coach' ? 'block' : 'none' }}>
            <div
              style={{
                padding: 11,
                borderRadius: 14,
                border: '1px solid #FFE0B2',
                background: '#FFF8E1',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 950, color: '#F97316', marginBottom: 4 }}>
                Ask the Coach
              </div>
              <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.4 }}>
                Work one section at a time. Get section-specific guidance for this job.
              </div>

              <button
                type="button"
                onClick={openCoachOverview}
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: ORANGE,
                  color: 'white',
                  fontWeight: 950,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.14)',
                }}
              >
                Review overall alignment
              </button>

              <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                {[
                  { label: 'Summary', section: 'summary' as const },
                  { label: 'Skills', section: 'skills' as const },
                  { label: 'Experience bullets', section: 'experience' as const },
                  { label: 'Education', section: 'education' as const },
                  { label: 'Certifications', section: 'certifications' as const },
                  { label: 'Languages', section: 'languages' as const },
                ].map((item) => (
                  <button
                    key={item.section}
                    type="button"
                    onClick={() => openCoach(item.section, null)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '8px 9px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,112,67,0.18)',
                      background: 'rgba(255,255,255,0.82)',
                      color: '#334155',
                      fontWeight: 900,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ color: ORANGE, fontSize: 11 }}>Open</span>
                  </button>
                ))}
              </div>

              {coachOpen && (
                <div style={{ marginTop: 10 }}>
                  <CoachSuggestionsPanel
                    open={true}
                    embedded={true}
                    onClose={() => setCoachOpen(false)}
                    context={coachContext}
                    jdText={cleanJdText}
                    resumeData={resumeData}
                    missing={{
                      high: [...missingTitleKeywords, ...missingHardSkills],
                      tools: missingTools,
                      edu: missingCerts,
                      soft: missingSoftSkills,
                      lang: missingLanguages,
                    }}
                    onAddSkill={onAddSkill}
                    onAddSummary={onAddSummary}
                    onAddBullet={onAddBullet}
                    {...{ onReady: (api: any) => { coachRunRef.current = api; } } as any}
                  />
                </div>
              )}
            </div>
          </div>

          {activePanel === 'signal' && (() => {
            // Run deterministic analysis — zero AI tokens, instant
            const analysis = (() => {
              try {
                const signals = [
                  'ownership and accountability',
                  'delivery and execution',
                  'people leadership and team management',
                  'advisory and client service delivery',
                  'stakeholder and executive engagement',
                  'process and methodology development',
                  'domain knowledge and qualification',
                  'education and credential credibility',
                ];

                // Client-side evidence classification
                const resumeText = [
                  summary || '',
                  (skills || []).join(' '),
                  (experiences || []).map((e: any) => `${e.title || ''} ${e.company || ''} ${(e.bullets || []).join(' ')}`).join(' '),
                  (education || []).map((e: any) => `${e.degree || ''} ${e.school || ''} ${e.field || ''}`).join(' '),
                ].join(' ').toLowerCase();

                const classified = signals.map(signal => {
                  const normalizedSignal = signal.toLowerCase();
                  // Direct match
                  if (resumeText.includes(normalizedSignal)) {
                    return { signal, status: 'direct', confidence: 'high' };
                  }
                  // Pattern matching — simplified client-side version
                  const patternGroups: Record<string, string[]> = {
                    'ownership and accountability': ['owned','responsible','accountable','managed','oversaw','led','directed','drove','built','launched','founded'],
                    'delivery and execution': ['delivered','executed','implemented','launched','shipped','completed','produced','operated','maintained','performed'],
                    'people leadership and team management': ['managed a team','direct reports','supervised','coached','mentored','hired','staffing','team lead','headcount','workforce'],
                    'advisory and client service delivery': ['advised','consulted','client','customer','service','supported','guided','engagement','relationship','account'],
                    'stakeholder and executive engagement': ['stakeholder','executive','senior leadership','cross-functional','collaborated','aligned','presented','briefed','reported to'],
                    'process and methodology development': ['methodology','process','procedure','framework','playbook','standard','protocol','compliance','workflow','audit'],
                    'domain knowledge and qualification': ['expertise','specialist','certified','certification','licensed','degree','trained','background in','years of experience'],
                    'education and credential credibility': ['bachelor','master','mba','phd','degree','certified','certification','university','college','credential'],
                  };
                  const patterns = patternGroups[normalizedSignal] || [];
                  const matched = patterns.filter(p => resumeText.includes(p.toLowerCase()));
                  if (matched.length >= 3) return { signal, status: 'adjacent_technical', confidence: 'high' };
                  if (matched.length >= 1) return { signal, status: 'adjacent', confidence: 'medium' };
                  return { signal, status: 'missing', confidence: 'high' };
                });

                const direct = classified.filter(s => s.status === 'direct' || s.status === 'adjacent_technical');
                const adjacent = classified.filter(s => s.status === 'adjacent');
                const missing = classified.filter(s => s.status === 'missing');

                const score = direct.length;
                const verdict = score >= 6 ? 'Low Hiring Risk' : score >= 4 ? 'Moderate Hiring Risk' : score >= 2 ? 'Elevated Hiring Risk' : 'High Hiring Risk';
                const verdictColor = score >= 6 ? '#16A34A' : score >= 4 ? '#0EA5E9' : score >= 2 ? '#D97706' : '#DC2626';

                return { classified, direct, adjacent, missing, verdict, verdictColor, score };
              } catch (e) {
                return null;
              }
            })();

            const statusConfig: Record<string, { label: string; riskLabel: string; color: string; bg: string; icon: string }> = {
              direct:            { label: 'Proven',          riskLabel: 'Low Risk',    color: '#15803D', bg: 'rgba(22,163,74,0.10)',  icon: '✓' },
              adjacent_technical:{ label: 'Strong Evidence', riskLabel: 'Low-Med Risk',color: '#0369A1', bg: 'rgba(14,165,233,0.10)', icon: '~' },
              adjacent:          { label: 'Partial Proof',   riskLabel: 'Medium Risk', color: '#D97706', bg: 'rgba(234,179,8,0.10)',  icon: '~' },
              missing:           { label: 'No Proof',        riskLabel: 'High Risk',   color: '#DC2626', bg: 'rgba(220,38,38,0.08)', icon: '✗' },
            };

            const sectionForSignal = (signal: string) => {
              const s = signal.toLowerCase();
              if (s.includes('education') || s.includes('credential')) return 'education' as const;
              if (s.includes('people') || s.includes('leadership')) return 'experience' as const;
              if (s.includes('domain') || s.includes('qualification')) return 'skills' as const;
              if (s.includes('advisory') || s.includes('client')) return 'experience' as const;
              return 'experience' as const;
            };

            const riskForStatus = (status: string) => {
              if (status === 'direct') return { label: 'Low hiring risk — recruiter sees clear proof', color: '#15803D' };
              if (status === 'adjacent_technical') return { label: 'Low-Medium risk — strong evidence, framing helps', color: '#0369A1' };
              if (status === 'adjacent') return { label: 'Medium hiring risk — partial proof, needs positioning', color: '#D97706' };
              return { label: 'High hiring risk — no visible proof, coach recommended', color: '#DC2626' };
            };

            return (
              <div style={{ padding: 11, borderRadius: 14, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                {/* Header */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 950, color: '#263238', marginBottom: 2 }}>
                    Signal Report
                  </div>
                  <div style={{ fontSize: 11, color: '#607D8B', lineHeight: 1.4 }}>
                    Evidence-based diagnostic. No keywords — alignment facts with recruiter-grade reasoning.
                  </div>
                </div>

                {analysis ? (
                  <>
                    {/* Readiness verdict */}
                    <div style={{ padding: '10px 12px', borderRadius: 10, marginBottom: 10,
                      background: `${analysis.verdictColor}14`, border: `1px solid ${analysis.verdictColor}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 13, color: analysis.verdictColor }}>
                          {analysis.verdict} Position
                        </div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                          {analysis.direct.length} low risk · {analysis.adjacent.length} medium risk · {analysis.missing.length} high risk
                        </div>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: analysis.verdictColor }}>
                        {analysis.score}/8
                      </div>
                    </div>

                    {/* Signal bands */}
                    <div style={{ display: 'grid', gap: 6 }}>
                      {analysis.classified.map((sig: any) => {
                        const cfg = statusConfig[sig.status] || statusConfig.missing;
                        const risk = riskForStatus(sig.status);
                        const targetSection = sectionForSignal(sig.signal);
                        return (
                          <div key={sig.signal} style={{ borderRadius: 9, border: `1px solid ${cfg.color}33`,
                            background: cfg.bg, padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: 12, fontWeight: 900, color: cfg.color, flexShrink: 0 }}>
                                  {cfg.icon}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#1E293B', lineHeight: 1.3 }}>
                                  {sig.signal.replace(/\w/g, (c: string) => c.toUpperCase())}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                                <span style={{ fontSize: 9, fontWeight: 800, color: cfg.color,
                                  background: 'rgba(255,255,255,0.70)', padding: '2px 7px', borderRadius: 999,
                                  whiteSpace: 'nowrap' }}>
                                  {cfg.label}
                                </span>
                                <span style={{ fontSize: 9, fontWeight: 900,
                                  color: cfg.color === '#15803D' ? '#15803D' : cfg.color === '#0369A1' ? '#0369A1' : cfg.color === '#D97706' ? '#D97706' : '#DC2626',
                                  background: cfg.bg, padding: '2px 7px', borderRadius: 999,
                                  whiteSpace: 'nowrap', border: `1px solid ${cfg.color}33` }}>
                                  {cfg.riskLabel}
                                </span>
                              </div>
                            </div>
                            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <span style={{ fontSize: 10, color: risk.color, fontWeight: 700 }}>
                                {risk.label}
                              </span>
                              {(sig.status === 'missing' || sig.status === 'adjacent') && (
                                <button
                                  type="button"
                                  onClick={() => { openCoach(targetSection, sig.signal); setActivePanel('coach'); }}
                                  style={{ fontSize: 9, fontWeight: 900, color: ORANGE,
                                    background: 'rgba(255,112,67,0.10)', border: '1px solid rgba(255,112,67,0.25)',
                                    borderRadius: 999, padding: '2px 8px', cursor: 'pointer', flexShrink: 0 }}>
                                  Coach →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: '#F8FAFC',
                      border: '1px solid #E2E8F0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {[
                        { icon: '✓', label: 'Proven — low hiring risk', color: '#15803D' },
                        { icon: '~', label: 'Partial — medium risk, needs framing', color: '#D97706' },
                        { icon: '✗', label: 'Missing — high risk, act now', color: '#DC2626' },
                      ].map(l => (
                        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: l.color }}>{l.icon}</span>
                          <span style={{ fontSize: 9, color: '#64748B' }}>{l.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA if gaps exist */}
                    {(analysis.missing.length > 0 || analysis.adjacent.length > 0) && (
                      <button type="button" onClick={() => setActivePanel('coach')}
                        style={{ marginTop: 10, width: '100%', padding: '9px 14px', borderRadius: 999,
                          border: 'none', background: ORANGE, color: 'white', fontWeight: 950,
                          fontSize: 12, cursor: 'pointer' }}>
                        {analysis.missing.length > 0
                          ? `Reduce ${analysis.missing.length} high-risk gap${analysis.missing.length > 1 ? 's' : ''} with the Coach →`
                          : `Strengthen ${analysis.adjacent.length} medium-risk signal${analysis.adjacent.length > 1 ? 's' : ''} with the Coach →`}
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: '#94A3B8', padding: '12px 0' }}>
                    Could not generate signal report. Make sure a job description is loaded.
                  </div>
                )}
              </div>
            );
          })()}

          {activePanel === 'keywords' && (
            <div style={{ padding: 11, borderRadius: 14, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <div style={{ fontSize: 14, fontWeight: 950, color: '#263238', marginBottom: 4 }}>
                Keyword Breakdown
              </div>
              <div style={{ fontSize: 12, color: '#607D8B', lineHeight: 1.4, marginBottom: 10 }}>
                Real terms from this JD — matched against your resume. Click any missing term to get coaching.
              </div>

              {buckets.length === 0 ? (
                <div style={{ fontSize: 12, color: '#388E3C', padding: '10px 0' }}>
                  No keyword categories detected in this JD. Try a more detailed job description.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {buckets.map((b) => {
                    const percent = b.points ?? 0;
                    const barCol = percent >= 80 ? '#2E7D32' : percent >= 50 ? '#F59E0B' : '#C62828';
                    return (
                      <div key={b.key} style={{ borderRadius: 10, border: '1px solid #ECEFF1', background: '#FAFAFA', padding: '9px 10px' }}>
                        {/* Row header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: '#37474F' }}>{b.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 900, color: barCol }}>
                            {b.matched}/{b.total}
                            <span style={{ fontSize: 10, color: '#90A4AE', marginLeft: 4 }}>({percent}%)</span>
                          </span>
                        </div>
                        {/* Bar */}
                        <div style={{ height: 6, borderRadius: 999, background: '#ECEFF1', overflow: 'hidden', marginBottom: 6 }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: barCol, transition: 'width 0.3s ease' }} />
                        </div>
                        {/* Missing chips — clickable, fire coach */}
                        {b.missing && b.missing.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                            {b.missing.slice(0, 8).map((kw) => (
                              <button
                                key={kw}
                                type="button"
                                onClick={() => openCoach(b.section, kw)}
                                style={{
                                  border: '1px solid rgba(255,112,67,0.28)',
                                  background: 'rgba(255,112,67,0.08)',
                                  color: '#C2410C',
                                  cursor: 'pointer',
                                  padding: '3px 8px',
                                  borderRadius: 999,
                                  fontSize: 10,
                                  fontWeight: 900,
                                }}
                              >
                                + {kw}
                              </button>
                            ))}
                            {b.missing.length > 8 && (
                              <span style={{ fontSize: 10, color: '#90A4AE', alignSelf: 'center' }}>
                                +{b.missing.length - 8} more
                              </span>
                            )}
                          </div>
                        )}
                        {b.missing && b.missing.length === 0 && b.total > 0 && (
                          <div style={{ fontSize: 10, color: '#388E3C', fontWeight: 700 }}>✓ All matched</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
