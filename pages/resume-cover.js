// pages/resume-cover.js
import Head from 'next/head';

export default function ResumeCoverCreator() {
  return (
    <>
      <Head>
        <title>Resume & Cover Creator | ForgeTomorrow</title>
      </Head>

      <main className="max-w-4xl mx-auto p-10 space-y-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121]">
        <section className="bg-white rounded-lg shadow p-8 space-y-6">
          <h1 className="text-4xl font-bold text-[#FF7043] text-center">Resume & Cover Letter Creator</h1>

          <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
            Easily build your professional resume and cover letter — from scratch or using your existing documents.
            Soon, you’ll be able to generate ATS-optimized files using AI, tailor each version to job descriptions,
            and save versions for each opportunity.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
            <div className="bg-[#F5F5F5] border border-dashed border-gray-400 rounded p-6 text-center space-y-2">
              <h3 className="text-xl font-semibold text-[#FF7043]">Start from Scratch</h3>
              <p className="text-sm text-gray-600">Use our AI-enhanced form builder to create a new resume step-by-step.</p>
              <button className="mt-2 bg-[#FF7043] text-white px-4 py-2 rounded hover:bg-[#F4511E] transition-colors">
                Create Resume
              </button>
            </div>

            <div className="bg-[#F5F5F5] border border-dashed border-gray-400 rounded p-6 text-center space-y-2">
              <h3 className="text-xl font-semibold text-[#FF7043]">Use Existing Resume</h3>
              <p className="text-sm text-gray-600">Upload your resume to improve and tailor it using AI tools.</p>
              <button className="mt-2 bg-[#FF7043] text-white px-4 py-2 rounded hover:bg-[#F4511E] transition-colors">
                Upload Resume
              </button>
            </div>

            <div className="col-span-1 sm:col-span-2 bg-[#F5F5F5] border border-dashed border-gray-400 rounded p-6 text-center space-y-2">
              <h3 className="text-xl font-semibold text-[#FF7043]">Cover Letter Builder</h3>
              <p className="text-sm text-gray-600">Build custom, targeted cover letters with one click.</p>
              <button className="mt-2 bg-[#FF7043] text-white px-4 py-2 rounded hover:bg-[#F4511E] transition-colors">
                Start Cover Letter
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
