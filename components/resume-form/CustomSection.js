import { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';

export default function CustomSection({ customSections, setCustomSections }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => setIsOpen(!isOpen);

  const handleTitleChange = (index, e) => {
    const updated = [...customSections];
    updated[index].title = e.target.value;
    setCustomSections(updated);
  };

  const handleItemChange = (sectionIndex, itemIndex, e) => {
    const updated = [...customSections];
    updated[sectionIndex].items[itemIndex] = e.target.value;
    setCustomSections(updated);
  };

  const addSection = () => {
    setCustomSections([
      ...customSections,
      { title: 'New Section', items: [''] }
    ]);
  };

  const removeSection = (index) => {
    const updated = [...customSections];
    updated.splice(index, 1);
    setCustomSections(updated);
  };

  const addItem = (index) => {
    const updated = [...customSections];
    updated[index].items.push('');
    setCustomSections(updated);
  };

  const removeItem = (sectionIndex, itemIndex) => {
    const updated = [...customSections];
    updated[sectionIndex].items.splice(itemIndex, 1);
    setCustomSections(updated);
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <h2 className="text-2xl font-bold text-[#FF7043]">Custom Sections</h2>
        {isOpen ? <FaChevronDown className="text-[#FF7043]" /> : <FaChevronRight className="text-[#FF7043]" />}
      </div>

      {isOpen && (
        <>
          {customSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border rounded p-4 space-y-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => handleTitleChange(sectionIndex, e)}
                  className="text-xl font-semibold border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF7043] w-full"
                  placeholder="Section Title"
                />
                <button
                  onClick={() => removeSection(sectionIndex)}
                  className="ml-4 text-red-600 hover:underline flex items-center gap-1"
                >
                  <FaTrash /> Remove Section
                </button>
              </div>

              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleItemChange(sectionIndex, itemIndex, e)}
                    className="flex-grow border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                    placeholder="Add item"
                  />
                  <button
                    onClick={() => removeItem(sectionIndex, itemIndex)}
                    className="text-red-600 hover:underline"
                    aria-label="Remove item"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addItem(sectionIndex)}
                className="mt-2 text-sm text-[#FF7043] hover:underline flex items-center gap-1"
              >
                <FaPlus /> Add Item
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSection}
            className="mt-4 bg-[#FF7043] text-white px-4 py-2 rounded hover:bg-[#F4511E] transition flex items-center justify-center gap-2"
          >
            <FaPlus /> Add New Section
          </button>
        </>
      )}
    </section>
  );
}
