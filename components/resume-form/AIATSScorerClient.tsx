'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

export type AIATSScorerClientProps = {
  jdText: string;
  resumeData: any;

  /**
   * Increment this number to trigger a new scan.
   * Example: setScanNonce((n) => n + 1)
   */
  scanNonce: number;

  /** Called when a new score is available (or null on failure/reset) */
  onScore?: (score: number | null) => void;

  /** Alternate name used by AtsDepthPanel */
  onScoreChange?: (score: number | null) => void;

  /** Optional: pass back tips (so parent can display if desired) */
  onTipsChange?: (tips: string[]) => void;

  /** Optional: parent can show upgrade UI */
  onUpgradeChange?: (upgrade: boolean) => void;

  /** Optional: parent can show loading state */
  onLoadingChange?: (loading: boolean) => void;

  /** Optional: parent can show error state */
  onErrorChange?: (error: string | null) => void;
};

export default function AIATSScorerClient({
  jdText,
  resumeData,
  scanNonce,
  onScore,
  onScoreChange,
  onTipsChange,
  onUpgradeChange,
  onLoadingChange,
  onErrorChange,
}: AIATSScorerClientProps) {
  useSession(); // keep session hook stable (you may want role-based logic later)

  const [loading, setLoading] = useState(false);
  const lastNonceRef = useRef<number>(0);

  const hasJD = !!jdText?.trim();

  // Reset when JD changes
  useEffect(() => {
    onScore?.(null);
    onScoreChange?.(null);
    onTipsChange?.([]);
    onUpgradeChange?.(false);
    onErrorChange?.(null);
  }, [jdText, onScore, onScoreChange, onTipsChange, onUpgradeChange, onErrorChange]);

  // Trigger scan when scanNonce increments
  useEffect(() => {
    if (!hasJD) return;
    if (!scanNonce) return;

    // prevent re-run if React re-renders with same nonce
    if (scanNonce === lastNonceRef.current) return;
    lastNonceRef.current = scanNonce;

    let cancelled = false;

    async function run() {
      setLoading(true);
      onLoadingChange?.(true);
      onUpgradeChange?.(false);
      onErrorChange?.(null);

      try {
        const response = await fetch('/api/ats-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jd: jdText, resume: resumeData }),
        });

        const data = await response.json();

        if (cancelled) return;

        const nextTips: string[] = Array.isArray(data.tips)
          ? data.tips
              .filter((t: any) => typeof t === 'string')
              .map((t: string) => t.trim())
              .filter(Boolean)
          : typeof data.tips === 'string' && data.tips.trim()
          ? [data.tips.trim()]
          : [];

        onTipsChange?.(nextTips);

        if (data.upgrade) {
          onUpgradeChange?.(true);
          onScore?.(null);
          onScoreChange?.(null);
          return;
        }

        const s =
          typeof data.score === 'number'
            ? Math.max(0, Math.min(100, Math.round(data.score)))
            : null;

        onScore?.(s);
        onScoreChange?.(s);
      } catch (e) {
        if (cancelled) return;
        console.error('AI ATS scan failed', e);
        onErrorChange?.('AI scan failed — try again.');
        onScore?.(null);
        onScoreChange?.(null);
      } finally {
        if (cancelled) return;
        setLoading(false);
        onLoadingChange?.(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [
    hasJD,
    scanNonce,
    jdText,
    resumeData,
    onScore,
    onScoreChange,
    onTipsChange,
    onUpgradeChange,
    onLoadingChange,
    onErrorChange,
  ]);

  // Headless: UI lives in AtsDepthPanel
  return null;
}
