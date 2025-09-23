// components/resume-form/templates/ReverseResumeTemplate.js
// Reverse-chronological, single-column, ATS-safe

import React from 'react';

function Lines({ text }) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  return (
    <ul className="list-disc list-inside space-y-1 text-gray-800 leading-snug">
      {lines.map((l, i) => <li key={i}>{l}</li>)}
    </ul>
  );
}

function bulletsFor(exp) {
  // Support either `bullets` array OR newline `description`
  if (Array.isArray(exp?.bullets) && exp.bullets.length) return exp.bullets;
  const desc = exp?.description || '';
  return desc.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

export default function ReverseResumeTemplate({ data }) {
  const {
    formData = {},
    summary = '',
    experiences = [],
    projects = [],
    volunteerExperiences = [],
    educationList = [],
    certifications = [],
    languages = [],
    skills = [],
    achievements = [],
    customSections = [],
  } = data || {};

  // Normalize some field names from different editors
  const renderJobTitle = (exp) => exp.jobTitle || exp.title || 'Title';
  const renderCompany  = (exp) => exp.company || exp.org || 'Company';
  const renderDates    = (exp) =>
    [exp.startDate || exp.start, exp.endDate || exp.end]
      .filter(Boolean)
      .join(' — ');

  // Languages can be array of strings OR objects
  const languageLabel = (it) =>
    typeof it === 'string' ? it :
    [it.language, it.proficiency, it.years ? `${it.years} yrs` : '']
      .filter(Boolean)
      .join(' — ');

  return (
    <article className="max-w-[780px] mx-auto bg-white text-gray-900 font-sans p-6">
      {/* Header */}
      <header className="border-b border-gray-300 pb-3 mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{formData.fullName || 'Your Name'}</h1>
        <div className="text-sm text-gray-700 mt-1 flex flex-wrap gap-x-3 gap-y-1">
          {formData.email && <span><a href={`mailto:${formData.email}`} className="underline">{formData.email}</a></span>}
          {formData.phone && <span>{formData.phone}</span>}
          {formData.location && <span>{formData.location}</span>}
          {formData.portfolio && <span><a href={formData.portfolio} className="underline" target="_blank" rel="noreferrer">Portfolio</a></span>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">Professional Summary</h2>
          <p className="mt-2 text-gray-800 whitespace-pre-wrap leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Experience (reverse-chronological) */}
      {experiences?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">Experience</h2>
          <div className="mt-2 space-y-3">
            {[...experiences].reverse().map((exp, idx) => (
              <div key={idx}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {renderJobTitle(exp)} — <span className="italic">{renderCompany(exp)}</span>
                  </h3>
                  <div className="text-sm text-gray-600">{renderDates(exp)}{exp.location ? ` | ${exp.location}` : ''}</div>
                </div>
                <div className="mt-1">
                  {Array.isArray(exp.bullets) && exp.bullets.length ? (
                    <ul className="list-disc list-inside space-y-1 text-gray-800 leading-snug">
                      {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : (
                    <Lines text={exp.description} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {educationList?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">Education</h2>
          <div className="mt-2 space-y-2">
            {educationList.map((edu, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{edu.degree || 'Degree'} — <span className="italic">{edu.school || 'School'}</span></h3>
                  <div className="text-sm text-gray-600">
                    {[edu.startDate, edu.endDate].filter(Boolean).join(' — ')}
                  </div>
                </div>
                {edu.description && <p className="text-gray-800 mt-1 whitespace-pre-wrap">{edu.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {Array.isArray(skills) && skills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">Skills</h2>
          <p className="mt-2 text-gray-800">{skills.join(', ')}</p>
        </section>
      )}

      {/* Projects */}
      {projects?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">Projects</h2>
          <div className="mt-2 space-y-2">
            {projects.map((p, i) => (
              <div key={i}>
                <h3 className="font-semibold">{p.title || 'Project'}</h3>
                {p.description && <p className="text-gray-800 whitespace-pre-wrap">{p.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {Array.isArray(languages) && languages.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">Languages</h2>
          <ul className="mt-2 list-disc list-inside text-gray-800">
            {languages.map((it, i) => <li key={i}>{languageLabel(it)}</li>)}
          </ul>
        </section>
      )}

      {/* Certifications */}
      {certifications?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">Certifications</h2>
          <ul className="mt-2 list-disc list-inside text-gray-800">
            {certifications.map((c, i) => (
              <li key={i}>
                {(c.name || c.title || 'Certification')}
                {c.issuer ? ` — ${c.issuer}` : ''}
                {c.date ? ` (${c.date})` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Achievements */}
      {achievements?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">Achievements</h2>
          <div className="mt-2 space-y-1">
            {achievements.map((a, i) => (
              <div key={i}>
                <span className="font-semibold">{a.title || a.name || 'Achievement'}</span>
                {a.description ? ` — ${a.description}` : ''}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Custom Sections */}
      {Array.isArray(customSections) && customSections.length > 0 && customSections.map((sec, i) => (
        <section key={i} className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">{sec.title || 'Custom'}</h2>
          {sec.content && <p className="mt-2 text-gray-800 whitespace-pre-wrap">{sec.content}</p>}
        </section>
      ))}
    </article>
  );
}
