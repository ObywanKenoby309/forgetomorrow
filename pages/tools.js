import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Tools() {
  const alertComingSoon = (feature) => () => alert(`${feature} feature coming soon!`);

  return (
    <>
      <Head>
        <title>ForgeTomorrow - Tools</title>
      </Head>

      <Header />

      <main className="max-w-7xl mx-auto p-6 min-h-[80vh] bg-[#ECEFF1] text-[#212121] space-y-8 pt-20">
        <section>
          <h1 className="text-4xl font-bold text-[#FF7043] mb-2">Your Tools</h1>
          <p className="text-gray-700 max-w-3xl mb-6">
            Access powerful resources to optimize your job search — from resume and cover letter editors to interview prep and ATS tips.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { title: 'Resume Builder', desc: 'Create or upload resumes, customize formats, and export polished documents ready to apply.' },
            { title: 'Cover Letter Editor', desc: 'Craft tailored cover letters with templates and expert tips for every job application.' },
            { title: 'ATS Optimization', desc: 'Analyze your resume to improve keyword matching and get past applicant tracking systems.' },
            { title: 'Interview Prep', desc: 'Practice common interview questions and get tips to impress hiring managers.' },
            { title: 'Mentorship & Coaching', desc: 'Connect with mentors and coaches for personalized guidance and support.' },
          ].map(({ title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
              role="button"
              tabIndex={0}
              onClick={alertComingSoon(title)}
              onKeyPress={(e) => { if(e.key === 'Enter') alertComingSoon(title)(); }}
              aria-label={title}
            >
              <h2 className="text-2xl font-semibold text-[#FF7043] mb-3">{title}</h2>
              <p>{desc}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </>
  );
}
