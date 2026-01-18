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

const ForgeHammerPanel = dynamic(() => import('@/components/hammer/ForgeHammerPanel'), { ssr: false });

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
      ? { background: '#E3F2FD', border: '1px solid #90CAF9', color: '#0D47A1' }
      : { background: '#FFF3E0', border: '1px solid #FFCC80', color: '#E65100' };

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

const GLASS_CARD = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

function Section({ title, open, onToggle, children, required = false, dense = false, subtitle = '' }) {
  const headerPad = dense ? '12px 14px' : '14px 16px';
  const bodyPad = dense ? '14px 14px' : '18px 16px';

  return (
    <div
      style={{
        ...GLASS_CARD,
        overflow: 'hidden',
        background: dense ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.58)',
        border: required ? '1px solid rgba(255,112,67,0.30)' : GLASS_CARD.border,
      }}
    >
      <button
        onClick={onToggle}
        type="button"
        style={{
          width: '100%',
          padding: headerPad,
          background: required
            ? 'linear-gradient(180deg, rgba(255,112,67,0.10), rgba(255,255,255,0))'
            : 'linear-gradient(180deg, rgba(0,0,0,0.03), rgba(255,255,255,0))',
          textAlign: 'left',
          fontWeight: dense ? 900 : 900,
          fontSize: dense ? 14 : 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: 'none',
          cursor: 'pointer',
          gap: 12,
        }}
        aria-expanded={open ? 'true' : 'false'}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ color: required ? ORANGE : '#1F2937' }}>{title}</span>
          {!!subtitle && (
            <div style={{ marginTop: 4, color: '#475569', fontSize: 12, fontWeight: 700 }}>
              {subtitle}
            </div>
          )}
        </span>

        <span
          style={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(0,0,0,0.08)',
            flexShrink: 0,
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            )}
          </svg>
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: bodyPad,
            borderTop: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {children}
        </div>
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
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 14,
            background: 'rgba(255,255,255,0.85)',
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
                border: '1px solid rgba(0,0,0,0.10)',
                borderRadius: 999,
                padding: '6px 10px',
                background: 'rgba(255,255,255,0.75)',
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
  const withChrome = (path) => (chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path);

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

  // ✅ UX: default collapsed (user chooses what they see)
  const [openRequired, setOpenRequired] = useState(false);
  const [openOptional, setOpenOptional] = useState(false);
  const [openTailor, setOpenTailor] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true); // collapsible tools bar

  // ✅ NEW: visible JD processing status (permanent)
  const [jdLoading, setJdLoading] = useState(false);
  const [jdStatus, setJdStatus] = useState('');

  // ATS context passed from jobs page (via resume-cover)
  const [atsPack, setAtsPack] = useState(null);
  const [atsJobMeta, setAtsJobMeta] = useState(null);
  const [atsAppliedFromContext, setAtsAppliedFromContext] = useState(false);

  // ✅ NEW: job meta lookup for Resume-Role Align flow (jobId without pack)
  const [jobMeta, setJobMeta] = useState(null);

  // ✅ Section-level collapse (user controls visibility)
  const [openContact, setOpenContact] = useState(false);
  const [openWork, setOpenWork] = useState(false);
  const [openEducation, setOpenEducation] = useState(false);
  const [openSkills, setOpenSkills] = useState(false);

  const [openLanguages, setOpenLanguages] = useState(false);
  const [openSummary, setOpenSummary] = useState(false);
  const [openProjects, setOpenProjects] = useState(false);
  const [openCerts, setOpenCerts] = useState(false);
  const [openCustom, setOpenCustom] = useState(false);

  // ✅ Clear loaded job / ATS fire
  const clearJobFire = async () => {
    setJd('');
    setJdStatus('');
    setAtsPack(null);
    setAtsJobMeta(null);
    setJobMeta(null);
    setAtsAppliedFromContext(true);
    hasAppliedUploadRef.current = false; // keep your intent

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

  // ✅ GLOBAL drag/drop kill switch (prevents browser opening PDFs)
  useEffect(() => {
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);

    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

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
    !!(atsPack && atsPack.ats && typeof atsPack.ats.score === 'number' && !/demo|sample/i.test(atsPack.ats.summary || ''));

  const savedTime = saveEventAt
    ? new Date(saveEventAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // ✅ REQUIRED completion checks (now includes EDUCATION)
  const checks = [
    summary?.trim().length > 20,
    skills?.length >= 8,
    experiences?.length > 0 && experiences.every((e) => e.title && e.company && e.bullets?.length >= 2),
    educationList?.length > 0 && educationList.some((edu) => (edu.school || edu.institution) && (edu.degree || edu.field)),
  ];

  // Detect if the resume is effectively empty and clamp progress to 0 in that case.
  // IMPORTANT: Ignore auto-populated fields (fullName + forgeUrl/ftProfile) so "Ready" stays 0% until user actually enters content.
  const hasAnyResumeContent =
    (formData &&
      (formData.email ||
        formData.phone ||
        formData.location ||
        formData.linkedin ||
        formData.github ||
        formData.portfolio ||
        formData.targetedRole)) ||
    (summary && summary.trim().length > 0) ||
    (skills && skills.length > 0) ||
    (languages && languages.length > 0) ||
    (experiences && experiences.some((e) => e.title || e.company || (Array.isArray(e.bullets) && e.bullets.length > 0))) ||
    (educationList &&
      educationList.some(
        (edu) => edu.school || edu.institution || edu.degree || edu.field || edu.details || edu.description
      )) ||
    (projects && projects.some((p) => p.title || p.company || (Array.isArray(p.bullets) && p.bullets.length > 0))) ||
    (certifications && certifications.length > 0) ||
    (customSections && customSections.length > 0);

  let progress = Math.round((checks.filter(Boolean).length / 4) * 100);
  if (!hasAnyResumeContent) progress = 0;

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
        if (formData.forgeUrl || formData.ftProfile || formData.fullName) return;
        const res = await fetch('/api/profile/header');
        if (!res.ok) return;
        const data = await res.json();
        const derivedName = data?.name || [data?.firstName, data?.lastName].filter(Boolean).join(' ') || '';
        const slug = data?.slug;
        const fullProfileUrl = slug ? `https://forgetomorrow.com/u/${slug}` : '';
        setFormData((prev) => ({
          ...prev,
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

  // Handle manual JD file upload / drop
  const handleFile = async (file) => {
    if (!file) return;

    setJdLoading(true);
    setJdStatus('Processing…');

    const isPdf =
      file.type === 'application/pdf' || String(file.name || '').toLowerCase().endsWith('.pdf');

    try {
      let raw = '';

      // Non-PDF: client extract only (fast)
      if (!isPdf) {
        raw = await extractTextFromFile(file);
      } else {
        // PDF: attempt client extract, then fallback to server if empty
        setJdStatus('Processing… (PDF parse)');
        raw = await extractTextFromFile(file);

        if (!raw || !String(raw).trim()) {
          setJdStatus('Processing… (server extract)');
          raw = await uploadJD(file);
        }
      }

      const clean = normalizeJobText(raw);

      if (!clean || !String(clean).trim()) {
        setJdStatus('Failed: PDF appears scanned/unreadable');
        alert('This PDF appears to be scanned (image-only) or unreadable. Try a text-based PDF or upload a .txt/.docx JD.');
        return;
      }

      setJd(clean);
      await saveDraft(DRAFT_KEYS.LAST_JOB_TEXT, clean);
      setJdStatus('Loaded: Job fire from file');
    } catch (e) {
      console.error('[Hammer] JD file failed:', e);
      const msg = e?.message || 'Unknown error';
      setJdStatus(`Failed: ${msg}`);
      alert(`Failed to process job description. ${msg}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const templateName = router.query.template === 'hybrid' ? 'Hybrid (Combination)' : 'Reverse Chronological (Default)';

  const resumeData = {
    personalInfo: {
      name: formData.fullName || formData.name || 'Your Name',
      targetedRole: formData.targetedRole || '',
      email: formData.email || '',
      phone: formData.phone || '',
      location: formData.location || '',
      linkedin: formData.linkedin || '',
      github: formData.github || '',
      portfolio: formData.portfolio || '',
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

        let guessedName = formData.fullName || formData.name || '';
        if (!guessedName && lines.length > 0) guessedName = lines[0];

        const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        const guessedEmail = emailMatch ? emailMatch[0] : '';

        const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);
        const guessedPhone = phoneMatch ? phoneMatch[0].trim() : '';

        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || guessedName || '',
          email: prev.email || guessedEmail || '',
          phone: prev.phone || guessedPhone || '',
        }));

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
            if (pack?.job?.description && !jd) {
              const clean = normalizeJobText(pack.job.description);
              setJd(clean);
              await saveDraft(DRAFT_KEYS.LAST_JOB_TEXT, clean);
              setJdStatus('Loaded: Job fire from ATS context');
              applied = true;
            }
          }
        } catch (err) {
          console.error('[resume/create] Failed to load pack from DB drafts', err);
        }
      }

      if (!applied && !jd) {
        try {
          const last = await getDraft(DRAFT_KEYS.LAST_JOB_TEXT);
          if (typeof last === 'string' && last) {
            setJd(last);
            setJdStatus('Loaded: Last saved job fire');
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

  const Header = (
    <section
      style={{
        ...GLASS_CARD,
        padding: 18,
        textAlign: 'center',
      }}
      aria-label="Resume Builder header"
    >
      <h1 style={{ margin: 0, color: ORANGE, fontSize: 22, fontWeight: 900 }}>Resume Builder</h1>
      <p style={{ margin: '8px auto 0', color: '#455A64', maxWidth: 860, fontWeight: 700, lineHeight: 1.35 }}>
        2 templates. 1 goal: Get you the interview. <strong>Reverse Chronological</strong> for recruiters.{' '}
        <strong>System-Optimized</strong> for automated screeners. No fluff. Only what works.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <button
          onClick={() => router.push(withChrome('/resume/create'))}
          style={{
            borderRadius: 999,
            padding: '10px 14px',
            background: ORANGE,
            color: 'white',
            border: '1px solid rgba(255,112,67,0.55)',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          1. Resume
        </button>
        <span style={{ width: 46, height: 1, background: 'rgba(0,0,0,0.12)' }} />
        <button
          onClick={() => router.push(withChrome('/cover/create'))}
          style={{
            borderRadius: 999,
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.75)',
            color: '#334155',
            border: '1px solid rgba(0,0,0,0.10)',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          2. Cover Letter
        </button>
      </div>
    </section>
  );

  const Footer = (
    <div className="mt-16 text-center text-xs text-gray-500 max-w-2xl mx-auto px-4">
      Tip: System-optimized formatting improves compatibility with automated screeners. <em>Results vary by role and market.</em>
    </div>
  );

  return (
    <SeekerLayout title="Resume Builder" header={Header} right={null} footer={Footer} activeNav="resume-cover">
      {/* ✅ Guardrails (profile-style) */}
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
        }

        /* Responsive: stack columns on smaller widths */
        .ft-resume-create-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .ft-resume-create-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: 1600,
          margin: '0 auto',
          padding: '14px 12px',
        }}
        className="overflow-x-hidden"
      >
        <div className="ft-resume-create-grid">
          {/* LEFT: INPUT */}
          <div style={{ display: 'grid', gap: 12, position: 'sticky', top: 20 }}>
            {/* TEMPLATE SWITCHER */}
            <div style={{ ...GLASS_CARD, padding: 12 }}>
              <Banner>
                Template: <strong>{templateName}</strong> • Live preview updates instantly on the right {' • '}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => router.push(withChrome('/resume/create?template=reverse'))}
                    style={{
                      fontWeight: router.query.template !== 'hybrid' ? 900 : 700,
                      color: router.query.template !== 'hybrid' ? ORANGE : '#64748B',
                      background: 'none',
                      border: 'none',
                      textDecoration: router.query.template !== 'hybrid' ? 'underline' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Reverse
                  </button>
                  <span style={{ color: '#94A3B8' }}>|</span>
                  <button
                    onClick={() => router.push(withChrome('/resume/create?template=hybrid'))}
                    style={{
                      fontWeight: router.query.template === 'hybrid' ? 900 : 700,
                      color: router.query.template === 'hybrid' ? ORANGE : '#64748B',
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
            </div>

            {/* REQUIRED (group) */}
            <Section
              title="Required"
              subtitle="Start here — these drive the core score"
              open={openRequired}
              onToggle={() => setOpenRequired((v) => !v)}
              required
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <Section
                  title="Contact information"
                  subtitle="How recruiters reach you"
                  open={openContact}
                  onToggle={() => setOpenContact((v) => !v)}
                  dense
                  required
                >
                  <ContactInfoSection embedded formData={formData} setFormData={setFormData} />
                </Section>

                <Section
                  title="Work experience"
                  subtitle="Your proof of impact"
                  open={openWork}
                  onToggle={() => setOpenWork((v) => !v)}
                  dense
                  required
                >
                  <WorkExperienceSection embedded experiences={experiences} setExperiences={setExperiences} />
                </Section>

                <div id="education-section">
                  <Section
                    title="Education"
                    subtitle="Degrees, programs, certifications"
                    open={openEducation}
                    onToggle={() => setOpenEducation((v) => !v)}
                    dense
                    required
                  >
                    <EducationSection embedded educationList={educationList} setEducationList={setEducationList} />
                  </Section>
                </div>

                <Section
                  title="Skills"
                  subtitle="8–12 is the sweet spot"
                  open={openSkills}
                  onToggle={() => setOpenSkills((v) => !v)}
                  dense
                  required
                >
                  <SkillsSection embedded skills={skills} setSkills={setSkills} />
                </Section>
              </div>
            </Section>

            {/* OPTIONAL (group) */}
            <Section
              title="Optional"
              subtitle="Add depth without clutter"
              open={openOptional}
              onToggle={() => setOpenOptional((v) => !v)}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <Section
                  title="Languages"
                  subtitle="Spoken or programming"
                  open={openLanguages}
                  onToggle={() => setOpenLanguages((v) => !v)}
                  dense
                >
                  <LanguagesInlineSection languages={languages} setLanguages={setLanguages} />
                </Section>

                <Section
                  title="Summary"
                  subtitle="6–10 lines, high signal"
                  open={openSummary}
                  onToggle={() => setOpenSummary((v) => !v)}
                  dense
                >
                  <SummarySection embedded summary={summary} setSummary={setSummary} />
                </Section>

                <Section
                  title="Projects"
                  subtitle="When projects prove fit"
                  open={openProjects}
                  onToggle={() => setOpenProjects((v) => !v)}
                  dense
                >
                  <ProjectsSection embedded projects={projects} setProjects={setProjects} />
                </Section>

                <Section
                  title="Certifications"
                  subtitle="Badges that matter"
                  open={openCerts}
                  onToggle={() => setOpenCerts((v) => !v)}
                  dense
                >
                  <CertificationsSection embedded certifications={certifications} setCertifications={setCertifications} />
                </Section>

                <Section
                  title="Custom sections"
                  subtitle="Tailor to the role"
                  open={openCustom}
                  onToggle={() => setOpenCustom((v) => !v)}
                  dense
                >
                  <CustomSection embedded customSections={customSections} setCustomSections={setCustomSections} />
                </Section>
              </div>
            </Section>

            {/* The Forge Hammer (own section, not Optional) */}
            <Section
              title="The Forge Hammer"
              subtitle="AI hammer + resume steel + job fire"
              open={openTailor}
              onToggle={() => setOpenTailor((v) => !v)}
              required={false}
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
              ) : jd ? (
                <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                  <Banner tone="blue">
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>🔥 Job fire loaded</div>
                    <div style={{ fontSize: 14 }}>
                      <strong>{fireMeta?.title || 'Job'}</strong>
                      {fireMeta?.company ? ` at ${fireMeta.company}` : ''}
                      {fireMeta?.location ? ` — ${fireMeta.location}` : ''}
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
                    Your resume is the <strong>steel</strong>. This page is the <strong>anvil</strong>. The AI tools are your{' '}
                    <strong>hammer</strong>. Add a job description to supply the <strong>fire</strong> — and unlock match insights,
                    keyword coverage, and tailored guidance for this specific role.
                  </div>
                </Banner>
              )}

              {(jd || atsPack) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
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
                    Clear loaded job
                  </button>
                </div>
              )}

              {/* ✅ PERMANENT: dropzone owns its handlers (no addEventListener timing issues) */}
              <div
                ref={dropRef}
                onClick={() => {
                  // reset first so selecting the same file still triggers onChange
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  fileInputRef.current?.click();
                }}
                style={{
                  padding: 22,
                  border: '3px dashed rgba(144,202,249,0.95)',
                  borderRadius: 16,
                  textAlign: 'center',
                  background: 'rgba(227,242,253,0.85)',
                  cursor: 'pointer',
                  marginTop: 12,
                }}
              >
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  Drop a job description here
                  <br />
                  or{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      fileInputRef.current?.click();
                    }}
                    style={{
                      color: ORANGE,
                      background: 'none',
                      border: 0,
                      fontWeight: 900,
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
                  accept=".pdf,.PDF,.docx,.DOCX,.txt,.TXT"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    console.log('[Hammer] input change fired:', f?.name, f?.type, f?.size);
                    if (f) handleFile(f);
                    e.target.value = ''; // ✅ allows re-selecting same file
                  }}
                  style={{ display: 'none' }}
                />

                {(jdLoading || jdStatus) && (
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      fontWeight: 800,
                      color: jdStatus?.startsWith?.('Failed') ? '#B91C1C' : '#0D47A1',
                    }}
                  >
                    {jdLoading ? 'Processing…' : jdStatus}
                  </div>
                )}
              </div>

              {jd && (
                <ForgeHammerPanel
                  jdText={jd}
                  resumeData={resumeData}
                  summary={summary}
                  skills={skills}
                  experiences={experiences}
                  education={educationList}
                  jobMeta={fireMeta || null}
                  onAddSkill={(k) => setSkills((s) => [...s, k])}
                  onAddSummary={(k) => setSummary((s) => (s ? `${s}\n\n${k}` : k))}
                  onAddBullet={(k) => {
                    const lastExp = experiences[experiences.length - 1];
                    if (lastExp) {
                      setExperiences((exp) =>
                        exp.map((e, i) => (i === exp.length - 1 ? { ...e, bullets: [...(e.bullets || []), k] } : e))
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
              overflow: 'hidden',
              ...GLASS_CARD,
              background: 'rgba(255,255,255,0.58)',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                background: 'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))',
                color: 'white',
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 0.6,
                textAlign: 'center',
              }}
            >
              LIVE RESUME PREVIEW
            </div>
            <div id="resume-preview" style={{ padding: 18, background: 'rgba(255,255,255,0.88)', minHeight: '60vh' }}>
              <div style={{ borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.10)' }}>
                <div style={{ padding: 24, background: '#fff' }}>
                  {TemplateComp && typeof TemplateComp === 'function' ? (
                    <TemplateComp data={resumeData} />
                  ) : (
                    <div style={{ textAlign: 'center', marginTop: 80, color: '#999', fontSize: 18 }}>
                      Loading your resume template...
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              <path d="M7 5l6 5-6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
