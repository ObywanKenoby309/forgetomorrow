// context/ResumeContext.js
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

export const ResumeContext = createContext();

export function ResumeProvider({ children }) {
  const { status } = useSession();
  const isAuthed = status === 'authenticated';

  // -----------------------------
  // Resume Builder State
  // -----------------------------
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    forgeUrl: '',
    ftProfile: '',
    targetedRole: '',
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

  const [template, setTemplate] = useState('reverse');

  const [resumes, setResumes] = useState([]);

  // Timestamps
  const [lastAutosaveAt, setLastAutosaveAt] = useState(null);
  const [saveEventAt, setSaveEventAt] = useState(null);

  const nowIso = () => new Date().toISOString();

  // -----------------------------
  // Summary Backup (OFF LOCAL; in-memory only)
  // -----------------------------
  const [summaryBackup, setSummaryBackup] = useState({ text: '', savedAt: '' });

  // ✅ IMPORTANT: Do NOT trigger global "Saved" toast for backup/autosave events.
  // saveEventAt should be reserved for explicit user-initiated saves (Save Resume).
  const persistSummaryBackup = (text) => {
    const payload = { text: text || '', savedAt: nowIso() };
    setSummaryBackup(payload);
  };

  const setSummaryWithBackup = (next) => {
    const current = summary || '';
    if (!summaryBackup.text || summaryBackup.text !== current) {
      persistSummaryBackup(current);
    }
    setSummary(next);
    // ✅ Do not setSaveEventAt here (would cause toast while typing)
  };

  // -----------------------------
  // Build Friendly Resume Name
  // -----------------------------
  const buildResumeName = () => {
    const n = (formData.fullName || 'Resume').trim();
    const r = (formData.targetedRole || 'General').trim();
    const date = new Date().toISOString().slice(0, 10);
    return `${n} - ${r} - ${date}`;
  };

  // -----------------------------
  // BUILD CORRECT resumeData FORMAT
  // -----------------------------
  const buildResumeData = () => ({
    template,
    personalInfo: {
      name: formData.fullName || '',
      targetedRole: formData.targetedRole || '',
      email: formData.email || '',
      phone: formData.phone || '',
      location: formData.location || '',
      linkedin: formData.linkedin || '',
      github: formData.github || '',
      portfolio: formData.portfolio || '',
      ftProfile: formData.forgeUrl || formData.ftProfile || '',
    },
    summary,
    workExperiences: experiences,
    projects,
    volunteerExperiences,
    educationList,
    certifications,
    languages,
    skills,
    achievements,
    customSections,
  });

  // -----------------------------
  // DRAFTS (DB) - UserDraft via /api/drafts/*
  // -----------------------------
  const RESUME_DRAFT_KEY = 'resume:draft';

  const draftBusyRef = useRef(false);
  const didLoadDraftRef = useRef(false);

  const getResumeDraft = async () => {
    // ✅ Gate drafts behind NextAuth session
    if (!isAuthed) return null;

    try {
      const res = await fetch(`/api/drafts/get?key=${encodeURIComponent(RESUME_DRAFT_KEY)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json?.draft?.content || null;
    } catch (e) {
      console.error('[ResumeContext] getResumeDraft failed', e);
      return null;
    }
  };

  const setResumeDraft = async (payload, opts = { isAutosave: false }) => {
    // ✅ Gate drafts behind NextAuth session
    if (!isAuthed) return;
    if (opts.isAutosave && draftBusyRef.current) return;

    try {
      if (opts.isAutosave) draftBusyRef.current = true;

      const res = await fetch('/api/drafts/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: RESUME_DRAFT_KEY, content: payload }),
      });

      if (!res.ok) throw new Error('Draft set failed');

      const ts = nowIso();
      setLastAutosaveAt(ts);

      // ✅ IMPORTANT: only fire "saveEventAt" for non-autosave actions.
      if (!opts.isAutosave) {
        setSaveEventAt(ts);
      }
    } catch (e) {
      console.error('[ResumeContext] setResumeDraft failed', e);
    } finally {
      draftBusyRef.current = false;
    }
  };

  const deleteResumeDraft = async () => {
    // ✅ Gate drafts behind NextAuth session
    if (!isAuthed) return;

    try {
      await fetch('/api/drafts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: RESUME_DRAFT_KEY }),
      });
    } catch (e) {
      console.error('[ResumeContext] deleteResumeDraft failed', e);
    }
  };

  // Load draft ONCE (does not overwrite after user starts typing)
  useEffect(() => {
    let mounted = true;

    async function loadDraftOnce() {
      // ✅ Don’t load drafts until authenticated (prevents 401 spam on signin)
      if (!isAuthed) return;

      // If we already loaded for this authenticated session, don’t re-run
      if (didLoadDraftRef.current) return;
      didLoadDraftRef.current = true;

      const draft = await getResumeDraft();
      if (!mounted || !draft) return;

      // draft format: { formData, summary, experiences, ... template }
      try {
        const d = draft;

        if (d.formData) setFormData((prev) => ({ ...prev, ...d.formData }));
        if (typeof d.summary === 'string') setSummary(d.summary);
        if (Array.isArray(d.experiences)) setExperiences(d.experiences);
        if (Array.isArray(d.projects)) setProjects(d.projects);
        if (Array.isArray(d.volunteerExperiences)) setVolunteerExperiences(d.volunteerExperiences);
        if (Array.isArray(d.educationList)) setEducationList(d.educationList);
        if (Array.isArray(d.certifications)) setCertifications(d.certifications);
        if (Array.isArray(d.languages)) setLanguages(d.languages);
        if (Array.isArray(d.skills)) setSkills(d.skills);
        if (Array.isArray(d.achievements)) setAchievements(d.achievements);
        if (Array.isArray(d.customSections)) setCustomSections(d.customSections);
        if (typeof d.template === 'string') setTemplate(d.template);
      } catch (e) {
        console.error('[ResumeContext] Failed to hydrate draft', e);
      }
    }

    loadDraftOnce();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  // Autosave draft every 30s (DB). This is the core requirement.
  useEffect(() => {
    // ✅ Don’t autosave drafts until authenticated (prevents 401 spam on signin)
    if (!isAuthed) return;

    const timer = setInterval(() => {
      const payload = {
        template,
        formData,
        summary,
        experiences,
        projects,
        volunteerExperiences,
        educationList,
        certifications,
        languages,
        skills,
        achievements,
        customSections,
        savedAt: nowIso(),
      };

      setResumeDraft(payload, { isAutosave: true });
    }, 30000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthed,
    template,
    formData,
    summary,
    experiences,
    projects,
    volunteerExperiences,
    educationList,
    certifications,
    languages,
    skills,
    achievements,
    customSections,
  ]);

  // Save draft on blur (capture) - minimal, no page edits required.
  // This triggers whenever any input/textarea/select inside the provider loses focus.
  useEffect(() => {
    // ✅ Don’t bind blur autosave until authenticated (prevents 401 spam on signin)
    if (!isAuthed) return;

    const onBlurCapture = (e) => {
      const t = e?.target;
      if (!t) return;

      const tag = String(t.tagName || '').toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') return;

      const payload = {
        template,
        formData,
        summary,
        experiences,
        projects,
        volunteerExperiences,
        educationList,
        certifications,
        languages,
        skills,
        achievements,
        customSections,
        savedAt: nowIso(),
      };

      setResumeDraft(payload, { isAutosave: true });
    };

    document.addEventListener('blur', onBlurCapture, true);
    return () => document.removeEventListener('blur', onBlurCapture, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthed,
    template,
    formData,
    summary,
    experiences,
    projects,
    volunteerExperiences,
    educationList,
    certifications,
    languages,
    skills,
    achievements,
    customSections,
  ]);

  // -----------------------------
  // MANUAL SAVE → DB
  // -----------------------------
  const saveResume = async () => {
    const now = nowIso();
    const title = buildResumeName();
    const resumeData = buildResumeData();

    // Local snapshot (in-memory only; still ok)
    const snapshot = {
      id: `${Date.now()}`,
      name: title,
      createdAt: now,
      updatedAt: now,
      isPrimary: true,
      data: resumeData,
    };

    setResumes((prev) => [...prev, snapshot]);

    // ✅ Manual save = this should drive the toast.
    setSaveEventAt(now);

    // keep lastAutosaveAt updated too (optional indicator use)
    setLastAutosaveAt(now);

    try {
      const res = await fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          content: resumeData,
          setPrimary: true,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const dbResume = json.resume;

        if (dbResume?.id) {
          const cleaned = {
            id: dbResume.id,
            name: dbResume.name,
            createdAt: dbResume.createdAt,
            updatedAt: dbResume.updatedAt,
            isPrimary: dbResume.isPrimary,
            data: (() => {
              try {
                return JSON.parse(dbResume.content);
              } catch {
                return resumeData;
              }
            })(),
          };

          setResumes((prev) => {
            const withoutTemp = prev.filter((r) => r.id !== snapshot.id);
            return [
              ...withoutTemp.map((r) => (dbResume.isPrimary ? { ...r, isPrimary: false } : r)),
              cleaned,
            ];
          });
        }
      }
    } catch (e) {
      console.error('[ResumeContext] Error saving:', e);
    }
  };

  return (
    <ResumeContext.Provider
      value={{
        formData,
        setFormData,
        summary,
        setSummary,
        setSummaryWithBackup,
        experiences,
        setExperiences,
        projects,
        setProjects,
        volunteerExperiences,
        setVolunteerExperiences,
        educationList,
        setEducationList,
        certifications,
        setCertifications,
        languages,
        setLanguages,
        skills,
        setSkills,
        achievements,
        setAchievements,
        customSections,
        setCustomSections,
        template,
        setTemplate,
        resumes,
        setResumes,
        lastAutosaveAt,
        saveEventAt,
        setSaveEventAt,
        saveResume,

        // Draft helpers (DB)
        getResumeDraft,
        setResumeDraft,
        deleteResumeDraft,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}
