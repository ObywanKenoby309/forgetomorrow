// components/cover-letter/CoverLetterTemplate.js
// THE FORGE LETTER - supports isEditMode + onUpdate for inline editing
import React from 'react';

const ORANGE = '#FF7043';

function EditableText({ value, onChange, placeholder, multiline, style, isEditMode }) {
  if (!isEditMode) {
    return <span style={style}>{value || <span style={{ color: '#ccc' }}>{placeholder}</span>}</span>;
  }
  if (multiline) {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          width: '100%',
          border: `1.5px solid ${ORANGE}`,
          borderRadius: 6,
          padding: '6px 8px',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          lineHeight: 'inherit',
          color: 'inherit',
          background: 'rgba(255,112,67,0.04)',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
          ...style,
        }}
      />
    );
  }
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        border: `1.5px solid ${ORANGE}`,
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        color: 'inherit',
        background: 'rgba(255,112,67,0.04)',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}

function SectionLabel({ isEditMode, label }) {
  if (!isEditMode) return null;
  return (
    <div style={{
      fontSize: 10,
      color: ORANGE,
      fontWeight: 700,
      background: 'rgba(255,112,67,0.08)',
      border: `1px solid rgba(255,112,67,0.25)`,
      borderRadius: 4,
      padding: '2px 7px',
      userSelect: 'none',
      display: 'inline-block',
      marginBottom: 4,
    }}>
      ✏️ {label}
    </div>
  );
}

export default function CoverLetterTemplate({ data, isEditMode = false, onUpdate }) {
  const {
    fullName = 'Your Name',
    email = '',
    phone = '',
    location = '',
    portfolio = '',
    recipient = 'Hiring Manager',
    company = 'the company',
    greeting = 'Dear Hiring Manager,',
    opening = '',
    body = '',
    closing = '',
    signoff = 'Sincerely,',
  } = data;

  const update = (field, value) => { if (onUpdate) onUpdate(field, value); };

  const contact = [email, phone, location]
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ');

  const bodyLines = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <div
      style={{
        fontFamily: 'Helvetica Neue, Arial, sans-serif',
        fontSize: 11,
        lineHeight: 1.6,
        color: '#1f2937',
        maxWidth: 650,
        margin: '0 auto',
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: 40, textAlign: 'left', position: 'relative' }}>
        <SectionLabel isEditMode={isEditMode} label="Contact Info" />
        <div style={{ fontWeight: 700, fontSize: 13 }}>{fullName}</div>
        {isEditMode ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <EditableText isEditMode value={portfolio} onChange={(v) => update('portfolio', v)} placeholder="Portfolio URL" style={{ fontSize: 10 }} />
          </div>
        ) : (
          (contact || portfolio) && (
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
              {contact && <span>{contact}</span>}
              {contact && portfolio && <span> · </span>}
              {portfolio && (
                <span style={{ color: '#1f2937', fontWeight: 500 }}>{portfolio}</span>
              )}
            </div>
          )
        )}
      </div>

      {/* RECIPIENT + COMPANY */}
      <div style={{ marginBottom: 24, position: 'relative' }}>
        <SectionLabel isEditMode={isEditMode} label="Recipient" />
        <div>
          <EditableText
            isEditMode={isEditMode}
            value={recipient}
            onChange={(v) => update('recipient', v)}
            placeholder="Hiring Manager"
          />
        </div>
        <div style={{ marginTop: isEditMode ? 6 : 0 }}>
          <EditableText
            isEditMode={isEditMode}
            value={company}
            onChange={(v) => update('company', v)}
            placeholder="Company name"
          />
        </div>
      </div>

      {/* GREETING */}
      <div style={{ marginBottom: 20, fontWeight: 500, position: 'relative' }}>
        <SectionLabel isEditMode={isEditMode} label="Greeting" />
        <EditableText
          isEditMode={isEditMode}
          value={greeting}
          onChange={(v) => update('greeting', v)}
          placeholder="Dear Hiring Manager,"
        />
      </div>

      {/* OPENING */}
      <div style={{ margin: '0 0 16px 0', position: 'relative' }}>
        <SectionLabel isEditMode={isEditMode} label="Opening" />
        {isEditMode ? (
          <EditableText
            isEditMode={isEditMode}
            value={opening}
            onChange={(v) => update('opening', v)}
            placeholder="One strong sentence. Lead with your biggest win. 12 words max."
            multiline
            style={{ minHeight: 60 }}
          />
        ) : (
          opening && (
            <p style={{ margin: 0, textAlign: 'justify', fontSize: 11 }}>{opening}</p>
          )
        )}
      </div>

      {/* BODY BULLETS */}
      <div style={{ margin: '16px 0', position: 'relative' }}>
        <SectionLabel isEditMode={isEditMode} label="Body — 3 bullets with numbers" />
        {isEditMode ? (
          <EditableText
            isEditMode={isEditMode}
            value={body}
            onChange={(v) => update('body', v)}
            placeholder={'• Achievement with a number\n• Achievement with a number\n• Achievement with a number'}
            multiline
            style={{ minHeight: 80 }}
          />
        ) : (
          bodyLines.length > 0 && (
            <div>
              {bodyLines.map((line, i) => (
                <p
                  key={i}
                  style={{
                    margin: '8px 0',
                    textAlign: 'justify',
                    fontSize: 11,
                    position: 'relative',
                    paddingLeft: 16,
                  }}
                >
                  <span style={{ position: 'absolute', left: 0, fontWeight: 700 }}>•</span>
                  {line.replace(/^[•\-]\s*/, '')}
                </p>
              ))}
            </div>
          )
        )}
      </div>

      {/* CLOSING */}
      <div style={{ margin: '20px 0 32px 0', position: 'relative' }}>
        <SectionLabel isEditMode={isEditMode} label="Closing" />
        {isEditMode ? (
          <EditableText
            isEditMode={isEditMode}
            value={closing}
            onChange={(v) => update('closing', v)}
            placeholder="Let's talk."
            multiline
            style={{ minHeight: 40 }}
          />
        ) : (
          closing && (
            <p style={{ margin: 0, textAlign: 'justify', fontSize: 11 }}>{closing}</p>
          )
        )}
      </div>

      {/* SIGNOFF */}
      <div style={{ marginTop: 40, position: 'relative' }}>
        <SectionLabel isEditMode={isEditMode} label="Sign-off" />
        <div style={{ fontWeight: 500 }}>
          <EditableText
            isEditMode={isEditMode}
            value={signoff}
            onChange={(v) => update('signoff', v)}
            placeholder="Sincerely,"
          />
        </div>
        <div style={{ fontWeight: 700, marginTop: 8 }}>{fullName}</div>
      </div>
    </div>
  );
}