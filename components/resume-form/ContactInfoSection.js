// components/resume-form/ContactInfoSection.js
import { useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

const ORANGE = '#FF7043'; // Match create.js

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
    }),
    [formData]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ===== Embedded variant (used inside SectionGroup) =====
  if (embedded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Your Name"
            value={formData.name || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setFormData(prev => ({ ...prev, name: newValue }));
            }}
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
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="text"
            placeholder="you@example.com"
            value={formData.email || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setFormData(prev => ({ ...prev, email: newValue }));
            }}
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
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
            Phone
          </label>
          <input
            type="tel"
            placeholder="123-456-7890"
            value={formData.phone || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setFormData(prev => ({ ...prev, phone: newValue }));
            }}
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
          <label htmlFor="location" className="block text-sm font-medium text-slate-700">
            Location
          </label>
          <input
            type="text"
            placeholder="Anywhere"
            value={formData.location || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setFormData(prev => ({ ...prev, location: newValue }));
            }}
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

        {/* TARGETED ROLE — FULL WIDTH + AI TIP */}
        <div className="md:col-span-2">
          <label style={{ fontWeight: 600, fontSize: 14, color: '#374151', display: 'block', marginBottom: 4 }}>
            Targeted Role
          </label>
          <input
            type="text"
            placeholder="e.g., Senior Software Engineer at Google"
            value={formData.targetedRole || ''}
            onChange={(e) => setFormData({ ...formData, targetedRole: e.target.value })}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 16,
              marginTop: 4,
            }}
          />
          <p style={{
            fontSize: 12,
            color: '#6B7280',
            marginTop: 6,
            marginBottom: 0,
            fontStyle: 'italic'
          }}>
            AI uses this + job description to optimize your resume for ATS.
          </p>
        </div>

        {/* Portfolio */}
        <div className="md:col-span-2">
          <label htmlFor="portfolio" className="block text-sm font-medium text-slate-700">
            Portfolio / Website
          </label>
          <input
            id="portfolio"
            type="url"
            name="portfolio"
            value={f.portfolio}
            onChange={handleChange}
            placeholder="https://yourportfolio.com"
            className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
          />
        </div>

        {/* ForgeTomorrow Profile URL */}
        <div className="md:col-span-2">
          <label htmlFor="forgeUrl" className="block text-sm font-medium text-slate-700">
            ForgeTomorrow Profile URL
          </label>
          <input
            id="forgeUrl"
            type="url"
            name="forgeUrl"
            value={f.forgeUrl}
            readOnly
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 p-2.5 text-sm text-slate-600"
          />
        </div>
      </div>
    );
  }

  // ===== Standalone variant (keeps your original collapsible card) =====
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Contact Information</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </button>
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName-std" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="fullName-std"
              type="text"
              name="fullName"
              value={f.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
            />
          </div>
          <div>
            <label htmlFor="email-std" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email-std"
              type="email"
              name="email"
              value={f.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
            />
          </div>
          <div>
            <label htmlFor="phone-std" className="block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              id="phone-std"
              type="tel"
              name="phone"
              value={f.phone}
              onChange={handleChange}
              placeholder="(123) 456-7890"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
            />
          </div>
          <div>
            <label htmlFor="location-std" className="block text-sm font-medium text-slate-700">
              Location
            </label>
            <input
              id="location-std"
              type="text"
              name="location"
              value={f.location}
              onChange={handleChange}
              placeholder="Nashville, TN"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
            />
          </div>

          {/* TARGETED ROLE — FULL WIDTH + AI TIP (STANDALONE) */}
          <div className="md:col-span-2">
            <label style={{ fontWeight: 600, fontSize: 14, color: '#374151', display: 'block', marginBottom: 4 }}>
              Targeted Role
            </label>
            <input
              type="text"
              placeholder="e.g., Senior Software Engineer at Google"
              value={formData.targetedRole || ''}
              onChange={(e) => setFormData({ ...formData, targetedRole: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 16,
                marginTop: 4,
              }}
            />
            <p style={{
              fontSize: 12,
              color: '#6B7280',
              marginTop: 6,
              marginBottom: 0,
              fontStyle: 'italic'
            }}>
              AI uses this + job description to optimize your resume for ATS.
            </p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="portfolio-std" className="block text-sm font-medium text-slate-700">
              Portfolio / Website
            </label>
            <input
              id="portfolio-std"
              type="url"
              name="portfolio"
              value={f.portfolio}
              onChange={handleChange}
              placeholder="https://yourportfolio.com"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="forgeUrl-std" className="block text-sm font-medium text-slate-700">
              ForgeTomorrow Profile URL
            </label>
            <input
              id="forgeUrl-std"
              type="url"
              name="forgeUrl"
              value={f.forgeUrl}
              readOnly
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 p-2.5 text-sm text-slate-600"
            />
          </div>
        </div>
      )}
    </section>
  );
}