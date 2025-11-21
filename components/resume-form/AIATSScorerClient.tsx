// components/resume-form/AIATSScorerClient.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function AIATSScorerClient({ jdText, resumeData }: { jdText: string; resumeData: any }) {
  const { data: session } = useSession();
  const [score, setScore] = useState<number | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [upgrade, setUpgrade] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    setUpgrade(false);
    try {
      const response = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jdText, resume: resumeData })
      });
      const data = await response.json();

      if (data.upgrade) {
        setUpgrade(true);
        setScore(null);
        setTips(data.tips);
      } else {
        setScore(data.score);
        setTips(data.tips);
      }
    } catch (e) {
      alert('AI scan failed — try again');
    } finally {
      setLoading(false);
    }
  };

  if (!jdText?.trim()) return null;

  return (
    <div style={{ marginTop: 20, padding: 16, background: '#FFF8E1', borderRadius: 12, border: '1px solid #FFCC80' }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#E65100' }}>
        AI ATS Score
      </h3>
      <p style={{ fontSize: 14, color: '#5D4037', marginBottom: 12 }}>
        { (session?.user?.role as string || 'USER') === 'COACH'
  ? 'Coach your client with AI insights.'
  : (session?.user?.role as string || 'USER') === 'RECRUITER'
  ? 'Evaluate hiring fit with AI.'
  : 'Improve your resume with AI-powered scoring.'
}
</p>

      <button
        onClick={handleScan}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: '#FF7043',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Analyzing...' : 'Run AI Scan'}
      </button>

      {upgrade && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#FFF3E0',
          border: '1px solid #FFB74D',
          borderRadius: 8
        }}>
          <p style={{ fontWeight: 600, color: '#E65100' }}>
            You've used your 3 free AI scans today.
          </p>
          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              marginTop: 8,
              padding: '8px 16px',
              background: '#FF7043',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600
            }}
          >
            Upgrade to Pro ($9.99/mo) to Unlimited AI
          </button>
        </div>
      )}

      {score !== null && !upgrade && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: score > 80 ? '#2E7D32' : score > 60 ? '#F59E0B' : '#C62828'
          }}>
            {score}/100
          </div>
          <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 14 }}>
            {tips.map((tip, i) => (
              <li key={i} style={{ marginBottom: 6, color: '#37474F' }}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}