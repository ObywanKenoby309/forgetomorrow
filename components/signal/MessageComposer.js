// components/signal/MessageComposer.js
import React, { useRef, useState } from 'react';

const COMMON_EMOJIS = ['👍','😊','🎉','🔥','🙏','🚀','🤝','💼','✅','💡','📎'];

export default function MessageComposer({ onSend }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]); // File objects
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef(null);

  const pickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...list]);
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const addEmoji = (e) => {
    setText((t) => (t || '') + e);
    inputRef.current?.focus();
    setShowEmoji(false);
  };

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;

    // Convert selected files to simple attachments (data URLs for demo)
    const toDataURL = (file) =>
      new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () =>
          res({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: reader.result,
            name: file.name,
          });
        reader.readAsDataURL(file);
      });

    Promise.all(files.map(toDataURL)).then((attachments) => {
      onSend?.(trimmed, attachments);
      setText('');
      setFiles([]);
      setShowEmoji(false);
      inputRef.current?.focus();
    });
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      style={{
        borderTop: '1px solid #EEF2F7',
        background: 'white',
        padding: 10,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 8,
        alignItems: 'end',
      }}
    >
      <div style={{ position: 'relative' }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type your message… (Enter to send • Shift+Enter for newline)"
          rows={2}
          style={{
            width: '100%',
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            padding: '10px 12px',
            outline: 'none',
            resize: 'vertical',
            minHeight: 44,
          }}
        />
        {/* attachments preview */}
        {files.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {files.map((f, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  padding: '6px 8px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13 }}>📎 {f.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}
                  aria-label={`Remove ${f.name}`}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* emoji popover */}
        {showEmoji && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 8,
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              padding: 8,
              boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
              zIndex: 2,
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              maxWidth: 280,
            }}
          >
            {COMMON_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => addEmoji(e)}
                style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
                aria-label={`Insert ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowEmoji((v) => !v)}
          aria-label="Insert emoji"
          title="Emoji"
          style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            padding: '8px 10px',
            cursor: 'pointer',
          }}
        >
          😊
        </button>

        <label
          style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            padding: '8px 10px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title="Attach files"
        >
          📎
          <input
            type="file"
            multiple
            hidden
            onChange={pickFiles}
          />
        </label>

        <button
          onClick={send}
          style={{
            background: '#FF7043',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
