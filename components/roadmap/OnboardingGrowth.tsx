// components/roadmap/OnboardingGrowth.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import { Loader2, Download, Calendar } from 'lucide-react';

interface Resume {
  id: string;
  content: string;
  createdAt: string;
}

export default function OnboardingGrowth() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<string>('');
  const [roadmap, setRoadmap] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path: string) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // Load user's resumes on mount
  useEffect(() => {
    const loadResumes = async () => {
      try {
        const res = await fetch('/api/resumes');
        const data = await res.json();
        setResumes(data.resumes || []);
      } catch (err) {
        console.error('Failed to load resumes', err);
      }
    };

    loadResumes();
  }, []);

  const generateRoadmap = async () => {
    if (!selectedResume) {
      setError('Please select a resume');
      return;
    }

    setLoading(true);
    setError('');
    setRoadmap('');

    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResume }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to generate roadmap');

      setRoadmap(data.roadmap);
      setPdfUrl(data.pdfUrl);
      setHasGenerated(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // BEFORE GENERATION
  if (!hasGenerated) {
    return (
      <div>
        <h2 className="text-4xl font-bold text-[#FF7043] mb-6 mt-0">
          Plan Growth &amp; Pivots
        </h2>
        <p className="text-lg text-gray-700 mb-8">
          Turn your resume into a 12-month growth map — including 30/60/90 day goals,
          skills to sharpen, promotion paths, and options for pivoting into your next
          role.
        </p>

        {resumes.length === 0 ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
            <p className="text-orange-800 font-medium">
              No resumes found. Please create one first.
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
              <label
                htmlFor="resume"
                className="block text-lg font-medium text-gray-800 mb-3"
              >
                Select Your Resume
              </label>
              <select
                id="resume"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7043] focus:border-transparent"
              >
                <option value="">Choose a resume...</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    Resume from {new Date(r.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-red-600 font-medium">{error}</p>}

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

  // components/roadmap/OnboardingGrowth.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import { Loader2, Download, Calendar } from 'lucide-react';

interface Resume {
  id: string;
  content: string;
  createdAt: string;
}

export default function OnboardingGrowth() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<string>('');
  const [roadmap, setRoadmap] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path: string) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // Load user's resumes on mount
  useEffect(() => {
    const loadResumes = async () => {
      try {
        const res = await fetch('/api/resumes');
        const data = await res.json();
        setResumes(data.resumes || []);
      } catch (err) {
        console.error('Failed to load resumes', err);
      }
    };

    loadResumes();
  }, []);

  const generateRoadmap = async () => {
    if (!selectedResume) {
      setError('Please select a resume');
      return;
    }

    setLoading(true);
    setError('');
    setRoadmap('');

    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResume }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to generate roadmap');

      setRoadmap(data.roadmap);
      setPdfUrl(data.pdfUrl);
      setHasGenerated(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // BEFORE GENERATION
  if (!hasGenerated) {
    return (
      <div>
        <h2 className="text-4xl font-bold text-[#FF7043] mb-6 mt-0">
          Plan Growth &amp; Pivots
        </h2>
        <p className="text-lg text-gray-700 mb-8">
          Turn your resume into a 12-month growth map — including 30/60/90 day goals,
          skills to sharpen, promotion paths, and options for pivoting into your next
          role.
        </p>

        {resumes.length === 0 ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
            <p className="text-orange-800 font-medium">
              No resumes found. Please create one first.
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
              <label
                htmlFor="resume"
                className="block text-lg font-medium text-gray-800 mb-3"
              >
                Select Your Resume
              </label>
              <select
                id="resume"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7043] focus:border-transparent"
              >
                <option value="">Choose a resume...</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    Resume from {new Date(r.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-red-600 font-medium">{error}</p>}

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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold text-[#FF7043] mt-0">
          Your 12-Month Growth Plan
        </h2>
        <div className="flex gap-4">
          {pdfUrl && (
            <a
              href={pdfUrl}
              download
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Download size={20} />
              Download PDF
            </a>
          )}
          <a
            href="https://calendly.com/your-coach-link"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FF7043] text-white px-6 py-3 rounded-lg hover:bg-[#F4511E] transition flex items-center gap-2"
          >
            <Calendar size={20} />
            Book Coach Review
          </a>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-10 prose prose-lg max-w-none">
        <ReactMarkdown>{roadmap}</ReactMarkdown>
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={() => router.push('/roadmap')}
          className="text-[#FF7043] font-medium underline hover:no-underline"
        >
          Back to Toolkit
        </button>
      </div>
    </div>
  );
}
