// components/ContactInfoSection.js
import { useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

export default function ContactInfoSection() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    portfolio: '',
    forgeUrl: 'https://forgetomorrow.com/your-profile' // placeholder, will be auto-generated per user
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <h2 className="text-2xl font-bold text-[#FF7043]">Contact Information</h2>
        {isOpen ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-gray-700">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="mt-1 w-full border-gray-300 rounded p-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full border-gray-300 rounded p-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 w-full border-gray-300 rounded p-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 w-full border-gray-300 rounded p-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700">Portfolio / Website</label>
            <input
              type="url"
              name="portfolio"
              value={formData.portfolio}
              onChange={handleChange}
              className="mt-1 w-full border-gray-300 rounded p-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700">ForgeTomorrow Profile URL</label>
            <input
              type="url"
              name="forgeUrl"
              value={formData.forgeUrl}
              readOnly
              className="mt-1 w-full border-gray-300 rounded p-2 bg-gray-100 text-gray-600"
            />
          </div>
        </div>
      )}
    </section>
  );
}
