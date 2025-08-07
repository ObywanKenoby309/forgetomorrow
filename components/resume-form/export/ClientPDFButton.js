// components/resume-form/export/ClientPDFButton.js
import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import StyledResumePDF from './StyledResumePDF';

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
      fileName="resume.pdf"
      className={className}
    >
      {({ loading }) => (loading ? 'Preparing PDF…' : 'Export Styled PDF')}
    </PDFDownloadLink>
  );
}
