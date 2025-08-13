// pages/recruiter/messaging.js
import Head from "next/head";
import { useState } from "react";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";
import MessageThread from "../../components/recruiter/MessageThread";
import SavedReplies from "../../components/recruiter/SavedReplies";
import BulkMessageModal from "../../components/recruiter/BulkMessageModal";

function Body() {
  const { isEnterprise } = usePlan();

  const [threads, setThreads] = useState([
    {
      id: 101,
      candidate: "Jane Doe",
      snippet: "Thanks for the update…",
      unread: 0,
      messages: [
        { id: "m1", from: "candidate", text: "Hi! Thanks for reaching out.", ts: new Date().toISOString() },
        { id: "m2", from: "recruiter", text: "Great, let’s schedule a call.", ts: new Date().toISOString(), status: "read" },
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
  ]);

  const [bulkOpen, setBulkOpen] = useState(false);

  const onSend = (threadId, text) => {
    // append recruiter message; then mark as read after short delay (demo)
    setThreads((prev) =>
      prev.map((t) =>
        t.id !== threadId
          ? t
          : {
              ...t,
              snippet: text,
              messages: [
                ...t.messages,
                { id: `m-${Date.now()}`, from: "recruiter", text, ts: new Date().toISOString(), status: "sent" },
              ],
            }
      )
    );
    setTimeout(() => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id !== threadId
            ? t
            : {
                ...t,
                messages: t.messages.map((m) => (m.id.startsWith("m-") ? { ...m, status: "read" } : m)),
              }
        )
      );
    }, 800);
  };

  const candidatesFlat = [
    { id: 1, name: "Jane Doe", role: "Client Success Lead", location: "Remote" },
    { id: 2, name: "Omar Reed", role: "Onboarding Specialist", location: "Nashville, TN" },
    { id: 3, name: "Priya Kumar", role: "Solutions Architect", location: "Austin, TX" },
  ];

  const onBulkSend = (ids, text) => {
    console.log("BULK SEND", { ids, text });
    setBulkOpen(false);
  };

  const onInsertSavedReply = (setDraft) => {
    // open a small side panel to choose a saved reply; here we just append via alert-free path
    // handled via SavedReplies below by passing onInsert
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Messaging</h1>
        <div className="flex items-center gap-2">
          {isEnterprise ? (
            <button className="rounded border px-3 py-2 text-sm" onClick={() => setBulkOpen(true)}>Bulk Message</button>
          ) : (
            <button className="rounded border px-3 py-2 text-sm" title="Enterprise only">🔒 Bulk Message</button>
          )}
        </div>
      </div>

      <MessageThread
        threads={threads}
        initialThreadId={101}
        onSend={onSend}
        onInsertSavedReply={(setDraft) => {
          // this function is satisfied by the SavedReplies component via "Insert" click
          // nothing to do here directly; we expose setDraft downward using closure below
        }}
      />

      {/* Saved replies manager */}
      <SavedReplies
        onInsert={(text) => {
          // quick insert: put text into clipboard-ish spot by dispatching into an input prompt
          // simpler: log and instruct user to copy; OR integrate by exposing a custom event.
          // For now, we emulate by opening a small prompt and appending:
          const el = document.querySelector('input[placeholder="Type a message…"]');
          if (el) {
            const curr = el.value || "";
            el.value = curr ? `${curr} ${text}` : text;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.focus();
          }
        }}
      />

      <BulkMessageModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        candidates={candidatesFlat}
        onSend={onBulkSend}
      />
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
