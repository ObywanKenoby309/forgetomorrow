// pages/the-hearth.js
import Head from 'next/head';
import Link from 'next/link';

export default function TheHearth() {
  const alertComingSoon = (feature) => () => alert(`${feature} feature coming soon!`);

  const tiles = [
    {
      title: 'Mentorship Programs',
      desc: 'Connect with experienced mentors to guide your career journey.',
      href: '/hearth/spotlights', // wired
    },
    { title: 'Community Events', desc: 'Join workshops, webinars, and networking events tailored for growth.' },
    { title: 'Discussion Forums', desc: 'Engage in meaningful conversations and share knowledge.' },
    { title: 'Resource Library', desc: 'Access articles, guides, and tools to support your professional growth.' },
  ];

  return (
    <>
      <Head>
        <title>ForgeTomorrow - The Hearth</title>
      </Head>

      <main className="max-w-7xl mx-auto p-6 space-y-8 min-h-[80vh] bg-[#ECEFF1] text-[#212121] pt-20">
        <section className="bg-white rounded-lg shadow p-8">
          <h1 className="text-4xl font-bold text-[#FF7043] mb-6 text-center">The Hearth</h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
            Your central place to build connections, find mentors, and grow your professional network with purpose and authenticity.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {tiles.map(({ title, desc, href }) =>
              href ? (
                <Link
                  key={title}
                  href={href}
                  className="bg-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer block focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                >
                  <h2 className="text-2xl font-semibold mb-3 text-[#FF7043]">{title}</h2>
                  <p>{desc}</p>
                </Link>
              ) : (
                <div
                  key={title}
                  className="bg-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={alertComingSoon(title)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      alertComingSoon(title)();
                    }
                  }}
                  aria-label={title}
                >
                  <h2 className="text-2xl font-semibold mb-3 text-[#FF7043]">{title}</h2>
                  <p>{desc}</p>
                </div>
              )
            )}
          </div>
        </section>
      </main>
    </>
  );
}
