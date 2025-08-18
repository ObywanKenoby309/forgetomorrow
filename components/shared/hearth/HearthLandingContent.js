// components/shared/hearth/HearthLandingContent.js
import Link from 'next/link';

export default function HearthLandingContent() {
  const tiles = [
    { title: 'Mentorship Programs', desc: 'Connect with experienced mentors to guide your journey.', href: '/hearth/spotlights' },
    { title: 'Community Events', desc: 'Workshops, webinars, and networking.', href: '/hearth/events' },
    { title: 'Discussion Forums', desc: 'Conversations and knowledge sharing.', href: '/hearth/forums' },
    { title: 'Resource Library', desc: 'Articles, guides, and tools.', href: '/hearth/resources' },
  ];

  return (
    <section className="bg-white rounded-lg shadow p-8">
      <h1 className="text-4xl font-bold text-[#FF7043] mb-6 text-center">The Hearth</h1>
      <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6 text-center">
        Your place to build connections, find mentors, and grow your network with purpose.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {tiles.map(({ title, desc, href }) => (
          <Link key={title} href={href} className="bg-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow block focus:outline-none focus:ring-2 focus:ring-[#FF7043]">
            <h2 className="text-2xl font-semibold mb-3 text-[#FF7043]">{title}</h2>
            <p>{desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
