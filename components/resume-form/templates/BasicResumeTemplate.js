// components/resume-form/templates/BasicResumeTemplate.js
export default function BasicResumeTemplate({
  formData,
  summary,
  experiences,
  projects,
  volunteerExperiences,
  educationList,
  certifications,
  languages,
  skills,
  achievements,
  customSections,
}) {
  return (
    <article className="max-w-3xl mx-auto p-6 bg-white text-gray-900 font-sans" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* Header */}
      <header className="mb-6 border-b border-gray-400 pb-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{formData.fullName || 'Your Name'}</h1>
          <p className="italic text-gray-700 mt-1">{formData.location || 'Your Location'}</p>
        </div>
        <div className="mt-3 md:mt-0 space-y-1 text-sm text-gray-600">
          {formData.email && (
            <p>
              Email: <a href={`mailto:${formData.email}`} className="underline text-blue-700">{formData.email}</a>
            </p>
          )}
          {formData.phone && (
            <p>Phone: {formData.phone}</p>
          )}
          {formData.portfolio && (
            <p>
              Portfolio: <a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">{formData.portfolio}</a>
            </p>
          )}
        </div>
      </header>

      {/* Professional Summary */}
      {summary && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Career Summary</h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{summary}</p>
        </section>
      )}

      {/* Work Experience */}
      {experiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Professional Background</h2>
          {experiences.map((exp, i) => (
            <div key={i} className="mb-5">
              <h3 className="font-semibold text-lg">
                {exp.jobTitle || 'Job Title'} &mdash; <span className="italic">{exp.company || 'Company'}</span>
              </h3>
              <p className="text-sm text-gray-600 italic mb-1">
                {exp.startDate || 'Start'} &mdash; {exp.endDate || 'End'} | {exp.location || 'Location'}
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 leading-snug">
                {(exp.description || '').split('\n').map((line, idx) => (
                  <li key={idx}>{line.trim()}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Selected Projects</h2>
          {projects.map((proj, i) => (
            <div key={i} className="mb-5">
              <h3 className="font-semibold">{proj.title || 'Project Title'}</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{proj.description || ''}</p>
            </div>
          ))}
        </section>
      )}

      {/* Volunteer Experience */}
      {volunteerExperiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Community Involvement</h2>
          {volunteerExperiences.map((vol, i) => (
            <div key={i} className="mb-5">
              <h3 className="font-semibold">{vol.role || 'Role'} &mdash; <span className="italic">{vol.organization || 'Organization'}</span></h3>
              <p className="text-sm text-gray-600 italic mb-1">{vol.startDate || 'Start'} &mdash; {vol.endDate || 'End'}</p>
              <p className="text-gray-700 whitespace-pre-wrap">{vol.description || ''}</p>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {educationList.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Education & Honors</h2>
          {educationList.map((edu, i) => (
            <div key={i} className="mb-5">
              <h3 className="font-semibold">{edu.degree || 'Degree'}, {edu.school || 'School'}</h3>
              <p className="text-sm text-gray-600 italic mb-1">{edu.startDate || 'Start'} &mdash; {edu.endDate || 'End'}</p>
              <p className="text-gray-700 whitespace-pre-wrap">{edu.description || ''}</p>
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Certifications & Training</h2>
          <ul className="list-disc list-inside text-gray-700">
            {certifications.map((cert, i) => (
              <li key={i}>
                {cert.name || 'Certification Name'} — <span className="italic">{cert.issuer || 'Issuer'}</span> {cert.date ? `(${cert.date})` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Languages</h2>
          <ul className="list-disc list-inside text-gray-700">
            {languages.map((lang, i) => (
              <li key={i}>
                {lang.language || 'Language'} — {lang.proficiency || 'Proficiency'} — {lang.years || 'Years'} years
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Skills</h2>
          <p>{skills.join(', ')}</p>
        </section>
      )}

      {/* Achievements & Awards */}
      {achievements.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Achievements & Awards</h2>
          {achievements.map((item, i) => (
            <div key={i} className="mb-2">
              <h3 className="font-semibold">{item.title || 'Title'}</h3>
              <p>{item.description || ''}</p>
            </div>
          ))}
        </section>
      )}

      {/* Custom Sections */}
      {customSections.length > 0 && customSections.map((section, i) => (
        <section key={i} className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">{section.title || 'Custom Section'}</h2>
          <p>{section.content || ''}</p>
        </section>
      ))}
    </article>
  );
}
