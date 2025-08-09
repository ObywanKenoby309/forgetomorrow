// context/ResumeContext.js
import React, { createContext, useState, useEffect } from 'react';

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
  const [resumes, setResumes] = useState([]); // for saved resumes

  // TEMP: inject a fake resume for testing Onboarding & Growth flow
  useEffect(() => {
    setResumes([
      {
        id: 'fake-001',
        fullName: 'John Doe',
        summary:
          'Experienced Operations Manager with a passion for process improvement and team leadership.',
        updatedAt: new Date().toISOString(),
      },
    ]);
  }, []);
  // END TEMP

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
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}
