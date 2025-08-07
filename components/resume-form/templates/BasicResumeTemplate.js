// components/resume-form/templates/BasicResumeTemplate.js
export default function BasicResumeTemplate({
  formData,
  summary,
  experiences,
  projects,
  volunteerExperiences,
  educationList,
  certifications,
  skills,
  achievements,
  customSections,
}) {
  return (
    <article className="max-w-3xl mx-auto p-6 bg-white text-gray-900 font-sans">
      {/* Contact Info */}
      <header className="mb-6 border-b border-gray-300 pb-4">
        <h1 className="text-3xl font-bold">{formData.fullName || 'Your Name'}</h1>
        <p>
          {formData.email && <span>{formData.email}</span>}
          {formData.phone && <span> | {formData.phone}</span>}
          {formData.location && <span> | {formData.location}</span>}
        </p>
        {formData.portfolio && (
          <p>
            Portfolio: <a href={formData.portfolio} target="_blank" rel="noreferrer" className="text-blue-600 underline">{formData.portfolio}</a>
          </p>
        )}
      </header>

      {/* Professional Summary */}
      {summary && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-300 mb-2">Professional Summary</h2>
          <p>{summary}</p>
        </section>
      )}

      {/* Work Experience */}
      {experiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-300 mb-2">Work Experience</h2>
          {experiences.map((exp, i) => (
            <div key={i} className="mb-4">
              <h3 className="font-semibold">{exp.jobTitle || 'Job Title'} — {exp.company || 'Company'}</h3>
              <p className="italic text-sm text-gray-600">
                {exp.startDate || 'Start'} — {exp.endDate || 'End'} | {exp.location || 'Location'}
              </p>
              <p>{exp.description || ''}</p>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-300 mb-2">Projects</h2>
          {projects.map((proj, i) => (
            <div key={i} className="mb-4">
              <h3 className="font-semibold">{proj.title || 'Project Title'}</h3>
              <p>{proj.description || ''}</p>
            </div>
          ))}
        </section>
      )}

      {/* Volunteer Experience */}
      {volunteerExperiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-300 mb-2">Volunteer Experience</h2>
          {volunteerExperiences.map((vol, i) => (
            <div key={i} className="mb-4">
              <h3 className="font-semibold">{vol.role || 'Role'} — {vol.organization || 'Organization'}</h3>
              <p className="italic text-sm text-gray-600">{vol.startDate || 'Start'} — {vol.endDate || 'End'}</p>
              <p>{vol.description || ''}</p>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {educationList.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-300 mb-2">Education</h2>
          {educationList.map((edu, i) => (
            <div key={i} className="mb-4">
              <h3 className="font-semibold">{edu.degree || 'Degree'}, {edu.school || 'School'}</h3>
              <p className="italic text-sm text-gray-600">{edu.startDate || 'Start'} — {edu.endDate || 'End'}</p>
              <p>{edu.description || ''}</p>
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-300 mb-2">Certifications</h2>
          <ul className="list-disc list-inside">
            {certifications.map((cert, i) => (
              <li key={i}>{cert.name || 'Certification Name'} — {cert.issuer || 'Issuer'}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-300 mb-2">Skills</h2>
          <p>{skills.join(', ')}</p>
        </section>
      )}

      {/* Achievements / Awards */}
      {achievements.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-300 mb-2">Achievements & Awards</h2>
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
          <h2 className="text-xl font-semibold border-b border-gray-300 mb-2">{section.title || 'Custom Section'}</h2>
          <p>{section.content || ''}</p>
        </section>
      ))}
    </article>
  );
}
