import Head from "next/head";

export default function Status() {
  const services = [
    { label: "API", status: "Operational" },
    { label: "Web App", status: "Operational" },
    { label: "Background Jobs", status: "Operational" },
  ];

  const failedCount = services.filter(
    (s) => s.status !== "Operational"
  ).length;

  let forgeIntensityLabel = "Forge burning bright";
  let forgeIntensityDetail = "All core systems are operational.";
  let forgePillClass = "bg-green-500/20 text-green-300 border-green-400/40";

  if (failedCount >= 1 && failedCount <= 2) {
    forgeIntensityLabel = "Forge running low";
    forgeIntensityDetail =
      "One or more services are degraded. Some features may be slower or unavailable.";
    forgePillClass = "bg-amber-500/20 text-amber-200 border-amber-400/40";
  } else if (failedCount >= 3) {
    forgeIntensityLabel = "Forge temporarily offline";
    forgeIntensityDetail =
      "Multiple services are impacted. We are working to restore full service.";
    forgePillClass = "bg-red-500/20 text-red-200 border-red-400/40";
  }

  return (
    <>
      <Head>
        <title>Status - ForgeTomorrow</title>
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

        {/* Forge intensity indicator */}
        <section
          className="mb-8 p-4 rounded-lg border border-white/10 bg-black/40"
          aria-label="Forge status summary"
        >
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${forgePillClass}`}
          >
            <span className="inline-block h-2 w-2 rounded-full bg-current" />
            <span>{forgeIntensityLabel}</span>
          </div>
          <p className="mt-3 text-sm text-slate-300">{forgeIntensityDetail}</p>
        </section>

        {/* Screen-reader-only label for the status grid */}
        <h2 id="service-status-heading" className="sr-only">
          Service Status Overview
        </h2>

        <div
          className="grid sm:grid-cols-3 gap-4 mb-8"
          aria-labelledby="service-status-heading"
        >
          {services.map((s, i) => (
            <div
              key={i}
              className="bg-black/40 rounded-lg p-4 border border-white/10"
              role="status"
              aria-label={`${s.label}: ${s.status}`}
            >
              <div className="text-sm text-slate-400">{s.label}</div>
              <div
                className={`font-semibold ${
                  s.status === "Operational"
                    ? "text-green-400"
                    : "text-amber-300"
                }`}
              >
                {s.status}
              </div>
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
