// components/resume-form/ProfessionalSummarySection.js
import { useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

export default function ProfessionalSummarySection({ summary, setSummary }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <h2 className="text-2xl font-bold text-[#FF7043]">Professional Summary</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </div>

      {isOpen && (
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Summary</label>
          <textarea
            name="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Example: Experienced IT leader with 13+ years of cross-functional team leadership, service delivery, and performance management..."
            className="w-full h-32 border border-gray-300 rounded p-3 resize-none"
          />
        </div>
      )}
    </section>
  );
}
