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
          <p
            style={{
              fontSize: '11pt',
              margin: '4pt 0 0 0',
              color: '#666',
            }}
          >
            {contactLine}
          </p>
        )}

        {/* PORTFOLIO */}
        {personalInfo.portfolio && (
          <p
            style={{
              fontSize: '11pt',
              margin: '2pt 0 0 0',
              color: '#666',
            }}
          >
            {personalInfo.portfolio}
          </p>
        )}

        {/* FT PROFILE (slug URL) */}
        {personalInfo.ftProfile && (
          <p
            style={{
              fontSize: '11pt',
              margin: '2pt 0 0 0',
              color: '#666',
            }}
          >
            {personalInfo.ftProfile}
          </p>
        )}

        {/* TARGETED ROLE */}
        {personalInfo.targetedRole && (
          <p
            style={{
              fontSize: '12pt',
              fontStyle: 'italic',
              margin: '8pt 0 0 0',
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
              margin: '0 0 6pt 0',
              borderBottom: '1pt solid #000',
              textTransform: 'uppercase',
            }}
          >
            Professional Summary
          </h2>
          <p style={{ margin: 0, fontSize: '11pt' }}>{summary}</p>
        </div>
      )}

      {/* SKILLS (FULL WIDTH) */}
      {skills.length > 0 && (
        <div style={{ marginBottom: '16pt' }}>
          <h2
            style={{
              fontSize: '13pt',
              fontWeight: 'bold',
              margin: '0 0 6pt 0',
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
                  fontSize: '11pt',
                  breakInside: 'avoid',
                }}
              >
                • {skill}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* EXPERIENCE (FULL WIDTH) */}
      {workExperiences.length > 0 && (
        <div style={{ marginBottom: '16pt' }}>
          <h2
            style={{
              fontSize: '13pt',
              fontWeight: 'bold',
              margin: '0 0 6pt 0',
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
                  <strong style={{ fontSize: '11pt' }}>
                    {exp.title || exp.jobTitle}
                  </strong>
                  <span
                    style={{
                      color: '#444',
                      marginLeft: '8pt',
                    }}
                  >
                    {exp.company}
                    {exp.location && ` • ${exp.location}`}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10pt',
                    color: '#666',
                    whiteSpace: 'nowrap',
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
      )}

      {/* PROJECTS */}
      {projects.length > 0 && (
        <div style={{ marginBottom: '16pt' }}>
          <h2
            style={{
              fontSize: '13pt',
              fontWeight: 'bold',
              margin: '0 0 6pt 0',
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
                  <strong style={{ fontSize: '11pt' }}>
                    {proj.title || proj.name}
                  </strong>
                  <span
                    style={{
                      color: '#444',
                      marginLeft: '8pt',
                    }}
                  >
                    {proj.company || proj.org || proj.client}
                    {proj.location && ` • ${proj.location}`}
                  </span>
                </div>
                {(proj.startDate || proj.endDate) && (
                  <span
                    style={{
                      fontSize: '10pt',
                      color: '#666',
                      whiteSpace: 'nowrap',
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
              margin: '0 0 6pt 0',
              borderBottom: '1pt solid #000',
              textTransform: 'uppercase',
            }}
          >
            Education
          </h2>
          {educationList.map((edu, i) => (
            <div key={i} style={{ marginBottom: '10pt' }}>
              {/* Degree + Field */}
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '11pt',
                }}
              >
                {edu.degree} {edu.field && `${edu.field}`}
              </div>

              {/* Institution / School */}
              <div style={{ fontSize: '10pt' }}>
                {(edu.institution || edu.school) && (
                  <>
                    {edu.institution || edu.school}{' '}
                    {edu.location && `• ${edu.location}`}
                  </>
                )}
              </div>

              {/* Dates */}
              <div
                style={{
                  fontSize: '10pt',
                  color: '#666',
                  whiteSpace: 'nowrap',
                }}
              >
                {edu.startDate} – {edu.endDate || 'Present'}
              </div>

              {/* Description / Details */}
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
              {edu.details && !edu.description && (
                <div
                  style={{
                    marginTop: '3pt',
                    fontSize: '10pt',
                  }}
                >
                  {edu.details}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CERTIFICATIONS / TRAINING */}
      {certifications.length > 0 && (
        <div style={{ marginBottom: '16pt' }}>
          <h2
            style={{
              fontSize: '13pt',
              fontWeight: 'bold',
              margin: '0 0 6pt 0',
              borderBottom: '1pt solid #000',
              textTransform: 'uppercase',
            }}
          >
            Certifications &amp; Training
          </h2>
          {certifications.map((cert, i) => {
            // Simple string support
            if (typeof cert === 'string') {
              return (
                <div
                  key={i}
                  style={{
                    marginBottom: '6pt',
                    fontSize: '11pt',
                  }}
                >
                  {cert}
                </div>
              );
            }

            const title =
              cert.name || cert.title || cert.certification;
            const org =
              cert.issuer || cert.organization || cert.provider;
            const date =
              cert.date || cert.issued || cert.obtained;
            const desc =
              cert.description || cert.details;

            return (
              <div key={i} style={{ marginBottom: '8pt' }}>
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '11pt',
                  }}
                >
                  {title}
                </div>
                {(org || date) && (
                  <div
                    style={{
                      fontSize: '10pt',
                      color: '#444',
                    }}
                  >
                    {org}
                    {org && date && ' • '}
                    {date}
                  </div>
                )}
                {desc && (
                  <div
                    style={{
                      marginTop: '3pt',
                      fontSize: '10pt',
                    }}
                  >
                    {desc}
                  </div>
                )}
              </div>
            );
          })}
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
                  margin: '0 0 6pt 0',
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
