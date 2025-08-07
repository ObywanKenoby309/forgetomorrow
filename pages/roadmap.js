// pages/roadmap.js
import Head from 'next/head';

export default function CareerRoadmap() {
  return (
    <>
      <Head>
        <title>Career Roadmap | ForgeTomorrow</title>
      </Head>

      <main className="max-w-4xl mx-auto p-10 space-y-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121]">
        <section className="bg-white rounded-lg shadow p-8 space-y-6">
          <h1 className="text-4xl font-bold text-[#FF7043] text-center">Career Roadmap</h1>

          <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
            This AI-powered experience will analyze your resume and professional history
            to generate a personalized roadmap with your best-fit roles, a 30/60/90 day plan
            for growth, and recommended certifications to help you succeed.
          </p>

          <div className="bg-[#F5F5F5] border border-dashed border-gray-400 rounded p-6 text-center text-gray-600">
            <p className="mb-2">🚧 This feature is under construction.</p>
            <p className="text-sm">You’ll soon be able to upload your resume and receive a full personalized plan.</p>
          </div>
        </section>
      </main>
    </>
  );
}
