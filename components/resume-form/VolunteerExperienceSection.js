import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function VolunteerExperienceSection({ volunteerExperiences = [], setVolunteerExperiences }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  const handleChange = (index, e) => {
    const updated = [...volunteerExperiences];
    updated[index][e.target.name] = e.target.value;
    setVolunteerExperiences(updated);
  };

  const addVolunteerExperience = () => {
    setVolunteerExperiences([
      ...volunteerExperiences,
      {
        role: '',
        organization: '',
        location: '',
        startDate: '',
        endDate: '',
        description: ''
      }
    ]);
  };

  const removeVolunteerExperience = (index) => {
    const updated = [...volunteerExperiences];
    updated.splice(index, 1);
    setVolunteerExperiences(updated);
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <h2 className="text-2xl font-bold text-[#FF7043]">Volunteer Experience</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </div>

      {isOpen && (
        <div className="space-y-6">
          {volunteerExperiences.map((vol, index) => (
            <div key={index} className="border rounded p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700">Role/Title</label>
                  <input
                    type="text"
                    name="role"
                    value={vol.role}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="e.g. Volunteer Coordinator"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Organization</label>
                  <input
                    type="text"
                    name="organization"
                    value={vol.organization}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="e.g. Helping Hands"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={vol.location}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="City, State"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                    <input
                      type="month"
                      name="startDate"
                      value={vol.startDate}
                      onChange={(e) => handleChange(index, e)}
                      className="mt-1 w-full border-gray-300 rounded p-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold text-gray-700 mb-1">End Date</label>
                    <input
                      type="month"
                      name="endDate"
                      value={vol.endDate}
                      onChange={(e) => handleChange(index, e)}
                      className="mt-1 w-full border-gray-300 rounded p-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={vol.description}
                  onChange={(e) => handleChange(index, e)}
                  className="mt-1 w-full border-gray-300 rounded p-3 resize-none"
                  placeholder="Describe your role and impact"
                />
              </div>

              <button
                type="button"
                onClick={() => removeVolunteerExperience(index)}
                className="text-sm text-red-600 hover:underline flex items-center gap-1"
              >
                <FaTrash /> Remove Volunteer Experience
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addVolunteerExperience}
            className="mt-2 text-sm text-[#FF7043] hover:underline flex items-center gap-1"
          >
            <FaPlus /> Add Another Volunteer Experience
          </button>
        </div>
      )}
    </section>
  );
}
