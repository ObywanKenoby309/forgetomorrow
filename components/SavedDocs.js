// components/SavedDocs.js
export default function SavedDocs() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#FF7043] mb-2">Saved Resumes</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="border rounded p-3 bg-[#FAFAFA]">
            Product Manager Resume.pdf <span className="block text-xs text-gray-500">Aug 5, 2025</span>
          </li>
          <li className="border rounded p-3 bg-[#FAFAFA]">
            Customer Success Resume.pdf <span className="block text-xs text-gray-500">Jul 30, 2025</span>
          </li>
          <li className="border rounded p-3 bg-[#FAFAFA]">
            Tech Support Resume.pdf <span className="block text-xs text-gray-500">Jul 20, 2025</span>
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#FF7043] mb-2">Saved Covers</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="border rounded p-3 bg-[#FAFAFA]">
            PM Cover Letter.docx <span className="block text-xs text-gray-500">Aug 3, 2025</span>
          </li>
          <li className="border rounded p-3 bg-[#FAFAFA]">
            Sales Lead Cover.docx <span className="block text-xs text-gray-500">Jul 25, 2025</span>
          </li>
          <li className="border rounded p-3 bg-[#FAFAFA]">
            IT Support Cover.docx <span className="block text-xs text-gray-500">Jul 18, 2025</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
