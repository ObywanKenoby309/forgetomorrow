// components/ai/AiWindowsHost.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AiLauncher from '@/components/ai/AiLauncher';
import AiWindow from '@/components/ai/AiWindow';

const LABELS = {
  seeker: 'Seeker Buddy',
  coach: 'Coach Buddy',
  recruiter: 'Recruiter Buddy',
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

  // 1 window per mode, no localStorage
  const [windows, setWindows] = useState(() => {
    const initial = {};
    for (const mode of allowed) initial[mode] = { open: false, minimized: false, z: 0, x: null, y: null };
    return initial;
  });

  const [zTop, setZTop] = useState(10);

  // DB-first unread (in-memory only)
  const [threadIds, setThreadIds] = useState(() => ({})); // { [mode]: threadId }
  const [lastSeenAt, setLastSeenAt] = useState(() => ({})); // { [mode]: ms }
  const [unreadByMode, setUnreadByMode] = useState(() => ({})); // { [mode]: number }

  // keep state aligned if allowed modes changes
  useEffect(() => {
    setWindows((prev) => {
      const next = { ...(prev || {}) };
      for (const mode of allowed) {
        if (!next[mode]) next[mode] = { open: false, minimized: false, z: 0, x: null, y: null };
      }
      // remove disallowed
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

  const markSeenNow = useCallback((mode) => {
    const now = Date.now();
    setLastSeenAt((s) => ({ ...(s || {}), [mode]: now }));
    setUnreadByMode((u) => ({ ...(u || {}), [mode]: 0 }));
  }, []);

  // ✅ Toggle behavior: selecting an already-open window minimizes it
  const openMode = useCallback(
    (mode) => {
      if (!allowed.includes(mode)) return;

      setWindows((w) => {
        const cur = w?.[mode] || { open: false, minimized: false, z: 0, x: null, y: null };

        // If already open and not minimized => minimize (toggle)
        if (cur.open && !cur.minimized) {
          return {
            ...w,
            [mode]: { ...cur, minimized: true },
          };
        }

        // Otherwise open + unminimize
        return {
          ...w,
          [mode]: {
            ...cur,
            open: true,
            minimized: false,
          },
        };
      });

      // Opening counts as "seen"
      markSeenNow(mode);
      bringToFront(mode);
    },
    [allowed, bringToFront, markSeenNow]
  );

  const closeMode = useCallback(
    (mode) => {
      setWindows((w) => ({
        ...w,
        [mode]: { ...(w?.[mode] || {}), open: false, minimized: false },
      }));
      // If they had it open, we treat it as seen already (no extra work).
    },
    []
  );

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

  // Poll threads/messages to compute unread (DB-first, no localStorage)
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!allowed.length) return;

    let alive = true;
    let timer = null;

    async function ensureThreadId(mode) {
      if (threadIds?.[mode]) return threadIds[mode];

      const res = await fetch(`/api/ai/thread?mode=${encodeURIComponent(mode)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load thread');

      const tid = String(json?.thread?.id || '');
      if (!tid) throw new Error('Thread id missing');

      if (!alive) return '';
      setThreadIds((prev) => ({ ...(prev || {}), [mode]: tid }));
      return tid;
    }

    async function pollOnce() {
      if (pollingRef.current) return;
      pollingRef.current = true;

      try {
        // only poll modes that are allowed
        for (const mode of allowed) {
          if (!alive) break;

          // If window is currently open (not minimized), unread should be 0 for that mode
          const st = windows?.[mode];
          const isVisible = !!(st?.open && !st?.minimized);
          if (isVisible) {
            setUnreadByMode((u) => ({ ...(u || {}), [mode]: 0 }));
            continue;
          }

          let tid = '';
          try {
            tid = await ensureThreadId(mode);
          } catch {
            // If thread endpoint fails, skip this mode for this poll
            continue;
          }
          if (!tid) continue;

          const mRes = await fetch(`/api/ai/messages?threadId=${encodeURIComponent(tid)}`);
          const mJson = await mRes.json();
          if (!mRes.ok) continue;

          const msgs = Array.isArray(mJson?.messages) ? mJson.messages : [];
          const seenMs = Number(lastSeenAt?.[mode] || 0);

          // unread = assistant messages created after lastSeenAt
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

    // immediate + interval
    pollOnce();
    timer = setInterval(pollOnce, 8000);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [allowed, threadIds, lastSeenAt, windows]);

  const unreadTotal = useMemo(() => {
    let sum = 0;
    for (const mode of allowed) sum += Number(unreadByMode?.[mode] || 0);
    return sum;
  }, [allowed, unreadByMode]);

  if (!allowed.length) return null;

  return (
    <>
      <AiLauncher allowedModes={allowed} onOpenMode={openMode} badgeCount={unreadTotal} />

      {allowed.map((mode) => {
        const st = windows?.[mode];
        if (!st?.open || st?.minimized) return null;

        return (
          <AiWindow
            key={mode}
            mode={mode}
            title={LABELS[mode] || 'AI Buddy'}
            zIndex={st.z || 20}
            x={st.x}
            y={st.y}
            onFocus={() => bringToFront(mode)}
            onClose={() => closeMode(mode)}
            onMinimize={() => minimizeMode(mode)}
            onSetPosition={(pos) => setPosition(mode, pos)}
          />
        );
      })}
    </>
  );
}