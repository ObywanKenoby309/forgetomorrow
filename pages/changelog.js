import Head from "next/head";

export default function Changelog() {
  return (
    <>
      <Head>
        <title>Changelog — ForgeTomorrow</title>
      </Head>

      <main
        className="max-w-4xl mx-auto px-6 py-10 text-slate-100"
        aria-labelledby="changelog-heading"
      >
        <h1
          id="changelog-heading"
          className="text-3xl font-bold text-[#FF7043] mb-2"
        >
          Changelog
        </h1>

        <p className="text-slate-300 mb-6">
          What’s new, improved, and fixed.
        </p>

        <article
          className="bg-black/40 rounded-lg p-4 border border-white/10"
          aria-labelledby="changelog-v010"
        >
          <h2
            id="changelog-v010"
            className="font-semibold text-slate-100"
          >
            v0.1.0 — Initial public scaffold
          </h2>

          <ul className="list-disc list-inside text-sm text-slate-300 mt-2 space-y-1">
            <li>Unified dark footers (public + internal)</li>
            <li>Home hero background focal fix</li>
            <li>Help, Status, Changelog, Shortcuts, Legal pages stubbed</li>
          </ul>
        </article>
      </main>
    </>
  );
}
