// pages/recruiter/messaging.js
import Head from "next/head";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";
import MessageThread from "../../components/recruiter/MessageThread";

function Body() {
  const { isEnterprise } = usePlan();

  const threads = [
    {
      id: 101,
      candidate: "Jane Doe",
      snippet: "Thanks for the update…",
      unread: 0,
      messages: [
        { id: "m1", from: "candidate", text: "Hi! Thanks for reaching out.", ts: new Date().toISOString() },
        { id: "m2", from: "recruiter", text: "Great, let’s schedule a call.", ts: new Date().toISOString() },
      ],
    },
    {
      id: 102,
      candidate: "Omar Reed",
      snippet: "Available Thursday at 2pm…",
      unread: 1,
      messages: [
        { id: "m3", from: "candidate", text: "Thursday 2pm works for me.", ts: new Date().toISOString() },
      ],
    },
    {
      id: 103,
      candidate: "Priya Kumar",
      snippet: "Attaching my portfolio…",
      unread: 0,
      messages: [
        { id: "m4", from: "candidate", text: "Here’s my portfolio link.", ts: new Date().toISOString() },
      ],
    },
  ];

  const onSend = (threadId, text) => {
    console.log("SEND", { threadId, text });
    // Later: persist via API, update state, etc.
  };

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

      <MessageThread threads={threads} initialThreadId={101} onSend={onSend} />
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
