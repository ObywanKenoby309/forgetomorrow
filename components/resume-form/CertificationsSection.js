// components/resume-form/CertificationsSection.js
import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function CertificationsSection({
  certifications = [],
  setCertifications,
  embedded = false,     // when true, render content only (for SectionGroup)
  defaultOpen = true,   // used only when not embedded
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const setField = (index, key, value) => {
    const next = [...certifications];
    const curr = { ...(next[index] || {}) };
    curr[key] = value;
    next[index] = curr;
    setCertifications(next);
  };

  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        name: '',
        issuer: '',
        location: '',
        dateEarned: '',
        expirationDate: '',
        description: '',
        credentialId: '', // optional
        link: '',         // optional (verification URL)
      },
    ]);
  };

  const removeCertification = (index) => {
    const next = [...certifications];
    next.splice(index, 1);
    setCertifications(next);
  };

  const Body = () => (
    <div className="space-y-4">
      {certifications.length === 0 && (
        <div className="text-sm text-slate-500">
          No certifications yet. Add relevant licenses, trainings, or certificates.
        </div>
      )}

      {certifications.map((cert, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Name</label>
              <input
                type="text"
                value={cert.name || ''}
                onChange={(e) => setField(index, 'name', e.target.value)}
                placeholder="e.g., AWS Certified Solutions Architect"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Issuer</label>
              <input
                type="text"
                value={cert.issuer || ''}
                onChange={(e) => setField(index, 'issuer', e.target.value)}
                placeholder="e.g., Amazon Web Services"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Location (optional)</label>
              <input
                type="text"
                value={cert.location || ''}
                onChange={(e) => setField(index, 'location', e.target.value)}
                placeholder="City, State"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date Earned</label>
                <input
                  type="month"
                  value={cert.dateEarned || ''}
                  onChange={(e) => setField(index, 'dateEarned', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Expiration Date</label>
                <input
                  type="month"
                  value={cert.expirationDate || ''}
                  onChange={(e) => setField(index, 'expirationDate', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Credential ID (optional)</label>
              <input
                type="text"
                value={cert.credentialId || ''}
                onChange={(e) => setField(index, 'credentialId', e.target.value)}
                placeholder="License/Certificate ID"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Verification Link (optional)</label>
              <input
                type="url"
                value={cert.link || ''}
                onChange={(e) => setField(index, 'link', e.target.value)}
                placeholder="https://verify.example.com/code"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Description / Notes</label>
            <textarea
              value={cert.description || ''}
              onChange={(e) => setField(index, 'description', e.target.value)}
              placeholder="Any notable coursework, exam score, or specialization."
              className="mt-1 w-full min-h-[90px] rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeCertification(index)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <FaTrash className="opacity-80" /> Remove Certification
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addCertification}
        className="inline-flex items-center gap-2 rounded-lg border border-[#FF7043]/30 px-3 py-2 text-sm font-semibold text-[#FF7043] hover:bg-[#FF7043] hover:text-white transition-colors"
      >
        <FaPlus /> Add Certification / Training
      </button>
    </div>
  );

  if (embedded) return <Body />;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen((o) => !o)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Certifications / Training</h2>
        {isOpen ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
      </button>

      {isOpen && <Body />}
    </section>
  );
}
