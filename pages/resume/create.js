// pages/resume/create.js — FINAL LOCKED
import { useContext, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import { ResumeContext } from '@/context/ResumeContext';
import ContactInfoSection from '@/components/resume-form/ContactInfoSection';
import WorkExperienceSection from '@/components/resume-form/WorkExperienceSection';
import EducationSection from '@/components/resume-form/EducationSection';
import SkillsSection from '@/components/resume-form/SkillsSection';
import SummarySection from '@/components/resume-form/SummarySection';
import ProjectsSection from '@/components/resume-form/ProjectsSection';
import CertificationsSection from '@/components/resume-form/CertificationsSection';
import CustomSection from '@/components/resume-form/CustomSection';
import AtsDepthPanel from '@/components/resume-form/AtsDepthPanel';
import { getResumeTemplateComponent } from '@/lib/templates';
import { extractTextFromFile, normalizeJobText } from '@/lib/jd/ingest';
import { uploadJD } from '@/lib/jd/uploadToApi';
import ReverseResumeTemplate from '@/components/resume-form/templates/ReverseResumeTemplate';
import BulkExportCTA from '@/components/BulkExportCTA';
// === IMPORT 3 BUTTONS ===
import ReverseATSButton from '@/components/resume-form/export/ReverseATSButton';
import HybridATSButton from '@/components/resume-form/export/HybridATSButton';
import DesignedPDFButton from '@/components/resume-form/export/DesignedPDFButton'; // ← NEW

const ORANGE = '#FF7043';

function Banner({ children }) {
  return (
    <div style={{ background: '#FFF3E0', border: '1px solid #FFCC80', borderRadius: 12, padding: 14, fontSize: 15, color: '#E65100', fontWeight: 600 }}>
      {children}
    </div>
  );
}

function Section({ title, open, onToggle, children, required = false }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '16px 20px',
          background: required ? '#FFF7E6' : '#FAFAFA',
          textAlign: 'left',
          fontWeight: 800,
          fontSize: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ color: required ? ORANGE : '#1F2937' }}>{title}</span>
        <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            )}
          </svg>
        </span>
      </button>
      {open && <div style={{ padding: '24px 20px', borderTop: '1px solid #E5E7EB' }}>{children}</div>}
    </div>
  );
}

