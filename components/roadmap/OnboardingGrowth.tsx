// components/roadmap/OnboardingGrowth.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2, Download, Calendar, UserRound, Printer } from 'lucide-react';

interface Resume {
  id: string;
  content: string;
  createdAt: string;
  name?: string;
  title?: string;
  isPrimary?: boolean;
}

type PlanBlock = {
  objectives: string[];
  actions: string[];
  metrics: string[];
  quickWins?: string[];
  risks?: string[];
  presentation?: string;
};

type CareerRoadmapPlan = {
  meta: {
    generatedAt: string;
    candidate: string;
    headline: string;
  };
  day30: PlanBlock;
  day60: PlanBlock;
  day90: PlanBlock;
  growthRecommendations: string[];
  skillsFocus: string[];
};

type RoadmapDirection = 'compare' | 'grow' | 'pivot';

async function safeReadJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function replaceAllSafe(s: string, find: string, repl: string) {
  return s.split(find).join(repl);
}

function escapeHtml(input: any) {
  let s = String(input ?? '');
  s = replaceAllSafe(s, '&', '&amp;');
  s = replaceAllSafe(s, '<', '&lt;');
  s = replaceAllSafe(s, '>', '&gt;');
  s = replaceAllSafe(s, '"', '&quot;');
  s = replaceAllSafe(s, "'", '&#039;');
  return s;
}

function normalizeList(items: any): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((x) => String(x ?? '').trim()).filter(Boolean);
}

function blockToHtml(label: string, items: string[]) {
  const list = normalizeList(items);
  if (!list.length) {
    return `<div class="block"><div class="block-title">${escapeHtml(label)}</div><div class="muted">—</div></div>`;
  }
  return `
    <div class="block">
      <div class="block-title">${escapeHtml(label)}</div>
      <ul>
        ${list.map((it) => `<li>${escapeHtml(it)}</li>`).join('')}
      </ul>
    </div>
  `;
}

function sectionToHtml(title: string, data: PlanBlock) {
  if (!data) return '';
  const objectives = normalizeList(data.objectives);
  const actions = normalizeList(data.actions);
  const metrics = normalizeList(data.metrics);
  const quickWins = normalizeList(data.quickWins);
  const risks = normalizeList(data.risks);
  const presentation = String(data.presentation ?? '').trim();

  return `
    <section class="section">
      <h2 class="section-title">${escapeHtml(title)}</h2>

      <div class="grid">
        ${blockToHtml('Objectives', objectives)}
        ${blockToHtml('Actions', actions)}
      </div>

      <div class="grid">
        ${blockToHtml('Metrics', metrics)}
        ${blockToHtml('Quick Wins', quickWins)}
      </div>

      <div class="single">
        ${blockToHtml('Risks', risks)}
      </div>

      ${
        presentation
          ? `<div class="presentation"><div class="block-title">Presentation</div><div>${escapeHtml(
              presentation
            )}</div></div>`
          : ''
      }
    </section>
  `;
}

