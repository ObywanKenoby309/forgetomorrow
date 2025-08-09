// pages/resume/create.js
import Head from 'next/head';
import { useContext, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

import { ResumeContext } from '../../context/ResumeContext';

import ContactInfoSection from '../../components/resume-form/ContactInfoSection';
import ProfessionalSummarySection from '../../components/resume-form/ProfessionalSummarySection';
import WorkExperienceSection from '../../components/resume-form/WorkExperienceSection';
import ProjectsSection from '../../components/resume-form/ProjectsSection';
import VolunteerExperienceSection from '../../components/resume-form/VolunteerExperienceSection';
import EducationSection from '../../components/resume-form/EducationSection';
import CertificationsSection from '../../components/resume-form/CertificationsSection';
import LanguagesSection from '../../components/resume-form/LanguagesSection';
import SkillsSection from '../../components/resume-form/SkillsSection';
import AchievementsSection from '../../components/resume-form/AchievementsSection';
import CustomSection from '../../components/resume-form/CustomSection';
import BasicResumeTemplate from '../../components/resume-form/templates/BasicResumeTemplate';
import SnapshotControls from '../../components/resume-form/SnapshotControls';

const ClientPDFButton = dynamic(
  () => import('../../components/resume-form/export/ClientPDFButton'),
  { ssr: false }
);

function formatLocal(dt) {
  if (!dt) return '';
  try {
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(d);
  } catch {
    return '';
  }
}

export default function CreateResumePage() {
  const {
    formData, setFormData,
    summary, setSummary,
    experiences, setExperiences,
    projects, setProjects,
    volunteerExperiences, setVolunteerExperiences,
    educationList, setEducationList,
    certifications, setCertifications,
    languages, setLanguages,
    skills, setSkills,
    achievements, setAchievements,
    customSections, setCustomSections,
    saveEventAt,
  } = useContext(ResumeContext);

  const [selectedTemplate, setSelectedTemplate] = useState('basic');

  // Toast visibility controller
  const [showToast, setShowToast] = useState(false);
  const savedTime = useMemo(() => formatLocal(saveEventAt), [saveEventAt]);

  useEffect(() => {
    if (!saveEventAt) return;
    setShowToast(true);
    const t = setTimeout(() => setShowToast(false), 2000); // visible ~2s
    return () => clearTimeout(t);
  }, [saveEventAt]);

  return (
    <>
      <Head>
        <title>Create Resume | ForgeTomorrow</title>
      </Head>

      <main className="max-w-7xl mx-auto px-6 min-h-[80vh] bg-[#ECEFF1] py-28 text-[#212121]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <aside className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <h2 className="text-lg font-semibold text-[#FF7043] mb-4">Navigation</h2>
              <a
                href="/seeker-dashboard"
                className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded transition"
              >
                ← Back to Dashboard
              </a>
            </div>
          </aside>

          <section className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <label htmlFor="template-select" className="block font-semibold mb-2 text-[#FF7043]">
                Choose Resume Template
              </label>
              <select
                id="template-select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="border border-gray-300 rounded p-2 w-full"
              >
                <option value="basic">Basic (ATS Friendly)</option>
              </select>
            </div>

            {/* Snapshot save + link to Saved Versions */}
            <SnapshotControls />

            <ContactInfoSection formData={formData} setFormData={setFormData} />
            <ProfessionalSummarySection summary={summary} setSummary={setSummary} />
            <WorkExperienceSection experiences={experiences} setExperiences={setExperiences} />
            <ProjectsSection projects={projects} setProjects={setProjects} />
            <VolunteerExperienceSection
              volunteerExperiences={volunteerExperiences}
              setVolunteerExperiences={setVolunteerExperiences}
            />
            <EducationSection educationList={educationList} setEducationList={setEducationList} />
            <CertificationsSection certifications={certifications} setCertifications={setCertifications} />
            <LanguagesSection languages={languages} setLanguages={setLanguages} />
            <SkillsSection skills={skills} setSkills={setSkills} />
            <AchievementsSection achievements={achievements} setAchievements={setAchievements} />
            <CustomSection customSections={customSections} setCustomSections={setCustomSections} />
          </section>

          <aside className="md:col-span-2 overflow-auto max-h-[80vh] flex flex-col">
            <div className="bg-white rounded-lg shadow p-4 flex-grow">
              <h2 className="text-lg font-semibold text-[#FF7043] mb-2">Live Preview</h2>
              {selectedTemplate === 'basic' && (
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
              )}
            </div>

            {/* Unified action bar: PDF / Word / Text / Save */}
            <ClientPDFButton
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
              className="bg-[#FF7043] hover:bg-[#F4511E] text-white py-2 px-4 rounded text-center"
            />
          </aside>
        </div>

        {/* Forge toast: bottom-right, slide-up + fade */}
        <div
          className={[
            'fixed right-6 bottom-6 z-50',
            'transition-all duration-300',
            showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none',
          ].join(' ')}
        >
          <div className="bg-[#FF7043] text-white shadow-lg rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-xl leading-none">⚒</span>
            <span className="text-xl leading-none">💥</span>
            <span className="font-medium">
              Saved{savedTime ? ` at ${savedTime}` : ''}
            </span>
          </div>
        </div>
      </main>
    </>
  );
}
