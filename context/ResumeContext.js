// context/ResumeContext.js
import React, { createContext, useState, useEffect, useRef } from 'react';

export const ResumeContext = createContext();

const SUMMARY_BACKUP_KEY = 'ft_summary_backup_v1';

export function ResumeProvider({ children }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    portfolio: '',
    forgeUrl: '',
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
  const [resumes, setResumes] = useState([]);

  // timestamps to show “Last saved” + toast
  const [lastAutosaveAt, setLastAutosaveAt] = useState(null); // ISO string
  const [saveEventAt, setSaveEventAt] = useState(null);       // ISO string (autosave or manual)

  const lastSaveRef = useRef(null);

  // -------- Shared Summary Backup (for local tools + future API flows) --------
  const [summaryBackup, setSummaryBackup] = useState({ text: '', savedAt: '' });

  const nowIso = () => new Date().toISOString();

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
    } catch {
      // ignore parse errors
    }
  };

  const persistSummaryBackup = (text) => {
    if (typeof window === 'undefined') return;
    const payload = { text: text || '', savedAt: nowIso() };
    try {
      localStorage.setItem(SUMMARY_BACKUP_KEY, JSON.stringify(payload));
      setSummaryBackup(payload);
      setSaveEventAt(payload.savedAt); // nudge any toast mechanism you already have
    } catch {
      // ignore storage errors
    }
  };

  const saveSummaryBackup = (overrideText) => {
    persistSummaryBackup(overrideText ?? summary);
  };

  const revertSummaryBackup = () => {
    if (!summaryBackup.text) return;
    setSummary(summaryBackup.text);
    setSaveEventAt(nowIso());
  };

  const clearSummaryBackup = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SUMMARY_BACKUP_KEY);
    }
    setSummaryBackup({ text: '', savedAt: '' });
  };

  /**
   * setSummaryWithBackup(next)
   * Auto-saves current summary into backup if:
   *  - no backup exists, or
   *  - backup differs from current
   * Then sets the new summary.
   */
  const setSummaryWithBackup = (next) => {
    const current = summary || '';
    if (!summaryBackup.text || summaryBackup.text !== current) {
      persistSummaryBackup(current);
    }
    setSummary(next);
    setSaveEventAt(nowIso());
  };

  // Restore saved snapshots + in-progress draft on mount
  useEffect(() => {
    try {
      const savedResumes = localStorage.getItem('ft_saved_resumes');
      if (savedResumes) setResumes(JSON.parse(savedResumes));

      const draft = localStorage.getItem('ft_current_resume_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        setFormData(parsed.formData || {});
        setSummary(parsed.summary || '');
        setExperiences(parsed.experiences || []);
        setProjects(parsed.projects || []);
        setVolunteerExperiences(parsed.volunteerExperiences || []);
        setEducationList(parsed.educationList || []);
        setCertifications(parsed.certifications || []);
        setLanguages(parsed.languages || []);
        setSkills(parsed.skills || []);
        setAchievements(parsed.achievements || []);
        setCustomSections(parsed.customSections || []);
      }
    } catch {
      // ignore parse/storage errors
    }

    // Load shared backup after mount
    loadSummaryBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist snapshots list when "resumes" changes
  useEffect(() => {
    try {
      localStorage.setItem('ft_saved_resumes', JSON.stringify(resumes));
    } catch {
      // ignore storage errors
    }
  }, [resumes]);

  // Autosave current draft every 10 seconds if changed
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
      };
      const draftString = JSON.stringify(draft);

      if (lastSaveRef.current !== draftString) {
        try {
          localStorage.setItem('ft_current_resume_draft', draftString);
          lastSaveRef.current = draftString;

          const now = nowIso();
          setLastAutosaveAt(now);
          setSaveEventAt(now); // triggers toast
        } catch {
          /* ignore */
        }
      }
    }, 10000); // 10s
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
  ]);

  return (
    <ResumeContext.Provider
      value={{
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
        resumes, setResumes,
        lastAutosaveAt,
        saveEventAt, setSaveEventAt, // expose for manual save toast

        // Shared backup API
        summaryBackup,
        saveSummaryBackup,
        revertSummaryBackup,
        clearSummaryBackup,
        setSummaryWithBackup,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}
