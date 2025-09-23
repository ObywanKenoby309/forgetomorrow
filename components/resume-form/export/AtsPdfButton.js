// components/resume-form/export/AtsPdfButton.jsx
import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import StyledResumePDF from './StyledResumePDF';

function fileSafeName(name) {
  if (!name) return 'Resume';
  return String(name).trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '');
}

export default function AtsPdfButton({
  formData = {},
  summary = '',
  experiences = [],
  projects = [],
  volunteerExperiences = [],
  educationList = [],
  certifications = [],
  languages = [],
  skills = [],
  achievements = [],
  customSections = [],
  className,
}) {
  const pdfName = `${fileSafeName(formData?.fullName || formData?.name)}_Resume_ATS.pdf`;

  return (
    <PDFDownloadLink
      document={
        <StyledResumePDF
          formData={formData}
          summary={summary}
          experiences={experiences}
          projects={projects}
          volunteerExperiences={volunteerExperiences}
          educationList={educationList}
          certifications={certifications}
          languages={languages}
          skills={skills}
          achievements={achievements}
          customSections={customSections}
        />
      }
      fileName={pdfName}
      className={className || 'bg-[#0F766E] hover:bg-[#115E59] text-white py-2 px-4 rounded'}
    >
      {({ loading }) => (loading ? 'Preparing ATS PDF…' : 'Download ATS PDF')}
    </PDFDownloadLink>
  );
}
