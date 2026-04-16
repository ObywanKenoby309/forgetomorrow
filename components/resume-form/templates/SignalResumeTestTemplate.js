// components/resume-form/templates/SignalResumeTestTemplate.js
import React from 'react';

const ORANGE = '#FF7043';
const SLATE = '#334155';
const MUTED = '#64748B';
const DARK = '#111827';
const RULE = '#E5E7EB';

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getName(data) {
  return (
    data?.personalInfo?.name ||
    data?.personalInfo?.fullName ||
    'Your Name'
  );
}

function getContactLine(data) {
  const info = data?.personalInfo || {};
  return [
    info.email,
    info.phone,
    info.location,
    info.externalurl,
    info.github,
    info.portfolio,
    info.ftProfile,
  ]
    .filter(Boolean)
    .join('  ·  ');
}

function getPositioningLine(data) {
  const info = data?.personalInfo || {};
  const summary = String(data?.summary || '').trim();

  if (info.targetedRole && summary) {
    const shortSummary = summary.split('.').slice(0, 1).join('.').slice(0, 160);
    return `${info.targetedRole} — ${shortSummary}`;
  }
  if (info.targetedRole) return info.targetedRole;
  if (summary) return summary.split('.').slice(0, 1).join('.').slice(0, 160);
  return 'Positioning statement goes here';
}

function collectImpactSnapshot(data) {
  const achievements = normalizeArray(data?.achievements).filter(Boolean);
  if (achievements.length) {
    return achievements
      .sort((a, b) => String(b).length - String(a).length)
      .slice(0, 5);
  }

  const work = normalizeArray(data?.workExperiences);
  const bullets = [];
  for (const role of work) {
    const roleBullets = normalizeArray(role?.bullets || role?.highlights);
    for (const bullet of roleBullets) {
      if (
        bullet &&
        /%|\$|million|k|reduced|increased|scaled|launched|built/i.test(bullet)
      ) {
        bullets.push(bullet);
      }
    }
  }
  return bullets.slice(0, 5);
}

function buildEmployerSpine(data) {
  const work = normalizeArray(data?.workExperiences);
  return work.map((role) => ({
    company: role?.company || '',
    title: role?.title || role?.role || '',
    range:
      role?.dateRange ||
      role?.range ||
      [role?.startDate || role?.start, role?.endDate || role?.end]
        .filter(Boolean)
        .join(' – '),
  }));
}

function groupSkills(skills) {
  const all = normalizeArray(skills).filter(Boolean);

  const buckets = {
    'Systems & Operations': [],
    'Leadership & Delivery': [],
    'Tools & Platforms': [],
    'Domain & Functional': [],
  };

  const toolHints = [
    'salesforce', 'jira', 'servicenow', 'excel', 'sql', 'tableau',
    'power bi', 'zendesk', 'hubspot', 'figma', 'notion', 'asana',
    'trello', 'slack', 'google analytics', 'workday', 'sap', 'oracle', 'microsoft',
  ];
  const leadershipHints = [
    'leadership', 'coaching', 'training', 'mentoring', 'management',
    'cross-functional', 'stakeholder', 'program', 'delivery', 'team',
  ];
  const systemsHints = [
    'operations', 'process', 'workflow', 'onboarding', 'support ops',
    'continuous improvement', 'quality', 'compliance', 'optimization',
    'system', 'implementation', 'scaling', 'efficiency',
  ];

  all.forEach((skill) => {
    const s = String(skill).toLowerCase();
    if (toolHints.some((h) => s.includes(h))) {
      buckets['Tools & Platforms'].push(skill);
    } else if (leadershipHints.some((h) => s.includes(h))) {
      buckets['Leadership & Delivery'].push(skill);
    } else if (systemsHints.some((h) => s.includes(h))) {
      buckets['Systems & Operations'].push(skill);
    } else {
      buckets['Domain & Functional'].push(skill);
    }
  });

  Object.keys(buckets).forEach((key) => {
    buckets[key] = buckets[key].slice(0, 6);
  });

  return buckets;
}

