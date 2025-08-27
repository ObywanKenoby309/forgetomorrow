// pages/resume/create.js
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

import { ResumeContext } from '@/context/ResumeContext';

import ContactInfoSection from '@/components/resume-form/ContactInfoSection';
import ProfessionalSummarySection from '@/components/resume-form/ProfessionalSummarySection';
import WorkExperienceSection from '@/components/resume-form/WorkExperienceSection';
import ProjectsSection from '@/components/resume-form/ProjectsSection';
import VolunteerExperienceSection from '@/components/resume-form/VolunteerExperienceSection';
import EducationSection from '@/components/resume-form/EducationSection';
import CertificationsSection from '@/components/resume-form/CertificationsSection';
import LanguagesSection from '@/components/resume-form/LanguagesSection';
import SkillsSection from '@/components/resume-form/SkillsSection';
import AchievementsSection from '@/components/resume-form/AchievementsSection';
import CustomSection from '@/components/resume-form/CustomSection';

import SnapshotControls from '@/components/resume-form/SnapshotControls';
import JobMatchAnalyzer from '@/components/resume-form/JobMatchAnalyzer';
import TailorLocal from '@/components/resume-form/TailorLocal';
import ResumePreview from '@/components/resume-form/ResumePreview';

import { applyResumeTemplate } from '@/lib/templates/applyTemplate';
import AtsCheckBadge from '@/components/resume-form/AtsCheckBadge';
import AtsPreviewModal from '@/components/resume-form/AtsPreviewModal';
import SmartExportMenu from '@/components/resume-form/export/SmartExportMenu';

// shared template registry + AI matcher
import { resumeTemplates, getResumeTemplateComponent } from '@/lib/templates';
import { matchTemplate } from '@/lib/ai/matchTemplate';

// stepper (always on now)
import ApplySteps from '@/components/apply/ApplySteps';

const ClientPDFButton = dynamic(
  () => import('@/components/resume-form/export/ClientPDFButton'),
  { ssr: false }
);

// -------- small helpers --------
function formatLocal(dt) {
  if (!dt) return '';
  try {
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(d);
  } catch {
    return '';
  }
}

