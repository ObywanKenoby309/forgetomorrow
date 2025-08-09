// context/ResumeContext.js
import React, { createContext, useState } from 'react';

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
