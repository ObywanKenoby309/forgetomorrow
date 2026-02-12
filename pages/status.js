// pages/status.js — UPDATED (adds outage incident + marks degraded)
import Head from "next/head";

export default function Status() {
  // ✅ During this incident, don’t claim “Operational”
  const services = [
    { label: "API", status: "Degraded Performance" },
    { label: "Web App", status: "Degraded Performance" },
    { label: "Background Jobs", status: "Degraded Performance" },
    { label: "Database Hosting Provider", status: "Investigating" },
  ];

  const failedCount = services.filter((s) => s.status === "Operational").length;
  const anyDegraded = services.some((s) => s.status !== "Operational");

  let forgeIntensityLabel = "Forge burning bright";
  let forgeIntensityDetail = "All core systems are operational.";
  let forgePillClass = "bg-green-500/20 text-green-300 border-green-400/40";

  if (anyDegraded) {
    forgeIntensityLabel = "Forge running low";
    forgeIntensityDetail =
      "We are experiencing an issue related to our database hosting provider that is impacting multiple areas of the site, including user login. We are monitoring the situation and will provide updates here regularly.";
    forgePillClass = "bg-amber-500/20 text-amber-200 border-amber-400/40";
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
          Operational overview and incident updates.
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

        {/* Service grid */}
        <h2 id="service-status-heading" className="sr-only">
          Service Status Overview
        </h2>

        <div
          className="grid sm:grid-cols-2 gap-4 mb-8"
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
                    : s.status === "Investigating"
                    ? "text-amber-200"
                    : "text-amber-300"
                }`}
              >
                {s.status}
              </div>
            </div>
          ))}
        </div>

        {/* ✅ Current incident block */}
        <h2 className="font-semibold mb-3">Current Incident</h2>
        <div className="space-y-3">
          <div className="text-sm text-slate-300 bg-black/30 p-4 rounded-md border border-white/10">
            <div className="font-semibold text-slate-100">
              Elevated 500 Errors in Some US Regions
            </div>
            <div className="mt-1">
              We are investigating an issue with our database hosting provider. This is impacting
              multiple areas of the site, including user login.
            </div>
            <div className="mt-2">
              We are monitoring the situation and will provide updates on this page regularly.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
