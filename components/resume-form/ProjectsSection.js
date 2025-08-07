import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function ProjectsSection({ projects = [], setProjects }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  const handleChange = (index, e) => {
    const updated = [...projects];
    updated[index][e.target.name] = e.target.value;
    setProjects(updated);
  };

  const addProject = () => {
    setProjects([
      ...projects,
      {
        title: '',
        role: '',
        description: '',
        startDate: '',
        endDate: ''
      }
    ]);
  };

  const removeProject = (index) => {
    const updated = [...projects];
    updated.splice(index, 1);
    setProjects(updated);
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <h2 className="text-2xl font-bold text-[#FF7043]">Projects</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </div>

      {isOpen && (
        <div className="space-y-6">
          {projects.map((project, index) => (
            <div key={index} className="border rounded p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700">Project Title</label>
                  <input
                    type="text"
                    name="title"
                    value={project.title}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="Project Name"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Role</label>
                  <input
                    type="text"
                    name="role"
                    value={project.role}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                    placeholder="Your Role"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold text-gray-700">Start Date</label>
                    <input
                      type="month"
                      name="startDate"
                      value={project.startDate}
                      onChange={(e) => handleChange(index, e)}
                      className="mt-1 w-full border-gray-300 rounded p-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold text-gray-700">End Date</label>
                    <input
                      type="month"
                      name="endDate"
                      value={project.endDate}
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
                  value={project.description}
                  onChange={(e) => handleChange(index, e)}
                  className="mt-1 w-full border-gray-300 rounded p-3 resize-none"
                  placeholder="Describe the project, your responsibilities, and accomplishments"
                />
              </div>

              <button
                type="button"
                onClick={() => removeProject(index)}
                className="text-sm text-red-600 hover:underline flex items-center gap-1"
              >
                <FaTrash /> Remove Project
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addProject}
            className="mt-2 text-sm text-[#FF7043] hover:underline flex items-center gap-1"
          >
            <FaPlus /> Add Another Project
          </button>
        </div>
      )}
    </section>
  );
}
