// context/ResumeContext.js
import React, { createContext, useState, useEffect, useRef } from 'react';

export const ResumeContext = createContext();

const SUMMARY_BACKUP_KEY = 'ft_summary_backup_v1';

export function ResumeProvider({ children }) {
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

  const [template, setTemplate] = useState('reverse'); // ← NEW: store which template they chose

  const [resumes, setResumes] = useState([]);

  // Timestamps
  const [lastAutosaveAt, setLastAutosaveAt] = useState(null);
  const [saveEventAt, setSaveEventAt] = useState(null);

  const lastSaveRef = useRef(null);

  // -----------------------------
  // Summary Backup (unchanged)
  // -----------------------------
  const nowIso = () => new Date().toISOString();

  const [summaryBackup, setSummaryBackup] = useState({ text: '', savedAt: '' });

  const loadSummaryBackup = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SUMMARY_BACKUP_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setSummaryBackup({
        text: parsed?.text || '',
        savedAt: parsed?.savedAt || '',
      });
    } catch {}
  };

  const persistSummaryBackup = (text) => {
    if (typeof window === 'undefined') return;
    const payload = { text: text || '', savedAt: nowIso() };
    try {
      localStorage.setItem(SUMMARY_BACKUP_KEY, JSON.stringify(payload));
      setSummaryBackup(payload);
      setSaveEventAt(payload.savedAt);
    } catch {}
  };

  const setSummaryWithBackup = (next) => {
    const current = summary || '';
    if (!summaryBackup.text || summaryBackup.text !== current) {
      persistSummaryBackup(current);
    }
    setSummary(next);
    setSaveEventAt(nowIso());
  };

  // -----------------------------
  // Load Draft from localStorage
  // -----------------------------
  useEffect(() => {
    try {
      const draft = localStorage.getItem('ft_current_resume_draft');
      if (draft) {
        const d = JSON.parse(draft);
        setFormData(d.formData || {});
        setSummary(d.summary || '');
        setExperiences(d.experiences || []);
        setProjects(d.projects || []);
        setVolunteerExperiences(d.volunteerExperiences || []);
        setEducationList(d.educationList || []);
        setCertifications(d.certifications || []);
        setLanguages(d.languages || []);
        setSkills(d.skills || []);
        setAchievements(d.achievements || []);
        setCustomSections(d.customSections || []);
        setTemplate(d.template || 'reverse');
      }
    } catch {}
    loadSummaryBackup();
  }, []);

  // -----------------------------
  // Autosave Draft
  // -----------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      const draft = {
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
        template, // ← NEW
      };

      const str = JSON.stringify(draft);
      if (lastSaveRef.current !== str) {
        lastSaveRef.current = str;
        localStorage.setItem('ft_current_resume_draft', str);

        const now = nowIso();
        setLastAutosaveAt(now);
        setSaveEventAt(now);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [
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
    template,
  ]);

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
  // BUILD CORRECT resumeData FORMAT (the key fix)
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
  // MANUAL SAVE → DB
  // -----------------------------
  const saveResume = async () => {
    const now = nowIso();
    const title = buildResumeName();

    // The CORRECT resume object
    const resumeData = buildResumeData();

    // Local snapshot
    const snapshot = {
      id: `${Date.now()}`,
      name: title,
      createdAt: now,
      updatedAt: now,
      isPrimary: true,
      data: resumeData,
    };

    setResumes((prev) => [...prev, snapshot]);
    setSaveEventAt(now);

    try {
      const res = await fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          content: resumeData, // ← The CORRECT format goes to DB
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
              ...withoutTemp.map((r) =>
                dbResume.isPrimary ? { ...r, isPrimary: false } : r
              ),
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
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}
