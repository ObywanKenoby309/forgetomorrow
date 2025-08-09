// context/ResumeContext.js
import React, { createContext, useState, useEffect, useRef } from 'react';

export const ResumeContext = createContext();

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

          const nowIso = new Date().toISOString();
          setLastAutosaveAt(nowIso);
          setSaveEventAt(nowIso); // triggers toast
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
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}
