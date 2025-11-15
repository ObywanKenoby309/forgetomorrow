// components/BulkExportCTA.js
'use client';

import { useState } from 'react';
import { usePlan } from '@/context/PlanContext';
import BulkExportModal from './BulkExportModal';

export default function BulkExportCTA() {
  const { plan, role } = usePlan();
  const [open, setOpen] = useState(false);
  const allowed = ['coach', 'smb-recruiter', 'enterprise-recruiter'];
  const isPro = plan === 'enterprise' || allowed.includes(role);

  if (!isPro) {
    return (
      <button
        onClick={() => alert('Upgrade to Pro for Bulk Export')}
        className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl transition-all"
      >
        BULK EXPORT (10 JDs) — Pro
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl transition-all"
      >
        BULK EXPORT (10 JDs → 30 PDFs)
      </button>
      {open && <BulkExportModal onClose={() => setOpen(false)} />}
    </>
  );
}