// components/resume-form/templates/HybridResumeTemplate.js
// Hybrid: skills & summary up top, then reverse-chron experience.
// Simple responsive two-column “header”, single column body.

import React from 'react';

export default function HybridResumeTemplate({ data }) {
  const {
    formData = {},
    summary = '',
    experiences = [],
    projects = [],
    educationList = [],
    skills = [],
    languages = [],
  } = data || {};

  const renderJobTitle = (exp) => exp.jobTitle || exp.title || 'Title';
  const renderCompany  = (exp) => exp.company || exp.org || 'Company';
  const renderDates    = (exp) =>
    [exp.startDate || exp.start, exp.endDate || exp.end]
      .filter(Boolean)
      .join(' — ');

  const languageLabel = (it) =>
    typeof it === 'string' ? it :
    [it.language, it.proficiency, it.years ? `${it.years} yrs` : '']
      .filter(Boolean)
      .join(' — ');

  return (
    <article className="max-w-[780px] mx-auto bg-white text-gray-900 font-sans p-6">
      {/* Top header */}
      <header className="border-b border-gray-300 pb-3 mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{formData.fullName || 'Your Name'}</h1>
        <div className="text-sm text-gray-700 mt-1 flex flex-wrap gap-x-3 gap-y-1">
          {formData.email && <span><a href={`mailto:${formData.email}`} className="underline">{formData.email}</a></span>}
          {formData.phone && <span>{formData.phone}</span>}
          {formData.location && <span>{formData.location}</span>}
          {formData.portfolio && <span><a href={formData.portfolio} className="underline" target="_blank" rel="noreferrer">Portfolio</a></span>}
        </div>
      </header>

      {/* Hybrid top: Summary + Skills next to each other on wider screens */}
      <section className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">Summary</h2>
          <p className="mt-2 text-gray-800 whitespace-pre-wrap leading-relaxed">{summary || 'Brief professional snapshot highlighting strengths and goals.'}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">Core Skills</h2>
          <p className="mt-2 text-gray-800">{(skills || []).join(', ') || 'Skill 1, Skill 2, Skill 3'}</p>
          {Array.isArray(languages) && languages.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mt-3">Languages</h3>
              <ul className="list-disc list-inside text-gray-800">
                {languages.map((it, i) => <li key={i}>{languageLabel(it)}</li>)}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* Experience */}
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
                {/* Bullets: prefer exp.bullets; fallback to newline description */}
                <div className="mt-1">
                  {Array.isArray(exp.bullets) && exp.bullets.length ? (
                    <ul className="list-disc list-inside space-y-1 text-gray-800 leading-snug">
                      {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-gray-800 leading-snug">
                      {(exp.description || '')
                        .split(/\r?\n/)
                        .map(s => s.trim())
                        .filter(Boolean)
                        .map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
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

      {/* Education */}
      {educationList?.length > 0 && (
        <section className="mb-2">
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
    </article>
  );
}
