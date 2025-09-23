// components/resume-form/templates/BasicResumeTemplate.js
export default function BasicResumeTemplate({
  formData,
  summary,
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
  // --- helpers to normalize inconsistent shapes ---
  const normalizeBullets = (exp) => {
    if (Array.isArray(exp?.bullets) && exp.bullets.length) return exp.bullets;
    const text = exp?.description || '';
    return String(text).split('\n').map(s => s.trim()).filter(Boolean);
  };

  const normalizeLanguages = (arr) => {
    return (arr || []).map((item) => {
      if (item == null) return null;
      if (typeof item === 'string') {
        return { label: item, proficiency: '', years: '' };
      }
      // accept various shapes: {language, proficiency, years}, {name, level}, {label}
      const label = item.language || item.name || item.label || '';
      const proficiency = item.proficiency || item.level || '';
      const years = item.years ?? item.yearsOfExperience ?? '';
      if (!label && !proficiency && !years) return null;
      return { label, proficiency, years };
    }).filter(Boolean);
  };

  const langs = normalizeLanguages(languages);

  return (
    <article className="max-w-3xl mx-auto p-6 bg-white text-gray-900 font-sans" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* Header */}
      <header className="mb-6 border-b border-gray-400 pb-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{formData?.fullName || 'Your Name'}</h1>
          <p className="italic text-gray-700 mt-1">{formData?.location || 'Your Location'}</p>
        </div>
        <div className="mt-3 md:mt-0 space-y-1 text-sm text-gray-600">
          {formData?.email ? (
            <p>
              Email:{' '}
              <a href={`mailto:${formData.email}`} className="underline text-blue-700">
                {formData.email}
              </a>
            </p>
          ) : null}
          {formData?.phone ? <p>Phone: {formData.phone}</p> : null}
          {formData?.portfolio ? (
            <p>
              Portfolio:{' '}
              <a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">
                {formData.portfolio}
              </a>
            </p>
          ) : null}
        </div>
      </header>

      {/* Professional Summary */}
      {summary ? (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Career Summary</h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{summary}</p>
        </section>
      ) : null}

      {/* Work Experience */}
      {Array.isArray(experiences) && experiences.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Professional Background</h2>
          {experiences.map((exp, i) => {
            const company = exp.company || exp.employer || '';
            const title = exp.jobTitle || exp.title || 'Job Title';
            const loc = exp.location || '';
            const start = exp.startDate || exp.start || '';
            const end = exp.endDate || exp.end || '';
            const bullets = normalizeBullets(exp);

            return (
              <div key={i} className="mb-5">
                <h3 className="font-semibold text-lg">
                  {title} {company ? <span>&mdash; <span className="italic">{company}</span></span> : null}
                </h3>
                {(start || end || loc) ? (
                  <p className="text-sm text-gray-600 italic mb-1">
                    {start || 'Start'} {start || end ? '—' : ''} {end || 'Present'} {loc ? `| ${loc}` : ''}
                  </p>
                ) : null}
                {bullets.length ? (
                  <ul className="list-disc list-inside space-y-1 text-gray-700 leading-snug">
                    {bullets.map((b, idx) => <li key={idx}>{b}</li>)}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : null}

      {/* Projects */}
      {Array.isArray(projects) && projects.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Selected Projects</h2>
          {projects.map((proj, i) => {
            const bullets = Array.isArray(proj.bullets) ? proj.bullets : String(proj.description || '').split('\n').filter(Boolean);
            return (
              <div key={i} className="mb-5">
                <h3 className="font-semibold">{proj.title || 'Project Title'}</h3>
                {bullets.length ? (
                  <ul className="list-disc list-inside text-gray-700">
                    {bullets.map((b, idx) => <li key={idx}>{b}</li>)}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : null}

      {/* Volunteer Experience */}
      {Array.isArray(volunteerExperiences) && volunteerExperiences.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Community Involvement</h2>
          {volunteerExperiences.map((vol, i) => (
            <div key={i} className="mb-5">
              <h3 className="font-semibold">
                {vol.role || vol.title || 'Role'} {vol.organization ? <span>&mdash; <span className="italic">{vol.organization}</span></span> : null}
              </h3>
              {(vol.startDate || vol.endDate) ? (
                <p className="text-sm text-gray-600 italic mb-1">{vol.startDate || 'Start'} — {vol.endDate || 'End'}</p>
              ) : null}
              {vol.description ? <p className="text-gray-700 whitespace-pre-wrap">{vol.description}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      {/* Education */}
      {Array.isArray(educationList) && educationList.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Education & Honors</h2>
          {educationList.map((edu, i) => (
            <div key={i} className="mb-5">
              <h3 className="font-semibold">
                {(edu.degree || 'Degree')}{edu.school ? `, ${edu.school}` : ''}
              </h3>
              {(edu.startDate || edu.endDate) ? (
                <p className="text-sm text-gray-600 italic mb-1">{edu.startDate || 'Start'} — {edu.endDate || 'End'}</p>
              ) : null}
              {edu.description ? <p className="text-gray-700 whitespace-pre-wrap">{edu.description}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      {/* Certifications */}
      {Array.isArray(certifications) && certifications.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Certifications & Training</h2>
          <ul className="list-disc list-inside text-gray-700">
            {certifications.map((cert, i) => (
              <li key={i}>
                {(cert.name || cert.title || 'Certification')} {cert.issuer ? <span>— <span className="italic">{cert.issuer}</span></span> : null} {cert.date ? `(${cert.date})` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Languages */}
      {langs.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Languages</h2>
          <ul className="list-disc list-inside text-gray-700">
            {langs.map((l, i) => {
              const parts = [l.label, l.proficiency].filter(Boolean).join(' — ');
              const tail = l.years ? ` (${l.years} yr${Number(l.years) === 1 ? '' : 's'})` : '';
              return <li key={i}>{parts}{tail}</li>;
            })}
          </ul>
        </section>
      ) : null}

      {/* Skills */}
      {Array.isArray(skills) && skills.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Skills</h2>
          <p>{skills.join(', ')}</p>
        </section>
      ) : null}

      {/* Achievements & Awards */}
      {Array.isArray(achievements) && achievements.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">Achievements & Awards</h2>
          {achievements.map((item, i) => (
            <div key={i} className="mb-2">
              <h3 className="font-semibold">{item.title || 'Title'}</h3>
              {item.description ? <p>{item.description}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      {/* Custom Sections */}
      {Array.isArray(customSections) && customSections.length > 0
        ? customSections.map((section, i) => (
            <section key={i} className="mb-6">
              <h2 className="text-xl font-semibold border-b border-gray-400 mb-3">{section.title || 'Custom Section'}</h2>
              {Array.isArray(section.items)
                ? (
                  <ul className="list-disc list-inside text-gray-700">
                    {section.items.map((it, idx) => <li key={idx}>{typeof it === 'string' ? it : (it.text || it.title || JSON.stringify(it))}</li>)}
                  </ul>
                )
                : <p>{section.content || ''}</p>}
            </section>
          ))
        : null}
    </article>
  );
}
