// components/SavedDocs.js
import Link from 'next/link';

export default function SavedDocs() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#FF7043] mb-2">Saved Resumes</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="border rounded p-3 bg-[#FAFAFA]">
            <Link href="/resume/view/resume-001" className="hover:underline text-[#FF7043] font-medium">
              Product Manager Resume.pdf
            </Link>
            <span className="block text-xs text-gray-500">Last edited: Aug 5, 2025</span>
          </li>
          <li className="border rounded p-3 bg-[#FAFAFA]">
            <Link href="/resume/view/resume-002" className="hover:underline text-[#FF7043] font-medium">
              Customer Success Resume.pdf
            </Link>
            <span className="block text-xs text-gray-500">Last edited: Jul 30, 2025</span>
          </li>
          <li className="border rounded p-3 bg-[#FAFAFA]">
            <Link href="/resume/view/resume-003" className="hover:underline text-[#FF7043] font-medium">
              Tech Support Resume.pdf
            </Link>
            <span className="block text-xs text-gray-500">Last edited: Jul 20, 2025</span>
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#FF7043] mb-2">Saved Covers</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="border rounded p-3 bg-[#FAFAFA]">
            <Link href="/cover/view/cover-001" className="hover:underline text-[#FF7043] font-medium">
              PM Cover Letter.docx
            </Link>
            <span className="block text-xs text-gray-500">Last edited: Aug 3, 2025</span>
          </li>
          <li className="border rounded p-3 bg-[#FAFAFA]">
            <Link href="/cover/view/cover-002" className="hover:underline text-[#FF7043] font-medium">
              Sales Lead Cover.docx
            </Link>
            <span className="block text-xs text-gray-500">Last edited: Jul 25, 2025</span>
          </li>
          <li className="border rounded p-3 bg-[#FAFAFA]">
            <Link href="/cover/view/cover-003" className="hover:underline text-[#FF7043] font-medium">
              IT Support Cover.docx
            </Link>
            <span className="block text-xs text-gray-500">Last edited: Jul 18, 2025</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
