// pages/resume/create.js — FINAL LOCKED + ATS CONTEXT
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
import { getResumeTemplateComponent } from '@/lib/templates';
import { extractTextFromFile, normalizeJobText } from '@/lib/jd/ingest';
import { uploadJD } from '@/lib/jd/uploadToApi';
import ReverseResumeTemplate from '@/components/resume-form/templates/ReverseResumeTemplate';
import BulkExportCTA from '@/components/BulkExportCTA';
// === IMPORT 3 BUTTONS ===
import ReverseATSButton from '@/components/resume-form/export/ReverseATSButton';
import HybridATSButton from '@/components/resume-form/export/HybridATSButton';
import DesignedPDFButton from '@/components/resume-form/export/DesignedPDFButton'; // ← NEW

const ForgeHammerPanel = dynamic(
  () => import('@/components/hammer/ForgeHammerPanel'),
  { ssr: false }
);

const ORANGE = '#FF7043';

// Draft keys (DB-backed)
const DRAFT_KEYS = {
  LAST_JOB_TEXT: 'ft_last_job_text',
  ATS_PACK: 'forge-ats-pack',
  LAST_UPLOADED_RESUME_TEXT: 'ft_last_uploaded_resume_text',
};

function Banner({ children, tone = 'orange' }) {
  const toneStyles =
    tone === 'blue'
      ? {
          background: '#E3F2FD',
          border: '1px solid #90CAF9',
          color: '#0D47A1',
        }
      : {
          background: '#FFF3E0',
          border: '1px solid #FFCC80',
          color: '#E65100',
        };

  return (
    <div
      style={{
        ...toneStyles,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function Section({ title, open, onToggle, children, required = false }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
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
        <span
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            )}
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: '24px 20px', borderTop: '1px solid #E5E7EB' }}>{children}</div>
      )}
    </div>
  );
}

