// components/roadmap/OnboardingGrowth.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2, Download, Calendar, UserRound } from 'lucide-react';

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

async function safeReadJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function OnboardingGrowth() {
  const router = useRouter();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<string>('');

  const [plan, setPlan] = useState<CareerRoadmapPlan | null>(null);

  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path: string) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // Load user's resumes on mount
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

  const generateRoadmap = async () => {
    if (!selectedResume) {
      setError('Please select a resume');
      return;
    }

    setLoading(true);
    setError('');
    setPlan(null);
    setPdfUrl('');

    // ✅ prevents “spin forever”
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s

    try {
      // IMPORTANT: matches /pages/api/roadmap/onboarding-growth/generate.js
      const res = await fetch('/api/roadmap/onboarding-growth/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResume }),
        signal: controller.signal,
      });

      const data = await safeReadJson(res);

      if (!res.ok) {
        const msg = data?.error || `Failed to generate roadmap (${res.status})`;
        throw new Error(msg);
      }

      // API returns: { plan: parsed }
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

  // BEFORE GENERATION
  if (!hasGenerated) {
    const noResumes = !loadingResumes && resumes.length === 0;

    return (
      <div>
        <h2 className="text-4xl font-bold text-[#FF7043] mb-6 mt-0">
          Plan Growth &amp; Pivots
        </h2>
        <p className="text-lg text-gray-700 mb-8">
          Turn your resume into a 12-month growth map, including 30/60/90 day goals,
          skills to sharpen, promotion paths, and options for pivoting into your next role.
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

            {error && <p className="text-red-600 font-medium">{error}</p>}

            {loading ? (
              <p className="text-sm text-gray-600 text-center">
                Working… this can take up to ~45 seconds for longer resumes.
              </p>
            ) : null}

            <button
              onClick={generateRoadmap}
              disabled={loading || !selectedResume}
              className="w-full bg-[#FF7043] text-white text-xl font-bold py-5 rounded-lg hover:bg-[#F4511E] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={28} />
                  Generating your 12-month growth plan...
                </>
              ) : (
                'Generate My Growth Plan'
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

  // AFTER GENERATION
  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-bold text-[#FF7043] mt-0">Your 12-Month Growth Plan</h2>
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

      {/* Guidance disclaimer */}
      <div
        className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4"
      >
        <strong>Guidance note:</strong> This roadmap provides structured, AI-assisted
        guidance based on the resume you selected. It is not a substitute for a live
        coach or mentor. For personalized, human guidance, visit Spotlight to find a
        coach or mentor and review this plan together.
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
