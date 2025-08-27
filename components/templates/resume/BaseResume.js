// components/templates/resume/BaseResume.jsx
// Shared renderer used by the 4 resume variants via simple theme props.

import React from 'react';

const ORANGE = '#FF7043';
const SLATE = '#455A64';

export default function BaseResume({
  theme = 'modern', // 'modern' | 'classic' | 'formal' | 'impact'
  accent = ORANGE,
  density = 'medium', // 'low'|'medium'|'high' controls spacing
  data = {},
}) {
  const {
    formData = {},
    summary = '',
    experiences = [],
    projects = [],
    volunteerExperiences = [],
    educationList = [],
    certifications = [],
    languages = [],
    skills = [],
    achievements = [],
    customSections = [],
  } = data;

  const padY = density === 'high' ? 6 : density === 'low' ? 14 : 10;
  const sectionTitleStyle = {
    fontWeight: 900,
    fontSize: theme === 'formal' ? 14 : 16,
    color: theme === 'formal' ? '#37474F' : accent,
    margin: `${padY}px 0 ${padY - 2}px`,
    textTransform: theme === 'classic' || theme === 'formal' ? 'uppercase' : 'none',
    letterSpacing: theme === 'formal' ? '0.04em' : 'normal',
    borderBottom: theme === 'impact' ? `2px solid ${accent}` : 'none',
    paddingBottom: theme === 'impact' ? 4 : 0,
  };

  const small = { fontSize: 12, color: '#607D8B' };
  const bullet = { margin: '0 0 6px 16px' };

  return (
    <div style={{ background: 'white', color: '#263238', fontFamily: 'Inter, system-ui, Arial', padding: 24, borderRadius: 12, border: '1px solid #eee' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{formData.fullName || 'Your Name'}</div>
          <div style={small}>{formData.title || formData.headline || 'Target Role'}</div>
        </div>
        <div style={{ textAlign: 'right', ...small }}>
          {[formData.email, formData.phone, formData.location].filter(Boolean).join(' • ')}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <>
          <div style={sectionTitleStyle}>Professional Summary</div>
          <p style={{ margin: '6px 0 0', lineHeight: 1.35, color: SLATE }}>{summary}</p>
        </>
      )}

      {/* Experience */}
      {!!experiences?.length && (
        <>
          <div style={sectionTitleStyle}>Work Experience</div>
          {experiences.map((xp, i) => (
            <div key={i} style={{ marginBottom: padY + 4 }}>
              <div style={{ fontWeight: 800 }}>{xp.title || 'Title'} — {xp.company || 'Company'}</div>
              <div style={small}>{[xp.location, xp.startDate, xp.endDate || 'Present'].filter(Boolean).join(' • ')}</div>
              <ul style={{ margin: '6px 0 0', padding: 0 }}>
                {(xp.bullets || []).map((b, j) => <li key={j} style={bullet}>{b}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Projects */}
      {!!projects?.length && (
        <>
          <div style={sectionTitleStyle}>Projects</div>
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: padY + 4 }}>
              <div style={{ fontWeight: 800 }}>{p.name || 'Project'}</div>
              <div style={small}>{p.role || ''}</div>
              <ul style={{ margin: '6px 0 0', padding: 0 }}>
                {(p.bullets || []).map((b, j) => <li key={j} style={bullet}>{b}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Volunteer */}
      {!!volunteerExperiences?.length && (
        <>
          <div style={sectionTitleStyle}>Volunteer Experience</div>
          {volunteerExperiences.map((v, i) => (
            <div key={i} style={{ marginBottom: padY + 4 }}>
              <div style={{ fontWeight: 800 }}>{v.org || 'Organization'}</div>
              <div style={small}>{[v.role, v.startDate, v.endDate || 'Present'].filter(Boolean).join(' • ')}</div>
              <ul style={{ margin: '6px 0 0', padding: 0 }}>
                {(v.bullets || []).map((b, j) => <li key={j} style={bullet}>{b}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Education */}
      {!!educationList?.length && (
        <>
          <div style={sectionTitleStyle}>Education</div>
          {educationList.map((e, i) => (
            <div key={i} style={{ marginBottom: padY + 4 }}>
              <div style={{ fontWeight: 800 }}>{e.school || 'School'}</div>
              <div style={small}>{[e.degree, e.field, e.graduationDate].filter(Boolean).join(' • ')}</div>
            </div>
          ))}
        </>
      )}

      {/* Certifications */}
      {!!certifications?.length && (
        <>
          <div style={sectionTitleStyle}>Certifications / Training</div>
          {certifications.map((c, i) => (
            <div key={i} style={{ marginBottom: padY + 4 }}>
              <div style={{ fontWeight: 800 }}>{c.name || 'Certification'}</div>
              <div style={small}>{[c.issuer, c.year].filter(Boolean).join(' • ')}</div>
            </div>
          ))}
        </>
      )}

      {/* Skills / Languages / Achievements */}
      {(skills?.length || languages?.length || achievements?.length) && (
        <>
          <div style={sectionTitleStyle}>Skills</div>
          {!!skills?.length && <div style={{ marginBottom: padY, color: SLATE }}>{skills.join(' • ')}</div>}
          {!!languages?.length && (
            <>
              <div style={{ ...sectionTitleStyle, marginTop: 4 }}>Languages</div>
              <div style={{ marginBottom: padY, color: SLATE }}>{languages.join(' • ')}</div>
            </>
          )}
          {!!achievements?.length && (
            <>
              <div style={{ ...sectionTitleStyle, marginTop: 4 }}>Achievements / Awards</div>
              <ul style={{ margin: '6px 0 0', padding: 0 }}>
                {achievements.map((a, i) => <li key={i} style={bullet}>{a}</li>)}
              </ul>
            </>
          )}
        </>
      )}

      {/* Custom Sections */}
      {(customSections || []).map((s, i) => (
        <div key={i}>
          <div style={sectionTitleStyle}>{s.title || 'Additional'}</div>
          <div style={{ color: SLATE }}>{s.content || ''}</div>
        </div>
      ))}
    </div>
  );
}
