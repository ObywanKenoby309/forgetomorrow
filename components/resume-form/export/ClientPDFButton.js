// components/resume-form/export/ClientPDFButton.js
'use client';

import React, { useContext, useState, useEffect } from 'react';
import { pdf, Document, Page, Text } from '@react-pdf/renderer';
import { ResumeContext } from '../../../context/ResumeContext';

function fileSafeName(name) {
  return name ? String(name).trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '') : 'Document';
}

// === ATS COVER LETTER (inline) ===
function ATSCoverLetter({ data }) {
  const { fullName, email, phone, location, portfolio, recipient, company, greeting, opening, body, closing, signoff } = data;
  return (
    <Document>
      <Page size="LETTER" style={{ fontFamily: 'Helvetica', padding: 72 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{fullName}</Text>
        <Text style={{ fontSize: 10, marginBottom: 20 }}>
          {[email, phone, location].filter(Boolean).join(' | ')} {portfolio ? `| ${portfolio}` : ''}
        </Text>
        <Text style={{ marginBottom: 4 }}>{recipient}</Text>
        <Text style={{ marginBottom: 20 }}>{company}</Text>
        <Text style={{ marginBottom: 10 }}>{greeting}</Text>
        {opening && <Text style={{ marginBottom: 10 }}>{opening}</Text>}
        {body && body.split('\n').filter(Boolean).map((b, i) => (
          <Text key={i} style={{ marginLeft: 20, marginBottom: 4 }}>• {b}</Text>
        ))}
        {closing && <Text style={{ marginTop: 20, marginBottom: 30 }}>{closing}</Text>}
        <Text>{signoff}</Text>
        <Text>{fullName}</Text>
      </Page>
    </Document>
  );
}

export default function ClientPDFButton({
  templateId,
  data,
  filename,
  children,
  currentTemplate, // 'reverse' | 'hybrid' — required for ats-resume
}) {
  const { setSaveEventAt } = useContext(ResumeContext) || {};
  const [isGenerating, setIsGenerating] = useState(false);
  const [Template, setTemplate] = useState(null);

  // === LOAD TEMPLATE ONLY WHEN NEEDED ===
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadTemplate = async () => {
      try {
        let mod;

        // Cover Letter Designed PDF
        if (templateId === 'cover-pdf') {
          mod = await import('@/components/cover-letter/CoverLetterTemplatePDF.js');
        }

        // ATS Resume — needs currentTemplate
        else if (templateId === 'ats-resume' && currentTemplate) {
          if (currentTemplate === 'reverse') {
            mod = await import('@/components/resume-form/templates/ReverseResumeTemplate.pdf.js');
          } else if (currentTemplate === 'hybrid') {
            mod = await import('@/components/resume-form/templates/HybridResumeTemplate.pdf.js');
          }
        }

        // Designed Resume (print preview) — loads same PDF template
        else if (['reverse', 'hybrid'].includes(templateId)) {
          const path = templateId === 'reverse'
            ? '@/components/resume-form/templates/ReverseResumeTemplate.pdf.js'
            : '@/components/resume-form/templates/HybridResumeTemplate.pdf.js';
          mod = await import(path);
        }

        setTemplate(mod?.default || null);
      } catch (e) {
        console.error('Template load failed:', e);
        setTemplate(null);
      }
    };

    loadTemplate();
  }, [templateId, currentTemplate]);

  const finalFilename = filename || `${fileSafeName(data?.fullName || data?.personalInfo?.name || 'Candidate')}_${templateId}.pdf`;

  const exportPDF = async () => {
    setIsGenerating(true);
    try {
      // === 1. ATS RESUME ===
      if (templateId === 'ats-resume') {
        if (!Template) throw new Error('ATS template not loaded');
        const doc = <Template data={data} />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // === 2. ATS COVER LETTER (inline) ===
      if (templateId === 'ats-cover') {
        const doc = <ATSCoverLetter data={data} />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // === 3. DESIGNED RESUME (print preview) ===
      if (['reverse', 'hybrid'].includes(templateId)) {
        const previewEl = document.querySelector('#resume-preview');
        if (!previewEl) {
          alert('Resume preview not ready. Please wait.');
          return;
        }
        const previewContent = previewEl.innerHTML;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('Please allow popups');
          return;
        }
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${data.personalInfo?.name || 'Resume'}</title>
              <meta charset="utf-8">
              <style>
                @page { size: Letter; margin: 0.5in; }
                body { font-family: Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #1f2937; padding: 50px; margin: 0; }
                h1 { font-size: 28pt; font-weight: bold; margin: 0; text-align: center; }
                h2 { font-size: 13pt; font-weight: bold; text-transform: uppercase; border-bottom: 1pt solid #000; margin: 16pt 0 6pt 0; padding-bottom: 2pt; }
                p { margin: 2pt 0; }
                .bullet { margin-left: 16pt; }
              </style>
            </head>
            <body>${previewContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 600);
        return;
      }

      // === 4. COVER LETTER DESIGNED PDF ===
      if (templateId === 'cover-pdf' && Template) {
        const doc = <Template data={data} />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      throw new Error('Invalid export type');
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Export failed: ' + (err.message || 'Try again'));
    } finally {
      setIsGenerating(false);
      setSaveEventAt?.(new Date().toISOString());
    }
  };

  // === IS READY: CRITICAL FIX ===
  const isReady =
    // Always ready
    templateId === 'ats-cover' ||
    // ATS Resume: only needs Template
    (templateId === 'ats-resume' && Template) ||
    // Cover PDF: needs Template
    (templateId === 'cover-pdf' && Template) ||
    // Designed Resume: needs preview DOM
    (['reverse', 'hybrid'].includes(templateId) && document.querySelector('#resume-preview'));

  return (
    <div
      onClick={isReady ? exportPDF : null}
      style={{
        cursor: isReady ? 'pointer' : 'not-allowed',
        opacity: isReady ? 1 : 0.6,
        display: 'inline-block'
      }}
    >
      {isGenerating ? 'Generating...' : isReady ? children : 'Loading...'}
    </div>
  );
}