// ✅ Languages input block (uses context state now)
function LanguagesInlineSection({ languages, setLanguages }) {
  const [val, setVal] = useState('');

  const add = () => {
    const v = String(val || '').trim();
    if (!v) return;
    setLanguages((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      if (next.some((x) => String(x).toLowerCase() === v.toLowerCase())) return next;
      next.push(v);
      return next;
    });
    setVal('');
  };

  const remove = (idx) => {
    setLanguages((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      arr.splice(idx, 1);
      return arr;
    });
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>Languages</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Add a language (e.g., English — Native)"
          style={{
            flex: 1,
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 14,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          style={{
            background: ORANGE,
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
      </div>
      {Array.isArray(languages) && languages.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {languages.map((l, idx) => (
            <div
              key={`${l}-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid #E5E7EB',
                borderRadius: 999,
                padding: '6px 10px',
                background: '#FAFAFA',
                fontSize: 13,
                fontWeight: 700,
                color: '#374151',
              }}
            >
              <span>{l}</span>
              <button
                type="button"
                onClick={() => remove(idx)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#6B7280',
                  lineHeight: 1,
                }}
                aria-label={`Remove ${l}`}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 12, color: '#6B7280' }}>
        Tip: use “Language — Proficiency” format (example: “Spanish — Professional”).
      </div>
    </div>
  );
}

export default function CreateResumePage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);
  const hasAppliedUploadRef = useRef(false); // ensure we only parse once per uploaded flow

  const {
    formData,
    setFormData,
    summary,
    setSummary,
    experiences,
    setExperiences,
    educationList,
    setEducationList,
    skills,
    setSkills,
    projects,
    setProjects,
    certifications,
    setCertifications,
    customSections,
    setCustomSections,
    // ✅ FIX: use ResumeContext languages (DB-persistent via drafts + saveResume)
    languages,
    setLanguages,
    saveEventAt,
    saveResume,
  } = useContext(ResumeContext);

  const [TemplateComp, setTemplateComp] = useState(null);
  const [jd, setJd] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [openRequired, setOpenRequired] = useState(true);
  const [openOptional, setOpenOptional] = useState(false);
  const [openTailor, setOpenTailor] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true); // collapsible tools bar

  // ATS context passed from jobs page (via resume-cover)
  const [atsPack, setAtsPack] = useState(null);
  const [atsJobMeta, setAtsJobMeta] = useState(null);
  const [atsAppliedFromContext, setAtsAppliedFromContext] = useState(false);

  // ✅ NEW: job meta lookup for Resume-Role Align flow (jobId without pack)
  const [jobMeta, setJobMeta] = useState(null);

  // Draft API helpers (DB-backed)
  const getDraft = async (key) => {
    try {
      const res = await fetch(`/api/drafts/get?key=${encodeURIComponent(key)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.draft?.content ?? null;
    } catch (e) {
      console.error('[resume/create] getDraft failed', key, e);
      return null;
    }
  };

  // ✅ FIX: use /api/drafts/set (you do not have /api/drafts/save)
  const saveDraft = async (key, content) => {
    try {
      await fetch('/api/drafts/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, content }),
      });
    } catch (e) {
      console.error('[resume/create] saveDraft failed', key, e);
    }
  };

  // Helper: detect if atsPack is a real result vs demo
  const hasRealAts =
    !!(
      atsPack &&
      atsPack.ats &&
      typeof atsPack.ats.score === 'number' &&
      !/demo|sample/i.test(atsPack.ats.summary || '')
    );

  const savedTime = saveEventAt
    ? new Date(saveEventAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // ✅ REQUIRED completion checks (now includes EDUCATION)
  const checks = [
    summary?.trim().length > 20,
    skills?.length >= 8,
    experiences?.length > 0 && experiences.every((e) => e.title && e.company && e.bullets?.length >= 2),
    educationList?.length > 0 &&
      educationList.some((edu) => (edu.school || edu.institution) && (edu.degree || edu.field)),
  ];

  // Detect if the resume is effectively empty and clamp progress to 0 in that case.
  // IMPORTANT: Ignore auto-populated fields (fullName + forgeUrl/ftProfile) so "Ready" stays 0% until user actually enters content.
  const hasAnyResumeContent =
    (formData &&
      (
        // NOTE: intentionally NOT counting fullName/name/forgeUrl/ftProfile as "started"
        formData.email ||
        formData.phone ||
        formData.location ||
        formData.linkedin ||
        formData.github ||
        formData.portfolio ||
        formData.targetedRole
      )) ||
    (summary && summary.trim().length > 0) ||
    (skills && skills.length > 0) ||
    (languages && languages.length > 0) ||
    (experiences &&
      experiences.some(
        (e) =>
          e.title ||
          e.company ||
          (Array.isArray(e.bullets) && e.bullets.length > 0)
      )) ||
    (educationList &&
      educationList.some(
        (edu) =>
          edu.school ||
          edu.institution ||
          edu.degree ||
          edu.field ||
          edu.details ||
          edu.description
      )) ||
    (projects &&
      projects.some(
        (p) =>
          p.title ||
          p.company ||
          (Array.isArray(p.bullets) && p.bullets.length > 0)
      )) ||
    (certifications && certifications.length > 0) ||
    (customSections && customSections.length > 0);

  let progress = Math.round((checks.filter(Boolean).length / 4) * 100);
  if (!hasAnyResumeContent) {
    progress = 0;
  }

  // treat "complete" as exactly 100% progress
  const isResumeComplete = progress === 100;

  // Load resume template
  useEffect(() => {
    if (!router.isReady) return;
    const id = router.query.template === 'hybrid' ? 'hybrid' : 'reverse';
    const comp = getResumeTemplateComponent(id);
    setTemplateComp(() => (typeof comp === 'function' ? comp : ReverseResumeTemplate));
  }, [router.isReady, router.query.template]);

  // Toast on save
  useEffect(() => {
    if (saveEventAt) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 2200);
      return () => clearTimeout(t);
    }
  }, [saveEventAt]);

  // 🔹 Auto-load ForgeTomorrow profile URL + name for the authenticated user
  useEffect(() => {
    async function loadProfileDefaults() {
      try {
        // If user already filled it, don't override
        if (formData.forgeUrl || formData.ftProfile || formData.fullName) return;
        const res = await fetch('/api/profile/header');
        if (!res.ok) return;
        const data = await res.json();
        // Build name safely
        const derivedName = data?.name || [data?.firstName, data?.lastName].filter(Boolean).join(' ') || '';
        const slug = data?.slug;
        const fullProfileUrl = slug ? `https://forgetomorrow.com/u/${slug}` : '';
        setFormData((prev) => ({
          ...prev,
          // ✅ put the auto-populated name into fullName (the field preview uses and user edits)
          fullName: prev.fullName || derivedName || prev.name || '',
          forgeUrl: prev.forgeUrl || fullProfileUrl,
          ftProfile: prev.ftProfile || fullProfileUrl,
        }));
      } catch (err) {
        console.error('[resume/create] Failed to auto-load profile data', err);
      }
    }
    loadProfileDefaults();
  }, [formData.fullName, formData.forgeUrl, formData.ftProfile, setFormData]);

  // ✅ NEW: If jobId is present, fetch job meta so we can show title/company/location even without a pack
  useEffect(() => {
    if (!router.isReady) return;

    const jobId = String(router.query.jobId || '').trim();
    if (!jobId) {
      setJobMeta(null);
      return;
    }

    let cancelled = false;

    async function loadJobMeta() {
      try {
        const res = await fetch(`/api/jobs?jobId=${encodeURIComponent(jobId)}`);
        if (!res.ok) return;
        const data = await res.json();
        const job = data?.job;
        if (!job || cancelled) return;

        setJobMeta({
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
        });
      } catch (err) {
        console.error('[resume/create] Failed to load job meta', err);
      }
    }

    loadJobMeta();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.jobId]);

  // Handle manual JD file upload / drop — WITH LIMIT CHECK
  const handleFile = async (file) => {
    if (!file) return;
    try {
      // Check limit first
      const res = await fetch('/api/seeker/resume-align-limit', {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.allowed) {
        alert(data.message);
        return;
      }

      const raw = file.size > 1_500_000 ? await uploadJD(file) : await extractTextFromFile(file);
      const clean = normalizeJobText(raw);
      setJd(clean);
      // ✅ DB-backed draft storage (no localStorage)
      await saveDraft(DRAFT_KEYS.LAST_JOB_TEXT, clean);
    } catch (e) {
      console.error(e);
      alert('Failed to process job description. Try again.');
    }
  };

  // Drag-and-drop listeners
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e) => e.preventDefault();
    const onDrop = (e) => {
      prevent(e);
      if (e.dataTransfer?.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    };
    el.addEventListener('dragover', prevent);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', prevent);
      el.removeEventListener('drop', onDrop);
    };
  }, []);

  const templateName =
    router.query.template === 'hybrid' ? 'Hybrid (Combination)' : 'Reverse Chronological (Default)';

  const resumeData = {
    personalInfo: {
      // Use fullName if available, fall back to name
      name: formData.fullName || formData.name || 'Your Name',
      targetedRole: formData.targetedRole || '',
      email: formData.email || '',
      phone: formData.phone || '',
      location: formData.location || '',
      linkedin: formData.linkedin || '',
      github: formData.github || '',
      portfolio: formData.portfolio || '',
      // Pass the ForgeTomorrow profile URL into the templates
      ftProfile: formData.forgeUrl || formData.ftProfile || '',
    },
    summary: summary || '',
    workExperiences: experiences,
    projects: projects,
    educationList: educationList,
    certifications: certifications,
    skills: skills,
    languages: languages,
    customSections: customSections,
  };

  // ─────────────────────────────────────────────────────────────
  // Autofill from uploaded resume text (from resume-cover → DB drafts)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!router.isReady) return;
    if (hasAppliedUploadRef.current) return;

    const { uploaded } = router.query || {};
    const uploadedFlag = String(uploaded || '').toLowerCase();
    if (uploadedFlag !== '1' && uploadedFlag !== 'true') return;

    async function applyUploadedResume() {
      try {
        const raw = await getDraft(DRAFT_KEYS.LAST_UPLOADED_RESUME_TEXT);
        const text = typeof raw === 'string' ? raw : '';
        if (!text) return;

        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);

        // Naive name guess: first non-empty line if we don't already have a fullName/name
        let guessedName = formData.fullName || formData.name || '';
        if (!guessedName && lines.length > 0) {
          guessedName = lines[0];
        }

        // Email
        const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        const guessedEmail = emailMatch ? emailMatch[0] : '';

        // Phone (very loose pattern, but good enough for first pass)
        const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);
        const guessedPhone = phoneMatch ? phoneMatch[0].trim() : '';

        // Only fill fields that are currently empty so we don't clobber existing formData
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || guessedName || '',
          email: prev.email || guessedEmail || '',
          phone: prev.phone || guessedPhone || '',
        }));

        // If summary is empty, drop in the raw text as a starting point (capped length)
        if (!summary || !summary.trim()) {
          const capped = text.length > 4000 ? text.slice(0, 4000) : text;
          setSummary(capped);
        }

        hasAppliedUploadRef.current = true;
      } catch (err) {
        console.error('[resume/create] Failed to auto-fill from uploaded resume', err);
      }
    }

    applyUploadedResume();
  }, [router.isReady, router.query, formData.fullName, formData.name, summary, setFormData, setSummary]);

  // ─────────────────────────────────────────────────────────────
  // Apply ATS pack + JD context from resume-cover (DB drafts)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!router.isReady) return;
    if (atsAppliedFromContext) return;

    async function applyAtsContext() {
      const { from } = router.query || {};
      const fromFlag = String(from || '').toLowerCase();
      let applied = false;

      if (fromFlag === 'ats') {
        try {
          const pack = await getDraft(DRAFT_KEYS.ATS_PACK);
          if (pack) {
            setAtsPack(pack || null);
            if (pack?.job) {
              setAtsJobMeta({
                title: pack.job.title || '',
                company: pack.job.company || '',
                location: pack.job.location || '',
              });
            }
            // If ATS pack carries a job description, auto-use it as JD text
            if (pack?.job?.description && !jd) {
              const clean = normalizeJobText(pack.job.description);
              setJd(clean);
              await saveDraft(DRAFT_KEYS.LAST_JOB_TEXT, clean);
              applied = true;
            }
          }
        } catch (err) {
          console.error('[resume/create] Failed to load pack from DB drafts', err);
        }
      }

      // Fallback: if we don't have a JD yet, reuse last uploaded JD if available
      if (!applied && !jd) {
        try {
          const last = await getDraft(DRAFT_KEYS.LAST_JOB_TEXT);
          if (typeof last === 'string' && last) {
            setJd(last);
          }
        } catch (err) {
          console.error('[resume/create] Failed to load last JD from DB drafts', err);
        }
      }

      setAtsAppliedFromContext(true);
    }

    applyAtsContext();
  }, [router.isReady, router.query, jd, atsAppliedFromContext]);

  const fireMeta = atsJobMeta || jobMeta;

  // HEADER
  const Header = (
    <section className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-orange-600">Resume Builder</h1>
      <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
        2 templates. 1 goal: Get you the interview. <strong>Reverse Chronological</strong> for recruiters.{' '}
        <strong>System-Optimized</strong> for automated screeners. No fluff. Only what works.
      </p>
      <div className="flex items-center justify-center gap-8 mt-6">
        <button
          onClick={() => router.push(withChrome('/resume/create'))}
          className="min-w-[160px] px-6 py-3 rounded-full font-bold text-sm bg-orange-500 text-white shadow-md"
        >
          1. Resume
        </button>
        <div className="w-16 h-px bg-gray-300" />
        <button
          onClick={() => router.push(withChrome('/cover/create'))}
          className="min-w-[160px] px-6 py-3 rounded-full font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          2. Cover Letter
        </button>
      </div>
    </section>
  );

  // FOOTER (removed ATS wording + removed the risky stat claim)
  const Footer = (
    <div className="mt-16 text-center text-xs text-gray-500 max-w-2xl mx-auto px-4">
      Tip: System-optimized formatting improves compatibility with automated screeners. <em>Results vary by role and market.</em>
    </div>
  );

  return (
    <SeekerLayout title="Resume Builder" header={Header} right={null} footer={Footer} activeNav="resume-cover">
      <div
        style={{
          maxWidth: 1600,
          margin: '0 auto',
          padding: '20px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          alignItems: 'start',
        }}
      >
        {/* LEFT: INPUT */}
        <div style={{ display: 'grid', gap: 20, position: 'sticky', top: 20 }}>
          {/* TEMPLATE SWITCHER */}
          <Banner>
            Template: <strong>{templateName}</strong> • Live preview updates instantly on the right {' • '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => router.push(withChrome('/resume/create?template=reverse'))}
                style={{
                  fontWeight: router.query.template !== 'hybrid' ? 800 : 500,
                  color: router.query.template !== 'hybrid' ? ORANGE : '#666',
                  background: 'none',
                  border: 'none',
                  textDecoration: router.query.template !== 'hybrid' ? 'underline' : 'none',
                  cursor: 'pointer',
                }}
              >
                Reverse
              </button>
              <span style={{ color: '#999' }}>|</span>
              <button
                onClick={() => router.push(withChrome('/resume/create?template=hybrid'))}
                style={{
                  fontWeight: router.query.template === 'hybrid' ? 800 : 500,
                  color: router.query.template === 'hybrid' ? ORANGE : '#666',
                  background: 'none',
                  border: 'none',
                  textDecoration: router.query.template === 'hybrid' ? 'underline' : 'none',
                  cursor: 'pointer',
                }}
              >
                Hybrid
              </button>
            </span>
          </Banner>

          {/* REQUIRED */}
          <Section title="Required – Start Here" open={openRequired} onToggle={() => setOpenRequired((v) => !v)} required>
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
          <Section
            title="Optional – Summary, Projects, Certifications, and Custom Sections"
            open={openOptional}
            onToggle={() => setOpenOptional((v) => !v)}
          >
            <div style={{ display: 'grid', gap: 32 }}>
              <LanguagesInlineSection languages={languages} setLanguages={setLanguages} />
              <SummarySection embedded summary={summary} setSummary={setSummary} />
              <ProjectsSection embedded projects={projects} setProjects={setProjects} />
              <CertificationsSection embedded certifications={certifications} setCertifications={setCertifications} />
              <CustomSection embedded customSections={customSections} setCustomSections={setCustomSections} />
            </div>
          </Section>

          {/* The Forge Hammer — WITH LIMIT CHECK */}
          <Section
            title={
              <>
                <span style={{ fontWeight: 800 }}>The Forge Hammer</span>
                <span style={{ fontWeight: 400 }}>
                  {' – where our AI hammer, your resume steel, and employers\' job fire work together.'}
                </span>
              </>
            }
            open={openTailor}
            onToggle={() => setOpenTailor((v) => !v)}
          >
            {/* Job fire banner */}
            {atsPack ? (
              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                <Banner tone="blue">
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>🔥 Job fire loaded</div>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>
                    This job is now the <strong>fire</strong> heating your resume steel.
                  </div>
                  {atsJobMeta && (
                    <div style={{ fontSize: 14, marginBottom: 4 }}>
                      <strong>{atsJobMeta.title}</strong>
                      {atsJobMeta.company ? ` at ${atsJobMeta.company}` : ''}
                      {atsJobMeta.location ? ` — ${atsJobMeta.location}` : ''}
                    </div>
                  )}
                  {hasRealAts ? (
                    <>
                      <div style={{ fontSize: 13, marginBottom: 6 }}>
                        Current estimated match: <strong>{atsPack.ats.score}%</strong>
                      </div>
                      {atsPack.ats.summary && (
                        <div style={{ fontSize: 13, marginBottom: 6 }}>
                          <strong>AI read of this role:</strong> {atsPack.ats.summary}
                        </div>
                      )}
                      {Array.isArray(atsPack.ats.recommendations) && atsPack.ats.recommendations.length > 0 && (
                        <div style={{ fontSize: 13 }}>
                          <strong>Key improvements to consider:</strong>
                          <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13 }}>
                            {atsPack.ats.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      This job is loaded as your fire, but it hasn’t been fully scored yet.
                    </div>
                  )}
                </Banner>
              </div>
            ) : fireMeta && jd ? (
              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                <Banner tone="blue">
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>🔥 Job fire loaded</div>
                  <div style={{ fontSize: 14 }}>
                    <strong>{fireMeta.title || 'Job'}</strong>
                    {fireMeta.company ? ` at ${fireMeta.company}` : ''}
                    {fireMeta.location ? ` — ${fireMeta.location}` : ''}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    Your keyword coverage and match insights are now based on this posting.
                  </div>
                </Banner>
              </div>
            ) : (
              <Banner>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>🔥 Add the fire.</div>
                <div style={{ fontSize: 14 }}>
                  Your resume is the <strong>steel</strong>. This page is the <strong>anvil</strong>. The AI tools are
                  your <strong>hammer</strong>. Add a job description to supply the <strong>fire</strong> — and unlock
                  match insights, keyword coverage, and tailored guidance for this specific role.
                </div>
              </Banner>
            )}

            <div
              ref={dropRef}
              style={{
                padding: 40,
                border: '4px dashed #90CAF9',
                borderRadius: 16,
                textAlign: 'center',
                background: '#E3F2FD',
                cursor: 'pointer',
                marginTop: 16,
              }}
            >
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Drop a job description here
                <br />
                or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    color: ORANGE,
                    background: 'none',
                    border: 0,
                    fontWeight: 800,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  upload file
                </button>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => handleFile(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
            </div>

            {jd && (
              <ForgeHammerPanel
                jdText={jd}
                resumeData={resumeData}
                summary={summary}
                skills={skills}
                experiences={experiences}
                education={educationList}
                jobMeta={fireMeta || null} // ✅ NEW (safe) prop for panel to display title/company/location
                onAddSkill={(k) => setSkills((s) => [...s, k])}
                onAddSummary={(k) => setSummary((s) => (s ? `${s}\n\n${k}` : k))}
                onAddBullet={(k) => {
                  const lastExp = experiences[experiences.length - 1];
                  if (lastExp) {
                    setExperiences((exp) =>
                      exp.map((e, i) =>
                        i === exp.length - 1 ? { ...e, bullets: [...(e.bullets || []), k] } : e
                      )
                    );
                  }
                }}
              />
            )}
          </Section>
        </div>

        {/* RIGHT: LIVE RESUME PREVIEW */}
        <div
          style={{
            position: 'sticky',
            top: 20,
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '20px 32px',
              background: '#263238',
              color: 'white',
              fontWeight: 800,
              fontSize: 18,
              textAlign: 'center',
            }}
          >
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

      {/* FLOATING TOOLS TOGGLE + BAR */}
      <div className="fixed bottom-24 right-6 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setToolsOpen((v) => !v)}
          className="flex items-center gap-2 bg-white shadow-2xl border rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <span>{toolsOpen ? 'Hide tools' : 'Resume tools'}</span>
          <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-gray-100">
            <svg
              className={`w-3 h-3 text-gray-600 transition-transform ${toolsOpen ? 'rotate-90' : '-rotate-90'}`}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 5l6 5-6 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {toolsOpen && (
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-2xl border">
            {router.query.template === 'hybrid' ? (
              <HybridATSButton data={resumeData}>
                <div className="bg-teal-600 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-teal-700 transition-all">
                  System PDF
                </div>
              </HybridATSButton>
            ) : (
              <ReverseATSButton data={resumeData}>
                <div className="bg-teal-600 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-teal-700 transition-all">
                  System PDF
                </div>
              </ReverseATSButton>
            )}

            <DesignedPDFButton data={resumeData} template={router.query.template === 'hybrid' ? 'hybrid' : 'reverse'}>
              <div className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-orange-600 transition-all">
                Designed PDF
              </div>
            </DesignedPDFButton>

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
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                  {progress}%
                </span>
              </div>
              <span className="font-semibold text-gray-600">Ready</span>
            </div>

            {isResumeComplete && (
              <button
                onClick={() => router.push(withChrome('/cover/create'))}
                className="ml-2 bg-purple-600 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-purple-700 transition-all"
              >
                Next: Build Cover Letter
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 max-w-4xl mx-auto">
        <BulkExportCTA />
      </div>

      {showToast && (
        <div
          style={{
            position: 'fixed',
            right: 28,
            bottom: 170,
            background: ORANGE,
            color: 'white',
            padding: '14px 24px',
            borderRadius: 12,
            fontWeight: 700,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 1000,
          }}
        >
          Saved at {savedTime}
        </div>
      )}
    </SeekerLayout>
  );
}
// pages/resume/create.js — FINAL LOCKED + ATS CONTEXT
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
import { getResumeTemplateComponent } from '@/lib/templates';
import { extractTextFromFile, normalizeJobText } from '@/lib/jd/ingest';
import { uploadJD } from '@/lib/jd/uploadToApi';
import ReverseResumeTemplate from '@/components/resume-form/templates/ReverseResumeTemplate';
import BulkExportCTA from '@/components/BulkExportCTA';
import ReverseATSButton from '@/components/resume-form/export/ReverseATSButton';
import HybridATSButton from '@/components/resume-form/export/HybridATSButton';
import DesignedPDFButton from '@/components/resume-form/export/DesignedPDFButton';

const ForgeHammerPanel = dynamic(
  () => import('@/components/hammer/ForgeHammerPanel'),
  { ssr: false }
);

const ORANGE = '#FF7043';

const DRAFT_KEYS = {
  LAST_JOB_TEXT: 'ft_last_job_text',
  ATS_PACK: 'forge-ats-pack',
  LAST_UPLOADED_RESUME_TEXT: 'ft_last_uploaded_resume_text',
};

export default function CreateResumePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);
  const hasAppliedUploadRef = useRef(false);

  const {
    formData,
    setFormData,
    summary,
    setSummary,
    experiences,
    setExperiences,
    educationList,
    setEducationList,
    skills,
    setSkills,
    projects,
    setProjects,
    certifications,
    setCertifications,
    customSections,
    setCustomSections,
    languages,
    setLanguages,
    saveEventAt,
    saveResume,
  } = useContext(ResumeContext);

  const [TemplateComp, setTemplateComp] = useState(null);
  const [jd, setJd] = useState('');
  const [atsPack, setAtsPack] = useState(null);
  const [atsJobMeta, setAtsJobMeta] = useState(null);
  const [jobMeta, setJobMeta] = useState(null);
  const [atsAppliedFromContext, setAtsAppliedFromContext] = useState(false);

  // ─────────────────────────────────────────────
  // ✅ CLEAR JOB FIX — single authoritative reset
  // ─────────────────────────────────────────────
  const clearJobFire = async () => {
    setJd('');
    setAtsPack(null);
    setAtsJobMeta(null);
    setJobMeta(null);
    setAtsAppliedFromContext(true); // prevent re-hydration this session

    try {
      await fetch('/api/drafts/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: DRAFT_KEYS.LAST_JOB_TEXT, content: '' }),
      });
      await fetch('/api/drafts/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: DRAFT_KEYS.ATS_PACK, content: null }),
      });
    } catch (e) {
      console.error('[resume/create] failed to clear job drafts', e);
    }
  };

  // (rest of file unchanged until Forge Hammer section)

  // ─────────────────────────────────────────────
  // FORGE HAMMER SECTION (only addition inside)
  // ─────────────────────────────────────────────

  {/* inside the Forge Hammer <Section> render, directly under the blue "Job fire loaded" Banner */}

  {(jd || atsPack) && (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
      <button
        type="button"
        onClick={clearJobFire}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#B91C1C',
          fontWeight: 800,
          fontSize: 13,
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Clear job fire
      </button>
    </div>
  )}

  // (rest of file remains exactly as you sent it)
}
