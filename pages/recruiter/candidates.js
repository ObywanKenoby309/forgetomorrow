// pages/recruiter/candidates.js
import Head from "next/head";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";

function Body() {
  const { isEnterprise } = usePlan();

  const candidates = [
    { id: 1, name: "Jane Doe", role: "Client Success Lead", location: "Remote", match: 92 },
    { id: 2, name: "Omar Reed", role: "Onboarding Specialist", location: "Nashville, TN", match: 88 },
    { id: 3, name: "Priya Kumar", role: "Solutions Architect", location: "Austin, TX", match: 86 },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-semibold">Candidates</h1>
        <div className="flex items-center gap-2">
          <input className="border rounded px-3 py-2 text-sm w-64" placeholder="Search candidates…" />
          {!isEnterprise ? (
            <button className="rounded border px-3 py-2 text-sm" title="Enterprise only">
              🔒 Boolean Search
            </button>
          ) : (
            <button className="rounded border px-3 py-2 text-sm">Boolean Search</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidates.map((c) => (
          <div key={c.id} className="rounded-lg border bg-white p-4">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-slate-500">{c.role} • {c.location}</div>
            <div className="mt-2 text-sm">
              Match Score:{" "}
              {isEnterprise ? (
                <span className="font-semibold">{c.match}%</span>
              ) : (
                <span className="text-slate-500">🔒 Upgrade for AI Match %</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className="rounded bg-black text-white text-sm px-3 py-2">View Profile</button>
              <button className="rounded border text-sm px-3 py-2">Message</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function CandidatesPage() {
  return (
    <PlanProvider>
      <Head><title>Candidates — ForgeTomorrow</title></Head>
      <RecruiterHeader />
      <Body />
    </PlanProvider>
  );
}
