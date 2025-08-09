// context/ResumeContext.js
import React, { createContext, useState } from 'react';

export const ResumeContext = createContext();

export function ResumeProvider({ children }) {
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', location: '', portfolio: '', forgeUrl: '' });
  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState([]);
  // ... other states similarly

  return (
    <ResumeContext.Provider
      value={{
        formData, setFormData,
        summary, setSummary,
        experiences, setExperiences,
        // ... expose all other state and setters
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}
