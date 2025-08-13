// pages/recruiter/messaging.js
import Head from "next/head";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";

function Body() {
  const { isEnterprise } = usePlan();

  const threads = [
    { id: 101, candidate: "Jane Doe", snippet: "Thanks for the update…" },
    { id: 102, candidate: "Omar Reed", snippet: "Available Thursday at 2pm…" },
    { id: 103, candidate: "Priya Kumar", snippet: "Attaching my portfolio…" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Messaging</h1>
        {!isEnterprise ? (
          <button className="rounded border px-3 py-2 text-sm" title="Enterprise only">🔒 Bulk Message</button>
        ) : (
          <button className="rounded border px-3 py-2 text-sm">Bulk Message</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Threads list */}
        <aside className="md:col-span-1 rounded-lg border bg-white">
          {threads.map((t) => (
            <div key={t.id} className="border-b last:border-0 px-4 py-3">
              <div className="font-medium">{t.candidate}</div>
              <div className="text-xs text-slate-500 truncate">{t.snippet}</div>
            </div>
          ))}
        </aside>

        {/* Active thread */}
        <section className="md:col-span-2 rounded-lg border bg-white p-4 flex flex-col">
          <div className="font-medium mb-2">Conversation</div>
          <div className="flex-1 border rounded p-3 text-sm text-slate-600 bg-slate-50">
            [Thread messages go here...]
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input className="flex-1 border rounded px-3 py-2 text-sm" placeholder="Type a message…" />
            <button className="rounded bg-black text-white text-sm px-3 py-2">Send</button>
            {!isEnterprise ? (
              <button className="rounded border px-3 py-2 text-sm" title="Enterprise only">🔒 AI Schedule Assist</button>
            ) : (
              <button className="rounded border px-3 py-2 text-sm">AI Schedule Assist</button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function MessagingPage() {
  return (
    <PlanProvider>
      <Head><title>Messaging — ForgeTomorrow</title></Head>
      <RecruiterHeader />
      <Body />
    </PlanProvider>
  );
}
