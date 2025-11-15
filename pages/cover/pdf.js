// pages/cover/pdf.js
'use client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Dynamically import PDFViewer to prevent SSR
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
);

import CoverLetterTemplatePDF from '@/components/cover-letter/CoverLetterTemplatePDF';

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