// components/signal/ConversationList.js
import React, { useMemo, useState } from 'react';

export default function ConversationList({
  conversations = [],
  activeId,
  onSelect,
}) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return conversations;
    return conversations.filter(c =>
      c.name.toLowerCase().includes(s) ||
      (c.lastMessage || '').toLowerCase().includes(s)
    );
  }, [q, conversations]);

  const wrap = {
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    gap: 8,
    height: '100%',
  };

  return (
    <aside style={wrap}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search conversations…"
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: 10,
          padding: '10px 12px',
          outline: 'none',
        }}
        aria-label="Search conversations"
      />

      <div
        style={{
          overflowY: 'auto',
          border: '1px solid #EEF2F7',
          borderRadius: 10,
          padding: 6,
          background: 'white',
        }}
      >
        {filtered.map((c) => {
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect?.(c.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: '40px 1fr auto',
                gap: 10,
                padding: 10,
                borderRadius: 10,
                border: '1px solid #EEF2F7',
                background: isActive ? '#FFF7F2' : 'white',
                cursor: 'pointer',
                marginBottom: 8,
              }}
              aria-current={isActive ? 'true' : 'false'}
            >
              <img
                src={c.avatar}
                alt=""
                width={40}
                height={40}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #FF7043' }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, color: '#111827' }}>{c.name}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#6B7280',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={c.lastMessage}
                >
                  {c.lastMessage}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.time}</div>
                {c.unread > 0 && (
                  <span
                    style={{
                      background: '#FF7043',
                      color: 'white',
                      borderRadius: 999,
                      padding: '1px 6px',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                    aria-label={`${c.unread} unread`}
                  >
                    {c.unread}
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ color: '#94A3B8', fontStyle: 'italic', padding: 12 }}>
            No conversations
          </div>
        )}
      </div>
    </aside>
  );
}
