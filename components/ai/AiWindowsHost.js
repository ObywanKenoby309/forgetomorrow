// components/ai/AiWindowsHost.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AiLauncher from '@/components/ai/AiLauncher';
import AiWindow from '@/components/ai/AiWindow';

const LABELS = {
  seeker: 'Seeker Striker',
  coach: 'Coaching Striker',
  recruiter: 'Recruiting Striker',
};

const MOBILE_SUBTITLES = {
  seeker: 'Career, jobs, profile, and resume guidance',
  coach: 'Client sessions, planning, and coaching workflow',
  recruiter: 'Hiring, candidates, jobs, and pipeline support',
};

const MOBILE_ICONS = {
  seeker: '/icons/seeker-ai.png',
  coach: '/icons/coach-ai.png',
  recruiter: '/icons/recruiter-ai.png',
};

const MOBILE_ACCENTS = {
  seeker: { bg: 'rgba(255,112,67,0.12)', border: 'rgba(255,112,67,0.30)' },
  coach: { bg: 'rgba(66,165,245,0.12)', border: 'rgba(66,165,245,0.30)' },
  recruiter: { bg: 'rgba(102,187,106,0.12)', border: 'rgba(102,187,106,0.30)' },
};

function safeMode(m) {
  const s = String(m || '').toLowerCase().trim();
  if (s === 'seeker') return 'seeker';
  if (s === 'coach') return 'coach';
  if (s === 'recruiter') return 'recruiter';
  return '';
}

function parseDateMs(v) {
  try {
    const ms = new Date(v).getTime();
    return Number.isFinite(ms) ? ms : 0;
  } catch {
    return 0;
  }
}

