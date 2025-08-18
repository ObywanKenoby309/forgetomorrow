import Head from "next/head";

export default function Help() {
  return (
    <>
      <Head>
        <title>Help Center — ForgeTomorrow</title>
      </Head>
      <main className="max-w-4xl mx-auto px-6 py-10 text-slate-100">
        <h1 className="text-3xl font-bold text-[#FF7043] mb-4">Help Center</h1>
        <p className="text-slate-300 mb-6">
          Find answers, guides, and support for using ForgeTomorrow.
        </p>

        <section className="space-y-4">
          <article className="bg-black/40 rounded-lg p-4 border border-white/10">
            <h2 className="font-semibold mb-2">Getting Started</h2>
            <p className="text-sm text-slate-300">Account setup, profiles, and basics.</p>
          </article>
          <article className="bg-black/40 rounded-lg p-4 border border-white/10">
            <h2 className="font-semibold mb-2">Job Seekers</h2>
            <p className="text-sm text-slate-300">Resumes, applications, and the Hearth.</p>
          </article>
          <article className="bg-black/40 rounded-lg p-4 border border-white/10">
            <h2 className="font-semibold mb-2">Recruiters</h2>
            <p className="text-sm text-slate-300">Posting jobs, messaging, and analytics.</p>
          </article>
          <article className="bg-black/40 rounded-lg p-4 border border-white/10">
            <h2 className="font-semibold mb-2">Coaching</h2>
            <p className="text-sm text-slate-300">Offer services, sessions, and billing.</p>
          </article>
        </section>
      </main>
    </>
  );
}
