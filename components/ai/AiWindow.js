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
}) {
  const resolvedMode = normalizeMode(mode);

  const size = useMemo(() => ({ w: 360, h: 460 }), []);
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
    if (!content) return;
    if (!threadId) return;

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
          <div style={{ fontSize: 11, fontWeight: 800, color: '#607D8B' }}>
            {resolvedMode.toUpperCase()} MODE
          </div>
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
        <div ref={scrollRef} style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ fontSize: 13, fontWeight: 700, color: '#546E7A' }}>Loading…</div>
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
                      background: isUser ? 'rgba(17, 32, 51, 0.10)' : 'rgba(255,255,255,0.78)',
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

        <div style={{ padding: 12, borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: 8 }}>
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
      </div>
    </div>
  );
}