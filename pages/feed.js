// pages/feed.js
import Head from 'next/head';
import Header from '../components/Header';

export default function Feed() {
  const handleReact = () => alert('React feature coming soon!');

  return (
    <>
      <Head>
        <title>ForgeTomorrow - Community Feed</title>
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto p-6 space-y-8 min-h-[80vh] bg-[#ECEFF1] text-[#212121] pt-20">
        <h1 className="text-4xl font-bold text-[#FF7043] mb-6 text-center">Community Feed</h1>

        <section className="space-y-6">
          {/* Example Post */}
          <article className="bg-white rounded-lg shadow p-6">
            <header className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#FF7043]">Eric James</h2>
                <time dateTime="2025-08-01T10:30" className="text-gray-500 text-sm">
                  August 1, 2025
                </time>
              </div>
              <button
                className="text-gray-400 hover:text-[#FF7043] focus:outline-none"
                aria-label="React to post"
                onClick={handleReact}
              >
                👍
              </button>
            </header>
            <p className="text-gray-700 leading-relaxed">
              Just launched the new ForgeTomorrow platform! Excited to build a community focused on real
              connections and jobs—not noise.
            </p>
          </article>

          {/* More posts can be added dynamically here */}
        </section>
      </main>
    </>
  );
}
