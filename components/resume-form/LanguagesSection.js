// components/resume-form/LanguagesSection.js
import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

const LANGUAGE_OPTIONS = [
  "Afrikaans","Albanian","Amharic","Arabic","Armenian","Azerbaijani","Basque","Belarusian",
  "Bengali","Bosnian","Bulgarian","Catalan","Cebuano","Chichewa","Chinese","Corsican",
  "Croatian","Czech","Danish","Dutch","English","Esperanto","Estonian","Filipino","Finnish",
  "French","Galician","Georgian","German","Greek","Gujarati","Haitian Creole","Hausa",
  "Hawaiian","Hebrew","Hindi","Hmong","Hungarian","Icelandic","Igbo","Indonesian","Irish",
  "Italian","Japanese","Javanese","Kannada","Kazakh","Khmer","Kinyarwanda","Korean",
  "Kurdish (Kurmanji)","Kyrgyz","Lao","Latin","Latvian","Lithuanian","Luxembourgish",
  "Macedonian","Malagasy","Malay","Malayalam","Maltese","Maori","Marathi","Mongolian",
  "Myanmar (Burmese)","Nepali","Norwegian","Nyanja","Odia (Oriya)","Pashto","Persian",
  "Polish","Portuguese","Punjabi","Romanian","Russian","Samoan","Scots Gaelic","Serbian",
  "Sesotho","Shona","Sindhi","Sinhala","Slovak","Slovenian","Somali","Spanish","Sundanese",
  "Swahili","Swedish","Tagalog (Filipino)","Tajik","Tamil","Tatar","Telugu","Thai",
  "Turkish","Turkmen","Ukrainian","Urdu","Uyghur","Uzbek","Vietnamese","Welsh","Xhosa",
  "Yiddish","Yoruba","Zulu"
];

const PROFICIENCY_LEVELS = ["Basic", "Conversational", "Fluent", "Native"];

export default function LanguagesSection({
  languages = [],
  setLanguages,
  embedded = false,     // render content only (for SectionGroup)
  defaultOpen = true,   // used only when not embedded
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const setField = (index, key, value) => {
    const next = [...languages];
    const curr = { ...(next[index] || {}) };
    if (key === 'years') {
      // allow empty; else numeric 0–50 in 0.5 steps
      if (value === '' || (/^\d*\.?\d*$/.test(value) && Number(value) >= 0 && Number(value) <= 50)) {
        curr[key] = value;
      } else {
        return;
      }
    } else {
      curr[key] = value;
    }
    next[index] = curr;
    setLanguages(next);
  };

  const addLanguage = () => {
    setLanguages([
      ...languages,
      { language: '', proficiency: '', years: '' },
    ]);
  };

  const removeLanguage = (index) => {
    const next = [...languages];
    next.splice(index, 1);
    setLanguages(next);
  };

  const Body = () => (
    <div className="space-y-4">
      {languages.length === 0 && (
        <p className="text-sm text-slate-500">No languages added yet.</p>
      )}

      {languages.map((entry, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Language</label>
              <input
                list="language-options"
                value={entry.language || ''}
                onChange={(e) => setField(index, 'language', e.target.value)}
                placeholder="Type or select a language"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
                autoComplete="off"
              />
              <datalist id="language-options">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Proficiency</label>
              <select
                value={entry.proficiency || ''}
                onChange={(e) => setField(index, 'proficiency', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              >
                <option value="">Select proficiency</option>
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={entry.years ?? ''}
                onChange={(e) => setField(index, 'years', e.target.value)}
                placeholder="e.g. 3.5"
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043]/30"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeLanguage(index)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <FaTrash className="opacity-80" /> Remove Language
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addLanguage}
        className="inline-flex items-center gap-2 rounded-lg border border-[#FF7043]/30 px-3 py-2 text-sm font-semibold text-[#FF7043] hover:bg-[#FF7043] hover:text-white transition-colors"
      >
        <FaPlus /> Add Language
      </button>
    </div>
  );

  if (embedded) return <Body />;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setIsOpen((o) => !o)}
      >
        <h2 className="text-lg font-semibold text-[#FF7043]">Languages</h2>
        {isOpen ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
      </button>

      {isOpen && <Body />}
    </section>
  );
}
