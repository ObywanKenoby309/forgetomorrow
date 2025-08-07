// pages/resume-cover.js
import Head from 'next/head';
import Link from 'next/link';
import SavedDocs from '../components/SavedDocs';

export default function ResumeCoverCreator() {
  return (
    <>
      <Head>
        <title>Resume & Cover Creator | ForgeTomorrow</title>
      </Head>

      <main className="max-w-7xl mx-auto p-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Left Column – Back to Dashboard */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h2 className="text-lg font-semibold text-[#FF7043] mb-4">Navigation</h2>
              <Link
                href="/seeker-dashboard"
                className="block bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded transition"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </aside>

          {/* Middle Column – Creator */}
          <section className="md:col-span-3 space-y-10">
            <div className="bg-white rounded-lg shadow p-8 space-y-6">
              <h1 className="text-4xl font-bold text-[#FF7043] text-center">Resume & Cover Letter Creator</h1>
              <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
                Easily build your professional resume and cover letter — from scratch or using your existing documents.
                Soon, you’ll be able to generate ATS-optimized files using AI, tailor each version to job descriptions,
                and save versions for each opportunity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

          {/* Right Column – Saved Docs */}
          <aside className="md:col-span-1">
            <SavedDocs />
          </aside>
        </div>
      </main>
    </>
  );
}

