// components/shared/hearth/ResourceLibraryContent.js
export default function ResourceLibraryContent() {
  const items = [
    { title: 'Interview Prep Guide', blurb: 'Frameworks, question banks, and practice tips.' },
    { title: 'Resume Writing', blurb: 'Example bullets and templates to get you started.' },
    { title: 'Offer Negotiation', blurb: 'Research anchors, scripts, and calculators.' },
  ];
  return (
    <section className="bg-white rounded-lg shadow p-8">
      <h1 className="text-3xl font-bold text-[#FF7043] text-center">Resource Library</h1>
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        {items.map((it) => (
          <div key={it.title} className="border rounded-lg bg-white p-4">
            <div className="font-semibold text-[#FF7043]">{it.title}</div>
            <div className="text-sm text-gray-700 mt-1">{it.blurb}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
