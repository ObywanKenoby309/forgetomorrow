// components/resume-form/templates/HybridResumeTemplate.js
export default function HybridResumeTemplate({ data }) {
  const { personalInfo, summary, workExperiences = [], educationList = [], skills = [] } = data;

  return (
    <div style={{
      width: '100%',
      padding: 0,
      margin: 0,
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: '11pt',
      lineHeight: '1.4',
      color: '#1f2937'
    }}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '20pt' }}>
        <h1 style={{ fontSize: '28pt', fontWeight: 'bold', margin: 0 }}>
          {personalInfo.name}
        </h1>
        <p style={{ fontSize: '11pt', margin: '4pt 0 0 0', color: '#666' }}>
          {[
            personalInfo.email,
            personalInfo.phone,
            personalInfo.location,
            personalInfo.linkedin,
            personalInfo.github,
            personalInfo.portfolio,
            personalInfo.ftProfile
          ].filter(Boolean).join(' | ')}
        </p>
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

      {/* TWO-COLUMN: SKILLS + EXPERIENCE */}
      <div style={{ display: 'flex', gap: '24pt', marginBottom: '16pt' }}>
        {/* LEFT: SKILLS */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 6pt 0', borderBottom: '1pt solid #000', textTransform: 'uppercase' }}>
            Skills
          </h2>
          <div style={{ columns: 2, columnGap: '12pt' }}>
            {skills.map((skill, i) => (
              <p key={i} style={{ margin: '2pt 0', fontSize: '11pt', breakInside: 'avoid' }}>
                • {skill}
              </p>
            ))}
          </div>
        </div>

        {/* RIGHT: EXPERIENCE */}
        <div style={{ flex: 2 }}>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 6pt 0', borderBottom: '1pt solid #000', textTransform: 'uppercase' }}>
            Experience
          </h2>
          {workExperiences.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '11pt' }}>{exp.title || exp.jobTitle}</strong>
                  <span style={{ color: '#444', marginLeft: '8pt' }}>{exp.company}</span>
                </div>
                <span style={{ fontSize: '10pt', color: '#666' }}>
                  {exp.startDate} – {exp.endDate || 'Present'}
                </span>
              </div>
              {(exp.bullets || []).map((b, bi) => (
                <p key={bi} style={{ margin: '2pt 0 2pt 16pt', fontSize: '11pt' }}>• {b}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

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
    </div>
  );
}