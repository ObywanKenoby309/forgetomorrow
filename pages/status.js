import Head from "next/head";

export default function Status() {
  return (
    <>
      <Head>
        <title>Status — ForgeTomorrow</title>
      </Head>

      <main
        className="max-w-4xl mx-auto px-6 py-10 text-slate-100"
        aria-labelledby="platform-status-heading"
      >
        <h1
          id="platform-status-heading"
          className="text-3xl font-bold text-[#FF7043] mb-2"
        >
          Platform Status
        </h1>

        <p className="text-slate-300 mb-6">
          Operational overview and incident history.
        </p>

        {/* Screen-reader-only label for the status grid */}
        <h2 id="service-status-heading" className="sr-only">
          Service Status Overview
        </h2>

        <div
          className="grid sm:grid-cols-3 gap-4 mb-8"
          aria-labelledby="service-status-heading"
        >
          {[
            { label: "API", status: "Operational" },
            { label: "Web App", status: "Operational" },
            { label: "Background Jobs", status: "Operational" },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-black/40 rounded-lg p-4 border border-white/10"
              role="status"
              aria-label={`${s.label}: ${s.status}`}
            >
              <div className="text-sm text-slate-400">{s.label}</div>
              <div className="font-semibold text-green-400">{s.status}</div>
            </div>
          ))}
        </div>

        <h2 className="font-semibold mb-3">Recent Incidents</h2>

        <ul className="space-y-3">
          <li
            className="text-sm text-slate-300 bg-black/30 p-3 rounded-md border border-white/10"
            aria-label="No incidents reported"
          >
            No incidents reported.
          </li>
        </ul>
      </main>
    </>
  );
}
