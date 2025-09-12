// components/seeker/SectionHint.js
export default function SectionHint({ title, bullets = [] }) {
  return (
    <aside className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 md:p-4 h-full">
      <h4 className="text-[#FF7043] font-semibold m-0">{title}</h4>
      {Array.isArray(bullets) && bullets.length > 0 && (
        <ul className="mt-2 space-y-1.5 text-sm text-[#455A64] list-disc pl-5">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}
