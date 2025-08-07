import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function WorkExperienceSection({ experiences = [], setExperiences }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (index, e) => {
    const updated = [...experiences];
    updated[index][e.target.name] = e.target.value;
    setExperiences(updated);
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: ''
      }
    ]);
  };

  const removeExperience = (index) => {
    const updated = [...experiences];
    updated.splice(index, 1);
    setExperiences(updated);
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
        <h2 className="text-2xl font-bold text-[#FF7043]">Work Experience</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </div>

      {isOpen && (
        <div className="space-y-6">
          {experiences.map((exp, index) => (
            <div key={index} className="border rounded p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700">Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={exp.jobTitle}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="e.g. Operations Manager"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={exp.company}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                {/* Location on its own full-width row */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={exp.location}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="City, State"
                  />
                </div>

                {/* Start and End Date side-by-side */}
                <div className="md:col-span-2 flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                    <input
                      type="month"
                      name="startDate"
                      value={exp.startDate}
                      onChange={(e) => handleChange(index, e)}
                      className="mt-1 w-full border-gray-300 rounded p-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold text-gray-700 mb-1">End Date</label>
                    <input
                      type="month"
                      name="endDate"
                      value={exp.endDate}
                      onChange={(e) => handleChange(index, e)}
                      className="mt-1 w-full border-gray-300 rounded p-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Key Achievements / Responsibilities</label>
                <textarea
                  name="description"
                  value={exp.description}
                  onChange={(e) => handleChange(index, e)}
                  className="mt-1 w-full border-gray-300 rounded p-3 resize-none"
                  placeholder="Use bullet points or a concise paragraph to describe your accomplishments"
                />
              </div>

              <button
                type="button"
                onClick={() => removeExperience(index)}
                className="text-sm text-red-600 hover:underline flex items-center gap-1"
              >
                <FaTrash /> Remove Experience
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addExperience}
            className="mt-2 text-sm text-[#FF7043] hover:underline flex items-center gap-1"
          >
            <FaPlus /> Add Another Experience
          </button>
        </div>
      )}
    </section>
  );
}
