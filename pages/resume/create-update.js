// pages/resume/create-update.js — FINAL LOCKED + ATS CONTEXT
import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import ResumeBuilderLayout from '@/components/layouts/ResumeBuilderLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
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
import SignalResumeTestTemplate from '@/components/resume-form/templates/SignalResumeTestTemplate';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import ReverseATSButton from '@/components/resume-form/export/ReverseATSButton';
import HybridATSButton from '@/components/resume-form/export/HybridATSButton';
import DesignedPDFButton from '@/components/resume-form/export/DesignedPDFButton';

const ForgeHammerPanel = dynamic(() => import('@/components/hammer/ForgeHammerPanel'), { ssr: false });

const ORANGE = '#FF7043';

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
        fontSize: 14,
        fontWeight: 700,
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
          fontWeight: 900,
          fontSize: dense ? 13 : 15,
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
          <span style={{ color: required ? ORANGE : '#111827', fontWeight: 900 }}>{title}</span>
          {!!subtitle && (
            <div style={{ marginTop: 4, color: '#334155', fontSize: 12, fontWeight: 700 }}>
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
          placeholder="Add a language (e.g., English - Native)"
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
        Tip: use “Language - Proficiency” format (example: “Spanish — Professional”).
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
  const hasAppliedUploadRef = useRef(false);
  const hasAppliedResumeLoadRef = useRef(false);

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
    setSaveEventAt,
    saveResume,
  } = useContext(ResumeContext);

  const [TemplateComp, setTemplateComp] = useState(null);
  const [previewMode, setPreviewMode] = useState('standard');
  const [jd, setJd] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [existingResumes, setExistingResumes] = useState([]);

  const [openRequired, setOpenRequired] = useState(false);
  const [openOptional, setOpenOptional] = useState(false);

  const [jdLoading, setJdLoading] = useState(false);
  const [jdStatus, setJdStatus] = useState('');

  const [atsPack, setAtsPack] = useState(null);
  const [atsJobMeta, setAtsJobMeta] = useState(null);
  const [atsAppliedFromContext, setAtsAppliedFromContext] = useState(false);

  const [jobMeta, setJobMeta] = useState(null);

  const [openContact, setOpenContact] = useState(false);
  const [openWork, setOpenWork] = useState(false);
  const [openEducation, setOpenEducation] = useState(false);
  const [openSkills, setOpenSkills] = useState(false);

  const [openLanguages, setOpenLanguages] = useState(false);
  const [openSummary, setOpenSummary] = useState(false);
  const [openProjects, setOpenProjects] = useState(false);
  const [openCerts, setOpenCerts] = useState(false);
  const [openCustom, setOpenCustom] = useState(false);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);

  const clearJobFire = async () => {
    setJd('');
    setJdStatus('');
    setAtsPack(null);
    setAtsJobMeta(null);
    setJobMeta(null);
    setAtsAppliedFromContext(true);
    hasAppliedUploadRef.current = false;

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

  const coerceUploadedDraftText = (raw) => {
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object' && typeof raw.text === 'string') return raw.text;
    return '';
  };

  const applyResumePayloadToState = (payload) => {
    if (!payload || typeof payload !== 'object') return false;

    const source = payload.resume || payload.data || payload.item || payload.document || payload;
    const sourceForm = source.formData || source.personalInfo || source.contact || {};

    setFormData((prev) => ({
      ...prev,
      ...(sourceForm || {}),
      fullName:
        sourceForm.fullName ||
        sourceForm.name ||
        source.fullName ||
        source.name ||
        prev.fullName ||
        prev.name ||
        '',
    }));

    if (typeof source.summary === 'string') setSummary(source.summary);
    if (Array.isArray(source.experiences || source.workExperiences)) setExperiences(source.experiences || source.workExperiences);
    if (Array.isArray(source.educationList || source.education)) setEducationList(source.educationList || source.education);
    if (Array.isArray(source.skills)) setSkills(source.skills);
    if (Array.isArray(source.projects)) setProjects(source.projects);
    if (Array.isArray(source.certifications)) setCertifications(source.certifications);
    if (Array.isArray(source.customSections)) setCustomSections(source.customSections);
    if (Array.isArray(source.languages)) setLanguages(source.languages);

    return true;
  };

  const fetchResumeById = async (resumeId) => {
    const id = String(resumeId || '').trim();
    if (!id) return null;

    const tryEndpoints = [
      `/api/resume/get?id=${encodeURIComponent(id)}`,
      `/api/resume?id=${encodeURIComponent(id)}`,
      `/api/resume/list`,
    ];

    for (const url of tryEndpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = await res.json();

        if (url.includes('/api/resume/list')) {
          const list = Array.isArray(json?.resumes) ? json.resumes : [];
          const found = list.find((item) => String(item?.id) === id);
          if (found) return found;
          continue;
        }

        return json;
      } catch (err) {
        console.error('[resume/create] Failed fetching resume source', url, err);
      }
    }

    return null;
  };

  const buildResumeCreateHref = (template) => {
    const params = new URLSearchParams();

    Object.entries(router.query || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null && v !== '') params.append(key, String(v));
        });
      } else {
        params.set(key, String(value));
      }
    });

    params.set('template', template);

    const qs = params.toString();
    return withChrome(`/resume/create${qs ? `?${qs}` : ''}`);
  };

  const hasRealAts =
    !!(atsPack && atsPack.ats && typeof atsPack.ats.score === 'number' && !/demo|sample/i.test(atsPack.ats.summary || ''));

  const savedTime = saveEventAt
    ? new Date(saveEventAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const checks = [
    summary?.trim().length > 20,
    skills?.length >= 8,
    experiences?.length > 0 && experiences.every((e) => e.title && e.company && e.bullets?.length >= 2),
    educationList?.length > 0 && educationList.some((edu) => (edu.school || edu.institution) && (edu.degree || edu.field)),
  ];

  const hasAnyResumeContent =
    (formData &&
      (formData.email ||
        formData.phone ||
        formData.location ||
        formData.externalurl ||
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

  useEffect(() => {
    if (!router.isReady) return;
    const id = router.query.template === 'hybrid' ? 'hybrid' : 'reverse';
    const comp = getResumeTemplateComponent(id);
    setTemplateComp(() => (typeof comp === 'function' ? comp : SignalResumeTestTemplate));
  }, [router.isReady, router.query.template]);

  useEffect(() => {
    if (saveEventAt) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 2200);
      return () => clearTimeout(t);
    }
  }, [saveEventAt]);

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

  useEffect(() => {
    if (!router.isReady) return;

    const resumeId = String(router.query.resumeId || '').trim();
    if (!resumeId) {
      hasAppliedResumeLoadRef.current = false;
      return;
    }

    if (hasAppliedResumeLoadRef.current === resumeId) return;

    let cancelled = false;

    async function loadResumeFromRoute() {
      try {
        const payload = await fetchResumeById(resumeId);
        if (cancelled || !payload) return;

        const applied = applyResumePayloadToState(payload);
        if (applied) {
          hasAppliedResumeLoadRef.current = resumeId;
          hasAppliedUploadRef.current = true;
        }
      } catch (err) {
        console.error('[resume/create] Failed to hydrate resume from resumeId', err);
      }
    }

    loadResumeFromRoute();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.resumeId]);

  const handleFile = async (file) => {
    if (!file) return;

    setJdLoading(true);
    setJdStatus('Processing…');

    const isPdf =
      file.type === 'application/pdf' || String(file.name || '').toLowerCase().endsWith('.pdf');

    try {
      let raw = '';

      if (!isPdf) {
        raw = await extractTextFromFile(file);
      } else {
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
      setJdLoading(false);
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
      externalurl: formData.externalurl || '',
      github: formData.github || '',
      portfolio: formData.portfolio || '',
      ftProfile: formData.forgeUrl || formData.ftProfile || '',
    },
    summary: summary || '',
    workExperiences: experiences,
    projects,
    educationList,
    certifications,
    skills,
    languages,
    customSections,
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (hasAppliedUploadRef.current) return;

    const { uploaded, resumeId } = router.query || {};
    if (resumeId) return;

    const uploadedFlag = String(uploaded || '').toLowerCase();
    if (uploadedFlag !== '1' && uploadedFlag !== 'true') return;

    async function applyUploadedResume() {
      try {
        const raw = await getDraft(DRAFT_KEYS.LAST_UPLOADED_RESUME_TEXT);
        const text = coerceUploadedDraftText(raw);
        if (!text) return;

        const res = await fetch('/api/resume/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const parsed = await res.json();
          applyResumePayloadToState(parsed);
        } else {
          const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
          const phoneMatch = text.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);

          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || lines[0] || '',
            email: prev.email || (emailMatch ? emailMatch[0] : ''),
            phone: prev.phone || (phoneMatch ? phoneMatch[0].trim() : ''),
          }));
        }

        hasAppliedUploadRef.current = true;
      } catch (err) {
        console.error('[resume/create] Failed to auto-fill from uploaded resume', err);
      }
    }

    applyUploadedResume();
  }, [router.isReady, router.query, formData.fullName, formData.name, summary, setFormData, setSummary]);

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
  const greeting = getTimeGreeting();

  const Header = (
    <SeekerTitleCard
      greeting={greeting}
      title="Resume Builder"
      subtitle="Build your resume once. Export anywhere. Reverse Chronological and Hybrid for traditional markets — ForgeFormat for people with real careers."
    />
  );

  const handleSaveClick = async () => {
    try {
      const res = await fetch('/api/resume/list');
      if (res.ok) {
        const json = await res.json();
        setExistingResumes(json.resumes || []);
      } else {
        setExistingResumes([]);
      }
    } catch {
      setExistingResumes([]);
    }
    setShowSaveModal(true);
  };

  const handleSaveNew = async () => {
    setShowSaveModal(false);
    await saveResume();
  };

  const handleOverwrite = async (resumeId, resumeName) => {
    setShowSaveModal(false);

    try {
      const res = await fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resumeId,
          name: resumeName,
          content: {
            template: router.query.template === 'hybrid' ? 'hybrid' : 'reverse',
            data: resumeData,
          },
          setPrimary: true,
        }),
      });

      if (!res.ok) throw new Error('Save failed');

      setSaveEventAt(new Date().toISOString());
    } catch {
      alert('Save failed. Try again.');
    }
  };

  const saveModal =
    typeof window !== 'undefined' && showSaveModal
      ? createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowSaveModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 28,
                width: 'min(480px, 92vw)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Save Resume</div>

              <div style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
                Save as a new resume, or overwrite an existing one.
              </div>

              <button
                onClick={handleSaveNew}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: ORANGE,
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: 'pointer',
                  marginBottom: 16,
                }}
              >
                + Save as new resume
              </button>

              {existingResumes.length > 0 && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: '#94A3B8',
                      marginBottom: 10,
                      letterSpacing: 0.5,
                    }}
                  >
                    OVERWRITE EXISTING
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    {existingResumes.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleOverwrite(r.id, r.name || r.resumeName || 'Resume')}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: 'pointer',
                          textAlign: 'left',
                          color: '#1F2937',
                        }}
                      >
                        <div>{r.name || 'Untitled Resume'}</div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#94A3B8',
                            marginTop: 2,
                          }}
                        >
                          {r.updatedAt
                            ? `Updated ${new Date(r.updatedAt).toLocaleDateString()}`
                            : 'Saved resume'}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => setShowSaveModal(false)}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: 10,
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <ResumeBuilderLayout title="Resume Builder | ForgeTomorrow">
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
        }

        @media (max-width: 1279px) {
          .ft-resume-top-grid,
          .ft-resume-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={{ width: '100%', boxSizing: 'border-box' }} className="overflow-x-hidden">
        {/* TOP BAND: header + toolbar stretch across center content width, ad stays in right rail */}
        <div
          className="ft-resume-top-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: isFocusMode ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) 260px',
            gap: 16,
            alignItems: 'start',
            marginBottom: 4,
          }}
        >
          <div style={{ minWidth: 0, display: 'grid', gap: 12 }}>
            <div>{Header}</div>

            <div style={{ ...GLASS_CARD, padding: 12 }}>
              <Banner>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 900, color: '#C2410C', fontSize: 13, whiteSpace: 'nowrap' }}>
                      Template: <strong>{templateName}</strong>
                    </span>
                    <span style={{ color: '#CBD5E1', fontSize: 13 }}>•</span>
                    <span style={{ fontWeight: 800, color: '#475569', fontSize: 13 }}>Base:</span>
                    <button
                      onClick={() => router.push(buildResumeCreateHref('reverse'))}
                      style={{
                        fontWeight: router.query.template !== 'hybrid' ? 900 : 700,
                        color: router.query.template !== 'hybrid' ? ORANGE : '#64748B',
                        background: 'none',
                        border: 'none',
                        textDecoration: router.query.template !== 'hybrid' ? 'underline' : 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        padding: 0,
                      }}
                    >
                      Reverse
                    </button>
                    <span style={{ color: '#94A3B8' }}>|</span>
                    <button
                      onClick={() => router.push(buildResumeCreateHref('hybrid'))}
                      style={{
                        fontWeight: router.query.template === 'hybrid' ? 900 : 700,
                        color: router.query.template === 'hybrid' ? ORANGE : '#64748B',
                        background: 'none',
                        border: 'none',
                        textDecoration: router.query.template === 'hybrid' ? 'underline' : 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        padding: 0,
                      }}
                    >
                      Hybrid
                    </button>
                    <span style={{ color: '#CBD5E1', fontSize: 13 }}>•</span>
                    <span style={{ fontWeight: 800, color: '#475569', fontSize: 12 }}>Preview:</span>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('standard')}
                      style={{
                        borderRadius: 999,
                        padding: '3px 8px',
                        fontSize: 11,
                        border: previewMode === 'standard' ? `1px solid ${ORANGE}` : '1px solid rgba(0,0,0,0.10)',
                        background: previewMode === 'standard' ? 'rgba(255,112,67,0.10)' : 'rgba(255,255,255,0.65)',
                        color: previewMode === 'standard' ? '#C2410C' : '#475569',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('signal-test')}
                      style={{
                        borderRadius: 999,
                        padding: '3px 8px',
                        fontSize: 11,
                        border: previewMode === 'signal-test' ? `1px solid ${ORANGE}` : '1px solid rgba(0,0,0,0.10)',
                        background: previewMode === 'signal-test' ? 'rgba(255,112,67,0.10)' : 'rgba(255,255,255,0.65)',
                        color: previewMode === 'signal-test' ? '#C2410C' : '#475569',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ForgeFormat
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFocusMode((v) => !v);
                        setIsLeftCollapsed(false);
                      }}
                      style={{
                        borderRadius: 999,
                        padding: '5px 12px',
                        fontSize: 12,
                        border: isFocusMode ? `2px solid ${ORANGE}` : '1px solid rgba(0,0,0,0.15)',
                        background: isFocusMode ? 'rgba(255,112,67,0.12)' : 'rgba(255,255,255,0.80)',
                        color: isFocusMode ? '#C2410C' : '#334155',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isFocusMode ? '← Exit Focus' : '🎯 Focus Resume'}
                    </button>

                    {!isFocusMode && (
                      <button
                        type="button"
                        onClick={() => setIsLeftCollapsed((v) => !v)}
                        style={{
                          borderRadius: 999,
                          padding: '5px 12px',
                          fontSize: 12,
                          border: isLeftCollapsed ? '2px solid #334155' : '1px solid rgba(0,0,0,0.15)',
                          background: isLeftCollapsed ? 'rgba(51,65,85,0.10)' : 'rgba(255,255,255,0.80)',
                          color: '#334155',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isLeftCollapsed ? '→ Expand Panel' : '← Collapse Panel'}
                      </button>
                    )}

                    <span style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.12)', margin: '0 4px', flexShrink: 0 }} />

                    {router.query.template === 'hybrid' ? (
                      <HybridATSButton data={resumeData}>
                        <div style={{ background: '#0F766E', color: 'white', padding: '5px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                          System PDF
                        </div>
                      </HybridATSButton>
                    ) : (
                      <ReverseATSButton data={resumeData}>
                        <div style={{ background: '#0F766E', color: 'white', padding: '5px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                          System PDF
                        </div>
                      </ReverseATSButton>
                    )}

                    <DesignedPDFButton data={resumeData} template={router.query.template === 'hybrid' ? 'hybrid' : 'reverse'}>
                      <div style={{ background: ORANGE, color: 'white', padding: '5px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                        Designed PDF
                      </div>
                    </DesignedPDFButton>

                    <button
                      type="button"
                      onClick={handleSaveClick}
                      style={{ background: '#16A34A', color: 'white', padding: '5px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer' }}
                    >
                      Save Resume
                    </button>

                    {isResumeComplete && (
                      <button
                        type="button"
                        onClick={() => router.push(withChrome('/cover/create'))}
                        style={{ background: '#7C3AED', color: 'white', padding: '5px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer' }}
                      >
                        Next: Cover Letter →
                      </button>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                      <div style={{ position: 'relative', width: 28, height: 28 }}>
                        <svg width="28" height="28" viewBox="0 0 28 28">
                          <circle cx="14" cy="14" r="11" fill="none" stroke="#E5E7EB" strokeWidth="2.5" />
                          <circle
                            cx="14"
                            cy="14"
                            r="11"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="2.5"
                            strokeDasharray={`${(progress / 100) * 69.1} 69.1`}
                            style={{ transition: 'stroke-dasharray 0.5s ease' }}
                          />
                        </svg>
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#374151' }}>
                          {progress}%
                        </span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Ready</span>
                    </div>
                  </div>
                </div>
              </Banner>
            </div>
          </div>

          {!isFocusMode && (
  <div
    style={{
      width: '100%',
      maxWidth: 248,
      height: 250,
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      overflow: 'visible',
    }}
  >
    <div
      style={{
        transform: 'scale(0.82)',
        transformOrigin: 'top center',
      }}
    >
      <RightRailPlacementManager slot="right_rail_1" />
    </div>
  </div>
)}
        </div>

        {/* MAIN BAND: left controls | center preview | right hammer */}
        <div
  className="ft-resume-main-grid"
  style={{
    display: 'grid',
    gridTemplateColumns: isFocusMode
      ? 'minmax(0, 1fr)'
      : isLeftCollapsed
      ? '52px minmax(0, 2.2fr) minmax(300px, 0.8fr)'
      : '240px minmax(0, 2.2fr) minmax(300px, 0.8fr)',
    gap: 16,
    alignItems: 'start',
    marginTop: 16,
    transition: 'grid-template-columns 0.25s ease',
  }}
>
          {!isFocusMode && (
            <div style={{ display: 'grid', gap: 12, position: 'sticky', top: 20, overflow: 'hidden' }}>
              {isLeftCollapsed ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                  {[
                    { label: 'R', title: 'Required' },
                    { label: 'O', title: 'Optional' },
                  ].map(({ label, title }) => (
                    <div
                      key={label}
                      title={title}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.70)',
                        border: '1px solid rgba(0,0,0,0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 13,
                        color: '#334155',
                        cursor: 'default',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

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
                padding: '10px 16px',
                background: 'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))',
                color: 'white',
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: 0.4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>LIVE RESUME PREVIEW</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                  disabled={previewPage <= 1}
                  style={{
                    background: previewPage <= 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.30)',
                    border: 'none',
                    color: 'white',
                    borderRadius: 6,
                    padding: '3px 8px',
                    cursor: previewPage <= 1 ? 'default' : 'pointer',
                    fontWeight: 800,
                    fontSize: 13,
                    opacity: previewPage <= 1 ? 0.4 : 1,
                  }}
                >
                  ‹
                </button>
                <span style={{ fontSize: 12, opacity: 0.85 }}>Pg {previewPage}</span>
                <button
                  type="button"
                  onClick={() => setPreviewPage((p) => p + 1)}
                  style={{
                    background: 'rgba(255,255,255,0.30)',
                    border: 'none',
                    color: 'white',
                    borderRadius: 6,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  ›
                </button>
              </div>
            </div>

            <div
              id="resume-preview"
              style={{
                padding: 12,
                background: 'rgba(255,255,255,0.88)',
                height: 760,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.10)',
                  height: 760,
                }}
              >
                <div
                  style={{
                    padding: 24,
                    background: '#fff',
                    transform: `translateY(calc(-${previewPage - 1} * 760px)) scale(0.62)`,
transformOrigin: 'top center',
transition: 'transform 0.35s ease',
width: '161%',
marginLeft: '-30.5%',
                  }}
                >
                  {previewMode === 'signal-test' ? (
                    <SignalResumeTestTemplate data={resumeData} />
                  ) : TemplateComp && typeof TemplateComp === 'function' ? (
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

          {!isFocusMode && (
            <div
              style={{
                position: 'sticky',
                top: 20,
                display: 'grid',
                gap: 12,
                maxHeight: 'calc(100vh - 40px)',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(255,112,67,0.25)',
                  background: 'rgba(255,255,255,0.70)',
                  backdropFilter: 'blur(10px)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 14, color: '#FF7043', marginBottom: 2 }}>
                  🔨 The Forge Hammer
                </div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                  AI hammer + resume steel + job fire
                </div>
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,0.10)',
                  background: 'rgba(255,255,255,0.70)',
                  backdropFilter: 'blur(10px)',
                  padding: '12px 14px',
                }}
              >
                {atsPack ? (
                  <>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#0D47A1', marginBottom: 6 }}>🔥 Job fire loaded</div>
                    {atsJobMeta && (
                      <div style={{ fontSize: 13, color: '#1E293B', marginBottom: 4 }}>
                        <strong>{atsJobMeta.title}</strong>
                        {atsJobMeta.company ? ` at ${atsJobMeta.company}` : ''}
                      </div>
                    )}
                    {hasRealAts && atsPack.ats?.score !== undefined && (
                      <div style={{ fontSize: 12, color: '#334155', marginBottom: 4 }}>
                        Match: <strong>{atsPack.ats.score}%</strong>
                      </div>
                    )}
                  </>
                ) : jd ? (
                  <>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#0D47A1', marginBottom: 4 }}>🔥 Job fire loaded</div>
                    <div style={{ fontSize: 12, color: '#334155' }}>
                      <strong>{fireMeta?.title || 'Job'}</strong>
                      {fireMeta?.company ? ` at ${fireMeta.company}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                      Your keyword coverage and match insights are now based on this posting.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#FF7043', marginBottom: 6 }}>
                      🔥 Add the fire.
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                      Drop a job description to unlock match insights, keyword coverage, and tailored guidance for this role.
                    </div>
                  </>
                )}

                {(jd || atsPack) && (
                  <button
                    type="button"
                    onClick={clearJobFire}
                    style={{
                      marginTop: 8,
                      background: 'transparent',
                      border: 'none',
                      color: '#B91C1C',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Clear loaded job
                  </button>
                )}
              </div>

              <div
                ref={dropRef}
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  fileInputRef.current?.click();
                }}
                style={{
                  padding: 16,
                  border: '2px dashed rgba(144,202,249,0.95)',
                  borderRadius: 14,
                  textAlign: 'center',
                  background: 'rgba(227,242,253,0.85)',
                  cursor: 'pointer',
                }}
              >
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#334155' }}>
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
                      fontSize: 13,
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
                    if (f) handleFile(f);
                    e.target.value = '';
                  }}
                  style={{ display: 'none' }}
                />

                {(jdLoading || jdStatus) && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
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
            </div>
          )}
        </div>
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

      {saveModal}
    </ResumeBuilderLayout>
  );
}