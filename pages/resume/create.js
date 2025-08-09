// pages/resume/create.js
import Head from 'next/head';
import { useContext, useState } from 'react';
import dynamic from 'next/dynamic';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

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

const ClientPDFButton = dynamic(
  () => import('../../components/resume-form/export/ClientPDFButton'),
  { ssr: false }
);

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
    // ⬇️ bring in saved resumes so we can persist snapshots
    resumes, setResumes,
  } = useContext(ResumeContext);

  const [selectedTemplate, setSelectedTemplate] = useState('basic');
  const [saving, setSaving] = useState(false);

  // ---- Export: Word ----
  const exportWord = async () => {
    const doc = new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: formData.fullName || 'Your Name',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph(formData.email || ''),
            new Paragraph(formData.phone || ''),
            new Paragraph(formData.location || ''),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'resume.docx');
  };

  // ---- Export: Plain Text ----
  const exportPlainText = () => {
    let text = `${formData.fullName || 'Your Name'}\n`;
    text += `${formData.email || ''}\n`;
    text += `${formData.phone || ''}\n`;
    text += `${formData.location || ''}\n\n`;
    text += `Professional Summary:\n${summary}\n`;

    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'resume.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // ---- Save: Snapshot to Context + localStorage ----
  const saveResume = () => {
    try {
      setSaving(true);

      const id = `res-${Date.now()}`;
      const snapshot = {
        id,
        // top-level fields used by the selector
        fullName: formData.fullName || 'Untitled Resume',
        summary: summary || '',
        updatedAt: new Date().toISOString(),

        // full builder payload (kept for future edits/exports)
        formData: { ...formData },
        experiences: [...experiences],
        projects: [...projects],
        volunteerExperiences: [...volunteerExperiences],
        educationList: [...educationList],
        certifications: [...certifications],
        languages: [...languages],
        skills: [...skills],
        achievements: [...achievements],
        customSections: [...customSections],
      };

      const next = [snapshot, ...(Array.isArray(resumes) ? resumes : [])];
      setResumes(next);

      // persist for selector/landing to read
      try {
        localStorage.setItem('ft_saved_resumes', JSON.stringify(next));
      } catch {
        /* ignore storage errors */
      }

      alert('Resume saved!');
    } finally {
      setSaving(false);
    }
  };

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

            <div className="mt-4 flex gap-4 justify-center items-center flex-wrap">
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

              <button
                onClick={exportWord}
                className="bg-[#FF7043] hover:bg-[#F4511E] text-white py-2 px-4 rounded"
              >
                Export Word
              </button>

              <button
                onClick={exportPlainText}
                className="bg-[#FF7043] hover:bg-[#F4511E] text-white py-2 px-4 rounded"
              >
                Export Text
              </button>

              {/* NEW: Save Snapshot */}
              <button
                onClick={saveResume}
                disabled={saving}
                className={`${
                  saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
                } text-white py-2 px-4 rounded`}
                title="Save this version to your account so you can analyze or export later"
              >
                {saving ? 'Saving…' : 'Save Resume'}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
