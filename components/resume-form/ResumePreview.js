// components/resume-form/ResumePreview.js
import BasicResumeTemplate from './templates/BasicResumeTemplate';

export default function ResumePreview({
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
    <section className="bg-white rounded-lg shadow p-6 max-h-[80vh] overflow-auto">
      <BasicResumeTemplate
        formData={formData}
        summary={summary}
        experiences={experiences}
        projects={projects}
        volunteerExperiences={volunteerExperiences}
        educationList={educationList}
        certifications={certifications}
        languages={languages}
        skills={skills}
        achievements={achievements}
        customSections={customSections}
      />
    </section>
  );
}
