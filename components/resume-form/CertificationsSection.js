import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function CertificationsSection({ certifications = [], setCertifications }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  const handleChange = (index, e) => {
    const updated = [...certifications];
    updated[index][e.target.name] = e.target.value;
    setCertifications(updated);
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
        description: ''
      }
    ]);
  };

  const removeCertification = (index) => {
    const updated = [...certifications];
    updated.splice(index, 1);
    setCertifications(updated);
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <h2 className="text-2xl font-bold text-[#FF7043]">Certifications / Training</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </div>

      {isOpen && (
        <div className="space-y-6">
          {certifications.map((cert, index) => (
            <div key={index} className="border rounded p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={cert.name}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="e.g. AWS Certified Solutions Architect"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Issuer</label>
                  <input
                    type="text"
                    name="issuer"
                    value={cert.issuer}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="e.g. Amazon Web Services"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={cert.location}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="City, State (optional)"
                  />
                </div>

                {/* Equalize widths on paired date inputs */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold text-gray-700">Date Earned</label>
                    <input
                      type="month"
                      name="dateEarned"
                      value={cert.dateEarned}
                      onChange={(e) => handleChange(index, e)}
                      className="mt-1 w-full border-gray-300 rounded p-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold text-gray-700">Expiration Date</label>
                    <input
                      type="month"
                      name="expirationDate"
                      value={cert.expirationDate}
                      onChange={(e) => handleChange(index, e)}
                      className="mt-1 w-full border-gray-300 rounded p-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Description / Notes</label>
                <textarea
                  name="description"
                  value={cert.description}
                  onChange={(e) => handleChange(index, e)}
                  className="mt-1 w-full border-gray-300 rounded p-3 resize-none"
                  placeholder="Additional information about this certification or training"
                />
              </div>

              <button
                type="button"
                onClick={() => removeCertification(index)}
                className="text-sm text-red-600 hover:underline flex items-center gap-1"
              >
                <FaTrash /> Remove Certification
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addCertification}
            className="mt-2 text-sm text-[#FF7043] hover:underline flex items-center gap-1"
          >
            <FaPlus /> Add Another Certification
          </button>
        </div>
      )}
    </section>
  );
}
