// components/templates/cover/BaseCover.jsx
import React from 'react';

const ORANGE = '#FF7043';
const SLATE = '#455A64';

export default function BaseCover({
  styleType = 'concise', // 'concise' | 'narrative' | 'achievement'
  accent = ORANGE,
  data = {},
}) {
  const { formData = {}, summary = '', experiences = [] } = data;

  const header = (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 900 }}>{formData.fullName || 'Your Name'}</div>
      <div style={{ fontSize: 12, color: '#607D8B' }}>
        {[formData.email, formData.phone, formData.location].filter(Boolean).join(' • ')}
      </div>
    </div>
  );

  const intro = styleType === 'narrative'
    ? `I’m excited about the opportunity to contribute to your mission. ${summary || ''}`.trim()
    : `I’m applying for the ${formData.headline || 'role'} and believe I’m a strong fit.`

  const bodyBullets = (experiences[0]?.bullets || []).slice(0, 4);

  return (
    <div style={{ background: 'white', color: '#263238', fontFamily: 'Inter, system-ui, Arial', padding: 24, borderRadius: 12, border: '1px solid #eee' }}>
      {header}
      <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 12, marginBottom: 12, fontWeight: 800, color: accent }}>
        Cover Letter
      </div>

      <p style={{ marginTop: 0, color: SLATE }}>{intro}</p>

      {styleType === 'achievement' && !!bodyBullets.length && (
        <>
          <div style={{ fontWeight: 800, marginTop: 10, color: accent }}>Selected Achievements</div>
          <ul style={{ marginTop: 6 }}>
            {bodyBullets.map((b, i) => <li key={i} style={{ marginBottom: 6 }}>{b}</li>)}
          </ul>
        </>
      )}

      {styleType === 'narrative' && (
        <p style={{ color: SLATE }}>
          My background spans {experiences.length || 'several'} roles, where I focused on solving real customer problems,
          improving processes, and delivering measurable outcomes.
        </p>
      )}

      {styleType === 'concise' && (
        <p style={{ color: SLATE }}>
          I bring relevant skills, a bias for action, and reliable delivery. I’d welcome the chance to discuss how I can help.
        </p>
      )}

      <p style={{ marginTop: 10, color: SLATE }}>
        Thank you for your time and consideration.
      </p>
    </div>
  );
}
