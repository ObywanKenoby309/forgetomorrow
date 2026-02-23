// components/ai/AiWindowsHost.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AiLauncher from '@/components/ai/AiLauncher';
import AiWindow from '@/components/ai/AiWindow';

const LABELS = {
  seeker: 'Seeker Striker',
  coach: 'Coaching Striker',
  recruiter: 'Recruiting Striker',
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

  // ✅ FIX #2: refs so polling loop always reads fresh state, never stale closure values
  const windowsRef = useRef(windows);
  const threadIdsRef = useRef({});
  const lastSeenAtRef = useRef({});

  useEffect(() => { windowsRef.current = windows; }, [windows]);
  useEffect(() => { threadIdsRef.current = threadIds; }, [threadIds]);
  useEffect(() => { lastSeenAtRef.current = lastSeenAt; }, [lastSeenAt]);

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

  // ✅ FIX #2: stamps current time AND immediately zeroes badge
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

        // Already open and not minimized → minimize (toggle)
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
      // read from ref so we always have the latest threadIds
      const existing = threadIdsRef.current?.[mode];
      if (existing) return existing;

      const res = await fetch(`/api/ai/thread?mode=${encodeURIComponent(mode)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load thread');

      const tid = String(json?.thread?.id || '');
      if (!tid) throw new Error('Thread id missing');
      if (!alive) return '';

      // Update both ref and state
      threadIdsRef.current = { ...threadIdsRef.current, [mode]: tid };
      setThreadIds((prev) => ({ ...(prev || {}), [mode]: tid }));

      // ✅ Seed lastSeenAt to NOW on first thread load — this means all existing
      // messages are treated as already read. Badge only fires for NEW messages
      // that arrive after this session started, while the window was closed.
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

          // ✅ FIX #2: read windows state from ref — never stale
          const st = windowsRef.current?.[mode];
          const isVisible = !!(st?.open && !st?.minimized);

          // If window is open and visible, always zero unread immediately
          if (isVisible) {
            setUnreadByMode((u) => ({ ...(u || {}), [mode]: 0 }));
            continue;
          }

          let tid = '';
          try {
            tid = await ensureThreadId(mode);
          } catch {
            continue; // skip this mode this poll cycle
          }
          if (!tid) continue;

          const mRes = await fetch(`/api/ai/messages?threadId=${encodeURIComponent(tid)}`);
          const mJson = await mRes.json();
          if (!mRes.ok) continue;

          const msgs = Array.isArray(mJson?.messages) ? mJson.messages : [];

          // ✅ FIX #2: read lastSeenAt from ref — never stale
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

    // Immediate + interval
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

  if (!allowed.length) return null;

  return (
    <>
      <AiLauncher
        allowedModes={allowed}
        onOpenMode={openMode}
        badgeCount={unreadTotal}
      />

      {allowed.map((mode) => {
        const st = windows?.[mode];
        if (!st?.open || st?.minimized) return null;

        return (
          <AiWindow
            key={mode}
            mode={mode}
            title={LABELS[mode] || 'AI Striker'}
            zIndex={st.z || 20}
            x={st.x}
            y={st.y}
            onFocus={() => bringToFront(mode)}
            onClose={() => closeMode(mode)}
            onMinimize={() => minimizeMode(mode)}
            onSetPosition={(pos) => setPosition(mode, pos)}
            // ✅ FIX #2: badge clears the moment window becomes visible
            onMarkSeen={() => markSeenNow(mode)}
          />
        );
      })}
    </>
  );
}