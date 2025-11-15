// components/cover-letter/CoverLetterTemplate.js
// THE FORGE LETTER — FINAL, PRINT-SAFE, HR-APPROVED
import React from 'react';

export default function CoverLetterTemplate({ data }) {
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

  const contact = [email, phone, location]
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ');

  const bodyLines = body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return (
    <div
      style={{
        fontFamily: 'Helvetica Neue',  // ONLY THIS — NO FALLBACKS
        fontSize: 11,
        lineHeight: 1.6,
        color: '#1f2937',
        maxWidth: 650,
        margin: '0 auto',
      }}
    >
      {/* HEADER — TOP RIGHT */}
      <div style={{ marginBottom: 40, textAlign: 'right' }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{fullName}</div>
        {(contact || portfolio) && (
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
            {contact && <span>{contact}</span>}
            {contact && portfolio && <span> · </span>}
            {portfolio && (
              <span style={{ color: '#1f2937', fontWeight: 500 }}>
                {portfolio}
              </span>
            )}
          </div>
        )}
      </div>

      {/* RECIPIENT */}
      <div style={{ marginBottom: 24 }}>
        <div>{recipient}</div>
        <div>{company}</div>
      </div>

      {/* GREETING */}
      <div style={{ marginBottom: 20, fontWeight: 500 }}>
        {greeting}
      </div>

      {/* OPENING */}
      {opening && (
        <p style={{ margin: '0 0 16px 0', textAlign: 'justify', fontSize: 11 }}>
          {opening}
        </p>
      )}

      {/* BODY — AUTO BULLETS */}
      {bodyLines.length > 0 && (
        <div style={{ margin: '16px 0' }}>
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
              <span style={{ position: 'absolute', left: 0, fontWeight: 700 }}>
                •
              </span>
              {line}
            </p>
          ))}
        </div>
      )}

      {/* CLOSING */}
      {closing && (
        <p style={{ margin: '20px 0 32px 0', textAlign: 'justify', fontSize: 11 }}>
          {closing}
        </p>
      )}

      {/* SIGNOFF */}
      <div style={{ marginTop: 40 }}>
        <div style={{ fontWeight: 500 }}>{signoff}</div>
        <div style={{ fontWeight: 700, marginTop: 8 }}>{fullName}</div>
      </div>
    </div>
  );
}