// ─── Design primitives ──────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: ORANGE,
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: `2px solid ${ORANGE}`,
        display: 'inline-block',
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: RULE, margin: '0 0 18px' }} />;
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function SignalResumeTestTemplate({ data }) {
  const name = getName(data);
  const contactLine = getContactLine(data);
  const positioningLine = getPositioningLine(data);
  const impactSnapshot = collectImpactSnapshot(data);
  const employerSpine = buildEmployerSpine(data);
  const skillBuckets = groupSkills(data?.skills);

  const work = normalizeArray(data?.workExperiences);
  const education = normalizeArray(data?.educationList);
  const projects = normalizeArray(data?.projects);
  const certifications = normalizeArray(data?.certifications);
  const languages = normalizeArray(data?.languages);
  const customSections = normalizeArray(data?.customSections);

  const singleRole = employerSpine.length <= 1;
  const singleRoleItem = singleRole ? employerSpine[0] : null;

  const hasSkills = Object.values(skillBuckets).some((arr) => arr.length > 0);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Sora', sans-serif", color: DARK, lineHeight: 1.5 }}>

      {/* ══════════════════════════════════════════
          PAGE 1 — SIGNAL PAGE
      ══════════════════════════════════════════ */}

      {/* ── Header Strip ── */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: DARK,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: 4,
          }}
        >
          {name}
        </div>

        {positioningLine && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: SLATE,
              marginBottom: 6,
              lineHeight: 1.4,
            }}
          >
            {positioningLine}
          </div>
        )}

        {contactLine && (
          <div style={{ fontSize: 11.5, color: MUTED, letterSpacing: '0.01em' }}>
            {contactLine}
          </div>
        )}

        <div style={{ height: 3, background: ORANGE, borderRadius: 2, marginTop: 14 }} />
      </div>

      {/* ── Impact Snapshot ── */}
      <div style={{ marginBottom: 22 }}>
        <SectionLabel>Impact Snapshot</SectionLabel>
        {impactSnapshot.length ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
            {impactSnapshot.map((item, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  fontSize: 13,
                  color: '#1E293B',
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    marginTop: 5,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: ORANGE,
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 13, color: MUTED, fontStyle: 'italic' }}>
            Add 3–5 strongest wins to populate your signal layer.
          </div>
        )}
      </div>

      {/* ── Core Capabilities ── */}
      {hasSkills && (
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>Core Capabilities</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
            {Object.entries(skillBuckets).map(([label, items]) =>
              items.length ? (
                <div key={label}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      color: SLATE,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 3,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                    {items.join('  ·  ')}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* ── Employer Spine ── */}
      <div style={{ marginBottom: 8 }}>
        <SectionLabel>
          {singleRole ? 'Current Role' : 'Career at a Glance'}
        </SectionLabel>

        {singleRole ? (
          singleRoleItem ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: DARK }}>
                {singleRoleItem.company || 'Company'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: SLATE }}>
                {singleRoleItem.title || 'Role'}
              </div>
              {singleRoleItem.range && (
                <div style={{ fontSize: 12, color: MUTED }}>{singleRoleItem.range}</div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: MUTED, fontStyle: 'italic' }}>
              Add experience to show your current role.
            </div>
          )
        ) : employerSpine.length ? (
          <div>
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr auto',
                gap: 12,
                paddingBottom: 5,
                marginBottom: 6,
                borderBottom: `1px solid ${RULE}`,
              }}
            >
              {['Company', 'Title', 'Dates'].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: 9.5,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                    color: MUTED,
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {employerSpine.map((item, idx) => (
              <div
                key={`${item.company}-${idx}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr auto',
                  gap: 12,
                  alignItems: 'baseline',
                  padding: '6px 0',
                  borderBottom: idx !== employerSpine.length - 1 ? `1px solid ${RULE}` : 'none',
                  opacity: idx > 3 ? 0.55 : 1,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 13, color: DARK }}>
                  {item.company || 'Company'}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: SLATE,
                    fontWeight: idx === 0 ? 700 : 500,
                  }}
                >
                  {item.title || 'Role'}
                </div>
                <div style={{ fontSize: 12, color: MUTED, whiteSpace: 'nowrap' }}>
                  {item.range || ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: MUTED, fontStyle: 'italic' }}>
            Add work experience to generate your career timeline.
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          PAGE BREAK
      ══════════════════════════════════════════ */}
      <div
        style={{
          margin: '32px 0 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, height: 1, background: '#D1D5DB' }} />
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 900,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#9CA3AF',
            whiteSpace: 'nowrap',
          }}
        >
          Full Career History
        </div>
        <div style={{ flex: 1, height: 1, background: '#D1D5DB' }} />
      </div>

      {/* ══════════════════════════════════════════
          PAGE 2+ — STORY PAGES
      ══════════════════════════════════════════ */}

      {/* ── Professional Experience ── */}
      {work.length > 0 && (
        <div style={{ marginBottom: 26 }}>
          <SectionLabel>Professional Experience</SectionLabel>
          <div style={{ display: 'grid', gap: 20 }}>
            {work.map((role, idx) => {
              const bullets = normalizeArray(role?.bullets || role?.highlights);
              const range =
                role?.dateRange ||
                role?.range ||
                [role?.startDate || role?.start, role?.endDate || role?.end]
                  .filter(Boolean)
                  .join(' – ');

              return (
                <div key={idx}>
                  {/* Role header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: DARK, lineHeight: 1.2 }}>
                        {role?.title || role?.role || 'Role'}
                      </div>
                      <div style={{ fontSize: 12.5, color: SLATE, fontWeight: 700, marginTop: 1 }}>
                        {role?.company || 'Company'}
                        {role?.location ? `  ·  ${role.location}` : ''}
                      </div>
                    </div>
                    {range && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: MUTED,
                          whiteSpace: 'nowrap',
                          paddingTop: 2,
                        }}
                      >
                        {range}
                      </div>
                    )}
                  </div>

                  {bullets.length > 0 && (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
                      {bullets.map((bullet, bIdx) => (
                        <li
                          key={bIdx}
                          style={{
                            display: 'flex',
                            gap: 9,
                            alignItems: 'flex-start',
                            fontSize: 12.5,
                            color: '#374151',
                            lineHeight: 1.45,
                          }}
                        >
                          <span
                            style={{
                              flexShrink: 0,
                              marginTop: 6,
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              background: '#9CA3AF',
                            }}
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}

                  {idx < work.length - 1 && (
                    <div style={{ marginTop: 18, height: 1, background: '#F1F5F9' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Education ── */}
      {education.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>Education</SectionLabel>
          <div style={{ display: 'grid', gap: 10 }}>
            {education.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 4,
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: DARK }}>
                    {item?.degree || item?.program || 'Degree'}
                    {item?.field ? `, ${item.field}` : ''}
                  </div>
                  <div style={{ fontSize: 12.5, color: SLATE }}>
                    {item?.school || item?.institution || 'School'}
                  </div>
                </div>
                {(item?.startDate || item?.endDate) && (
                  <div style={{ fontSize: 11.5, color: MUTED, whiteSpace: 'nowrap' }}>
                    {[item?.startDate, item?.endDate].filter(Boolean).join(' – ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Projects ── */}
      {projects.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>Projects</SectionLabel>
          <div style={{ display: 'grid', gap: 12 }}>
            {projects.map((project, idx) => {
              const bullets = normalizeArray(project?.bullets || project?.highlights);
              return (
                <div key={idx}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: DARK }}>
                    {project?.title || project?.name || 'Project'}
                  </div>
                  {project?.company && (
                    <div style={{ fontSize: 12.5, color: SLATE, marginTop: 1 }}>
                      {project.company}
                    </div>
                  )}
                  {bullets.length > 0 && (
                    <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
                      {bullets.map((bullet, bIdx) => (
                        <li
                          key={bIdx}
                          style={{
                            display: 'flex',
                            gap: 9,
                            alignItems: 'flex-start',
                            fontSize: 12.5,
                            color: '#374151',
                            lineHeight: 1.45,
                          }}
                        >
                          <span
                            style={{
                              flexShrink: 0,
                              marginTop: 6,
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              background: '#9CA3AF',
                            }}
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Additional (Certs / Languages / Custom) ── */}
      {(certifications.length > 0 || languages.length > 0 || customSections.length > 0) && (
        <div style={{ marginBottom: 8 }}>
          <SectionLabel>Additional</SectionLabel>
          <div style={{ display: 'grid', gap: 10 }}>
            {certifications.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: SLATE,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 3,
                  }}
                >
                  Certifications
                </div>
                <div style={{ fontSize: 12.5, color: '#374151' }}>
                  {certifications
                    .map((c) => (typeof c === 'string' ? c : c?.name || 'Certification'))
                    .filter(Boolean)
                    .join('  ·  ')}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: SLATE,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 3,
                  }}
                >
                  Languages
                </div>
                <div style={{ fontSize: 12.5, color: '#374151' }}>
                  {languages.join('  ·  ')}
                </div>
              </div>
            )}

            {customSections.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: SLATE,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 3,
                  }}
                >
                  Other
                </div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {customSections.map((section, idx) => (
                    <div key={idx} style={{ fontSize: 12.5, color: '#374151' }}>
                      {section?.title || section?.name || 'Custom Section'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}