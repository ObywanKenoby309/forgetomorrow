import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Support() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow - Support</title>
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto p-6 space-y-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121] pt-20">
        <h1 className="text-4xl font-bold text-[#FF7043] mb-6 text-center">Support Center</h1>

        <section className="bg-white rounded-lg shadow p-8 space-y-6">
          <p className="text-gray-700 text-center max-w-xl mx-auto mb-8">
            We take your experience seriously. If you have questions, feedback, or need assistance, you’re in the right place.
            Our dedicated team is here to help you succeed every step of the way.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
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
                    </a>.
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
            ].map(({ title, desc, alertMsg }) => (
              <div
                key={title}
                className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => alert(alertMsg)}
                onKeyPress={(e) => { if (e.key === 'Enter') alert(alertMsg); }}
                aria-label={title}
              >
                <h2 className="text-2xl font-semibold text-[#FF7043] mb-3">{title}</h2>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
