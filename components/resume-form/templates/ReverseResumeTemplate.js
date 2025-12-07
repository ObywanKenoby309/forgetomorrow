// components/resume-form/templates/ReverseResumeTemplate.js
export default function ReverseResumeTemplate({ data }) {
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

  // Build contact line (email | phone | location)
  const contactLine = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
  ].filter(Boolean).join(" | ");

  return (
    <div
      style={{
        width: '100%',
        padding: 0,
        margin: 0,
        fontFamily: 'Georgia, serif',
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
          <p style={{ fontSize: '11pt', margin: '4pt 0 0 0', color: '#666' }}>
            {contactLine}
          </p>
        )}

        {/* PORTFOLIO */}
        {personalInfo.portfolio && (
          <p style={{ fontSize: '11pt', margin: '2pt 0 0 0', color: '#666' }}>
            {personalInfo.portfolio}
          </p>
        )}

        {/* FT PROFILE SLUG */}
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

      {/* EXPERIENCE */}
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
                  <span style={{ color: '#444', marginLeft: '8pt' }}>
                    {exp.company}
                    {exp.location && ` • ${exp.location}`}
                  </span>
                </div>
                <span style={{ fontSize: '10pt', color: '#666' }}>
                  {exp.startDate} – {exp.endDate || "Present"}
                </span>
              </div>

              {(exp.bullets || []).map((b, bi) => (
                <p key={bi} style={{ margin: '3pt 0 3pt 16pt' }}>
                  {b}
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
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <strong>{proj.title || proj.name}</strong>
                  <span style={{ color: '#444', marginLeft: '8pt' }}>
                    {proj.company || proj.org || proj.client}
                  </span>
                </div>
                {(proj.startDate || proj.endDate) && (
                  <span style={{ fontSize: '10pt', color: '#666' }}>
                    {proj.startDate} – {proj.endDate || "Present"}
                  </span>
                )}
              </div>

              {(proj.bullets || []).map((b, bi) => (
                <p key={bi} style={{ margin: '3pt 0 3pt 16pt' }}>
                  {b}
                </p>
              ))}

              {proj.description && (!proj.bullets || proj.bullets.length === 0) && (
                <p style={{ margin: '3pt 0 3pt 16pt' }}>{proj.description}</p>
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
              <div style={{ fontWeight: 'bold' }}>
                {edu.degree} {edu.field}
              </div>
              <div style={{ fontSize: '10pt' }}>
                {edu.institution || edu.school}
                {edu.location && ` • ${edu.location}`}
              </div>
              <div style={{ fontSize: '10pt', color: '#666' }}>
                {edu.startDate} – {edu.endDate || "Present"}
              </div>

              {edu.description && (
                <div style={{ marginTop: '3pt', fontSize: '10pt' }}>
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
              margin: '0 0 6pt 0',
              borderBottom: '1pt solid #000',
              textTransform: 'uppercase',
            }}
          >
            Certifications & Training
          </h2>

          {certifications.map((cert, i) => (
            <div key={i} style={{ marginBottom: '8pt' }}>
              <div style={{ fontWeight: 'bold' }}>{cert.name || cert.title}</div>
              <div style={{ fontSize: '10pt', color: '#444' }}>
                {cert.issuer || cert.organization}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SKILLS */}
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

          <p>{skills.join(" • ")}</p>
        </div>
      )}

      {/* CUSTOM SECTIONS */}
      {customSections.length > 0 &&
        customSections.map((section, i) => (
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
              {section.title || section.heading || "Additional Information"}
            </h2>

            {Array.isArray(section.items) ? (
              <ul style={{ margin: 0, paddingLeft: '16pt' }}>
                {section.items.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '3pt' }}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              section.content && <p>{section.content}</p>
            )}
          </div>
        ))}
    </div>
  );
}