function simpleListToHtml(title: string, items: string[]) {
  const list = normalizeList(items);
  return `
    <section class="section">
      <h2 class="section-title">${escapeHtml(title)}</h2>
      ${
        list.length
          ? `<ul>${list.map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ul>`
          : `<div class="muted">—</div>`
      }
    </section>
  `;
}

function buildPrintHtml(opts: {
  title: string;
  candidate: string;
  headline: string;
  generatedAt: string;
  plan: CareerRoadmapPlan;
}) {
  const { title, candidate, headline, generatedAt, plan } = opts;

  const dt = generatedAt ? new Date(generatedAt) : null;
  const generated = dt && !Number.isNaN(dt.getTime()) ? dt.toLocaleString() : '—';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} — ${escapeHtml(candidate)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --text: #111827;
      --muted: #6b7280;
      --border: #e5e7eb;
      --bg: #ffffff;
      --accent: #FF7043;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      line-height: 1.45;
    }
    .wrap { max-width: 900px; margin: 0 auto; }
    .top {
      border-bottom: 1px solid var(--border);
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .h1 {
      font-size: 28px;
      font-weight: 800;
      margin: 0 0 6px 0;
      color: var(--accent);
    }
    .meta {
      color: var(--muted);
      font-size: 13px;
    }
    .candidate {
      margin-top: 10px;
      font-weight: 700;
      font-size: 14px;
    }
    .headline {
      margin-top: 2px;
      color: var(--muted);
      font-size: 13px;
    }
    .section {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      margin: 14px 0;
      page-break-inside: avoid;
    }
    .section-title {
      margin: 0 0 10px 0;
      font-size: 18px;
      font-weight: 800;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 10px;
    }
    .single { margin-top: 10px; }
    .block-title {
      font-weight: 800;
      font-size: 13px;
      margin-bottom: 6px;
    }
    ul {
      margin: 0;
      padding-left: 18px;
    }
    li { margin: 4px 0; }
    .muted { color: var(--muted); }
    .presentation {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid var(--border);
      color: var(--text);
    }
    .note {
      margin-top: 14px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: #f9fafb;
      color: #374151;
      font-size: 12.5px;
    }
    @media print {
      body { padding: 0; }
      .section { border-color: #d1d5db; }
    }
    @page { margin: 12mm; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div class="h1">${escapeHtml(title)}</div>
      <div class="meta">Generated: ${escapeHtml(generated)}</div>
      <div class="candidate">${escapeHtml(candidate)}</div>
      ${headline ? `<div class="headline">${escapeHtml(headline)}</div>` : ''}
    </div>

    ${sectionToHtml('First 30 Days', plan.day30)}
    ${sectionToHtml('Days 31–60', plan.day60)}
    ${sectionToHtml('Days 61–90', plan.day90)}

    ${simpleListToHtml('Growth Recommendations', plan.growthRecommendations)}
    ${simpleListToHtml('Skills Focus', plan.skillsFocus)}

    <div class="note">
      <strong>Guidance note:</strong> This tool provides structured, AI-assisted guidance based on your profile and resume.
      It is designed to support your thinking and preparation, not to replace live coaching or mentorship.
      We encourage you to work with a coach or mentor through Spotlight to refine your strategy, positioning, and next steps.
    </div>
  </div>
</body>
</html>`;
}

export default function OnboardingGrowth() {
  const router = useRouter();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<string>('');

  const [direction, setDirection] = useState<RoadmapDirection>('compare');
  const [pivotTarget, setPivotTarget] = useState<string>('');

  const [plan, setPlan] = useState<CareerRoadmapPlan | null>(null);

  const [pdfUrl, setPdfUrl] = useState<string>(''); // optional server PDF link if you add later
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path: string) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  useEffect(() => {
    let active = true;

    const loadResumes = async () => {
      setLoadingResumes(true);
      setError('');

      try {
        const res = await fetch('/api/resume/list', { method: 'GET' });

        if (!res.ok) {
          let msg = `Failed to load resumes (${res.status})`;
          const maybeJson = await safeReadJson(res);
          if (maybeJson?.error) msg = maybeJson.error;
          throw new Error(msg);
        }

        const data = await safeReadJson(res);
        const list = Array.isArray(data?.resumes) ? data.resumes : [];

        if (!active) return;

        setResumes(list);

        const primary = list.find((r: any) => r?.isPrimary);
        if (primary?.id) setSelectedResume(String(primary.id));
        else if (list?.[0]?.id) setSelectedResume(String(list[0].id));
      } catch (err: any) {
        if (!active) return;
        setResumes([]);
        setSelectedResume('');
        setError(err?.message || 'Failed to load resumes');
      } finally {
        if (active) setLoadingResumes(false);
      }
    };

    loadResumes();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (direction !== 'pivot') {
      setPivotTarget('');
    }
  }, [direction]);

  const generateRoadmap = async () => {
    if (!selectedResume) {
      setError('Please select a resume');
      return;
    }

    if (direction === 'pivot') {
      const t = String(pivotTarget || '').trim();
      if (!t) {
        setError('What do you want to pivot into? Add a target role or direction.');
        return;
      }
    }

    setLoading(true);
    setError('');
    setPlan(null);
    setPdfUrl('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const body: any = { resumeId: selectedResume, direction };
      if (direction === 'pivot') {
        body.pivotTarget = String(pivotTarget || '').trim();
      }

      const res = await fetch('/api/roadmap/onboarding-growth/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await safeReadJson(res);

      if (!res.ok) {
        const msg = data?.error || `Failed to generate roadmap (${res.status})`;
        throw new Error(msg);
      }

      if (!data?.plan) throw new Error('Roadmap response missing plan');

      setPlan(data.plan as CareerRoadmapPlan);
      setPdfUrl(String(data?.pdfUrl || ''));
      setHasGenerated(true);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Roadmap generation timed out. Please try again.');
      } else {
        setError(err?.message || 'Something went wrong');
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handlePrintToPdf = () => {
    if (!plan) return;

    try {
      const title =
        direction === 'compare'
          ? 'Your Compare Plan'
          : direction === 'pivot'
          ? 'Your Pivot Plan'
          : 'Your Stay-the-Course Plan';

      const html = buildPrintHtml({
        title,
        candidate: plan?.meta?.candidate || 'Candidate',
        headline: plan?.meta?.headline || '',
        generatedAt: plan?.meta?.generatedAt || '',
        plan,
      });

      const w = window.open('', '_blank', 'noopener,noreferrer');
      if (!w) {
        setError('Popup blocked. Please allow popups for this site, then try Print / Save as PDF again.');
        return;
      }

      w.document.open();
      w.document.write(html);
      w.document.close();

      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {
          // ignore
        }
      }, 250);
    } catch {
      setError('Unable to open print view. Please try again.');
    }
  };

  if (!hasGenerated) {
    const noResumes = !loadingResumes && resumes.length === 0;

    const buttonLabel =
      direction === 'compare'
        ? 'Generate My Compare Plan'
        : direction === 'pivot'
        ? 'Generate My Pivot Plan'
        : 'Generate My Stay-the-Course Plan';

    const loadingLabel =
      direction === 'compare'
        ? 'Generating your compare plan...'
        : direction === 'pivot'
        ? 'Generating your pivot plan...'
        : 'Generating your stay-the-course plan...';

    return (
      <div>
        <h2 className="text-4xl font-bold text-[#FF7043] mb-6 mt-0">
          {direction === 'compare'
            ? 'Compare: Stay vs Pivot'
            : direction === 'pivot'
            ? 'Pivot Plan'
            : 'Stay the Course Plan'}
        </h2>

        <p className="text-lg text-gray-700 mb-2">
          {direction === 'compare'
            ? 'See how staying the course compares to pivot options, including gaps and next steps.'
            : direction === 'pivot'
            ? 'Tell us what you want to pivot into. We’ll compare it to your current resume and show what’s missing.'
            : 'You like your current direction. Let’s increase your market value and map the next level.'}
        </p>

        <p className="text-sm text-gray-600 mb-8">
          Includes 30/60/90 priorities, skills to strengthen, and clear next steps based on your selected mode.
        </p>

        {loadingResumes ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-700 font-medium">Loading your resumes…</p>
          </div>
        ) : noResumes ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
            <p className="text-orange-800 font-medium">No resumes found on your account.</p>
            <p className="text-sm text-orange-800 mt-2">
              If you believe this is wrong, make sure you’re logged in with the same account that created them.
            </p>
            <button
              onClick={() => router.push(withChrome('/resume/create'))}
              className="mt-4 bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
            >
              Open Resume Builder
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label htmlFor="resume" className="block text-lg font-medium text-gray-800 mb-3">
                Select Your Resume
              </label>
              <select
                id="resume"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7043] focus:border-transparent"
              >
                <option value="">Choose a resume...</option>
                {resumes.map((r) => {
                  const label =
                    r?.name || r?.title || `Resume from ${new Date(r.createdAt).toLocaleDateString()}`;
                  return (
                    <option key={r.id} value={r.id}>
                      {label}
                      {r?.isPrimary ? ' (Primary)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div>
                <div className="text-lg font-medium text-gray-800">Which path are you considering?</div>
                <div className="text-sm text-gray-600 mt-1">
                  Not sure compares both. Pivot asks where you want to go. Stay focuses on increasing market value.
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="direction"
                    value="compare"
                    checked={direction === 'compare'}
                    onChange={() => setDirection('compare')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-gray-800">Not sure yet</div>
                    <div className="text-sm text-gray-600">
                      Compare staying the course vs pivot options, and show what you’re missing for each.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="direction"
                    value="grow"
                    checked={direction === 'grow'}
                    onChange={() => setDirection('grow')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-gray-800">Stay the course</div>
                    <div className="text-sm text-gray-600">
                      You like where you are. Increase market value and map where to go from here.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="direction"
                    value="pivot"
                    checked={direction === 'pivot'}
                    onChange={() => setDirection('pivot')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-gray-800">Pivot</div>
                    <div className="text-sm text-gray-600">
                      You want to change direction. Tell us where, and we’ll compare it to your current resume.
                    </div>
                  </div>
                </label>
              </div>

              {direction === 'pivot' ? (
                <div className="mt-5">
                  <label htmlFor="pivotTarget" className="block text-sm font-semibold text-gray-800 mb-2">
                    What do you want to pivot into?
                  </label>
                  <input
                    id="pivotTarget"
                    value={pivotTarget}
                    onChange={(e) => setPivotTarget(e.target.value)}
                    placeholder="Example: Product Manager, Customer Success Director, Recruiter Ops, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7043] focus:border-transparent"
                  />
                  <div className="text-xs text-gray-600 mt-2">
                    This helps the plan compare your current resume to the target role and highlight gaps.
                  </div>
                </div>
              ) : null}
            </div>

            {error && <p className="text-red-600 font-medium">{error}</p>}

            {loading ? (
              <p className="text-sm text-gray-600 text-center">Working… this can take up to ~45 seconds.</p>
            ) : null}

            <button
              onClick={generateRoadmap}
              disabled={loading || !selectedResume}
              className="w-full bg-[#FF7043] text-white text-xl font-bold py-5 rounded-lg hover:bg-[#F4511E] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={28} />
                  {loadingLabel}
                </>
              ) : (
                buttonLabel
              )}
            </button>

            <p className="text-sm text-gray-600 text-center">
              Free users: 1 lifetime roadmap • Pro users: 1 per month
            </p>
          </div>
        )}
      </div>
    );
  }

  const afterTitle =
    direction === 'compare'
      ? 'Your Compare Plan'
      : direction === 'pivot'
      ? 'Your Pivot Plan'
      : 'Your Stay-the-Course Plan';

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-bold text-[#FF7043] mt-0">{afterTitle}</h2>
          {plan?.meta?.headline ? <p className="text-gray-600 mt-2">{plan.meta.headline}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {pdfUrl ? (
            <a
              href={pdfUrl}
              download
              className="bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Download size={20} />
              Download PDF
            </a>
          ) : null}

          <button
            onClick={handlePrintToPdf}
            className="bg-white border border-gray-300 text-gray-800 px-5 py-3 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <Printer size={20} />
            Print / Save as PDF
          </button>

          <button
            onClick={() => router.push(withChrome('/hearth/spotlights'))}
            className="bg-[#FF7043] text-white px-5 py-3 rounded-lg hover:bg-[#F4511E] transition flex items-center gap-2"
          >
            <UserRound size={20} />
            Find a Coach in Spotlight
          </button>

          <button
            onClick={() => router.push(withChrome('/calendar'))}
            className="bg-white border border-gray-300 text-gray-800 px-5 py-3 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <Calendar size={20} />
            Open Calendar
          </button>
        </div>
      </div>

      {error ? <p className="text-red-600 font-medium mb-4">{error}</p> : null}

      <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10">
        {plan ? (
          <div className="space-y-8">
            <MetaBlock plan={plan} />
            <PlanSection title="First 30 Days" data={plan.day30} />
            <PlanSection title="Days 31–60" data={plan.day60} />
            <PlanSection title="Days 61–90" data={plan.day90} />
            <SimpleListCard title="Growth Recommendations" items={plan.growthRecommendations} />
            <SimpleListCard title="Skills Focus" items={plan.skillsFocus} />

            <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <strong>Guidance note:</strong> This tool provides structured, AI-assisted guidance based on your
              profile and resume. It is designed to support your thinking and preparation, not to replace live
              coaching or mentorship. We encourage you to work with a coach or mentor through Spotlight to
              refine your strategy, positioning, and next steps.
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-700">No plan data found.</div>
        )}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={() => router.push(withChrome('/roadmap'))}
          className="text-[#FF7043] font-medium underline hover:no-underline"
        >
          Back to Toolkit
        </button>
      </div>
    </div>
  );
}

function MetaBlock({ plan }: { plan: CareerRoadmapPlan }) {
  const dt = plan?.meta?.generatedAt ? new Date(plan.meta.generatedAt) : null;
  return (
    <div className="border-b border-gray-100 pb-5">
      <div className="text-gray-600">
        Generated: {dt && !Number.isNaN(dt.getTime()) ? dt.toLocaleString() : '—'}
      </div>
      <div className="font-semibold mt-2">{plan?.meta?.candidate || '—'}</div>
    </div>
  );
}

function PlanSection({ title, data }: { title: string; data: PlanBlock }) {
  if (!data) return null;

  return (
    <section className="border border-gray-100 rounded-xl p-5">
      <h3 className="text-xl font-bold mb-4">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Block label="Objectives" items={data.objectives} />
        <Block label="Actions" items={data.actions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <Block label="Metrics" items={data.metrics} />
        <Block label="Quick Wins" items={data.quickWins || []} emptyDash />
      </div>

      <div className="mt-5">
        <Block label="Risks" items={data.risks || []} emptyDash />
      </div>

      {data.presentation ? (
        <div className="mt-5">
          <div className="font-semibold mb-2">Presentation</div>
          <p className="text-gray-700">{data.presentation}</p>
        </div>
      ) : null}
    </section>
  );
}

function Block({
  label,
  items,
  emptyDash,
}: {
  label: string;
  items: string[];
  emptyDash?: boolean;
}) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return (
    <div>
      <div className="font-semibold mb-2">{label}</div>
      {list.length === 0 ? (
        <p className="text-gray-600">{emptyDash ? '—' : 'None yet'}</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          {list.map((it, i) => (
            <li key={`${label}-${i}`}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SimpleListCard({ title, items }: { title: string; items: string[] }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return (
    <section className="border border-gray-100 rounded-xl p-5">
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      {list.length === 0 ? (
        <p className="text-gray-600">—</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          {list.map((it, i) => (
            <li key={`${title}-${i}`}>{it}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
