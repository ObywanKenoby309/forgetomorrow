// components/resume-form/export/DesignedPrintButton.js
'use client';

import { useContext, useState } from 'react';
import { ResumeContext } from '../../../context/ResumeContext';

export default function DesignedPrintButton({ children }) {
  const { setSaveEventAt } = useContext(ResumeContext) || {};
  const [loading, setLoading] = useState(false);

  const handlePrint = () => {
    setLoading(true);
    const preview = document.querySelector('#resume-preview');
    if (!preview) {
      alert('Preview not ready');
      setLoading(false);
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Allow popups');
      setLoading(false);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Resume</title></head>
        <body style="margin:0;padding:50px;font-family:Helvetica,Arial,sans-serif;">${preview.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setLoading(false);
      setSaveEventAt?.(new Date().toISOString());
    }, 600);
  };

  return (
    <div onClick={loading ? null : handlePrint} style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
      {loading ? 'Printing...' : children}
    </div>
  );
}