// pages/cover/pdf.js
'use client';

import { PDFViewer } from '@react-pdf/renderer';
import CoverLetterTemplatePDF from '@/components/cover-letter/CoverLetterTemplatePDF';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function CoverLetterPDFPage() {
  const router = useRouter();
  const [data, setData] = useState({});

  useEffect(() => {
    if (!router.isReady) return;

    const raw = router.query.data;

    if (raw && typeof raw === 'string') {
      try {
        const parsed = JSON.parse(decodeURIComponent(raw));
        setData(parsed || {});
      } catch (e) {
        console.error('Failed to parse cover letter data:', e);
        setData({});
      }
    } else {
      setData({});
    }
  }, [router.isReady, router.query]);

  return (
    <PDFViewer width="100%" height="100vh">
      <CoverLetterTemplatePDF data={data} />
    </PDFViewer>
  );
}