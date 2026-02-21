// components/ai/AiWindowsHost.js
import React, { useCallback, useMemo, useState } from 'react';
import AiLauncher from '@/components/ai/AiLauncher';
import AiWindow from '@/components/ai/AiWindow';

const LABELS = {
  seeker: 'Seeker Buddy',
  coach: 'Coach Buddy',
  recruiter: 'Recruiter Buddy',
};

export default function AiWindowsHost({ allowedModes = [] }) {
  const allowed = useMemo(() => {
    const set = new Set((allowedModes || []).map((m) => String(m || '').toLowerCase().trim()));
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

  const openMode = useCallback(
    (mode) => {
      if (!allowed.includes(mode)) return;

      setWindows((w) => {
        const cur = w?.[mode] || { open: false, minimized: false, z: 0, x: null, y: null };

        // If already open and not minimized, just focus
        if (cur.open && !cur.minimized) return w;

        return {
          ...w,
          [mode]: {
            ...cur,
            open: true,
            minimized: false,
          },
        };
      });

      bringToFront(mode);
    },
    [allowed, bringToFront]
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

  const openCount = useMemo(() => Object.values(windows || {}).filter((v) => v?.open && !v?.minimized).length, [windows]);

  if (!allowed.length) return null;

  return (
    <>
      <AiLauncher allowedModes={allowed} onOpenMode={openMode} openCount={openCount} />

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