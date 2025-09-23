// pages/resume/create.js
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
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

import { getResumeTemplateComponent } from '@/lib/templates';
import { matchTemplate } from '@/lib/ai/matchTemplate';

import ApplySteps from '@/components/apply/ApplySteps';

import { extractTextFromFile, normalizeJobText } from '@/lib/jd/ingest';
import { uploadJD } from '@/lib/jd/uploadToApi';

import AtsDepthPanel from '@/components/resume-form/AtsDepthPanel';

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

/** Small neutral collapsible row (used for each sub-section inside Required/Recommended) */
function RowCollapser({ title, open, onToggle, children, rightHint }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          color: '#334155',
          fontWeight: 600,
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        <span>{title}</span>
        <span style={{ color: '#64748B', display: 'flex', gap: 8, alignItems: 'center' }}>
          {rightHint ? <span style={{ fontSize: 12 }}>{rightHint}</span> : null}
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && <div style={{ padding: 12, borderTop: '1px solid #E5E7EB' }}>{children}</div>}
    </div>
  );
}

// -------- page --------
export default function CreateResumePage() {
  const router = useRouter();
  const seededRef = useRef(false);
  const fileInputRef = useRef(null);
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

  // ---- ONLY show ATS-safe options in UI
  const ALLOWED_TEMPLATE_IDS = ['reverse', 'hybrid'];

  // Always render these two choices in the UI (labels guaranteed)
  const TEMPLATE_CHOICES = [
    { id: 'reverse', name: 'Reverse (Default)' },
    { id: 'hybrid',  name: 'Hybrid (Combination)' },
  ];

  // Default template is 'reverse' (coerce anything else to reverse)
  const [templateId, setTemplateId] = useState(() => {
    const t = String(router.query?.template || 'reverse');
    return ALLOWED_TEMPLATE_IDS.includes(t) ? t : 'reverse';
  });

  const [TemplateComp, setTemplateComp] = useState(null);

  const [showToast, setShowToast] = useState(false);
  const savedTime = useMemo(() => formatLocal(saveEventAt), [saveEventAt]);

  const [jd, setJd] = useState('');
  const [jdBusy, setJdBusy] = useState(false);
  const [jdError, setJdError] = useState('');

  // Group headers closed by default
  const [openReq, setOpenReq] = useState(false);
  const [openRec, setOpenRec] = useState(false);

  // Per-item collapse state (all closed initially)
  const [reqOpen, setReqOpen] = useState({
    contact: false, experience: false, education: false, skills: false,
  });
  const [recOpen, setRecOpen] = useState({
    summary: false, projects: false, volunteer: false, certs: false,
    languages: false, achievements: false, custom: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ft_last_job_text') || '';
      if (saved) setJd(saved);
    } catch {}
  }, []);

  // Ingest seed from localStorage (if empty form)
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

      if (seed?.templateId) {
        const picked = String(seed.templateId);
        setTemplateId(ALLOWED_TEMPLATE_IDS.includes(picked) ? picked : 'reverse');
      }

      seededRef.current = true;
      localStorage.removeItem('ft_resume_seed');
    } catch {
      localStorage.removeItem('ft_resume_seed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed from ?template=
  useEffect(() => {
    const t = router.query?.template;
    if (!t || seededRef.current) {
      if (t) {
        const picked = String(t);
        setTemplateId(ALLOWED_TEMPLATE_IDS.includes(picked) ? picked : 'reverse');
      }
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
      setTemplateId(ALLOWED_TEMPLATE_IDS.includes(String(t)) ? String(t) : 'reverse');
      return;
    }

    const profile = { summary, skills, experience: experiences, education: educationList, projects, links: [] };
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
    setTemplateId(ALLOWED_TEMPLATE_IDS.includes(String(t)) ? String(t) : 'reverse');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query?.template]);

  // Load the template component whenever templateId changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const Comp = await getResumeTemplateComponent(templateId || 'reverse');
        if (mounted) setTemplateComp(() => Comp);
      } catch {
        if (mounted) setTemplateComp(null);
      }
    })();
    return () => { mounted = false; };
  }, [templateId]);

  // If templateId drifts to something not allowed (defensive), coerce back
  useEffect(() => {
    if (!ALLOWED_TEMPLATE_IDS.includes(templateId)) {
      setTemplateId('reverse');
    }
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

  // (2B) Listen for “open education” signal from AtsDepthPanel and scroll to the editor
  useEffect(() => {
    const handler = () => {
      setOpenReq(true);
      setReqOpen(s => ({ ...s, education: true }));
      setTimeout(() => {
        const el = document.getElementById('education-section');
        if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    };
    window.addEventListener('ft-open-education', handler);
    return () => window.removeEventListener('ft-open-education', handler);
  }, []);

  // Right rail (reordered & simplified)
  const RightPane = (
    <div style={{ display: 'grid', gap: 12, width: '100%', boxSizing: 'border-box' }}>
      {/* ATS status + preview */}
      <div
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

        {/* Export box */}
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
            templateId={templateId}
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
            className="bg-[#FF7043] hover:bg-[#F4511E] text-white py-1.5 px-3 rounded text-sm"
          />
          <SmartExportMenu
            templateId={templateId}
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

        {/* Snapshot moved below exports */}
        <SnapshotControls compact />
      </div>

      {/* Tools */}
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

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

  // ---- ATS Depth insertion actions ----
  const addSkill = (term) => {
    const s = Array.isArray(skills) ? [...skills] : [];
    if (!s.some(v => String(v).toLowerCase() === term.toLowerCase())) {
      s.push(term);
      setSkills(s);
    }
  };

  const addSummary = (phrase) => {
    const sep = summary?.trim() ? ' ' : '';
    const next = (summary || '') + sep + phrase;
    setSummary(next);
  };

  const addBullet = (phrase) => {
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
  };

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

  const templateOptions = useMemo(() => TEMPLATE_CHOICES, []);

  return (
    <SeekerLayout
      title="Create Resume | ForgeTomorrow"
      header={HeaderBox}
      right={RightPane}
      activeNav="resume-cover"
    >
      {/* CENTER COLUMN CONTENT */}
      <div style={{ display: 'grid', gap: 16 }}>
        {/* 1) TEMPLATE SELECTOR */}
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
              {templateOptions.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={async () => {
                try {
                  const jobText = localStorage.getItem('ft_last_job_text') || '';
                  const result = await matchTemplate({ jobText, profile: { summary, skills } });
                  const rid = String(result?.resumeId || '');
                  if (ALLOWED_TEMPLATE_IDS.includes(rid)) setTemplateId(rid);
                } catch {}
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
            Tip: Open with <code>?template=reverse|hybrid</code> to seed &amp; select automatically.
          </div>
        </section>

        {/* 2) JD card */}
        <section
          ref={dropRef}
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
          <div style={{ fontWeight: 800, color: '#37474F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Job description (optional)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}
              >
                Import JD (PDF/DOCX/TXT)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          <textarea
            placeholder="Paste the job description here to tailor your resume & enable ATS checks…"
            value={jd}
            onChange={(e) => {
              const v = e.target.value;
              setJd(v);
              try { localStorage.setItem('ft_last_job_text', v); } catch {}
            }}
            style={{ width: '100%', minHeight: 160, border: '1px solid #E0E0E0', borderRadius: 10, padding: 12, outline: 'none' }}
          />

          {jdBusy && <div style={{ color: '#607D8B', fontSize: 12 }}>Importing…</div>}
          {jdError && <div style={{ color: '#C62828', fontSize: 12, fontWeight: 700 }}>{jdError}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                const v = (jd || '').trim();
                if (!v) { setJdError('Please provide a job description above.'); return; }
                try { localStorage.setItem('ft_last_job_text', v); } catch {}
                setOpenAnalyzer(true);
              }}
              style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '8px 12px', fontWeight: 800, cursor: 'pointer' }}
            >
              Analyze JD
            </button>
            <button
              type="button"
              onClick={async () => {
                const v = (jd || '').trim();
                if (!v) { setJdError('Please provide a job description above.'); return; }
                try { localStorage.setItem('ft_last_job_text', v); } catch {}
                try {
                  const result = await matchTemplate({ jobText: v, profile: { summary, skills } });
                  const rid = String(result?.resumeId || '');
                  if (ALLOWED_TEMPLATE_IDS.includes(rid)) setTemplateId(rid);
                } catch {}
                setOpenTailor(true);
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
          <div style={{ fontSize: 12, color: '#90A4AE' }}>Tip: Drag & drop a JD file anywhere on this card.</div>
        </section>

        {/* 3) ATS Depth */}
        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <AtsDepthPanel
            jdText={jd}
            summary={summary}
            skills={skills}
            experiences={experiences}
            education={educationList}
            onAddSkill={addSkill}
            onAddSummary={(phrase) => {
              const sep = summary?.trim() ? ' ' : '';
              const next = (summary || '') + sep + phrase;
              setSummary(next);
            }}
            onAddBullet={addBullet}
            collapsedDefault={true}
          />
        </section>

        {/* 4) REQUIRED */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3"
            onClick={() => setOpenReq(o => !o)}
            aria-expanded={openReq}
          >
            <span className="text-sm font-semibold text-slate-700 tracking-wide">Required</span>
            <span className="text-slate-600">{openReq ? '▾' : '▸'}</span>
          </button>

          {openReq && (
            <div className="px-3 pb-4 space-y-2">
              <RowCollapser
                title="Contact Information"
                open={reqOpen.contact}
                onToggle={() => setReqOpen(s => ({ ...s, contact: !s.contact }))}
              >
                <ContactInfoSection embedded formData={formData} setFormData={setFormData} />
              </RowCollapser>

              <RowCollapser
                title="Work Experience"
                open={reqOpen.experience}
                onToggle={() => setReqOpen(s => ({ ...s, experience: !s.experience }))}
              >
                <WorkExperienceSection embedded experiences={experiences} setExperiences={setExperiences} />
              </RowCollapser>

{/* Education */}
<div id="education-section">
  <RowCollapser
    title="Education"
    open={reqOpen.education}
    onToggle={() => setReqOpen(s => ({ ...s, education: !s.education }))}
  >
    <EducationSection
      embedded
      educationList={educationList}
      setEducationList={setEducationList}
    />
  </RowCollapser>
</div>

              <RowCollapser
                title="Skills / Keywords"
                open={reqOpen.skills}
                onToggle={() => setReqOpen(s => ({ ...s, skills: !s.skills }))}
              >
                <SkillsSection embedded skills={skills} setSkills={setSkills} />
              </RowCollapser>
            </div>
          )}
        </section>

        {/* 5) RECOMMENDED */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3"
            onClick={() => setOpenRec(o => !o)}
            aria-expanded={openRec}
          >
            <span className="text-sm font-semibold text-slate-700 tracking-wide">Recommended</span>
            <span className="text-slate-600">{openRec ? '▾' : '▸'}</span>
          </button>

          {openRec && (
            <div className="px-3 pb-4 space-y-2">
              <RowCollapser
                title="Professional Summary"
                open={recOpen.summary}
                onToggle={() => setRecOpen(s => ({ ...s, summary: !s.summary }))}
              >
                <ProfessionalSummarySection embedded summary={summary} setSummary={setSummary} />
              </RowCollapser>

              <RowCollapser
                title="Projects"
                open={recOpen.projects}
                onToggle={() => setRecOpen(s => ({ ...s, projects: !s.projects }))}
              >
                <ProjectsSection embedded projects={projects} setProjects={setProjects} />
              </RowCollapser>

              <RowCollapser
                title="Volunteer Experience"
                open={recOpen.volunteer}
                onToggle={() => setRecOpen(s => ({ ...s, volunteer: !s.volunteer }))}
              >
                <VolunteerExperienceSection embedded volunteerExperiences={volunteerExperiences} setVolunteerExperiences={setVolunteerExperiences} />
              </RowCollapser>

              <RowCollapser
                title="Certifications / Training"
                open={recOpen.certs}
                onToggle={() => setRecOpen(s => ({ ...s, certs: !s.certs }))}
              >
                <CertificationsSection embedded certifications={certifications} setCertifications={setCertifications} />
              </RowCollapser>

              <RowCollapser
                title="Languages"
                open={recOpen.languages}
                onToggle={() => setRecOpen(s => ({ ...s, languages: !s.languages }))}
              >
                <LanguagesSection embedded languages={languages} setLanguages={setLanguages} />
              </RowCollapser>

              <RowCollapser
                title="Achievements / Awards"
                open={recOpen.achievements}
                onToggle={() => setRecOpen(s => ({ ...s, achievements: !s.achievements }))}
              >
                <AchievementsSection embedded achievements={achievements} setAchievements={setAchievements} />
              </RowCollapser>

              <RowCollapser
                title="Custom Sections"
                open={recOpen.custom}
                onToggle={() => setRecOpen(s => ({ ...s, custom: !s.custom }))}
              >
                <CustomSection embedded customSections={customSections} setCustomSections={setCustomSections} />
              </RowCollapser>
            </div>
          )}
        </section>
      </div>

      {/* Toast */}
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
          jdText={jd}
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
        <TailorLocal jdText={jd} />
      </DockModal>

      <DockModal
        open={openPreview}
        title="Live Preview"
        onClose={() => setOpenPreview(false)}
      >
        {TemplateComp ? (
          <TemplateComp
            key={`preview-${templateId}`}
            data={{
              formData, summary, experiences, projects, volunteerExperiences,
              educationList, certifications, languages, skills, achievements, customSections
            }}
          />
        ) : (
          <ResumePreview
            key="preview-fallback"
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
