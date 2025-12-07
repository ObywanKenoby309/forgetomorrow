// components/resume-form/templates/HybridResumeTemplate.js

export default function HybridResumeTemplate({ data }) {
  const {
    personalInfo,
    summary,
    workExperiences = [],
    projects = [],
    educationList = [],
    skills = [],
    certifications = [],
    customSections = [],
  } = data;

  const contactLine = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
  ]
    .filter(Boolean)
    .join(' | ');

  return (
    <div
      style={{
        width: '100%',
        padding: 0,
        margin: 0,
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '11pt',
        lineHeight: '1.4',
        color: '#1f2937',
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '20pt' }}>
        {/* NAME */}
        <h1 style={{ fontSize: '28pt', fontWeight: 'bold', margin: 0 }}>
          {personalInfo.name}
        </h1>

        {/* CONTACT LINE */}
        {contactLine && (
          <p style={{ fontSize: '11pt', marginTop: '4pt', color: '#666' }}>
            {contactLine}
          </p>
        )}

        {/* PORTFOLIO */}
        {personalInfo.portfolio && (
          <p style={{ fontSize: '11pt', margin: '2pt 0 0 0', color: '#666' }}>
            {personalInfo.portfolio}
          </p>
        )}

        {/* FT PROFILE */}
        {personalInfo.ftProfile && (
          <p style={{ fontSize: '11pt', margin: '2pt 0 0 0', color: '#666' }}>
            {personalInfo.ftProfile}
          </p>
        )}

        {/* TARGETED ROLE */}
        {personalInfo.targetedRole && (
          <p
            style={{
              fontSize: '12pt',
              fontStyle: 'italic',
              marginTop: '8pt',
              color: '#444',
            }}
          >
            {personalInfo.targetedRole}
          </p>
        )}
      </div>

      {/* SUMMARY */}
      {summary && (
        <div style={{ marginBottom: '16pt' }}>
          <h2
            style={{
              fontSize: '13pt',
              fontWeight: 'bold',
              marginBottom: '6pt',
              borderBottom: '1pt solid '#000',
              textTransform: 'uppercase',
            }}
          >
            Professional Summary
          </h2>
          <p style={{ margin: 0 }}>{summary}</p>
        </div>
      )}

      {/* SKILLS + EXPERIENCE TWO-COLUMN */}
      <div style={{ display: 'flex', gap: '24pt', marginBottom: '16pt' }}>
        {/* LEFT - SKILLS */}
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: '13pt',
              fontWeight: 'bold',
              marginBottom: '6pt',
              borderBottom: '1pt solid #000',
              textTransform: 'uppercase',
            }}
          >
            Skills
          </h2>
          <div style={{ columns: 2, columnGap: '12pt' }}>
            {skills.map((skill, i) => (
              <p
                key={i}
                style={{
                  margin: '2pt 0',
                  breakInside: 'avoid',
                }}
              >
                • {skill}
              </p>
            ))}
          </div>
        </div>

        {/* RIGHT - EXPERIENCE */}
        <div style={{ flex: 2 }}>
          <h2
            style={{
              fontSize: '13pt',
              fontWeight: 'bold',
              marginBottom: '6pt',
              borderBottom: '1pt solid #000',
              textTransform: 'uppercase',
            }}
          >
            Experience
          </h2>

          {workExperiences.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <strong>{exp.title || exp.jobTitle}</strong>
                  <span style={{ marginLeft: '8pt', color: '#444' }}>
                    {exp.company}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10pt',
                    color: '#666',
                    whiteSpace: 'nowrap', // prevent the date from breaking oddly
                  }}
                >
                  {exp.startDate} – {exp.endDate || 'Present'}
                </span>
              </div>

              {(exp.bullets || []).map((b, bi) => (
                <p
                  key={bi}
                  style={{
                    margin: '2pt 0 2pt 16pt',
                    fontSize: '11pt',
                  }}
                >
                  • {b}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PROJECTS */}
      {projects.length > 0 && (
        <div style={{ marginBottom: '16pt' }}>
          <h2
            style={{
              fontSize: '13pt',
              fontWeight: 'bold',
              marginBottom: '6pt',
              borderBottom: '1pt solid #000',
              textTransform: 'uppercase',
            }}
          >
            Projects
          </h2>

          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: '10pt' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <strong>{proj.title || proj.name}</strong>
                  <span style={{ marginLeft: '8pt', color: '#444' }}>
                    {proj.company || proj.org || proj.client}
                  </span>
                </div>

                {(proj.startDate || proj.endDate) && (
                  <span
                    style={{
                      fontSize: '10pt',
                      color: '#666',
                      whiteSpace: 'nowrap', // same fix here
                    }}
                  >
                    {proj.startDate} – {proj.endDate || 'Present'}
                  </span>
                )}
              </div>

              {(proj.bullets || []).map((b, bi) => (
                <p
                  key={bi}
                  style={{
                    margin: '2pt 0 2pt 16pt',
                    fontSize: '11pt',
                  }}
                >
                  • {b}
                </p>
              ))}

              {proj.description &&
                (!proj.bullets || proj.bullets.length === 0) && (
                  <p
                    style={{
                      margin: '2pt 0 2pt 16pt',
                      fontSize: '11pt',
                    }}
                  >
                    {proj.description}
                  </p>
                )}
            </div>
          ))}
        </div>
      )}

      {/* EDUCATION */}
      {educationList.length > 0 && (
        <div style={{ marginBottom: '16pt' }}>
          <h2
            style={{
              fontSize: '13pt',
              fontWeight: 'bold',
              marginBottom: '6pt',
              borderBottom: '1pt solid #000',
              textTransform: 'uppercase',
            }}
          >
            Education
          </h2>

          {educationList.map((edu, i) => (
            <div key={i} style={{ marginBottom: '10pt' }}>
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '11pt',
                }}
              >
                {edu.degree} {edu.field}
              </div>
              <div style={{ fontSize: '10pt' }}>
                {edu.institution || edu.school}
                {edu.location && ` • ${edu.location}`}
              </div>
              <div
                style={{
                  fontSize: '10pt',
                  color: '#666',
                  whiteSpace: 'nowrap',
                }}
              >
                {edu.startDate} – {edu.endDate || 'Present'}
              </div>

              {edu.description && (
                <div
                  style={{
                    marginTop: '3pt',
                    fontSize: '10pt',
                  }}
                >
                  {edu.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CERTIFICATIONS */}
      {certifications.length > 0 && (
        <div style={{ marginBottom: '16pt' }}>
          <h2
            style={{
              fontSize: '13pt',
              fontWeight: 'bold',
              marginBottom: '6pt',
              borderBottom: '1pt solid #000',
              textTransform: 'uppercase',
            }}
          >
            Certifications & Training
          </h2>

          {certifications.map((cert, i) => (
            <div key={i} style={{ marginBottom: '8pt' }}>
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '11pt',
                }}
              >
                {cert.name || cert.title}
              </div>
              <div
                style={{
                  fontSize: '10pt',
                  color: '#444',
                }}
              >
                {cert.organization || cert.issuer}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CUSTOM SECTIONS */}
      {customSections.length > 0 &&
        customSections.map((section, i) => {
          if (!section) return null;

          const title =
            section.title ||
            section.heading ||
            'Additional Information';

          const items = Array.isArray(section.items)
            ? section.items
            : null;

          const content =
            section.content ||
            section.text ||
            section.body;

          return (
            <div key={i} style={{ marginBottom: '16pt' }}>
              <h2
                style={{
                  fontSize: '13pt',
                  fontWeight: 'bold',
                  marginBottom: '6pt',
                  borderBottom: '1pt solid #000',
                  textTransform: 'uppercase',
                }}
              >
                {title}
              </h2>

              {items && items.length > 0 ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '16pt',
                    fontSize: '11pt',
                  }}
                >
                  {items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '3pt' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                content && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '11pt',
                    }}
                  >
                    {content}
                  </p>
                )
              )}
            </div>
          );
        })}
    </div>
  );
}
