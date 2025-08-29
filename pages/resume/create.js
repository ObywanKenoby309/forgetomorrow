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

// Template registry + AI matcher
import { resumeTemplates, getResumeTemplateComponent } from '@/lib/templates';
import { matchTemplate } from '@/lib/ai/matchTemplate';

// Stepper
import ApplySteps from '@/components/apply/ApplySteps';

// JD ingest (client) + normalizer
import { extractTextFromFile, normalizeJobText } from '@/lib/jd/ingest';
// Server fallback for heavy files
import { uploadJD } from '@/lib/jd/uploadToApi';

// Optional deep ATS panel
import AtsDepthPanel from '@/components/resume-form/AtsDepthPanel';

// extracted building blocks
import JdCard from '@/components/resume/create/JdCard';
import RightRail from '@/components/resume/create/RightRail';
import SectionGroup from '@/components/resume/create/SectionGroup';

const ClientPDFButton = dynamic(
  () => import('@/components/resume-form/export/ClientPDFButton'),
  { ssr: false }
);

// -------- tiny helpers --------
function formatLocal(dt) {
  if (!dt) return '';
  try {
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(d);
  } catch {
    return '';
  }
}

function withTimeout(promise, ms = 15000, label = 'Operation') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise.finally(() => clearTimeout(timer)), timeout]);
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
        <div style={{ overflow: 'auto', padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

// Lightweight collapsible card used for “Missing keywords”
function ToggleCard({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold text-gray-800">
          {title}{typeof count === 'number' ? ` — ${count}` : ''}
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-[13px] font-medium border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

// -------- page --------
export default function CreateResumePage() {
  const router = useRouter();
  const seededRef = useRef(false);
  const dropRef = useRef(null);

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

  // selected resume template + lazy component
  const [templateId, setTemplateId] = useState(() => String(router.query?.template || 'modern'));
  const [TemplateComp, setTemplateComp] = useState(null);

  // toast
  const [showToast, setShowToast] = useState(false);
  const savedTime = useMemo(() => formatLocal(saveEventAt), [saveEventAt]);

  // unified apply flow – JD text lives here
  const [jd, setJd] = useState('');
  const [jdBusy, setJdBusy] = useState(false);
  const [jdError, setJdError] = useState('');

  // convenience blob for passing to children
  const resumeData = useMemo(() => ({
    formData, summary, experiences, projects, volunteerExperiences,
    educationList, certifications, languages, skills, achievements, customSections
  }), [
    formData, summary, experiences, projects, volunteerExperiences,
    educationList, certifications, languages, skills, achievements, customSections
  ]);

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

  // Header
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
      <h1 style={{ color: '#FF7043', fontSize: 28, fontWeight: 800, margin: 0 }}>
        Resume & Cover Letter Builder
      </h1>
      <p style={{ marginTop: 0, color: '#546E7A', fontSize: 14 }}>
        Build, tailor, analyze, and export professional documents. Open tools from the right dock when you need them.
      </p>
    </section>
  );

  // ---- JD handlers (paste + upload) ----
  const BIG_BYTES = 1_500_000;

  async function handleFile(file) {
    setJdError('');
    if (!file) return;
    setJdBusy(true);
    try {
      let raw = '';
      const lower = (file.name || '').toLowerCase();
      const type = (file.type || '').toLowerCase();
      const isPDF = type.includes('pdf') || lower.endsWith('.pdf');
      const isBig = file.size > BIG_BYTES || isPDF;

      if (isBig) {
        raw = await withTimeout(uploadJD(file, 20000), 22000, 'Upload JD');
      } else {
        raw = await withTimeout(extractTextFromFile(file), 15000, 'Client extract');
      }

      const norm = normalizeJobText(raw);
      setJd(norm);
      try { localStorage.setItem('ft_last_job_text', norm); } catch {}
    } catch (e) {
      console.error('[JD Import] error:', e);
      setJdError(e?.message || 'Could not import this file. Please paste the JD instead.');
    } finally {
      setJdBusy(false);
    }
  }

  // Drag & drop for the JD card
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e) => {
      prevent(e);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    };
    el.addEventListener('dragenter', prevent);
    el.addEventListener('dragover', prevent);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragenter', prevent);
      el.removeEventListener('dragover', prevent);
      el.removeEventListener('drop', onDrop);
    };
  }, []);

  // Actions for JdCard
  const onAnalyze = () => {
    const v = (jd || '').trim();
    if (!v) { setJdError('Please provide a job description above.'); return; }
    try { localStorage.setItem('ft_last_job_text', v); } catch {}
    setOpenAnalyzer(true);
  };
  const onAssist = async () => {
    const v = (jd || '').trim();
    if (!v) { setJdError('Please provide a job description above.'); return; }
    try { localStorage.setItem('ft_last_job_text', v); } catch {}
    try {
      const result = await matchTemplate({ jobText: v, profile: { summary, skills } });
      if (result?.resumeId) setTemplateId(result.resumeId);
    } catch {}
    setOpenTailor(true);
  };

  return (
    <SeekerLayout
      title="Create Resume | ForgeTomorrow"
      header={HeaderBox}
      right={
        <div style={{ display:'grid', gap:12, width:'100%', boxSizing:'border-box' }}>
          <SeekerRightColumn variant="creator" />
          <RightRail
            data={resumeData}
            onOpenAts={() => setOpenAtsPreview(true)}
            onOpenAnalyzer={() => setOpenAnalyzer(true)}
            onOpenTailor={() => setOpenTailor(true)}
            onOpenPreview={() => setOpenPreview(true)}
            coverStorageKey="ft_cover_draft"
            SnapshotControls={SnapshotControls}
            AtsCheckBadge={AtsCheckBadge}
            ClientPDFButton={ClientPDFButton}
            SmartExportMenu={SmartExportMenu}
          />
        </div>
      }
      activeNav="resume-cover"
    >
      {/* CENTER COLUMN CONTENT */}
      <div style={{ display: 'grid', gap: 16 }}>

        {/* 1) Template selector — now first */}
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
              style={{ border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', width: '100%', outline: 'none' }}
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
                } catch {
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

        {/* 2) JD card — paste/import + actions */}
        <div ref={dropRef}>
          <JdCard
            jd={jd}
            setJd={setJd}
            busy={jdBusy}
            error={jdError}
            onImportFile={handleFile}
            onAnalyze={onAnalyze}
            onAssist={onAssist}
          />
        </div>

        {/* 3) Missing keywords (ATS suggestions) — calmer, collapsible */}
        <ToggleCard title="Missing keywords (suggested adds)" defaultOpen={false}>
          <AtsDepthPanel
            jdText={jd}
            summary={summary}
            skills={skills}
            experiences={experiences}
            onAddSkill={(term) => {
              const s = Array.isArray(skills) ? [...skills] : [];
              if (!s.some(v => String(v).toLowerCase() === term.toLowerCase())) {
                s.push(term);
                setSkills(s);
              }
            }}
            onAddSummary={(phrase) => {
              const sep = summary?.trim() ? ' ' : '';
              setSummary((summary || '') + sep + phrase);
            }}
            onAddBullet={(phrase) => {
              const exps = Array.isArray(experiences) ? [...experiences] : [];
              if (!exps.length) {
                exps.push({ title: 'Target Role', company: '', bullets: [phrase] });
              } else {
                const first = { ...(exps[0] || {}) };
                const bullets = Array.isArray(first.bullets) ? [...first.bullets] : [];
                bullets.push(phrase);
                first.bullets = bullets;
                exps[0] = first;
              }
              setExperiences(exps);
            }}
          />
        </ToggleCard>

        {/* 4) Required & Recommended groups — compact & light */}
        <SectionGroup
          title="Required"
          defaultOpen
          density="compact"
          shell="ghost"
          items={[
            {
              key: 'contact',
              title: 'Contact Information',
              render: () => (
                <ContactInfoSection embedded formData={formData} setFormData={setFormData} />
              ),
            },
            {
              key: 'experience',
              title: 'Work Experience',
              render: () => (
                <WorkExperienceSection embedded experiences={experiences} setExperiences={setExperiences} />
              ),
            },
            {
              key: 'education',
              title: 'Education',
              render: () => (
                <EducationSection embedded educationList={educationList} setEducationList={setEducationList} />
              ),
            },
            {
              key: 'skills',
              title: 'Skills',
              render: () => (
                <SkillsSection embedded skills={skills} setSkills={setSkills} />
              ),
            },
          ]}
        />

        <SectionGroup
          title="Recommended"
          defaultOpen={false}
          density="compact"
          shell="ghost"
          items={[
            {
              key: 'summary',
              title: 'Professional Summary',
              render: () => (
                <ProfessionalSummarySection embedded summary={summary} setSummary={setSummary} />
              ),
            },
            {
              key: 'projects',
              title: 'Projects',
              render: () => (
                <ProjectsSection embedded projects={projects} setProjects={setProjects} />
              ),
            },
            {
              key: 'volunteer',
              title: 'Volunteer Experience',
              render: () => (
                <VolunteerExperienceSection embedded volunteerExperiences={volunteerExperiences} setVolunteerExperiences={setVolunteerExperiences} />
              ),
            },
            {
              key: 'certs',
              title: 'Certifications / Training',
              render: () => (
                <CertificationsSection embedded certifications={certifications} setCertifications={setCertifications} />
              ),
            },
            {
              key: 'languages',
              title: 'Languages',
              render: () => (
                <LanguagesSection embedded languages={languages} setLanguages={setLanguages} />
              ),
            },
            {
              key: 'awards',
              title: 'Achievements / Awards',
              render: () => (
                <AchievementsSection embedded achievements={achievements} setAchievements={setAchievements} />
              ),
            },
            {
              key: 'custom',
              title: 'Custom Sections',
              render: () => (
                <CustomSection embedded customSections={customSections} setCustomSections={setCustomSections} />
              ),
            },
          ]}
        />
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
      <DockModal open={openAnalyzer} title="Job Match Analyzer" onClose={() => setOpenAnalyzer(false)}>
        <JobMatchAnalyzer jdText={jd} data={resumeData} />
      </DockModal>

      <DockModal open={openTailor} title="Tailor (Local)" onClose={() => setOpenTailor(false)}>
        <TailorLocal jdText={jd} />
      </DockModal>

      <DockModal open={openPreview} title="Live Preview" onClose={() => setOpenPreview(false)}>
        {TemplateComp ? (
          <TemplateComp data={resumeData} />
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
