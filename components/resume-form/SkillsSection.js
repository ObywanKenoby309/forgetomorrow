import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTimes } from 'react-icons/fa';
import skillsList from './skillsData'; // <-- import external skills list

export default function SkillsSection({ skills = [], setSkills }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  const onInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    if (val.length === 0) {
      setSuggestions([]);
      return;
    }

    const filtered = skillsList.filter(
      (skill) =>
        skill.toLowerCase().includes(val.toLowerCase()) && !skills.includes(skill)
    ).slice(0, 5); // limit suggestions to 5

    setSuggestions(filtered);
  };

  const addSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
    setInput('');
    setSuggestions([]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addSkill(input.trim());
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <h2 className="text-2xl font-bold text-[#FF7043]">Skills</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </div>

      {isOpen && (
        <>
          <input
            type="text"
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder="Start typing to add skills..."
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
            autoComplete="off"
          />

          {suggestions.length > 0 && (
            <ul className="border border-gray-300 rounded bg-white max-h-40 overflow-auto mt-1">
              {suggestions.map((skill) => (
                <li
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="cursor-pointer px-3 py-2 hover:bg-[#FF7043] hover:text-white"
                >
                  {skill}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center bg-[#FF7043] text-white rounded-full px-3 py-1 text-sm"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-2 focus:outline-none"
                  aria-label={`Remove ${skill}`}
                >
                  <FaTimes />
                </button>
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
