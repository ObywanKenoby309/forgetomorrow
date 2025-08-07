import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function EducationSection({ educationList = [], setEducationList }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  const handleChange = (index, e) => {
    const updated = [...educationList];
    updated[index][e.target.name] = e.target.value;
    setEducationList(updated);
  };

  const addEducation = () => {
    setEducationList([
      ...educationList,
      {
        degree: '',
        institution: '',
        location: '',
        startDate: '',
        endDate: '',
        description: ''
      }
    ]);
  };

  const removeEducation = (index) => {
    const updated = [...educationList];
    updated.splice(index, 1);
    setEducationList(updated);
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <h2 className="text-2xl font-bold text-[#FF7043]">Education</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </div>

      {isOpen && (
        <div className="space-y-6">
          {educationList.map((edu, index) => (
            <div key={index} className="border rounded p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700">Degree / Qualification</label>
                  <input
                    type="text"
                    name="degree"
                    value={edu.degree}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="e.g. Bachelor of Science"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Institution</label>
                  <input
                    type="text"
                    name="institution"
                    value={edu.institution}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="e.g. University of Example"
                  />
                </div>

                {/* Location full width */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={edu.location}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="City, State"
                  />
                </div>

                {/* Start and End Dates side-by-side */}
                <div className="md:col-span-2 flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                    <input
                      type="month"
                      name="startDate"
                      value={edu.startDate}
                      onChange={(e) => handleChange(index, e)}
                      className="mt-1 w-full border-gray-300 rounded p-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold text-gray-700 mb-1">End Date</label>
                    <input
                      type="month"
                      name="endDate"
                      value={edu.endDate}
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
                  value={edu.description}
                  onChange={(e) => handleChange(index, e)}
                  className="mt-1 w-full border-gray-300 rounded p-3 resize-none"
                  placeholder="Additional info about your studies, honors, or projects"
                />
              </div>

              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="text-sm text-red-600 hover:underline flex items-center gap-1"
              >
                <FaTrash /> Remove Education
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addEducation}
            className="mt-2 text-sm text-[#FF7043] hover:underline flex items-center gap-1"
          >
            <FaPlus /> Add Another Education
          </button>
        </div>
      )}
    </section>
  );
}
