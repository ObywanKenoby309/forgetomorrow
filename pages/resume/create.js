import Head from 'next/head';
import { useState } from 'react';
import ContactInfoSection from '../../components/resume-form/ContactInfoSection';
import ProfessionalSummarySection from '../../components/resume-form/ProfessionalSummarySection';
import WorkExperienceSection from '../../components/resume-form/WorkExperienceSection';
import ProjectsSection from '../../components/resume-form/ProjectsSection';
import VolunteerExperienceSection from '../../components/resume-form/VolunteerExperienceSection';
import EducationSection from '../../components/resume-form/EducationSection';
import CertificationsSection from '../../components/resume-form/CertificationsSection';
import SkillsSection from '../../components/resume-form/SkillsSection';
import AchievementsSection from '../../components/resume-form/AchievementsSection';
import CustomSection from '../../components/resume-form/CustomSection'; // NEW import

export default function CreateResumePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    portfolio: '',
    forgeUrl: 'https://forgetomorrow.com/your-profile'
  });

  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [volunteerExperiences, setVolunteerExperiences] = useState([]);
  const [educationList, setEducationList] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [skills, setSkills] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [customSections, setCustomSections] = useState([]); // NEW state

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
          <section className="md:col-span-3 space-y-6">
            <div className="bg-white rounded-lg shadow p-8 space-y-6">
              <h1 className="text-4xl font-bold text-[#FF7043] text-center">Create Your Resume</h1>
              <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
                Fill in the sections below to generate a beautiful, ATS-optimized resume. You’ll be able to preview,
                edit, and save your work as you go.
              </p>
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
            <SkillsSection skills={skills} setSkills={setSkills} />
            <AchievementsSection achievements={achievements} setAchievements={setAchievements} />
            <CustomSection customSections={customSections} setCustomSections={setCustomSections} /> {/* NEW */}
          </section>

          {/* Right Column – Live Resume Preview Placeholder */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-[#FF7043] mb-2">Live Preview</h2>
              <p className="text-sm text-gray-600">Coming soon: View your resume build live here.</p>
              <div className="mt-4 h-[300px] bg-gray-100 border border-dashed border-gray-400 rounded p-4 text-center text-gray-500 text-sm flex items-center justify-center">
                Resume preview panel
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
