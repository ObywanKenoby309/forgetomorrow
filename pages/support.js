import Head from 'next/head';
import Link from 'next/link';
import Footer from '../components/Footer';

export default function Support() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow – Support</title>
      </Head>

      <main className="max-w-4xl mx-auto p-6 space-y-8 min-h-[80vh] bg-[#ECEFF1] text-[#212121] pt-20">
        {/* Header card */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid #eee',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              margin: 0,
              color: '#FF7043',
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            Support Center
          </h1>
          <p
            style={{
              margin: '6px auto 0',
              color: '#607D8B',
              maxWidth: 640,
            }}
          >
            We take your experience seriously. If you have questions, feedback, or need
            assistance, you’re in the right place. Our dedicated team is here to help you
            succeed every step of the way.
          </p>
        </section>

        {/* Main content card */}
        <section className="bg-white rounded-lg shadow p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Chat with Support',
                desc: 'Start a live conversation with our support personas about your job search, billing, or technical issues.',
                href: '/support/chat',
              },
              {
                title: 'FAQs',
                desc: 'Find answers to common questions about using ForgeTomorrow.',
                alertMsg: 'FAQs coming soon!',
              },
              {
                title: 'Contact Us',
                desc: (
                  <>
                    Need personalized support? Email us anytime at{' '}
                    <a
                      href="mailto:forgetomorrowteam@gmail.com"
                      className="text-[#FF7043] underline"
                    >
                      forgetomorrowteam@gmail.com
                    </a>
                    .
                  </>
                ),
                alertMsg: 'Contact Us feature coming soon!',
              },
              {
                title: 'Tutorials & Guides',
                desc: 'Step-by-step instructions and video tutorials to get the most from ForgeTomorrow.',
                alertMsg: 'Tutorials & Guides coming soon!',
              },
              {
                title: 'Community Forum',
                desc: 'Connect with other users to share tips, ideas, and best practices.',
                alertMsg: 'Community Forum coming soon!',
              },
            ].map(({ title, desc, alertMsg, href }) => {
              const commonClasses =
                'bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:ring-offset-2 focus:ring-offset-white';

              if (href) {
                // Link-based card (Chat with Support)
                return (
                  <Link
                    key={title}
                    href={href}
                    className={commonClasses}
                    aria-label={title}
                  >
                    <h2 className="text-2xl font-semibold text-[#FF7043] mb-3">
                      {title}
                    </h2>
                    <p>{desc}</p>
                  </Link>
                );
              }

              // Click-to-alert cards (coming soon sections)
              return (
                <div
                  key={title}
                  className={commonClasses}
                  role="button"
                  tabIndex={0}
                  onClick={() => alert(alertMsg)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') alert(alertMsg);
                  }}
                  aria-label={title}
                >
                  <h2 className="text-2xl font-semibold text-[#FF7043] mb-3">{title}</h2>
                  <p>{desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
