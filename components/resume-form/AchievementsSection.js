import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function AchievementsSection({ achievements, setAchievements }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (index, e) => {
    const updated = [...achievements];
    updated[index][e.target.name] = e.target.value;
    setAchievements(updated);
  };

  const addAchievement = () => {
    setAchievements([
      ...achievements,
      {
        title: '',
        issuer: '',
        date: '',
        description: ''
      }
    ]);
  };

  const removeAchievement = (index) => {
    const updated = [...achievements];
    updated.splice(index, 1);
    setAchievements(updated);
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
        <h2 className="text-2xl font-bold text-[#FF7043]">Achievements / Awards</h2>
        {isOpen ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
      </div>

      {isOpen && (
        <div className="space-y-6">
          {achievements.map((ach, index) => (
            <div key={index} className="border rounded p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={ach.title}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="Award or Achievement Title"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Issuer</label>
                  <input
                    type="text"
                    name="issuer"
                    value={ach.issuer}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="Organization or Authority"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Date</label>
                  <input
                    type="month"
                    name="date"
                    value={ach.date}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={ach.description}
                  onChange={(e) => handleChange(index, e)}
                  className="mt-1 w-full border-gray-300 rounded p-3 resize-none"
                  placeholder="Optional: details or context about this achievement"
                />
              </div>

              <button
                type="button"
                onClick={() => removeAchievement(index)}
                className="text-sm text-red-600 hover:underline flex items-center gap-1"
              >
                <FaTrash /> Remove Achievement
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addAchievement}
            className="mt-2 text-sm text-[#FF7043] hover:underline flex items-center gap-1"
          >
            <FaPlus /> Add Another Achievement
          </button>
        </div>
      )}
    </section>
  );
}