export default function CreateResumePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);
  const {
    formData, setFormData,
    summary, setSummary,
    experiences, setExperiences,
    educationList, setEducationList,
    skills, setSkills,
    projects, setProjects,
    certifications, setCertifications,
    customSections, setCustomSections,
    saveEventAt,
    saveResume,
  } = useContext(ResumeContext);

  const [TemplateComp, setTemplateComp] = useState(null);
  const [jd, setJd] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [openRequired, setOpenRequired] = useState(true);
  const [openOptional, setOpenOptional] = useState(false);
  const [openTailor, setOpenTailor] = useState(false);

  const savedTime = saveEventAt ? new Date(saveEventAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const isResumeValid =
    summary?.trim().length > 20 &&
    skills?.length >= 8 &&
    experiences?.length > 0 &&
    experiences.every(e => e.title && e.company && e.bullets?.length >= 2);

  const checks = [
    summary?.trim().length > 20,
    skills?.length >= 8,
    experiences?.length > 0,
    experiences.every(e => e.title && e.company && e.bullets?.length >= 2)
  ];
  const progress = Math.round((checks.filter(Boolean).length / 4) * 100);

  useEffect(() => {
    if (!router.isReady) return;
    const id = router.query.template === 'hybrid' ? 'hybrid' : 'reverse';
    const comp = getResumeTemplateComponent(id);
    setTemplateComp(() => (typeof comp === 'function' ? comp : ReverseResumeTemplate));
  }, [router.isReady, router.query.template]);

  useEffect(() => {
    if (saveEventAt) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 2200);
      return () => clearTimeout(t);
    }
  }, [saveEventAt]);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      const raw = file.size > 1_500_000 ? await uploadJD(file) : await extractTextFromFile(file);
      const clean = normalizeJobText(raw);
      setJd(clean);
      localStorage.setItem('ft_last_job_text', clean);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e) => e.preventDefault();
    const onDrop = (e) => {
      prevent(e);
      handleFile(e.dataTransfer.files[0]);
    };
    el.addEventListener('dragover', prevent);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', prevent);
      el.removeEventListener('drop', onDrop);
    };
  }, []);

  const templateName = router.query.template === 'hybrid' ? 'Hybrid (Combination)' : 'Reverse Chronological (Default)';

  const resumeData = {
    personalInfo: {
      name: formData.name || 'Your Name',
      targetedRole: formData.targetedRole || '',
      email: formData.email || '',
      phone: formData.phone || '',
      location: formData.location || '',
      linkedin: formData.linkedin || '',
      github: formData.github || '',
      portfolio: formData.portfolio || '',
    },
    summary: summary || '',
    workExperiences: experiences,
    projects: projects,
    educationList: educationList,
    certifications: certifications,
    skills: skills,
    customSections: customSections,
  };

  // HEADER
  const Header = (
    <section className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-orange-600">Resume Builder</h1>
      <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
        2 templates. 1 goal: Get you the interview.
        <strong>Reverse Chronological</strong> for recruiters.
        <strong>ATS-Optimized</strong> for systems.
        No fluff. Only what works.
      </p>
      <div className="flex items-center justify-center gap-8 mt-6">
        <button
          onClick={() => router.push('/resume/create')}
          className="min-w-[160px] px-6 py-3 rounded-full font-bold text-sm bg-orange-500 text-white shadow-md"
        >
          1. Resume
        </button>
        <div className="w-16 h-px bg-gray-300" />
        <button
          onClick={() => router.push('/cover/create')}
          className="min-w-[160px] px-6 py-3 rounded-full font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          2. Cover Letter
        </button>
      </div>
    </section>
  );

  // FOOTER
  const Footer = (
    <div className="mt-16 text-center text-xs text-gray-500 max-w-2xl mx-auto px-4">
      *87% of job seekers using ATS-optimized resumes receive at least one interview within 7 days of applying.
      <em>Source: Jobscan 2024 Applicant Study (n=1,200). Results vary.</em>
    </div>
  );

  return (
    <SeekerLayout
      title="Resume Builder"
      header={Header}
      right={null}
      footer={Footer}
      activeNav="resume-cover"
    >
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        {/* LEFT: INPUT */}
        <div style={{ display: 'grid', gap: 20, position: 'sticky', top: 20 }}>
          {/* TEMPLATE SWITCHER */}
          <Banner>
            Template: <strong>{templateName}</strong> • Live preview updates instantly on the right
            {' • '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => router.push('/resume/create?template=reverse')}
                style={{
                  fontWeight: router.query.template !== 'hybrid' ? 800 : 500,
                  color: router.query.template !== 'hybrid' ? ORANGE : '#666',
                  background: 'none',
                  border: 'none',
                  textDecoration: router.query.template !== 'hybrid' ? 'underline' : 'none',
                  cursor: 'pointer'
                }}
              >
                Reverse
              </button>
              <span style={{ color: '#999' }}>|</span>
              <button
                onClick={() => router.push('/resume/create?template=hybrid')}
                style={{
                  fontWeight: router.query.template === 'hybrid' ? 800 : 500,
                  color: router.query.template === 'hybrid' ? ORANGE : '#666',
                  background: 'none',
                  border: 'none',
                  textDecoration: router.query.template === 'hybrid' ? 'underline' : 'none',
                  cursor: 'pointer'
                }}
              >
                Hybrid
              </button>
            </span>
          </Banner>

          {/* REQUIRED */}
          <Section title="Required – Start Here" open={openRequired} onToggle={() => setOpenRequired(v => !v)} required>
            <div style={{ display: 'grid', gap: 32 }}>
              <ContactInfoSection embedded formData={formData} setFormData={setFormData} />
              <WorkExperienceSection embedded experiences={experiences} setExperiences={setExperiences} />
              <div id="education-section">
                <EducationSection embedded educationList={educationList} setEducationList={setEducationList} />
              </div>
              <SkillsSection embedded skills={skills} setSkills={setSkills} />
            </div>
          </Section>

          {/* OPTIONAL */}
          <Section title="Optional – Add Power" open={openOptional} onToggle={() => setOpenOptional(v => !v)}>
            <div style={{ display: 'grid', gap: 32 }}>
              <SummarySection embedded summary={summary} setSummary={setSummary} />
              <ProjectsSection embedded projects={projects} setProjects={setProjects} />
              <CertificationsSection embedded certifications={certifications} setCertifications={setCertifications} />
              <CustomSection embedded customSections={customSections} setCustomSections={setCustomSections} />
            </div>
          </Section>

          {/* TAILOR TO JOB — WITH PRO TIP BANNER */}
          <Section title="Tailor to Job (Optional)" open={openTailor} onToggle={() => setOpenTailor(v => !v)}>
            <Banner>
              Pro Tip: Upload a job description to unlock <strong>AI-powered ATS scoring</strong> and keyword suggestions.
            </Banner>
            <div
              ref={dropRef}
              style={{
                padding: 40,
                border: '4px dashed #90CAF9',
                borderRadius: 16,
                textAlign: 'center',
                background: '#E3F2FD',
                cursor: 'pointer'
              }}
            >
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Drop a job description here<br />
                or <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ color: ORANGE, background: 'none', border: 0, fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  upload file
                </button>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={e => handleFile(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
            </div>
            {jd && (
              <AtsDepthPanel
                jdText={jd}
                summary={summary}
                skills={skills}
                experiences={experiences}
                education={educationList}
                onAddSkill={(k) => setSkills(s => [...s, k])}
                onAddSummary={(k) => setSummary(s => s ? `${s}\n\n${k}` : k)}
                onAddBullet={(k) => {
                  const lastExp = experiences[experiences.length - 1];
                  if (lastExp) {
                    setExperiences(exp => exp.map((e, i) =>
                      i === exp.length - 1 ? { ...e, bullets: [...(e.bullets || []), k] } : e
                    ));
                  }
                }}
              />
            )}
          </Section>
        </div>

        {/* RIGHT: LIVE RESUME PREVIEW */}
        <div style={{ position: 'sticky', top: 20, background: 'white', borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 32px', background: '#263238', color: 'white', fontWeight: 800, fontSize: 18, textAlign: 'center' }}>
            LIVE RESUME PREVIEW
          </div>
          <div id="resume-preview" style={{ padding: 60, background: '#fff', minHeight: '100vh' }}>
            {TemplateComp && typeof TemplateComp === 'function' ? (
              <TemplateComp data={resumeData} />
            ) : (
              <div style={{ textAlign: 'center', marginTop: 120, color: '#999', fontSize: 20 }}>
                Loading your resume template...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXPORT BUTTONS */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-2xl border">
        {/* ATS PDF */}
        {router.query.template === 'hybrid' ? (
          <HybridATSButton data={resumeData}>
            <div className="bg-teal-600 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-teal-700 transition-all">
              ATS PDF
            </div>
          </HybridATSButton>
        ) : (
          <ReverseATSButton data={resumeData}>
            <div className="bg-teal-600 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-teal-700 transition-all">
              ATS PDF
            </div>
          </ReverseATSButton>
        )}
        {/* DESIGNED PDF */}
        <DesignedPDFButton
          data={resumeData}
          template={router.query.template === 'hybrid' ? 'hybrid' : 'reverse'}
        >
          <div className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-orange-600 transition-all">
            Designed PDF
          </div>
        </DesignedPDFButton>
        {/* SAVE + PROGRESS */}
        <button
          onClick={saveResume}
          className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-green-700 transition-all"
        >
          Save Resume
        </button>
        <div className="bg-white px-3 py-1.5 rounded-full flex items-center gap-1.5 border text-xs ml-1">
          <div className="relative">
            <svg className="w-6 h-6">
              <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E7EB" strokeWidth="2.5" />
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeDasharray={`${(progress / 100) * 62.8} 62.8`}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
              {progress}%
            </span>
          </div>
          <span className="font-semibold text-gray-600">Ready</span>
        </div>
      </div>

      {/* BULK EXPORT CTA */}
      <div className="mt-6 max-w-4xl mx-auto">
        <BulkExportCTA />
      </div>

      {/* SMART CTA */}
      {isResumeValid && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 md:bottom-28 md:left-auto md:right-6 md:transform-none">
          <button
            onClick={() => router.push('/cover/create')}
            className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-xl hover:bg-purple-700 transition-all transform hover:scale-105"
          >
            Next: Build Cover Letter
          </button>
        </div>
      )}

      {/* TOAST */}
      {showToast && (
        <div style={{ position: 'fixed', right: 28, bottom: 100, background: ORANGE, color: 'white', padding: '14px 24px', borderRadius: 12, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 1000 }}>
          Saved at {savedTime}
        </div>
      )}
    </SeekerLayout>
  );
}