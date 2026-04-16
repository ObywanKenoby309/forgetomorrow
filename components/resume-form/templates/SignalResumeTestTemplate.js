// components/resume-form/templates/SignalResumeTestTemplate.js
import React from 'react';

const ORANGE = '#FF7043';

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
    .join(' • ');
}

function getPositioningLine(data) {
  const info = data?.personalInfo || {};
  const summary = String(data?.summary || '').trim();

  if (info.targetedRole && summary) {
    const shortSummary = summary.split('.').slice(0, 1).join('.').slice(0, 140);
    return `${info.targetedRole} — ${shortSummary}`;
  }

  if (info.targetedRole) return info.targetedRole;
  if (summary) return summary.split('.').slice(0, 1).join('.').slice(0, 140);

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
        .join(' — '),
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
    'salesforce',
    'jira',
    'servicenow',
    'excel',
    'sql',
    'tableau',
    'power bi',
    'zendesk',
    'hubspot',
    'figma',
    'notion',
    'asana',
    'trello',
    'slack',
    'google analytics',
    'workday',
    'sap',
    'oracle',
    'microsoft',
  ];

  const leadershipHints = [
    'leadership',
    'coaching',
    'training',
    'mentoring',
    'management',
    'cross-functional',
    'stakeholder',
    'program',
    'delivery',
    'team',
  ];

  const systemsHints = [
    'operations',
    'process',
    'workflow',
    'onboarding',
    'support ops',
    'continuous improvement',
    'quality',
    'compliance',
    'optimization',
    'system',
    'implementation',
    'scaling',
    'efficiency',
  ];

  all.forEach((skill) => {
    const s = String(skill).toLowerCase();

    if (toolHints.some((hint) => s.includes(hint))) {
      buckets['Tools & Platforms'].push(skill);
    } else if (leadershipHints.some((hint) => s.includes(hint))) {
      buckets['Leadership & Delivery'].push(skill);
    } else if (systemsHints.some((hint) => s.includes(hint))) {
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

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: ORANGE,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: 14,
        background: '#FFFFFF',
      }}
    >
      {children}
    </div>
  );
}

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

  return (
    <div style={{ display: 'grid', gap: 24, color: '#111827' }}>
      {/* PAGE 1 — SIGNAL PAGE */}
      <div style={{ display: 'grid', gap: 14 }}>
        <div
          style={{
            borderBottom: '2px solid #F3F4F6',
            paddingBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.1,
              color: '#111827',
            }}
          >
            {name}
          </div>

          {contactLine ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: '#475569',
                lineHeight: 1.5,
              }}
            >
              {contactLine}
            </div>
          ) : null}

          <div
            style={{
              marginTop: 10,
              fontSize: 15,
              fontWeight: 700,
              color: '#1F2937',
              lineHeight: 1.45,
            }}
          >
            {positioningLine}
          </div>
        </div>

        <Card>
          <SectionTitle>Impact Snapshot</SectionTitle>
          {impactSnapshot.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
              {impactSnapshot.map((item, idx) => (
                <li key={idx} style={{ fontSize: 14, lineHeight: 1.45 }}>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 14, color: '#64748B' }}>
              Add 3–5 strongest wins to test the signal-first layout.
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>Core Capabilities</SectionTitle>
          <div style={{ display: 'grid', gap: 10 }}>
            {Object.entries(skillBuckets).map(([label, items]) =>
              items.length ? (
                <div key={label}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    {items.join(' · ')}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </Card>

        {singleRole ? (
          <Card>
            <SectionTitle>Current Role Context</SectionTitle>
            {singleRoleItem ? (
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontWeight: 900, fontSize: 14, color: '#111827' }}>
                  {singleRoleItem.company || 'Company'}
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  {singleRoleItem.title || 'Role'}
                </div>

                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {singleRoleItem.range || ''}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#64748B' }}>
                Add experience to show current role context.
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <SectionTitle>Employer Spine</SectionTitle>
            <div style={{ display: 'grid', gap: 8 }}>
              {employerSpine.length ? (
                employerSpine.map((item, idx) => (
                  <div
                    key={`${item.company}-${idx}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr) auto',
                      gap: 10,
                      fontSize: 13,
                      alignItems: 'baseline',
                      opacity: idx > 2 ? 0.6 : 1,
                      borderBottom: idx !== employerSpine.length - 1 ? '1px solid #F1F5F9' : 'none',
                      paddingBottom: idx !== employerSpine.length - 1 ? 8 : 0,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#111827' }}>
                      {item.company || 'Company'}
                    </div>

                    <div style={{ color: '#334155', fontWeight: idx === 0 ? 700 : 500 }}>
                      {item.title || 'Role'}
                    </div>

                    <div style={{ color: '#64748B', whiteSpace: 'nowrap' }}>
                      {item.range || ''}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 14, color: '#64748B' }}>
                  Add experience to see your employer spine.
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* PAGE BREAK VISUAL */}
      <div
        style={{
          borderTop: '3px dashed #E5E7EB',
          paddingTop: 10,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#94A3B8',
        }}
      >
        Story Pages — Full Chronological History
      </div>

      {/* PAGE 2+ — STORY PAGES */}
      <div style={{ display: 'grid', gap: 18 }}>
        <Card>
          <SectionTitle>Professional Experience</SectionTitle>
          <div style={{ display: 'grid', gap: 16 }}>
            {work.length ? (
              work.map((role, idx) => {
                const bullets = normalizeArray(role?.bullets || role?.highlights);
                const range =
                  role?.dateRange ||
                  role?.range ||
                  [role?.startDate || role?.start, role?.endDate || role?.end]
                    .filter(Boolean)
                    .join(' — ');

                return (
                  <div key={idx} style={{ display: 'grid', gap: 6 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
                        {role?.title || role?.role || 'Role'}
                      </div>
                      <div style={{ fontSize: 13, color: '#334155', fontWeight: 700 }}>
                        {role?.company || 'Company'}
                        {role?.location ? ` • ${role.location}` : ''}
                        {range ? ` • ${range}` : ''}
                      </div>
                    </div>

                    {bullets.length ? (
                      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                        {bullets.map((bullet, bulletIdx) => (
                          <li key={bulletIdx} style={{ fontSize: 13, lineHeight: 1.45, color: '#374151' }}>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: 14, color: '#64748B' }}>No experience added yet.</div>
            )}
          </div>
        </Card>

        {education.length ? (
          <Card>
            <SectionTitle>Education</SectionTitle>
            <div style={{ display: 'grid', gap: 10 }}>
              {education.map((item, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                    {item?.degree || item?.program || 'Degree'}
                    {item?.field ? `, ${item.field}` : ''}
                  </div>
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    {item?.school || item?.institution || 'School'}
                    {item?.startDate || item?.endDate
                      ? ` • ${[item?.startDate, item?.endDate].filter(Boolean).join(' — ')}`
                      : ''}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {projects.length ? (
          <Card>
            <SectionTitle>Projects</SectionTitle>
            <div style={{ display: 'grid', gap: 10 }}>
              {projects.map((project, idx) => {
                const bullets = normalizeArray(project?.bullets || project?.highlights);
                return (
                  <div key={idx}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                      {project?.title || project?.name || 'Project'}
                    </div>
                    {project?.company ? (
                      <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                        {project.company}
                      </div>
                    ) : null}
                    {bullets.length ? (
                      <ul style={{ margin: '6px 0 0', paddingLeft: 18, display: 'grid', gap: 5 }}>
                        {bullets.map((bullet, bulletIdx) => (
                          <li key={bulletIdx} style={{ fontSize: 13, lineHeight: 1.45, color: '#374151' }}>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        ) : null}

        {(certifications.length || languages.length || customSections.length) ? (
          <Card>
            <SectionTitle>Additional</SectionTitle>
            <div style={{ display: 'grid', gap: 10 }}>
              {certifications.length ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Certifications
                  </div>
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    {certifications
                      .map((c) => (typeof c === 'string' ? c : c?.name || 'Certification'))
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                </div>
              ) : null}

              {languages.length ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Languages
                  </div>
                  <div style={{ fontSize: 13, color: '#475569' }}>{languages.join(' • ')}</div>
                </div>
              ) : null}

              {customSections.length ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Custom Sections
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {customSections.map((section, idx) => (
                      <div key={idx} style={{ fontSize: 13, color: '#475569' }}>
                        {section?.title || section?.name || 'Custom Section'}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}