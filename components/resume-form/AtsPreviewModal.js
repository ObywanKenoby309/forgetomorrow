// components/resume-form/AtsPreviewModal.js
import React from 'react';

/**
 * Shows a normalized, ATS-style plain-text preview of what will be exported in ATS mode.
 */
export default function AtsPreviewModal({
  open,
  onClose,
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
}) {
  if (!open) return null;

  const name = formData?.name || formData?.fullName || '';
  const email = formData?.email || '';
  const phone = formData?.phone || '';
  const location = formData?.location || '';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center' }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: 'min(1100px, 96vw)',
          maxHeight: '90vh',
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 14,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: '#2a2a2a',
            color: 'white',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontWeight: 800 }}>ATS Preview (plain text)</div>
          <button
            onClick={onClose}
            style={{
              background: '#FF7043', color: 'white', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8, padding: '6px 10px', fontWeight: 800, cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 16, overflow: 'auto', lineHeight: 1.5, fontSize: 14, color: '#263238' }}>
          {/* Contact */}
          <h3 style={{ margin: 0, fontSize: 18 }}>{name}</h3>
          <div style={{ color: '#607D8B', marginBottom: 8 }}>
            {[email, phone, location].filter(Boolean).join(' · ')}
          </div>

          {/* Summary */}
          {summary && (
            <>
              <h4 style={{ margin: '12px 0 6px', fontSize: 14, color: '#37474F' }}>Professional Summary</h4>
              <p style={{ margin: 0 }}>{summary}</p>
            </>
          )}

          {/* Experience */}
          {!!(experiences?.length) && (
            <>
              <h4 style={{ margin: '12px 0 6px', fontSize: 14, color: '#37474F' }}>Work Experience</h4>
              <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                {experiences.map((e, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    <div><strong>{e?.title || ''}</strong>{e?.company ? ` — ${e.company}` : ''}</div>
                    <div style={{ color: '#546E7A', fontSize: 12 }}>{e?.dateRange || e?.range || ''}</div>
                    {(e?.highlights || e?.bullets)?.length ? (
                      <ul style={{ paddingLeft: 16, marginTop: 4 }}>
                        {(e.highlights || e.bullets).map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Projects */}
          {!!(projects?.length) && (
            <>
              <h4 style={{ margin: '12px 0 6px', fontSize: 14, color: '#37474F' }}>Projects</h4>
              <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                {projects.map((p, i) => (
                  <li key={i}>{p?.title || p?.name || 'Project'}{p?.summary ? ` — ${p.summary}` : ''}</li>
                ))}
              </ul>
            </>
          )}

          {/* Volunteer */}
          {!!(volunteerExperiences?.length) && (
            <>
              <h4 style={{ margin: '12px 0 6px', fontSize: 14, color: '#37474F' }}>Volunteer Experience</h4>
              <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                {volunteerExperiences.map((v, i) => (
                  <li key={i}>{v?.title || ''}{v?.organization ? ` — ${v.organization}` : ''}</li>
                ))}
              </ul>
            </>
          )}

          {/* Education */}
          {!!(educationList?.length) && (
            <>
              <h4 style={{ margin: '12px 0 6px', fontSize: 14, color: '#37474F' }}>Education</h4>
              <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                {educationList.map((ed, i) => (
                  <li key={i}>{ed?.degree || ed?.program || ''}{ed?.institution ? ` — ${ed.institution}` : ''}</li>
                ))}
              </ul>
            </>
          )}

          {/* Skills */}
          {!!(skills?.length) && (
            <>
              <h4 style={{ margin: '12px 0 6px', fontSize: 14, color: '#37474F' }}>Skills</h4>
              <div>{skills.join(', ')}</div>
            </>
          )}

          {/* Achievements */}
          {!!(achievements?.length) && (
            <>
              <h4 style={{ margin: '12px 0 6px', fontSize: 14, color: '#37474F' }}>Achievements</h4>
              <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                {achievements.map((a, i) => (<li key={i}>{a}</li>))}
              </ul>
            </>
          )}

          {/* Certifications */}
          {!!(certifications?.length) && (
            <>
              <h4 style={{ margin: '12px 0 6px', fontSize: 14, color: '#37474F' }}>Certifications</h4>
              <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                {certifications.map((c, i) => (<li key={i}>{c?.name || c}</li>))}
              </ul>
            </>
          )}

          {/* Custom */}
          {!!(customSections?.length) && (
            <>
              <h4 style={{ margin: '12px 0 6px', fontSize: 14, color: '#37474F' }}>Additional</h4>
              <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                {customSections.map((c, i) => (<li key={i}>{c?.title || c?.name || 'Item'}</li>))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
