// components/resume-form/export/ClientPDFButton.js
import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import StyledResumePDF from './StyledResumePDF';

function fileSafeName(name) {
  if (!name) return 'Resume';
  return String(name).trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '');
}

export default function ClientPDFButton({
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
  className,
}) {
  const base = fileSafeName(formData?.fullName);
  const fileName = `${base}_Resume.pdf`;

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
      fileName={fileName}
      className={className}
    >
      {({ loading }) => (loading ? 'Preparing PDF…' : 'Export Styled PDF')}
    </PDFDownloadLink>
  );
}
