// components/signal/MessageThread.js
import React from 'react';

function Attachment({ att }) {
  const box = {
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: 6,
    marginTop: 6,
    background: 'white',
    maxWidth: 260,
  };
  if (att.type === 'image') {
    return (
      <div style={box}>
        <img
          src={att.url}
          alt={att.name || 'image'}
          style={{ display: 'block', width: '100%', borderRadius: 6 }}
        />
        {att.name && <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{att.name}</div>}
      </div>
    );
  }
  return (
    <a
      href={att.url}
      download
      style={{ ...box, display: 'inline-block', textDecoration: 'none' }}
    >
      📎 {att.name || 'Download file'}
    </a>
  );
}

export default function MessageThread({ partnerName, messages = [] }) {
  // Right-align "me", left-align "them"
  const wrap = {
    display: 'grid',
    gridTemplateRows: '1fr',
    border: '1px solid #EEF2F7',
    borderRadius: 12,
    background: 'white',
    height: '100%',
    overflow: 'hidden',
  };

  const scroller = {
    overflowY: 'auto',
    padding: 16,
    display: 'grid',
    gap: 10,
    alignContent: 'start',
    background: '#F8FAFC',
  };

  const bubbleBase = {
    maxWidth: '70%',
    padding: '10px 12px',
    borderRadius: 14,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    position: 'relative',
  };

  return (
    <section style={wrap} aria-label={`Conversation with ${partnerName}`}>
      <div style={scroller}>
        {messages.map((m) => {
          const mine = m.from === 'me';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: mine ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  ...bubbleBase,
                  background: mine ? '#FFECE4' : 'white',
                  color: '#111827',
                  borderTopRightRadius: mine ? 4 : 14,
                  borderTopLeftRadius: mine ? 14 : 4,
                }}
              >
                {!!m.text && <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>}
                {!!m.attachments?.length &&
                  m.attachments.map((a, idx) => <Attachment key={idx} att={a} />)}
                <div
                  style={{
                    fontSize: 10,
                    color: '#94A3B8',
                    textAlign: mine ? 'right' : 'left',
                    marginTop: 6,
                  }}
                >
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div style={{ color: '#94A3B8', textAlign: 'center', padding: 20 }}>
            No messages yet.
          </div>
        )}
      </div>
    </section>
  );
}
