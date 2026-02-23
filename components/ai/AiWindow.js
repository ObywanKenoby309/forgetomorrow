// components/ai/AiWindow.js
import React, { useEffect, useCallback, useRef, useState } from 'react';

const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.86)',
  boxShadow: '0 18px 44px rgba(0,0,0,0.22)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

// ✅ FIX #3: Site header is ~64px. Window initial placement and drag are clamped below this.
const NAV_HEIGHT = 64;

// ✅ FIX #4: Resize constraints
const MIN_HEIGHT = 280;
const MAX_HEIGHT = 700;
const DEFAULT_HEIGHT = 420; // smaller default — subtle, not page-dominating
const WIN_W = 360;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeMode(mode) {
  const m = String(mode || '').toLowerCase().trim();
  if (m === 'seeker') return 'seeker';
  if (m === 'coach') return 'coach';
  if (m === 'recruiter') return 'recruiter';
  return 'seeker';
}

export default function AiWindow({
  mode,
  title,
  zIndex = 30,
  x,
  y,
  onFocus,
  onClose,
  onMinimize,
  onSetPosition,
  onMarkSeen, // ✅ FIX #2: called on mount so badge clears immediately
}) {
  const resolvedMode = normalizeMode(mode);

  // ✅ FIX #4: height is now state so user can drag-resize
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const [pos, setPos] = useState(() => ({
    x: typeof x === 'number' ? x : null,
    y: typeof y === 'number' ? y : null,
  }));

  const [threadId, setThreadId] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const scrollRef = useRef(null);

  // ✅ FIX #3: Initial placement — never opens under the site header
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pos.x !== null && pos.y !== null) return;

    const pad = 18;
    const startX = clamp(
      window.innerWidth - WIN_W - pad,
      pad,
      window.innerWidth - WIN_W - pad
    );
    const startY = clamp(
      window.innerHeight - DEFAULT_HEIGHT - 140,
      NAV_HEIGHT + pad,
      window.innerHeight - DEFAULT_HEIGHT - pad
    );

    const next = { x: startX, y: startY };
    setPos(next);
    onSetPosition?.(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync position if parent changes it
  useEffect(() => {
    if (typeof x === 'number' && typeof y === 'number') setPos({ x, y });
  }, [x, y]);

  // ✅ FIX #2: Mark as seen the moment the window mounts (becomes visible)
  useEffect(() => {
    onMarkSeen?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load thread + messages (DB-first)
  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError('');
      try {
        const tRes = await fetch(`/api/ai/thread?mode=${encodeURIComponent(resolvedMode)}`);
        const tJson = await tRes.json();
        if (!tRes.ok) throw new Error(tJson?.error || 'Failed to load thread');

        const tid = String(tJson?.thread?.id || '');
        if (!tid) throw new Error('Thread id missing');
        if (!alive) return;
        setThreadId(tid);

        const mRes = await fetch(`/api/ai/messages?threadId=${encodeURIComponent(tid)}`);
        const mJson = await mRes.json();
        if (!mRes.ok) throw new Error(mJson?.error || 'Failed to load messages');
        if (!alive) return;
        setMessages(Array.isArray(mJson?.messages) ? mJson.messages : []);
      } catch (e) {
        if (!alive) return;
        setError(String(e?.message || 'Failed to load.'));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [resolvedMode]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    try {
      el.scrollTop = el.scrollHeight;
    } catch {
      // no-op
    }
  }, [messages?.length]);

  async function handleSend() {
    if (sending) return;
    const content = String(text || '').trim();
    if (!content || !threadId) return;

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/ai/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to send');

      setMessages(Array.isArray(json?.messages) ? json.messages : []);
      setText('');
    } catch (e) {
      setError(String(e?.message || 'Failed to send.'));
    } finally {
      setSending(false);
    }
  }

  // ── Drag to move ──────────────────────────────────────────────────────────
  const dragging = useRef(false);
  const dragStart = useRef({ px: 0, py: 0, ox: 0, oy: 0 });

  function onPointerDown(e) {
    // Don't start drag if user clicked a button in the header
    try {
      const target = e?.target;
      if (target && typeof target.closest === 'function' && target.closest('button')) return;
    } catch {
      // no-op
    }

    if (e.button !== undefined && e.button !== 0) return;

    dragging.current = true;
    dragStart.current = {
      px: e.clientX,
      py: e.clientY,
      ox: pos.x ?? 0,
      oy: pos.y ?? 0,
    };
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
    const dx = e.clientX - dragStart.current.px;
    const dy = e.clientY - dragStart.current.py;

    const nx = clamp(dragStart.current.ox + dx, pad, window.innerWidth - WIN_W - pad);
    // ✅ FIX #3: top clamped to NAV_HEIGHT — can never drag under the site header
    const ny = clamp(dragStart.current.oy + dy, NAV_HEIGHT + pad, window.innerHeight - height - pad);

    const next = { x: nx, y: ny };
    setPos(next);
    onSetPosition?.(next);
  }

  function onPointerUp() {
    dragging.current = false;
  }

  // ── FIX #4: Drag bottom edge to resize height ─────────────────────────────
  const resizing = useRef(false);
  const resizeStart = useRef({ py: 0, oh: 0 });

  const onResizeDown = useCallback((e) => {
    e.stopPropagation();
    if (e.button !== undefined && e.button !== 0) return;
    resizing.current = true;
    resizeStart.current = { py: e.clientY, oh: height };
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // no-op
    }
  }, [height]);

  const onResizeMove = useCallback((e) => {
    if (!resizing.current) return;
    const dy = e.clientY - resizeStart.current.py;
    setHeight(clamp(resizeStart.current.oh + dy, MIN_HEIGHT, MAX_HEIGHT));
  }, []);

  const onResizeUp = useCallback(() => {
    resizing.current = false;
  }, []);

  return (
    <div
      onMouseDown={() => onFocus?.()}
      style={{
        position: 'fixed',
        left: pos.x ?? 18,
        top: pos.y ?? (NAV_HEIGHT + 18),
        width: WIN_W,
        height,
        // ✅ FIX #3: zIndex bumped well above nav header (typically z ~100)
        zIndex: 10000 + (zIndex || 0),
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...GLASS,
      }}
    >
      {/* ── Header / drag handle ─────────────────────────────────────────── */}
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
          flex: '0 0 auto',
        }}
      >
        <div style={{ display: 'grid' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#112033', lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#607D8B' }}>
            {resolvedMode.toUpperCase()} MODE
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
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
            onPointerDown={(e) => e.stopPropagation()}
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

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          padding: 12,
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {loading ? (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#546E7A' }}>
            Loading…
          </div>
        ) : error ? (
          <div
            style={{
              fontSize: 13,
              color: '#B71C1C',
              background: 'rgba(183, 28, 28, 0.08)',
              border: '1px solid rgba(183, 28, 28, 0.18)',
              borderRadius: 12,
              padding: 10,
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#546E7A' }}>
            Start the conversation.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {messages.map((m) => {
              const isUser = String(m.role) === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    justifySelf: isUser ? 'end' : 'start',
                    maxWidth: '88%',
                    borderRadius: 14,
                    padding: '10px 12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    background: isUser
                      ? 'rgba(17, 32, 51, 0.10)'
                      : 'rgba(255,255,255,0.78)',
                    color: '#112033',
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.content}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          gap: 8,
          flex: '0 0 auto',
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder={sending ? 'Sending…' : 'Type a message…'}
          disabled={loading || sending || !!error}
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
          onClick={handleSend}
          disabled={loading || sending || !!error || !String(text || '').trim()}
          style={{
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.10)',
            padding: '10px 12px',
            fontSize: 13,
            fontWeight: 900,
            background: 'rgba(17, 32, 51, 0.10)',
            cursor: loading || sending || !!error ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </div>

      {/* ✅ FIX #4: Resize handle — drag to change window height ─────────── */}
      <div
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        title="Drag to resize"
        style={{
          flex: '0 0 auto',
          height: 14,
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.03)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          userSelect: 'none',
        }}
      >
        {/* Three dot grip indicator */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: 999,
                background: 'rgba(0,0,0,0.22)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}