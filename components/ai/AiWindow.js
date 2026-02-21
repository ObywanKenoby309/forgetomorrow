// components/ai/AiWindow.js
import React, { useEffect, useMemo, useRef, useState } from 'react';

const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.86)',
  boxShadow: '0 18px 44px rgba(0,0,0,0.22)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function AiWindow({ mode, title, zIndex = 30, x, y, onFocus, onClose, onMinimize, onSetPosition }) {
  const size = useMemo(() => ({ w: 360, h: 420 }), []);
  const [pos, setPos] = useState(() => ({ x: typeof x === 'number' ? x : null, y: typeof y === 'number' ? y : null }));

  // initial placement (once)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pos.x !== null && pos.y !== null) return;

    const pad = 18;
    const startX = window.innerWidth - size.w - pad;
    const startY = window.innerHeight - size.h - 140;
    const next = {
      x: clamp(startX, pad, window.innerWidth - size.w - pad),
      y: clamp(startY, pad, window.innerHeight - size.h - pad),
    };
    setPos(next);
    onSetPosition?.(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof x === 'number' && typeof y === 'number') setPos({ x, y });
  }, [x, y]);

  const dragging = useRef(false);
  const start = useRef({ px: 0, py: 0, ox: 0, oy: 0 });

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    dragging.current = true;
    start.current = { px: e.clientX, py: e.clientY, ox: pos.x ?? 0, oy: pos.y ?? 0 };
    onFocus?.();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // no-op
    }
  }

  function onPointerMove(e) {
    if (!dragging.current) return;
    if (typeof window === 'undefined') return;

    const pad = 10;
    const dx = e.clientX - start.current.px;
    const dy = e.clientY - start.current.py;

    const nx = clamp(start.current.ox + dx, pad, window.innerWidth - size.w - pad);
    const ny = clamp(start.current.oy + dy, pad, window.innerHeight - size.h - pad);

    const next = { x: nx, y: ny };
    setPos(next);
    onSetPosition?.(next);
  }

  function onPointerUp() {
    dragging.current = false;
  }

  return (
    <div
      onMouseDown={() => onFocus?.()}
      style={{
        position: 'fixed',
        left: pos.x ?? 18,
        top: pos.y ?? 18,
        width: size.w,
        height: size.h,
        zIndex,
        borderRadius: 16,
        overflow: 'hidden',
        ...GLASS,
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 12px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          cursor: 'grab',
          userSelect: 'none',
          background: 'rgba(17, 32, 51, 0.06)',
        }}
      >
        <div style={{ display: 'grid' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#112033', lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#607D8B' }}>{String(mode || '').toUpperCase()} MODE</div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize"
            style={{
              border: '1px solid rgba(0,0,0,0.10)',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 10,
              padding: '6px 8px',
              cursor: 'pointer',
              fontWeight: 900,
            }}
          >
            –
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: '1px solid rgba(0,0,0,0.10)',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 10,
              padding: '6px 9px',
              cursor: 'pointer',
              fontWeight: 900,
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ height: 'calc(100% - 54px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              color: '#223040',
              lineHeight: 1.4,
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 12,
              padding: 12,
            }}
          >
            This is the UI shell for <b>{title}</b>.
            <br />
            <br />
            Next wiring step: DB threads/messages + scoped prompts + “stay on Forge” redirect behavior.
          </div>
        </div>

        <div style={{ padding: 12, borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Type here (wiring next)..."
            disabled
            style={{
              flex: 1,
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.10)',
              padding: '10px 12px',
              fontSize: 13,
              background: 'rgba(255,255,255,0.9)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            disabled
            style={{
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.10)',
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 900,
              background: 'rgba(17, 32, 51, 0.10)',
              cursor: 'not-allowed',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}