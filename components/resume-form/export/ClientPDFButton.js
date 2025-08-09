// components/resume-form/export/ClientPDFButton.js
import React, { useContext, useState, useMemo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

import StyledResumePDF from './StyledResumePDF';
import { ResumeContext } from '../../../context/ResumeContext';

function fileSafeName(name) {
  if (!name) return 'Resume';
  return String(name).trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '');
}

function formatLocal(dt) {
  if (!dt) return '';
  try {
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return '';
  }
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
  const { resumes, setResumes, lastAutosaveAt } = useContext(ResumeContext) || {};
  const [saving, setSaving] = useState(false);
  const [lastManualSaveAt, setLastManualSaveAt] = useState(null);

  const base = fileSafeName(formData?.fullName);
  const pdfFileName = `${base}_Resume.pdf`;

  // Export: Word
  const exportWord = async () => {
    const doc = new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: formData?.fullName || 'Your Name',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph(formData?.email || ''),
            new Paragraph(formData?.phone || ''),
            new Paragraph(formData?.location || ''),
            new Paragraph(''),
            new Paragraph({
              children: [new TextRun({ text: 'Professional Summary', bold: true })],
            }),
            new Paragraph(summary || ''),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${base}_Resume.docx`);
  };

  // Export: Text
  const exportPlainText = () => {
    let text = `${formData?.fullName || 'Your Name'}\n`;
    text += `${formData?.email || ''}\n`;
    text += `${formData?.phone || ''}\n`;
    text += `${formData?.location || ''}\n\n`;
    text += `Professional Summary:\n${summary || ''}\n`;

    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${base}_Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Save snapshot
  const saveResume = () => {
    try {
      setSaving(true);

      const id = `res-${Date.now()}`;
      const snapshot = {
        id,
        fullName: formData?.fullName || 'Untitled Resume',
        summary: summary || '',
        updatedAt: new Date().toISOString(),
        formData: { ...(formData || {}) },
        experiences: [...(experiences || [])],
        projects: [...(projects || [])],
        volunteerExperiences: [...(volunteerExperiences || [])],
        educationList: [...(educationList || [])],
        certifications: [...(certifications || [])],
        languages: [...(languages || [])],
        skills: [...(skills || [])],
        achievements: [...(achievements || [])],
        customSections: [...(customSections || [])],
      };

      const next = [snapshot, ...(Array.isArray(resumes) ? resumes : [])];
      if (setResumes) setResumes(next);

      try {
        localStorage.setItem('ft_saved_resumes', JSON.stringify(next));
      } catch {
        /* ignore */
      }

      setLastManualSaveAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  // Pick the most recent save time (autosave or manual save)
  const lastSavedDisplay = useMemo(() => {
    const a = lastAutosaveAt ? new Date(lastAutosaveAt).getTime() : 0;
    const m = lastManualSaveAt ? lastManualSaveAt.getTime() : 0;
    const latest = Math.max(a, m);
    return latest ? formatLocal(new Date(latest)) : null;
  }, [lastAutosaveAt, lastManualSaveAt]);

  const primaryBtn =
    className || 'bg-[#FF7043] hover:bg-[#F4511E] text-white py-2 px-4 rounded';
  const saveBtn = saving
    ? 'bg-gray-400 text-white py-2 px-4 rounded cursor-not-allowed'
    : 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-2 px-4 rounded';

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex gap-4 justify-center items-center flex-wrap">
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
          fileName={pdfFileName}
          className={primaryBtn}
        >
          {({ loading }) => (loading ? 'Preparing PDF…' : 'Export Styled PDF')}
        </PDFDownloadLink>

        <button onClick={exportWord} className={primaryBtn}>
          Export Word
        </button>

        <button onClick={exportPlainText} className={primaryBtn}>
          Export Text
        </button>

        <button
          onClick={saveResume}
          disabled={saving}
          className={saveBtn}
          title="Save this version to your account so you can analyze or export later"
        >
          {saving ? 'Saving…' : 'Save Resume'}
        </button>
      </div>

      <div className="text-sm text-gray-600 h-5">
        {lastSavedDisplay ? `Last saved: ${lastSavedDisplay}` : 'Not saved yet'}
      </div>
    </div>
  );
}
