// components/BulkExportModal.js
'use client';

import { useContext, useRef, useState } from 'react';
import { ResumeContext } from '@/context/ResumeContext';
import { extractTextFromFile } from '@/lib/jd/ingest';
import { generateBulkPDFs } from '@/lib/bulk/pdf-generator';
import { useAiUsage } from '@/context/AiUsageContext';

export default function BulkExportModal({ onClose }) {
  const { formData, summary, experiences, educationList, skills } = useContext(ResumeContext);
  const { incrementUsage, canUse } = useAiUsage();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef();

  const handleFile = async (file) => {
    if (files.length >= 10) return;
    const text = await extractTextFromFile(file);
    setFiles(prev => [...prev, { file, text, name: file.name }]);
  };

  const generate = async () => {
    if (!canUse()) return alert('Free limit: 3 AI uses/month. Upgrade to Pro.');
    if (files.length === 0) return alert('Drop at least 1 JD');

    setLoading(true);
    try {
      await generateBulkPDFs({ files, resumeData: { formData, summary, experiences, educationList, skills } });
      incrementUsage();
      onClose();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">Bulk Export — Pro Feature</h2>
        <p className="text-sm text-gray-600 mb-4">
          Drop up to 10 JDs → Get 30 tailored PDFs + Match Report
        </p>

        <div
          ref={dropRef}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={e => e.preventDefault()}
          className="border-4 border-dashed border-orange-300 rounded-xl p-8 text-center bg-orange-50"
        >
          <p className="font-bold">Drop JDs here (PDF, DOCX, TXT)</p>
          <p className="text-sm text-gray-600">or click to upload</p>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={e => handleFile(e.target.files[0])}
            className="hidden"
            id="bulk-upload"
          />
          <label htmlFor="bulk-upload" className="cursor-pointer text-orange-600 font-bold underline">Upload</label>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                {f.name} — {f.text.split(/\s+/).length} words
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={generate}
            disabled={loading || files.length === 0}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? 'Generating 30 PDFs...' : `Generate ZIP (${files.length} JDs)`}
          </button>
          <button onClick={onClose} className="px-6 py-3 border rounded-xl font-bold">Cancel</button>
        </div>
      </div>
    </div>
  );
}