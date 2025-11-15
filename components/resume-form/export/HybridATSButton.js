// components/resume-form/export/HybridATSButton.js
'use client';

import { useContext, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import HybridResumeTemplatePDF from '@/components/resume-form/templates/HybridResumeTemplate.pdf.js';
import { ResumeContext } from '../../../context/ResumeContext';

export default function HybridATSButton({ data, children }) {
  const { setSaveEventAt } = useContext(ResumeContext) || {};
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const doc = <HybridResumeTemplatePDF data={data} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.personalInfo?.name || 'Resume'}_ATS.pdf`;
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