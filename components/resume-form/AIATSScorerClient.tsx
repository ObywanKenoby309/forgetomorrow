'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

type AIATSScorerClientProps = {
  jdText: string;
  resumeData: any;
  onScore?: (score: number | null) => void;
  /** Optional: hook this up to open the Writing Coach modal */
  onAskCoach?: () => void;
};

export default function AIATSScorerClient({
  jdText,
  resumeData,
  onScore,
  onAskCoach,
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

  const handleScan = async () => {
    if (!hasJD) return;

    setLoading(true);
    setUpgrade(false);
    setError(null);

    try {
      const response = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jdText, resume: resumeData }),
      });

      const data = await response.json();

      if (data.upgrade) {
        setUpgrade(true);
        setScore(null);
        setTips(Array.isArray(data.tips) ? data.tips : []);
        onScore?.(null);
      } else {
        const s =
          typeof data.score === 'number'
            ? Math.max(0, Math.min(100, Math.round(data.score)))
            : null;

        setScore(s);
        setTips(
          Array.isArray(data.tips)
            ? data.tips
            : typeof data.tips === 'string' && data.tips.trim()
            ? [data.tips.trim()]
            : []
        );

        if (s !== null) {
          onScore?.(s);
        } else {
          onScore?.(null);
        }
      }
    } catch (e) {
      console.error('AI ATS scan failed', e);
      setError('AI scan failed — try again.');
      onScore?.(null);
      alert('AI scan failed — try again');
    } finally {
      setLoading(false);
    }
  };

  const role = (session?.user?.role as string) || 'USER';
  const helperText =
    role === 'COACH'
      ? 'Coach your client with AI insights.'
      : role === 'RECRUITER'
      ? 'Evaluate hiring fit with AI.'
      : 'Improve your resume with AI-powered scoring.';

  // Normalize tips safely for display
  const normalizedTips: string[] = Array.isArray(tips)
    ? tips.filter((t) => typeof t === 'string' && t.trim().length > 0)
    : [];

  const canAskCoach = typeof onAskCoach === 'function';

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* LEFT CARD – AI ATS Score */}
        <div
          style={{
            flex: '1 1 280px',
            padding: 16,
            background: '#FFF8E1',
            borderRadius: 12,
            border: '1px solid #FFCC80',
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 8,
              color: '#E65100',
            }}
          >
            AI ATS Score
          </h3>

          <p
            style={{
              fontSize: 14,
              color: '#5D4037',
              marginBottom: 8,
            }}
          >
            {helperText}
          </p>

          {/* Pro Tip when no JD */}
          {!hasJD && (
            <p
              style={{
                fontSize: 13,
                color: '#6D4C41',
                fontStyle: 'italic',
                marginBottom: 10,
              }}
            >
              <strong>Pro Tip:</strong> Upload a job description to unlock
              AI-powered ATS scoring and keyword suggestions.
            </p>
          )}

          <button
            onClick={handleScan}
            disabled={loading || !hasJD}
            style={{
              padding: '10px 20px',
              background: hasJD ? '#FF7043' : '#FFCC80',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: loading || !hasJD ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? 'Analyzing...'
              : hasJD
              ? 'Run AI Scan'
              : 'Paste a job description first'}
          </button>

          {upgrade && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: '#FFF3E0',
                border: '1px solid #FFB74D',
                borderRadius: 8,
              }}
            >
              <p style={{ fontWeight: 600, color: '#E65100' }}>
                You've used your 3 free AI scans today.
              </p>
              <button
                onClick={() => (window.location.href = '/pricing')}
                style={{
                  marginTop: 8,
                  padding: '8px 16px',
                  background: '#FF7043',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Upgrade to Pro ($9.99/mo) to Unlimited AI
              </button>
            </div>
          )}

          {error && (
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                color: '#C62828',
              }}
            >
              {error}
            </p>
          )}

          {score !== null && !upgrade && hasJD && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color:
                    score > 80
                      ? '#2E7D32'
                      : score > 60
                      ? '#F59E0B'
                      : '#C62828',
                }}
              >
                {score}/100
              </div>

              {normalizedTips.length > 0 && (
                <ul
                  style={{
                    marginTop: 8,
                    paddingLeft: 20,
                    fontSize: 14,
                  }}
                >
                  {normalizedTips.map((tip, i) => (
                    <li
                      key={i}
                      style={{
                        marginBottom: 6,
                        color: '#37474F',
                      }}
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* RIGHT CARD – AI Resume Coach */}
        <div
          style={{
            flex: '1 1 280px',
            padding: 16,
            background: '#FFF8E1',
            borderRadius: 12,
            border: '1px solid #FFCC80',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 8,
                color: '#E65100',
              }}
            >
              AI Resume Coach
            </h3>
            <p
              style={{
                fontSize: 14,
                color: '#5D4037',
                marginBottom: 12,
              }}
            >
              Ask the coach to help guide you through aligning your resume to
              industry-standard ATS expectations.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={canAskCoach ? onAskCoach : undefined}
              disabled={!canAskCoach}
              style={{
                padding: '10px 20px',
                background: '#FF7043',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: canAskCoach ? 'pointer' : 'not-allowed',
                opacity: canAskCoach ? 1 : 0.6,
              }}
            >
              Ask the Coach
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
