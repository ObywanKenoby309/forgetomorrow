// lib/bulk/pdf-generator.js
'use client';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import ReverseResumeTemplate from '@/components/resume-form/templates/ReverseResumeTemplate';
import HybridResumeTemplate from '@/components/resume-form/templates/HybridResumeTemplate';
import CoverLetterTemplatePDF from '@/components/cover-letter/CoverLetterTemplatePDF';
import { tailorResumeAndCover } from './ai-tailor';
import { generateMatchReport } from './match-score';

const ATSResumeDoc = ({ data }) => { /* ... same as ClientPDFButton ... */ };
const ATSCoverDoc = ({ data }) => { /* ... same ... */ };

export async function generateBulkPDFs({ files, resumeData }) {
  const zip = new JSZip();
  const results = [];

  for (const { text: jd, name } of files) {
    const base = name.replace(/\.[^/.]+$/, '');
    const { tailoredResume, tailoredCover, score } = await tailorResumeAndCover(jd, resumeData);

    // Reverse
    const revBlob = await pdf(<ReverseResumeTemplate data={tailoredResume} />).toBlob();
    zip.file(`${base}_Resume_Reverse.pdf`, revBlob);

    // Hybrid
    const hybBlob = await pdf(<HybridResumeTemplate data={tailoredResume} />).toBlob();
    zip.file(`${base}_Resume_Hybrid.pdf`, hybBlob);

    // Cover
    const coverBlob = await pdf(<CoverLetterTemplatePDF data={tailoredCover} />).toBlob();
    zip.file(`${base}_Cover.pdf`, coverBlob);

    results.push({ base, score });
  }

  // Match Report
  const report = generateMatchReport(results);
  zip.file('Match_Report.csv', report);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'ForgeTomorrow_Bulk_Applications.zip');
}