/** Full-screen modal overlay for “focus” mode */
function DockModal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.5)',
        display: 'grid', placeItems: 'center', padding: 16
      }}
    >
      <div
        style={{
          width: 'min(1100px, 96vw)',
          maxHeight: '90vh',
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 14,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: '#2a2a2a',
            color: 'white',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: '#FF7043',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div style={{ overflow: 'auto', padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

function DockItem({ title, subtitle, onOpen }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'grid',
        alignItems: 'start',
        gap: 6,
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <div style={{ fontWeight: 800, color: '#FF7043' }}>{title}</div>
      {subtitle ? (
        <div style={{ color: '#607D8B', fontSize: 12 }}>{subtitle}</div>
      ) : null}
      <div style={{ marginTop: 4 }}>
        <button
          type="button"
          onClick={onOpen}
          style={{
            background: '#FF7043',
            color: 'white',
            padding: '6px 10px',
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.06)',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Open
        </button>
      </div>
    </div>
  );
}

// -------- page --------
export default function CreateResumePage() {
  const router = useRouter();
  const seededRef = useRef(false);

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

  // selected resume template + lazy-loaded component
  const [templateId, setTemplateId] = useState(() => String(router.query?.template || 'modern'));
  const [TemplateComp, setTemplateComp] = useState(null);

  // toast
  const [showToast, setShowToast] = useState(false);
  const savedTime = useMemo(() => formatLocal(saveEventAt), [saveEventAt]);

  // unified apply flow is now default (no query needed)
  const isApplyFlow = true;
  const [jd, setJd] = useState('');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ft_last_job_text') || '';
      if (saved) setJd(saved);
    } catch {}
  }, []);

  // Ingest Apply Assistant seed BEFORE ?template= seeding
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ft_resume_seed');
      if (!raw) return;
      const seed = JSON.parse(raw);

      const isEmpty =
        !summary &&
        (experiences?.length ?? 0) === 0 &&
        (projects?.length ?? 0) === 0 &&
        (volunteerExperiences?.length ?? 0) === 0 &&
        (educationList?.length ?? 0) === 0 &&
        (certifications?.length ?? 0) === 0 &&
        (languages?.length ?? 0) === 0 &&
        (skills?.length ?? 0) === 0 &&
        (achievements?.length ?? 0) === 0 &&
        (customSections?.length ?? 0) === 0;

      if (!isEmpty) {
        localStorage.removeItem('ft_resume_seed');
        return;
      }

      if (seed?.formData) setFormData(prev => ({ ...prev, ...seed.formData }));
      if (seed?.summary != null) setSummary(seed.summary);
      if (Array.isArray(seed?.experiences)) setExperiences(seed.experiences);
      if (Array.isArray(seed?.projects)) setProjects(seed.projects);
      if (Array.isArray(seed?.volunteerExperiences)) setVolunteerExperiences(seed.volunteerExperiences);
      if (Array.isArray(seed?.educationList)) setEducationList(seed.educationList);
      if (Array.isArray(seed?.certifications)) setCertifications(seed.certifications);
      if (Array.isArray(seed?.languages)) setLanguages(seed.languages);
      if (Array.isArray(seed?.skills)) setSkills(seed.skills);
      if (Array.isArray(seed?.achievements)) setAchievements(seed.achievements);
      if (Array.isArray(seed?.customSections)) setCustomSections(seed.customSections);

      if (seed?.templateId) setTemplateId(String(seed.templateId));

      seededRef.current = true;
      localStorage.removeItem('ft_resume_seed');
    } catch {
      localStorage.removeItem('ft_resume_seed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed from ?template= if doc is empty (kept), mirror into templateId
  useEffect(() => {
    const t = router.query?.template;
    if (!t || seededRef.current) {
      if (t) setTemplateId(String(t));
      return;
    }

    const isEmpty =
      !summary &&
      (experiences?.length ?? 0) === 0 &&
      (projects?.length ?? 0) === 0 &&
      (volunteerExperiences?.length ?? 0) === 0 &&
      (educationList?.length ?? 0) === 0 &&
      (certifications?.length ?? 0) === 0 &&
      (languages?.length ?? 0) === 0 &&
      (skills?.length ?? 0) === 0 &&
      (achievements?.length ?? 0) === 0 &&
      (customSections?.length ?? 0) === 0;

    if (!isEmpty) {
      setTemplateId(String(t));
      return;
    }

    const profile = {
      summary,
      skills,
      experience: experiences,
      education: educationList,
      projects,
      links: [],
    };

    const doc = applyResumeTemplate(String(t), profile);

    setSummary(doc?.sections?.summary?.data?.text || summary || '');
    setSkills(Array.isArray(doc?.sections?.skills?.items) ? doc.sections.skills.items : skills || []);
    setExperiences(Array.isArray(doc?.sections?.experience?.items) ? doc.sections.experience.items : experiences || []);
    setEducationList(Array.isArray(doc?.sections?.education?.items) ? doc.sections.education.items : educationList || []);
    setProjects(Array.isArray(doc?.sections?.projects?.items) ? doc.sections.projects.items : projects || []);
    setAchievements(Array.isArray(doc?.sections?.achievements?.items) ? doc.sections.achievements.items : achievements || []);
    setCertifications(Array.isArray(doc?.sections?.certifications?.items) ? doc.sections.certifications.items : certifications || []);
    setLanguages(Array.isArray(doc?.sections?.languages?.items) ? doc.sections.languages.items : languages || []);
    setCustomSections(Array.isArray(doc?.sections?.custom?.items) ? doc.sections.custom.items : customSections || []);

    seededRef.current = true;
    setTemplateId(String(t));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query?.template]);

  // Load the template component whenever templateId changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const Comp = await getResumeTemplateComponent(templateId || 'modern');
        if (mounted) setTemplateComp(() => Comp);
      } catch {
        if (mounted) setTemplateComp(null);
      }
    })();
    return () => { mounted = false; };
  }, [templateId]);

  // Dock modals
  const [openAnalyzer, setOpenAnalyzer] = useState(false);
  const [openTailor, setOpenTailor] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);

  // ATS preview modal
  const [openAtsPreview, setOpenAtsPreview] = useState(false);

  useEffect(() => {
    if (!saveEventAt) return;
    setShowToast(true);
    const t = setTimeout(() => setShowToast(false), 2000);
    return () => clearTimeout(t);
  }, [saveEventAt]);

  // Header (stepper always visible)
  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
        display: 'grid',
        gap: 10,
      }}
    >
      <ApplySteps current={1} />

      <h1
        style={{
          color: '#FF7043',
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
        }}
      >
        Resume & Cover Letter Builder
      </h1>
      <p
        style={{
          marginTop: 0,
          color: '#546E7A',
          fontSize: 14,
        }}
      >
        Build, tailor, analyze, and export professional documents. Open tools from the right dock when you need them.
      </p>
    </section>
  );

  // Right rail
  const RightPane = (
    <div style={{ display: 'grid', gap: 12, width: '100%', boxSizing: 'border-box' }}>
      {/* Shortcuts */}
      <SeekerRightColumn variant="creator" />

      {/* ATS status + Export */}
      <div
        id="export"
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 10,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          display: 'grid',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AtsCheckBadge
            formData={formData}
            summary={summary}
            experiences={experiences}
            educationList={educationList}
            skills={skills}
          />
          <button
            type="button"
            onClick={() => setOpenAtsPreview(true)}
            style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '6px 10px', fontWeight: 800, cursor: 'pointer' }}
          >
            ATS Preview
          </button>
        </div>

        {/* Save snapshots */}
        <SnapshotControls compact />

        {/* Smart Export */}
        <div
          style={{
            background: '#FAFAFA',
            border: '1px dashed #B0BEC5',
            borderRadius: 10,
            padding: 10,
            transform: 'scale(0.94)',
            transformOrigin: 'top right',
          }}
        >
          <div style={{ fontWeight: 700, color: '#37474F', marginBottom: 6, fontSize: 13 }}>
            Export / Download
          </div>
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
            coverStorageKey="ft_cover_draft"
            defaultCombined={true}
            defaultOrder="resume-first"
            defaultAtsMode={true}
            className="bg-[#FF7043] hover:bg-[#F4511E] text-white py-1.5 px-3 rounded text-sm"
          />

          <SmartExportMenu
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
            coverStorageKey="ft_cover_draft"
          />
        </div>
      </div>

      {/* Dock items */}
      <DockItem
        title="Job Match Analyzer"
        subtitle="Paste a JD and see matched/missing keywords plus a match score."
        onOpen={() => setOpenAnalyzer(true)}
      />
      <DockItem
        title="Tailor (Local)"
        subtitle="Generate a summary & bullets aligned to the JD—no API required."
        onOpen={() => setOpenTailor(true)}
      />
      <DockItem
        title="Live Preview"
        subtitle="See your resume rendered as you edit content."
        onOpen={() => setOpenPreview(true)}
      />
    </div>
  );

  return (
    <SeekerLayout
      title="Create Resume | ForgeTomorrow"
      header={HeaderBox}
      right={RightPane}
      activeNav="resume-cover"
    >
      {/* CENTER COLUMN CONTENT */}
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Optional JD card (always visible, still optional to use) */}
        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 800, color: '#37474F' }}>Job description (optional)</div>
          <textarea
            placeholder="Paste the job description here to tailor your resume & enable ATS checks…"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            style={{ width: '100%', minHeight: 160, border: '1px solid #E0E0E0', borderRadius: 10, padding: 12, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { try { localStorage.setItem('ft_last_job_text', jd || ''); } catch {} setOpenAnalyzer(true); }}
              style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}
            >
              Analyze JD
            </button>
            <button
              type="button"
              onClick={async () => {
                try { localStorage.setItem('ft_last_job_text', jd || ''); } catch {}
                // Optional AI template pick based on JD
                try {
                  if (jd.trim()) {
                    const result = await matchTemplate({ jobText: jd, profile: { summary, skills } });
                    if (result?.resumeId) setTemplateId(result.resumeId);
                  }
                } catch {}
                setOpenTailor(true); // free/local tailoring modal
              }}
              style={{ background: '#FF7043', color: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '10px 14px', fontWeight: 800, cursor: 'pointer' }}
            >
              AI assist (free)
            </button>
            <a
              href="/cover/create"
              style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '10px 14px', fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}
            >
              Continue to Cover →
            </a>
          </div>
          <div style={{ fontSize: 12, color: '#90A4AE' }}>We’ll reuse this JD on the cover step unless you change it.</div>
        </section>

        {/* Template selector (real templates + AI choose) */}
        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <label htmlFor="template-select" style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#FF7043' }}>
            Choose Resume Template
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
            <select
              id="template-select"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '10px 12px',
                width: '100%',
                outline: 'none',
              }}
            >
              {resumeTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={async () => {
                try {
                  const jobText = localStorage.getItem('ft_last_job_text') || '';
                  const result = await matchTemplate({ jobText, profile: { summary, skills } });
                  setTemplateId(result.resumeId);
                  // eslint-disable-next-line no-alert
                  alert(`AI picked: ${result.resumeId}\nReason: ${result.reasons.resume.why}`);
                } catch (e) {
                  // eslint-disable-next-line no-alert
                  alert('Could not run template matcher. Using current selection.');
                }
              }}
              style={{
                background: '#FF7043',
                color: 'white',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.06)',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Use AI to choose
            </button>
          </div>

          <div style={{ marginTop: 8, fontSize: 12, color: '#607D8B' }}>
            Tip: Opening this page with <code>?template=modern|classic|formal|impact</code> will also seed content and select the template.
          </div>
        </section>

        {/* Form sections */}
        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
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
      </div>

      {/* Toast (fixed, bottom-right) */}
      <div
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 50,
          transition: 'all 300ms',
          opacity: showToast ? 1 : 0,
          transform: showToast ? 'translateY(0)' : 'translateY(12px)',
          pointerEvents: showToast ? 'auto' : 'none',
        }}
      >
        <div
          style={{
            background: '#FF7043',
            color: 'white',
            boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
            borderRadius: 16,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>⚒</span>
          <span style={{ fontSize: 18, lineHeight: 1 }}>💥</span>
          <span style={{ fontWeight: 600 }}>
            Saved{savedTime ? ` at ${savedTime}` : ''}
          </span>
        </div>
      </div>

      {/* FOCUS MODALS */}
      <DockModal
        open={openAnalyzer}
        title="Job Match Analyzer"
        onClose={() => setOpenAnalyzer(false)}
      >
        <JobMatchAnalyzer
          data={{
            formData, summary, experiences, projects, volunteerExperiences,
            educationList, certifications, languages, skills, achievements, customSections
          }}
        />
      </DockModal>

      <DockModal
        open={openTailor}
        title="Tailor (Local)"
        onClose={() => setOpenTailor(false)}
      >
        <TailorLocal />
      </DockModal>

      <DockModal
        open={openPreview}
        title="Live Preview"
        onClose={() => setOpenPreview(false)}
      >
        {TemplateComp ? (
          <TemplateComp
            data={{
              formData, summary, experiences, projects, volunteerExperiences,
              educationList, certifications, languages, skills, achievements, customSections
            }}
          />
        ) : (
          <ResumePreview
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
      </DockModal>

      {/* ATS PREVIEW */}
      <AtsPreviewModal
        open={openAtsPreview}
        onClose={() => setOpenAtsPreview(false)}
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
    </SeekerLayout>
  );
}
