'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

export type AIATSScorerClientProps = {
  jdText: string;
  resumeData: any;

  /** Called when a new score is available (or null on failure/reset) */
  onScore?: (score: number | null) => void;

  /** Alternate name used by AtsDepthPanel */
  onScoreChange?: (score: number | null) => void;

  /**
   * NEW: lets the parent trigger a scan (so your "Run AI Scan" button works)
   * We pass you a function you can call anytime to run scan.
   */
  onRegisterScan?: (runScan: () => void) => void;

  /**
   * NEW: compact mode so we don't render duplicate "AI ATS Score / Coach" cards.
   * In AtsDepthPanel we already render the two top action cards.
   */
  compact?: boolean;
};

export default function AIATSScorerClient({
  jdText,
  resumeData,
  onScore,
  onScoreChange,
  onRegisterScan,
  compact = true,
}: AIATSScorerClientProps) {
  const { data: session } = useSession();

  const [score, setScore] = useState<number | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);

  const hasJD = !!jdText?.trim();

  useEffect(() => {
    setScore(null);
    setTips([]);
    setError(null);
    setUpgrade(false);
  }, [jdText]);

  const role = (session?.user?.role as string) || 'USER';
  const helperText = useMemo(() => {
    if (role === 'COACH') return 'Coach your client with AI insights.';
    if (role === 'RECRUITER') return 'Evaluate hiring fit with AI.';
    return 'Improve your resume with AI-powered scoring.';
  }, [role]);

  const normalizedTips: string[] = Array.isArray(tips)
    ? tips.filter((t) => typeof t === 'string' && t.trim().length > 0)
    : [];

  const runScan = async () => {
    if (!hasJD || loading) return;

    setLoading(true);
    setUpgrade(false);
    setError(null);

    try {
      const response = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jdText, resume: resumeData }),
      });

      // Handle non-JSON responses safely
      const rawText = await response.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const msg = data?.error || `AI scan failed (${response.status}).`;
        throw new Error(msg);
      }

      if (data?.upgrade) {
        setUpgrade(true);
        setScore(null);

        const nextTips: string[] = Array.isArray(data?.tips)
          ? data.tips
          : typeof data?.tips === 'string' && data.tips.trim()
          ? [data.tips.trim()]
          : [];

        setTips(nextTips);
        onScore?.(null);
        onScoreChange?.(null);
        return;
      }

      const s =
        typeof data?.score === 'number'
          ? Math.max(0, Math.min(100, Math.round(data.score)))
          : null;

      const nextTips: string[] = Array.isArray(data?.tips)
        ? data.tips
        : typeof data?.tips === 'string' && data.tips.trim()
        ? [data.tips.trim()]
        : [];

      setScore(s);
      setTips(nextTips);

      onScore?.(s);
      onScoreChange?.(s);
    } catch (e: any) {
      console.error('AI ATS scan failed', e);
      setError(e?.message || 'AI scan failed — try again.');
      onScore?.(null);
      onScoreChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  // Register runScan so AtsDepthPanel can trigger it from its top button
  useEffect(() => {
    if (typeof onRegisterScan === 'function') {
      onRegisterScan(runScan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterScan, jdText, resumeData]);

  if (compact) {
    return (
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            padding: 14,
            background: '#FFF8E1',
            borderRadius: 12,
            border: '1px solid #FFCC80',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 14, color: '#E65100', marginBottom: 6 }}>
            AI ATS Scan
          </div>

          <div style={{ fontSize: 13, color: '#5D4037', marginBottom: 10 }}>{helperText}</div>

          <button
            type="button"
            onClick={runScan}
            disabled={loading || !hasJD}
            style={{
              padding: '10px 16px',
              background: hasJD ? '#FF7043' : '#FFCC80',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontWeight: 800,
              cursor: loading || !hasJD ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? 'Analyzing…' : hasJD ? 'Run AI Scan' : 'Paste a job description first'}
          </button>

          {upgrade && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: '#FFF3E0',
                border: '1px solid #FFB74D',
                borderRadius: 10,
              }}
            >
              <div style={{ fontWeight: 800, color: '#E65100', fontSize: 13 }}>
                You&apos;ve used your 3 free AI scans today.
              </div>
              <button
                type="button"
                onClick={() => (window.location.href = '/pricing')}
                style={{
                  marginTop: 8,
                  padding: '8px 14px',
                  background: '#FF7043',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Upgrade to Pro to unlock unlimited scans
              </button>
            </div>
          )}

          {error && <div style={{ marginTop: 10, fontSize: 12, color: '#C62828' }}>{error}</div>}

          {score !== null && !upgrade && hasJD && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: score >= 85 ? '#2E7D32' : score >= 70 ? '#F59E0B' : '#C62828',
                }}
              >
                {score}/100
              </div>

              {normalizedTips.length > 0 && (
                <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: 13, color: '#37474F' }}>
                  {normalizedTips.map((tip, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // (If you ever want the full-card version again, you can add it here.)
  return null;
}
