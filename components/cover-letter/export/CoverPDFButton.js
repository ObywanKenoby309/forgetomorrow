// components/cover-letter/export/CoverPDFButton.js
'use client';
import { useContext, useState } from 'react';
import { pdf, Document, Page, Text } from '@react-pdf/renderer';
import CoverLetterTemplatePDF from '@/components/cover-letter/CoverLetterTemplatePDF';
import { ResumeContext } from '../../../context/ResumeContext';

// Inline ATSCoverLetter (from ClientPDFButton.js)
function ATSCoverLetter({ data }) {
  const safeData = data || {};
  const {
    fullName = 'Your Name',
    email = '',
    phone = '',
    location = '',
    portfolio = '',
    recipient = 'Hiring Manager',
    company = 'the company',
    greeting = 'Dear Hiring Manager,',
    opening = '',
    body = '',
    closing = '',
    signoff = 'Sincerely,'
  } = safeData;
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

export default function CoverPDFButton({ data, templateId, children }) {
  const { setSaveEventAt } = useContext(ResumeContext) || {};
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const safeData = data || {};
      const doc = templateId === 'ats-cover'
        ? <ATSCoverLetter data={safeData} />
        : <CoverLetterTemplatePDF data={safeData} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeData.fullName?.replace(/\s+/g, '_') || 'Candidate'}_Cover_${templateId === 'ats-cover' ? 'ATS' : 'Designed'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    } finally {
      setLoading(false);
      setSaveEventAt?.(new Date().toISOString());
    }
  };

  return (
    <div onClick={loading ? null : handleClick} style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
      {loading ? 'Generating...' : children}
    </div>
  );
}