import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash } from 'react-icons/fa';

// Sample language options — can be expanded or replaced later
const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'Mandarin',
  'French',
  'German',
  'Japanese',
  'Russian',
  'Arabic',
  'Portuguese',
  'Hindi',
  'Bengali',
  'Italian',
  'Korean',
  'Dutch',
  'Turkish',
  'Swedish',
  'Polish',
  'Vietnamese',
  'Thai',
  'Greek',
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
          <Fa
