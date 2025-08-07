import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash } from 'react-icons/fa';

// Sample language options — can be expanded or replaced later
const LANGUAGE_OPTIONS = [
  "Afrikaans",
  "Albanian",
  "Amharic",
  "Arabic",
  "Armenian",
  "Azerbaijani",
  "Basque",
  "Belarusian",
  "Bengali",
  "Bosnian",
  "Bulgarian",
  "Catalan",
  "Cebuano",
  "Chichewa",
  "Chinese",
  "Corsican",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "English",
  "Esperanto",
  "Estonian",
  "Filipino",
  "Finnish",
  "French",
  "Galician",
  "Georgian",
  "German",
  "Greek",
  "Gujarati",
  "Haitian Creole",
  "Hausa",
  "Hawaiian",
  "Hebrew",
  "Hindi",
  "Hmong",
  "Hungarian",
  "Icelandic",
  "Igbo",
  "Indonesian",
  "Irish",
  "Italian",
  "Japanese",
  "Javanese",
  "Kannada",
  "Kazakh",
  "Khmer",
  "Kinyarwanda",
  "Korean",
  "Kurdish (Kurmanji)",
  "Kyrgyz",
  "Lao",
  "Latin",
  "Latvian",
  "Lithuanian",
  "Luxembourgish",
  "Macedonian",
  "Malagasy",
  "Malay",
  "Malayalam",
  "Maltese",
  "Maori",
  "Marathi",
  "Mongolian",
  "Myanmar (Burmese)",
  "Nepali",
  "Norwegian",
  "Nyanja",
  "Odia (Oriya)",
  "Pashto",
  "Persian",
  "Polish",
  "Portuguese",
  "Punjabi",
  "Romanian",
  "Russian",
  "Samoan",
  "Scots Gaelic",
  "Serbian",
  "Sesotho",
  "Shona",
  "Sindhi",
  "Sinhala",
  "Slovak",
  "Slovenian",
  "Somali",
  "Spanish",
  "Sundanese",
  "Swahili",
  "Swedish",
  "Tagalog (Filipino)",
  "Tajik",
  "Tamil",
  "Tatar",
  "Telugu",
  "Thai",
  "Turkish",
  "Turkmen",
  "Ukrainian",
  "Urdu",
  "Uyghur",
  "Uzbek",
  "Vietnamese",
  "Welsh",
  "Xhosa",
  "Yiddish",
  "Yoruba",
  "Zulu"
];

const PROFICIENCY_LEVELS = [
  'Basic',
  'Conversational',
  'Fluent',
  'Native',
];

export default function LanguagesSection({ languages = [], setLanguages }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => setIsOpen(!isOpen);

  // Add new empty language entry
  const addLanguage = () => {
    setLanguages([
      ...languages,
      { language: '', proficiency: '', years: '' },
    ]);
  };

  // Remove language entry at index
  const removeLanguage = (index) => {
    const updated = [...languages];
    updated.splice(index, 1);
    setLanguages(updated);
  };

  // Handle change on any input/select in a language entry
  const handleChange = (index, field, value) => {
    const updated = [...languages];
    if (field === 'years') {
      // Validate years: numeric between 0 and 50 with step 0.5
      if (value === '' || (/^\d*\.?\d*$/.test(value) && Number(value) >= 0 && Number(value) <= 50)) {
        updated[index][field] = value;
      }
    } else {
      updated[index][field] = value;
    }
    setLanguages(updated);
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <h2 className="text-2xl font-bold text-[#FF7043]">Languages</h2>
        {isOpen ? (
          <FaChevronDown className="text-[#FF7043]" />
        ) : (
          <FaChevronRight className="text-[#FF7043]" />
        )}
      </div>

      {isOpen && (
        <>
          {languages.length === 0 && (
            <p className="text-gray-500 italic">No languages added yet.</p>
          )}

          {languages.map((entry, index) => (
            <div key={index} className="border rounded p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block font-semibold text-gray-700">Language</label>
                  <input
                    list="language-options"
                    name="language"
                    value={entry.language}
                    onChange={(e) => handleChange(index, 'language', e.target.value)}
                    placeholder="Type or select a language"
                    className="mt-1 w-full border-gray-300 rounded p-2"
                  />
                  <datalist id="language-options">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang} value={lang} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Proficiency</label>
                  <select
                    name="proficiency"
                    value={entry.proficiency}
                    onChange={(e) => handleChange(index, 'proficiency', e.target.value)}
                    className="mt-1 w-full border-gray-300 rounded p-2"
                  >
                    <option value="">Select proficiency</option>
                    {PROFICIENCY_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Years of Experience</label>
                  <input
                    type="number"
                    name="years"
                    min="0"
                    max="50"
                    step="0.5"
                    value={entry.years}
                    onChange={(e) => handleChange(index, 'years', e.target.value)}
                    placeholder="e.g. 3.5"
                    className="mt-1 w-full border-gray-300 rounded p-2"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeLanguage(index)}
                className="text-sm text-red-600 hover:underline flex items-center gap-1"
              >
                <FaTrash /> Remove Language
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addLanguage}
            className="mt-2 text-sm text-[#FF7043] hover:underline flex items-center gap-1"
          >
            + Add Another Language
          </button>
        </>
      )}
    </section>
  );
}
