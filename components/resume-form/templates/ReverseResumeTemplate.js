// components/resume-form/templates/ReverseResumeTemplate.js
export default function ReverseResumeTemplate({ data }) {
  const { personalInfo, summary, workExperiences = [], educationList = [], skills = [] } = data;

  return (
    <div style={{
      width: '100%',
      padding: 0,
      margin: 0,
      fontFamily: 'Georgia, serif',
      fontSize: '11pt',
      lineHeight: '1.4',
      color: '#1f2937'
    }}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '20pt' }}>
        <h1 style={{ fontSize: '28pt', fontWeight: 'bold', margin: 0 }}>
          {personalInfo.name}
        </h1>

        {/* CONTACT + LINKS */}
        <p style={{ fontSize: '11pt', margin: '4pt 0 0 0', color: '#666' }}>
          {[
            personalInfo.email,
            personalInfo.phone,
            personalInfo.location,
            personalInfo.linkedin && `LinkedIn: ${personalInfo.linkedin}`,
            personalInfo.github && `GitHub: ${personalInfo.github}`,
            personalInfo.portfolio && `Portfolio: ${personalInfo.portfolio}`,
            personalInfo.ftProfile && `FT Profile: ${personalInfo.ftProfile}`
          ].filter(Boolean).join(' | ')}
        </p>

        {/* TARGETED ROLE */}
        {personalInfo.targetedRole && (
          <p style={{ fontSize: '12pt', fontStyle: 'italic', margin: '8pt 0 0 0', color: '#444' }}>
            {personalInfo.targetedRole}
          </p>
        )}
      </div>

      {/* SUMMARY */}
      {summary && (
        <div style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 6pt 0', borderBottom: '1pt solid #000', textTransform: 'uppercase' }}>
            Professional Summary
          </h2>
          <p style={{ margin: 0, fontSize: '11pt' }}>{summary}</p>
        </div>
      )}

      {/* EXPERIENCE */}
      {workExperiences.length > 0 && (
        <div style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 6pt 0', borderBottom: '1pt solid #000', textTransform: 'uppercase' }}>
            Experience
          </h2>
          {workExperiences.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '11pt' }}>{exp.title || exp.jobTitle}</strong>
                  <span style={{ color: '#444', marginLeft: '8pt' }}>
                    {exp.company} {exp.location && `• ${exp.location}`}
                  </span>
                </div>
                <span style={{ fontSize: '10pt', color: '#666', whiteSpace: 'nowrap' }}>
                  {exp.startDate} – {exp.endDate || 'Present'}
                </span>
              </div>
              {(exp.bullets || []).map((b, bi) => (
                <p key={bi} style={{ margin: '3pt 0 3pt 16pt', fontSize: '11pt' }}>
                  {b}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* EDUCATION */}
      {educationList.length > 0 && (
        <div style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 6pt 0', borderBottom: '1pt solid #000', textTransform: 'uppercase' }}>
            Education
          </h2>
          {educationList.map((edu, i) => (
            <div key={i} style={{ marginBottom: '10pt' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>
                {edu.degree} {edu.field && `${edu.field}`}
              </div>
              <div style={{ fontSize: '10pt' }}>
                {edu.school} {edu.location && `• ${edu.location}`}
              </div>
              <div style={{ fontSize: '10pt', color: '#666' }}>
                {edu.startDate} – {edu.endDate || 'Present'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SKILLS */}
      {skills.length > 0 && (
        <div>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 6pt 0', borderBottom: '1pt solid #000', textTransform: 'uppercase' }}>
            Skills
          </h2>
          <p style={{ margin: 0, fontSize: '11pt' }}>
            {skills.join(' • ')}
          </p>
        </div>
      )}
    </div>
  );
}