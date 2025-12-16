// context/ResumeContext.js
import React, { createContext, useState, useEffect } from 'react';

export const ResumeContext = createContext();

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

  const persistSummaryBackup = (text) => {
    const payload = { text: text || '', savedAt: nowIso() };
    setSummaryBackup(payload);
    setSaveEventAt(payload.savedAt);
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
  // MANUAL SAVE → DB
  // -----------------------------
  const saveResume = async () => {
    const now = nowIso();
    const title = buildResumeName();
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
