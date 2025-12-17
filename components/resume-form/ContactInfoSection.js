// components/resume-form/ContactInfoSection.js
import { useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

const ORANGE = '#FF7043';

export default function ContactInfoSection({
  formData = {},
  setFormData,
  embedded = false,
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const f = useMemo(
    () => ({
      fullName: formData.fullName ?? '',
      email: formData.email ?? '',
      phone: formData.phone ?? '',
      location: formData.location ?? '',
      portfolio: formData.portfolio ?? '',
      forgeUrl: formData.forgeUrl ?? '',
      targetedRole: formData.targetedRole ?? '',
    }),
    [formData]
  );

  const updateField = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'fullName' ? { name: value } : {}), // keep legacy name in sync
    }));
  };

  /* ================= EMBEDDED ================= */
  if (embedded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Your Name"
            value={f.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 15,
              marginTop: 6,
            }}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={f.email}
            onChange={(e) => updateField('email', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 15,
              marginTop: 6,
            }}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Phone
          </label>
          <input
            type="tel"
            placeholder="123-456-7890"
            value={f.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 15,
              marginTop: 6,
            }}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Location
          </label>
          <input
            type="text"
            placeholder="Anywhere"
            value={f.location}
            onChange={(e) => updateField('location', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 15,
              marginTop: 6,
            }}
          />
        </div>

        {/* Targeted Role */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Targeted Role
          </label>
          <input
            type="text"
            placeholder="e.g., Senior Software Engineer at Google"
            value={f.targetedRole}
            onChange={(e) => updateField('targetedRole', e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 16,
              marginTop: 4,
            }}
          />
          <p className="text-xs italic text-slate-500 mt-1">
            AI uses this + job description to optimize your resume for ATS.
          </p>
        </div>

        {/* Portfolio */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Portfolio / Website
          </label>
          <input
            type="url"
            value={f.portfolio}
            onChange={(e) => updateField('portfolio', e.target.value)}
            placeholder="https://yourportfolio.com"
            className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm"
          />
        </div>

        {/* Forge URL (read-only) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            ForgeTomorrow Profile URL
          </label>
          <input
            type="url"
            value={f.forgeUrl}
            readOnly
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 p-2.5 text-sm text-slate-600"
          />
        </div>
      </div>
    );
  }

  /* ================= STANDALONE ================= */
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">
          Contact Information
        </h2>
        {isOpen ? <FaChevronDown /> : <FaChevronRight />}
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <input
            type="text"
            value={f.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            placeholder="John Doe"
            className="rounded-lg border p-2.5"
          />
          {/* remaining fields identical to embedded logic */}
        </div>
      )}
    </section>
  );
}
