// pages/resume/create.js
import Head from 'next/head';

export default function CreateResume() {
  return (
    <>
      <Head>
        <title>Create Resume | ForgeTomorrow</title>
      </Head>

      <main className="max-w-7xl mx-auto px-6 pt-[100px] pb-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Resume Form Section */}
          <section className="bg-white rounded-lg shadow p-8 space-y-8">
            <h1 className="text-3xl font-bold text-[#FF7043]">Create Your Resume</h1>

            <form className="space-y-6">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input type="text" className="w-full border rounded px-4 py-2" placeholder="John Doe" />
              </div>

              <div>
                <label className="block font-semibold mb-1">Professional Title</label>
                <input type="text" className="w-full border rounded px-4 py-2" placeholder="Product Manager" />
              </div>

              <div>
                <label className="block font-semibold mb-1">Summary</label>
                <textarea className="w-full border rounded px-4 py-2" rows="4" placeholder="Brief professional summary..." />
              </div>

              {/* Additional fields to be added in next phase */}
            </form>
          </section>

          {/* Live Preview Placeholder */}
          <aside className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-bold text-[#FF7043] mb-4">Live Preview</h2>
            <div className="text-gray-500 italic">
              Resume preview will appear here as you type.
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