export default function AiWindowsHost({ allowedModes = [] }) {
  // ✅ Only 3 brains exist: seeker, coach, recruiter
  // - Seeker gets: ['seeker']
  // - Coach gets: ['seeker','coach']
  // - Recruiter gets: ['seeker','recruiter']
  const allowed = useMemo(() => {
    const set = new Set((allowedModes || []).map((m) => safeMode(m)).filter(Boolean));
    const list = [];
    if (set.has('seeker')) list.push('seeker');
    if (set.has('coach')) list.push('coach');
    if (set.has('recruiter')) list.push('recruiter');
    return list;
  }, [allowedModes]);

  const [windows, setWindows] = useState(() => {
    const initial = {};
    for (const mode of allowed) {
      initial[mode] = { open: false, minimized: false, z: 0, x: null, y: null };
    }
    return initial;
  });

  const [zTop, setZTop] = useState(10);
  const [threadIds, setThreadIds] = useState(() => ({}));
  const [lastSeenAt, setLastSeenAt] = useState(() => ({}));
  const [unreadByMode, setUnreadByMode] = useState(() => ({}));
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 1024;
      setIsMobile(nextIsMobile);

      if (!nextIsMobile) {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Refs so polling loop always reads fresh state (no stale closures)
  const windowsRef = useRef(windows);
  const threadIdsRef = useRef({});
  const lastSeenAtRef = useRef({});

  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  useEffect(() => {
    threadIdsRef.current = threadIds;
  }, [threadIds]);

  useEffect(() => {
    lastSeenAtRef.current = lastSeenAt;
  }, [lastSeenAt]);

  // Keep state aligned when allowedModes changes
  useEffect(() => {
    setWindows((prev) => {
      const next = { ...(prev || {}) };
      for (const mode of allowed) {
        if (!next[mode]) next[mode] = { open: false, minimized: false, z: 0, x: null, y: null };
      }
      for (const k of Object.keys(next)) {
        if (!allowed.includes(k)) delete next[k];
      }
      return next;
    });

    setThreadIds((prev) => {
      const next = { ...(prev || {}) };
      for (const k of Object.keys(next)) {
        if (!allowed.includes(k)) delete next[k];
      }
      return next;
    });

    setLastSeenAt((prev) => {
      const next = { ...(prev || {}) };
      for (const k of Object.keys(next)) {
        if (!allowed.includes(k)) delete next[k];
      }
      return next;
    });

    setUnreadByMode((prev) => {
      const next = { ...(prev || {}) };
      for (const k of Object.keys(next)) {
        if (!allowed.includes(k)) delete next[k];
      }
      return next;
    });
  }, [allowed]);

  const bringToFront = useCallback((mode) => {
    setZTop((prev) => {
      const next = prev + 1;
      setWindows((w) => ({
        ...w,
        [mode]: { ...(w?.[mode] || {}), z: next },
      }));
      return next;
    });
  }, []);

  // stamps current time AND immediately zeroes badge
  const markSeenNow = useCallback((mode) => {
    const now = Date.now();
    setLastSeenAt((s) => ({ ...(s || {}), [mode]: now }));
    setUnreadByMode((u) => ({ ...(u || {}), [mode]: 0 }));
  }, []);

  const openMode = useCallback(
    (mode) => {
      if (!allowed.includes(mode)) return;

      setWindows((w) => {
        const cur = w?.[mode] || { open: false, minimized: false, z: 0, x: null, y: null };

        // Already open and not minimized -> minimize (toggle)
        if (cur.open && !cur.minimized) {
          return { ...w, [mode]: { ...cur, minimized: true } };
        }

        // Otherwise open + unminimize
        return { ...w, [mode]: { ...cur, open: true, minimized: false } };
      });

      markSeenNow(mode);
      bringToFront(mode);
    },
    [allowed, bringToFront, markSeenNow]
  );

  useEffect(() => {
    if (!mounted) return;
    if (typeof window === 'undefined') return;

    const handleOpenStriker = () => {
      if (!allowed.length) return;

      if (window.innerWidth < 1024) {
        setMobileMenuOpen((v) => !v);
        return;
      }

      if (allowed.length === 1) {
        openMode(allowed[0]);
      }
    };

    window.addEventListener('ft-open-striker', handleOpenStriker);
    return () => window.removeEventListener('ft-open-striker', handleOpenStriker);
  }, [allowed, mounted, openMode]);

  const closeMode = useCallback((mode) => {
    setWindows((w) => ({
      ...w,
      [mode]: { ...(w?.[mode] || {}), open: false, minimized: false },
    }));
  }, []);

  const minimizeMode = useCallback((mode) => {
    setWindows((w) => ({
      ...w,
      [mode]: { ...(w?.[mode] || {}), minimized: true },
    }));
  }, []);

  const setPosition = useCallback((mode, pos) => {
    setWindows((w) => ({
      ...w,
      [mode]: { ...(w?.[mode] || {}), ...pos },
    }));
  }, []);

  // ── Poll for unread messages ────────────────────────────────────────────
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!allowed.length) return;

    let alive = true;
    let timer = null;

    async function ensureThreadId(mode) {
      const existing = threadIdsRef.current?.[mode];
      if (existing) return existing;

      const res = await fetch(`/api/ai/thread?mode=${encodeURIComponent(mode)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load thread');

      const tid = String(json?.thread?.id || '');
      if (!tid) throw new Error('Thread id missing');
      if (!alive) return '';

      threadIdsRef.current = { ...threadIdsRef.current, [mode]: tid };
      setThreadIds((prev) => ({ ...(prev || {}), [mode]: tid }));

      // Seed lastSeenAt to NOW on first load (treat existing as read)
      const now = Date.now();
      lastSeenAtRef.current = { ...lastSeenAtRef.current, [mode]: now };
      setLastSeenAt((prev) => ({ ...(prev || {}), [mode]: now }));

      return tid;
    }

    async function pollOnce() {
      if (pollingRef.current) return;
      pollingRef.current = true;

      try {
        for (const mode of allowed) {
          if (!alive) break;

          const st = windowsRef.current?.[mode];
          const isVisible = !!(st?.open && !st?.minimized);

          // If visible, clear unread immediately
          if (isVisible) {
            setUnreadByMode((u) => ({ ...(u || {}), [mode]: 0 }));
            continue;
          }

          let tid = '';
          try {
            tid = await ensureThreadId(mode);
          } catch {
            continue;
          }
          if (!tid) continue;

          const mRes = await fetch(`/api/ai/messages?threadId=${encodeURIComponent(tid)}`);
          const mJson = await mRes.json();
          if (!mRes.ok) continue;

          const msgs = Array.isArray(mJson?.messages) ? mJson.messages : [];
          const seenMs = Number(lastSeenAtRef.current?.[mode] || 0);

          let unread = 0;
          for (const m of msgs) {
            const role = String(m?.role || '');
            if (role !== 'assistant') continue;
            const t = parseDateMs(m?.createdAt);
            if (t > seenMs) unread += 1;
          }

          setUnreadByMode((u) => ({ ...(u || {}), [mode]: unread }));
        }
      } finally {
        pollingRef.current = false;
      }
    }

    pollOnce();
    timer = setInterval(pollOnce, 8000);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  const unreadTotal = useMemo(() => {
    let sum = 0;
    for (const mode of allowed) sum += Number(unreadByMode?.[mode] || 0);
    return sum;
  }, [allowed, unreadByMode]);

  if (!allowed.length || !mounted || typeof document === 'undefined') return null;

  const strikerLayer = (
    <div
      id="forge-striker-os-layer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        pointerEvents: 'none',
        isolation: 'isolate',
      }}
    >
      {isMobile && mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close Striker menu"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'default',
              pointerEvents: 'auto',
            }}
          />

          <div
            style={{
              position: 'fixed',
              top: 56,
              right: 4,
              width: 'min(292px, calc(100vw - 12px))',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 18px 44px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10)',
              padding: '10px 8px',
              boxSizing: 'border-box',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: '#90A4AE',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '0 8px 8px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                marginBottom: 8,
              }}
            >
              Choose Striker
            </div>

            <div style={{ display: 'grid', gap: 7 }}>
              {allowed.map((mode) => {
                const iconSrc = MOBILE_ICONS[mode] || '/icons/the-striker.png';
                const accent = MOBILE_ACCENTS[mode] || MOBILE_ACCENTS.seeker;

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      openMode(mode);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      borderRadius: 14,
                      border: `1px solid ${accent.border}`,
                      background: accent.bg,
                      color: '#112033',
                      padding: '10px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.88)',
                        border: `1px solid ${accent.border}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: '0 0 auto',
                      }}
                    >
                      <img
                        src={iconSrc}
                        alt=""
                        aria-hidden="true"
                        style={{ width: 25, height: 25, objectFit: 'contain', borderRadius: 8 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#112033', lineHeight: 1.15 }}>
                        {LABELS[mode] || 'Striker'}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#607D8B', lineHeight: 1.25 }}>
                        {MOBILE_SUBTITLES[mode] || ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!isMobile && (
        <div style={{ pointerEvents: 'auto' }}>
          <AiLauncher allowedModes={allowed} onOpenMode={openMode} badgeCount={unreadTotal} />
        </div>
      )}

      {allowed.map((mode) => {
        const st = windows?.[mode];
        if (!st?.open || st?.minimized) return null;

        return (
          <div key={mode} style={{ pointerEvents: 'auto' }}>
            <AiWindow
              mode={mode}
              title={LABELS[mode] || 'AI Striker'}
              zIndex={st.z || 20}
              x={st.x}
              y={st.y}
              onFocus={() => bringToFront(mode)}
              onClose={() => closeMode(mode)}
              onMinimize={() => minimizeMode(mode)}
              onSetPosition={(pos) => setPosition(mode, pos)}
              onMarkSeen={() => markSeenNow(mode)}
            />
          </div>
        );
      })}
    </div>
  );

  return createPortal(strikerLayer, document.body);
}