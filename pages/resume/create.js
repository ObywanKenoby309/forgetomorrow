import Head from 'next/head';
import { useState } from 'react';
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

export default function CreateResumePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    portfolio: '',
    forgeUrl: 'https://forgetomorrow.com/your-profile',
  });

  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [volunteerExperiences, setVolunteerExperiences] = useState([]);
  const [educationList, setEducationList] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [skills, setSkills] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('basic');

  return (
    <>
      <Head>
        <title>Create Resume | ForgeTomorrow</title>
      </Head>

      <main className="max-w-7xl mx-auto px-6 min-h-[80vh] bg-[#ECEFF1] py-28 text-[#212121]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left Column – Back to Dashboard */}
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

          {/* Center Column – Resume Form */}
          <section className="md:col-span-2 space-y-6">
            {/* Template selector */}
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
                {/* Additional templates can be added here */}
              </select>
            </div>

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

          {/* Right Column – Live Resume Preview */}
          <aside className="md:col-span-2 overflow-auto max-h-[80vh]">
            <div className="bg-white rounded-lg shadow p-4">
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
              {/* Add more templates preview conditional rendering here if needed */}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
